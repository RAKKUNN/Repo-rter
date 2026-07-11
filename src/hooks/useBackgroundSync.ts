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

          // 2. Fetch traffic data to trigger localStorage persistence
          // We limit to top 10 repos to avoid hitting API rate limits too quickly in the background
          const topRepos = repos.sort((a: any, b: any) => b.stargazers_count - a.stargazers_count).slice(0, 10);
          
          let totalNewViews = 0;
          for (const repo of topRepos) {
            const owner = repo.owner.login;
            const name = repo.name;
            const viewsData = await getRepoTrafficViews(owner, name);
            const clonesData = await getRepoTrafficClones(owner, name);
            
            if (viewsData && viewsData.count) totalNewViews += viewsData.count;
          }

          // 3. Send Notification
          if (permissionGranted) {
            sendNotification({
              title: 'Repo-rter Sync',
              body: `Background sync completed. Processed ${topRepos.length} top repos. Total views snapshot: ${totalNewViews}.`
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
