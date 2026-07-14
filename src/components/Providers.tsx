'use client';

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { useState, useEffect } from 'react';
import '@/lib/i18n';
import { ThemeProvider } from 'next-themes';
import { ToastProvider } from './ToastProvider';
import { cleanExpiredCache } from '@/lib/storage';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000 * 5, // 5 minutes
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [persister] = useState(() =>
    createSyncStoragePersister({
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
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
    const runCleanup = async () => {
      const retentionDaysStr = localStorage.getItem('data_retention_days');
      if (retentionDaysStr) {
        const retentionDays = parseInt(retentionDaysStr, 10);
        if (!isNaN(retentionDays) && retentionDays > 0) {
          await cleanExpiredCache(retentionDays);
        }
      }
    };
    runCleanup();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ToastProvider>
        <PersistQueryClientProvider 
          client={queryClient} 
          persistOptions={{ persister }}
        >
          {children}
        </PersistQueryClientProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
