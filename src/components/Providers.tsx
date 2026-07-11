'use client';

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { useState, useEffect } from 'react';
import '@/lib/i18n';

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

  return (
    <PersistQueryClientProvider 
      client={queryClient} 
      persistOptions={{ persister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
