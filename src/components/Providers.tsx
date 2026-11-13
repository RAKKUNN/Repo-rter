'use client';

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { useState, useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import '@/lib/i18n';
import { ThemeProvider } from 'next-themes';
import { UIThemeProvider } from '@/lib/themes';
import { ToastProvider } from './ToastProvider';
import { cleanExpiredCache } from '@/lib/storage';
import { downloadAndMergeSync } from '@/lib/sync';
import { migrateSecretsFromLocalStorage } from '@/lib/secrets';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000 * 10, // 10 minutes — prevents redundant refetches when switching repos/filters
            gcTime: 60 * 1000 * 30, // 30 minutes in-memory retention
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  // Throttle localStorage persistence and only persist lightweight metadata queries
  // (Traffic data is already persisted natively via Rust filesystem I/O)
  const [persister] = useState(() =>
    createSyncStoragePersister({
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      throttleTime: 3000,
    })
  );

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      const handleContextMenu = (e: MouseEvent) => e.preventDefault();
      window.addEventListener('contextmenu', handleContextMenu);
      return () => window.removeEventListener('contextmenu', handleContextMenu);
    }
  }, []);

  useEffect(() => {
    const runInit = async () => {
      // 0. 평문 시크릿을 OS 키체인으로 이관한다.
      //    아래 동기화 풀이 sync_webdav_pass와 sync_encryption_key를 읽으므로
      //    반드시 그보다 먼저 끝나야 한다.
      try {
        await migrateSecretsFromLocalStorage();
      } catch (e) {
        console.error('Secret migration failed:', e);
      }

      // 1. Pull remote data and merge
      try {
        const provider = localStorage.getItem('sync_provider');
        if (provider === 'webdav') {
          await downloadAndMergeSync();
        }
      } catch (e) {
        console.error('Failed startup sync pull:', e);
      }

      // 2. Run data retention cleanup
      const retentionDaysStr = localStorage.getItem('data_retention_days');
      if (retentionDaysStr) {
        const retentionDays = parseInt(retentionDaysStr, 10);
        if (!isNaN(retentionDays) && retentionDays > 0) {
          await cleanExpiredCache(retentionDays);
        }
      }
    };
    runInit();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <UIThemeProvider>
          <ToastProvider>
            <PersistQueryClientProvider
              client={queryClient}
              persistOptions={{
                persister,
                dehydrateOptions: {
                  shouldDehydrateQuery: (query) => {
                    const key0 = query.queryKey[0];
                    return key0 === 'githubUser' || key0 === 'githubRepos';
                  },
                },
              }}
            >
              {children}
            </PersistQueryClientProvider>
          </ToastProvider>
        </UIThemeProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
