import { useEffect } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { sendNotification, isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';
import { getRepos, getRepoTrafficViews, getRepoTrafficClones } from '@/lib/github';
import { useTranslation } from 'react-i18next';

// Run background sync every 1 hour (3600000 ms)
const SYNC_INTERVAL = 3600000;

export function useBackgroundSync() {
  const { t } = useTranslation();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const setupSync = async () => {
      if (!isTauri()) return;

      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }

      intervalId = setInterval(async () => {
        try {
          const token = localStorage.getItem('github_token');
          if (!token) return;

          // 1. Fetch repositories
          const repos = await getRepos();
          if (!repos || repos.length === 0) return;

          // 2. Fetch traffic data to trigger persistence
          // We sync in batches of 10 repositories, rotating through the entire list to prevent rate limits
          const lastSyncedIndexStr = localStorage.getItem('background_sync_last_index');
          let startIndex = lastSyncedIndexStr ? parseInt(lastSyncedIndexStr, 10) : 0;
          if (isNaN(startIndex) || startIndex >= repos.length) {
            startIndex = 0;
          }

          // Sort repositories consistently so the rotation index maps predictably
          const sortedRepos = repos.sort((a: any, b: any) => b.stargazers_count - a.stargazers_count);
          
          const BATCH_SIZE = 10;
          const endIndex = Math.min(startIndex + BATCH_SIZE, sortedRepos.length);
          const batchRepos = sortedRepos.slice(startIndex, endIndex);
          
          let totalNewViews = 0;
          for (const repo of batchRepos) {
            const owner = repo.owner.login;
            const name = repo.name;
            const viewsData = await getRepoTrafficViews(owner, name);
            const clonesData = await getRepoTrafficClones(owner, name);
            
            if (viewsData && viewsData.count) totalNewViews += viewsData.count;
          }

          // Update sync index for next iteration
          const nextStartIndex = endIndex >= sortedRepos.length ? 0 : endIndex;
          localStorage.setItem('background_sync_last_index', nextStartIndex.toString());

          // 3. Send Notification
          if (permissionGranted) {
            sendNotification({
              title: 'Repo-rter Sync',
              body: `Synced batch ${startIndex + 1}-${endIndex} of ${sortedRepos.length} repos. Total views snapshot: ${totalNewViews}.`
            });
          }

        } catch (error) {
          console.error("Background sync failed:", error);
        }
      }, SYNC_INTERVAL);
    };

    setupSync();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);
}
