'use client';

import { useQuery, useQueries } from '@tanstack/react-query';
import { getUser, getRepos, getRepoTrafficViews, getRepoTrafficClones, getRepoTrafficPaths, getRepoTrafficReferrers, getRepoLanguages, getRepoIssues, getRepoPulls, getRepoAlerts, getRepoMentions } from '@/lib/github';
import { removeGithubToken } from '@/lib/auth';
import { open } from '@tauri-apps/plugin-shell';
import { isTauri } from '@tauri-apps/api/core';
import { LogOut, LayoutDashboard, Loader2, Star, Eye, GitBranch, GitPullRequest, EyeOff, Globe, Download, Settings, Moon, Sun, MessageCircle } from 'lucide-react';
import MetricCard from './MetricCard';
import TrafficChart from './TrafficChart';
import GlobalTrafficChart from './GlobalTrafficChart';
import SettingsModal from './SettingsModal';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { generateMarkdownReport, downloadMarkdown } from '@/lib/export';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [hiddenRepos, setHiddenRepos] = useState<Record<string, boolean>>({});
  const [activeMetric, setActiveMetric] = useState<'stars' | 'forks' | 'repos' | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize background scheduler
  useBackgroundSync();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  };
  const [showForks, setShowForks] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('hiddenRepos');
    if (saved) {
      setHiddenRepos(JSON.parse(saved));
    }
  }, []);

  const toggleHideRepo = (repoName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHidden = { ...hiddenRepos, [repoName]: !hiddenRepos[repoName] };
    setHiddenRepos(newHidden);
    localStorage.setItem('hiddenRepos', JSON.stringify(newHidden));
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ko' : 'en';
    i18n.changeLanguage(newLang);
  };

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['githubUser'],
    queryFn: getUser,
  });

  const { data: repos, isLoading: loadingRepos } = useQuery({
    queryKey: ['githubRepos'],
    queryFn: getRepos,
  });

  const visibleRepos = repos?.filter((r: any) => {
    if (hiddenRepos[r.name]) return false;
    if (!showForks && r.fork) return false;
    return true;
  }) || [];
  
  // Sorted for the sidebar
  const sortedVisibleRepos = [...visibleRepos].sort((a: any, b: any) => b.stargazers_count - a.stargazers_count);
  const hiddenReposList = repos?.filter((r: any) => hiddenRepos[r.name]) || [];

  const handleLogout = () => {
    removeGithubToken();
    window.location.reload();
  };

  const totalStars = visibleRepos.reduce((acc: number, repo: any) => acc + repo.stargazers_count, 0);
  const totalForks = visibleRepos.reduce((acc: number, repo: any) => acc + repo.forks_count, 0);

  useEffect(() => {
    // Check for native notification support
    async function checkNotification() {
      if (!totalStars) return;
      
      const prevStars = localStorage.getItem('lastTotalStars');
      if (prevStars) {
        const prev = parseInt(prevStars, 10);
        if (totalStars > prev) {
          try {
            let permissionGranted = await isPermissionGranted();
            if (!permissionGranted) {
              const permission = await requestPermission();
              permissionGranted = permission === 'granted';
            }
            if (permissionGranted) {
              sendNotification({ title: 'New GitHub Star!', body: `Congratulations! Your total stars increased from ${prev} to ${totalStars}.` });
            }
          } catch (e) {
            console.error('Failed to send native notification:', e);
          }
        }
      }
      localStorage.setItem('lastTotalStars', totalStars.toString());
    }
    checkNotification();
  }, [totalStars]);

  if (loadingUser || loadingRepos) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pixel-blue" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 border-r border-glass-border bg-glass backdrop-blur-xl flex flex-col h-full">
        <div className="p-6 border-b border-glass-border flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-xl">
            <GitPullRequest className="w-6 h-6 text-pixel-purple" />
            <span className="text-gradient">{t('appTitle')}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide relative">
          <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-4 px-2">
            {t('topRepos')} ({visibleRepos.length})
          </div>
          <div className="space-y-1 mb-6">
            {sortedVisibleRepos.map((repo: any) => (
              <div
                key={repo.id}
                onClick={() => setSelectedRepo(repo.name)}
                className={`w-full text-left px-3 py-2 rounded-none border-2 border-[var(--pixel-border)] shadow-[2px_2px_0px_var(--pixel-border)] transition-all text-sm flex items-center justify-between group cursor-pointer ${
                  selectedRepo === repo.name 
                    ? 'bg-pixel-blue text-white' 
                    : 'bg-[var(--pixel-panel-bg)] hover:bg-foreground/10 text-foreground'
                }`}
              >
                <span className="truncate pr-2">{repo.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs opacity-50 flex items-center gap-1">
                    <Star className="w-3 h-3" /> {repo.stargazers_count}
                  </span>
                  <button 
                    onClick={(e) => toggleHideRepo(repo.name, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                    title={t('hide')}
                  >
                    <EyeOff className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {hiddenReposList.length > 0 && (
            <>
              <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-4 px-2 flex items-center gap-2">
                <EyeOff className="w-3 h-3" /> Hidden Repos
              </div>
              <div className="space-y-1 opacity-50">
                {hiddenReposList.map((repo: any) => (
                  <div key={repo.id} className="w-full text-left px-3 py-2 text-sm flex items-center justify-between bg-[var(--pixel-panel-bg)] text-foreground border-2 border-[var(--pixel-border)] shadow-[2px_2px_0px_var(--pixel-border)] mb-1">
                    <span className="truncate pr-2">{repo.name}</span>
                    <button 
                      onClick={(e) => toggleHideRepo(repo.name, e)}
                      className="p-1 text-gray-400 hover:text-pixel-blue dark:hover:text-pixel-blue"
                      title={t('show')}
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-glass-border flex items-center justify-between group">
          <button 
            onClick={async () => {
              if (user?.login) {
                const url = `https://github.com/${user.login}`;
                if (isTauri()) {
                  await open(url);
                } else {
                  window.open(url, '_blank');
                }
              }
            }}
            className="flex-1 flex items-center gap-3 overflow-hidden p-2 rounded-none border-2 border-transparent hover:border-[var(--pixel-border)] hover:shadow-[2px_2px_0px_var(--pixel-border)] bg-transparent hover:bg-[var(--pixel-panel-bg)] transition-all text-left"
            title="Open GitHub Profile"
          >
            <img src={user?.avatar_url} alt="Avatar" className="w-8 h-8 rounded-none border-2 border-[var(--pixel-border)] ring-2 ring-pixel-blue/50" />
            <div className="text-sm font-medium truncate text-foreground">{user?.name || user?.login}</div>
          </button>
          
          <button 
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2 ml-2 text-foreground/50 hover:text-foreground opacity-50 hover:opacity-100 transition-all active:rotate-45"
            title="Settings"
          >
            <Settings className="w-5 h-5 transition-transform duration-300" />
          </button>
        </div>
      </aside>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        user={user}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        toggleLanguage={toggleLanguage}
        showForks={showForks}
        setShowForks={setShowForks}
        handleLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold mb-2">{t('overview')}</h1>
          <p className="text-foreground/60">{t('welcome', { name: user?.name || user?.login })}</p>
        </header>

        {/* Global Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard 
            title={t('totalStars')} 
            value={totalStars} 
            icon={Star} 
            delay={0.1}
            onClick={() => { setActiveMetric('stars'); setSelectedRepo(null); }}
          />
          <MetricCard 
            title={t('totalForks')} 
            value={totalForks} 
            icon={GitBranch} 
            delay={0.2}
            onClick={() => { setActiveMetric('forks'); setSelectedRepo(null); }}
          />
          <MetricCard 
            title={t('totalRepos')} 
            value={visibleRepos.length} 
            icon={LayoutDashboard} 
            delay={0.3}
            onClick={() => { setActiveMetric('repos'); setSelectedRepo(null); }}
          />
        </div>

        {/* Global or Repo Specific View */}
        {!selectedRepo ? (
          <GlobalDashboard repos={visibleRepos} t={t} activeMetric={activeMetric} />
        ) : (
          <RepoDetails repoData={visibleRepos.find((r: any) => r.name === selectedRepo)} t={t} />
        )}
      </main>
    </div>
  );
}

function RepoDetails({ repoData, t }: { repoData: any; t: any }) {
  const owner = repoData?.owner?.login;
  const repo = repoData?.name;
  
  const { data: views, isLoading: loadingViews } = useQuery({
    queryKey: ['views', owner, repo],
    queryFn: () => getRepoTrafficViews(owner, repo),
    enabled: !!owner && !!repo,
  });

  const { data: clones, isLoading: loadingClones } = useQuery({
    queryKey: ['clones', owner, repo],
    queryFn: () => getRepoTrafficClones(owner, repo),
  });

  const { data: paths } = useQuery({
    queryKey: ['paths', owner, repo],
    queryFn: () => getRepoTrafficPaths(owner, repo),
  });

  const { data: referrers } = useQuery({
    queryKey: ['referrers', owner, repo],
    queryFn: () => getRepoTrafficReferrers(owner, repo),
  });

  const { data: languages } = useQuery({
    queryKey: ['languages', owner, repo],
    queryFn: () => getRepoLanguages(owner, repo),
  });

  const { data: pulls } = useQuery({
    queryKey: ['pulls', owner, repo],
    queryFn: () => getRepoPulls(owner, repo),
  });

  const { data: mentionsData } = useQuery({
    queryKey: ['mentions', repo],
    queryFn: () => getRepoMentions(repo),
  });

  const { data: issues } = useQuery({
    queryKey: ['issues', owner, repo],
    queryFn: () => getRepoIssues(owner, repo),
  });

  if (loadingViews || loadingClones) {
    return (
      <div className="glass-panel p-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pixel-blue" />
      </div>
    );
  }

  // Calculate All-Time totals from merged arrays instead of 14-day count
  const allTimeViewsCount = views?.views?.reduce((sum: number, v: any) => sum + v.count, 0) || 0;
  const allTimeViewsUniques = views?.views?.reduce((sum: number, v: any) => sum + v.uniques, 0) || 0;
  
  const allTimeClonesCount = clones?.clones?.reduce((sum: number, v: any) => sum + v.count, 0) || 0;
  const allTimeClonesUniques = clones?.clones?.reduce((sum: number, v: any) => sum + v.uniques, 0) || 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      key={repo} // force re-render animation when repo changes
      className="space-y-6 pb-10"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span className="text-pixel-purple">{repo}</span>
        </h2>
        <button
          onClick={() => {
            const md = generateMarkdownReport({
              repoName: repo,
              views: { count: allTimeViewsCount, uniques: allTimeViewsUniques },
              clones: { count: allTimeClonesCount, uniques: allTimeClonesUniques },
              referrers: referrers || [],
              paths: paths || [],
              languages: languages || {},
              openIssues: repoData?.open_issues_count || 0,
              openPulls: pulls ? pulls.filter((p: any) => p.state === 'open').length : 0
            });
            downloadMarkdown(`${repo}_report`, md);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#2d2d2d] border-2 border-black dark:border-[#aaaaaa] shadow-[2px_2px_0px_var(--pixel-border)] hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-bold active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          <Download className="w-4 h-4" />
          Export MD
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard 
          title={`${t('views')} (All Time)`} 
          value={allTimeViewsCount} 
          icon={Eye} 
          trend={{ value: allTimeViewsUniques, isUp: true }} 
        />
        <MetricCard 
          title={`${t('clones')} (All Time)`} 
          value={allTimeClonesCount} 
          icon={GitPullRequest} 
          trend={{ value: allTimeClonesUniques, isUp: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {views?.views && views.views.length > 0 && (
          <TrafficChart data={views.views} title={`${t('views')} over time`} />
        )}
        {clones?.clones && clones.clones.length > 0 && (
          <TrafficChart data={clones.clones} title={`${t('clones')} over time`} />
        )}
      </div>

      {/* Advanced Metrics (Referrers & Paths) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h3 className="text-lg font-medium mb-4">{t('referrers')}</h3>
          <div className="space-y-3">
            {referrers && referrers.length > 0 ? referrers.slice(0, 5).map((ref: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-sm p-2 rounded hover:bg-white">
                <span className="truncate font-medium">{ref.referrer}</span>
                <div className="flex items-center gap-4 text-foreground/70">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {ref.count}</span>
                  <span className="flex items-center gap-1 text-pixel-purple opacity-80"><Eye className="w-3 h-3" /> {ref.uniques} uniq</span>
                </div>
              </div>
            )) : <p className="text-sm text-foreground/50">No referrers data available.</p>}
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-lg font-medium mb-4">{t('popularPaths')}</h3>
          <div className="space-y-3">
            {paths && paths.length > 0 ? paths.slice(0, 5).map((path: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-sm p-2 rounded hover:bg-white">
                <span className="truncate font-medium max-w-[200px]" title={path.title}>{path.title || path.path}</span>
                <div className="flex items-center gap-4 text-foreground/70">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {path.count}</span>
                  <span className="flex items-center gap-1 text-pixel-blue opacity-80"><Eye className="w-3 h-3" /> {path.uniques} uniq</span>
                </div>
              </div>
            )) : <p className="text-sm text-foreground/50">No path data available.</p>}
          </div>
        </div>
      </div>

      {/* Project Health & Languages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h3 className="text-lg font-medium mb-4">{t('languages')}</h3>
          {languages && Object.keys(languages).length > 0 ? (
            <div className="h-64 drop-shadow-[4px_4px_0px_var(--pixel-border)]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(languages).map(([name, value]) => ({ name, value: Number(value) }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="var(--pixel-border)"
                    strokeWidth={2}
                  >
                    {Object.entries(languages).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#f43f5e'][index % 6]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--pixel-panel-bg)', 
                      border: '3px solid var(--pixel-border)',
                      borderRadius: '0px',
                      color: 'var(--color-foreground)',
                      fontFamily: 'var(--font-pixel)'
                    }}
                    itemStyle={{ color: 'var(--color-foreground)', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-foreground/50">No language data available.</p>}
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-pixel-blue">
            <MessageCircle className="w-5 h-5" />
            Echo Locator (Mentions)
          </h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {mentionsData?.items && mentionsData.items.length > 0 ? (
              mentionsData.items.slice(0, 10).map((mention: any) => (
                <a 
                  key={mention.id} 
                  href={mention.html_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-3 rounded-none border-2 border-[var(--pixel-border)] hover:bg-foreground/5 transition-colors"
                >
                  <div className="font-bold text-pixel-blue hover:underline truncate">{mention.title}</div>
                  <div className="text-sm text-foreground/70 mt-1 flex items-center gap-2">
                    <img src={mention.user.avatar_url} className="w-4 h-4 rounded-full" alt="avatar" />
                    <span>{mention.user.login}</span>
                    <span className="opacity-50">•</span>
                    <span>{new Date(mention.created_at).toLocaleDateString()}</span>
                  </div>
                </a>
              ))
            ) : (
              <p className="text-sm text-foreground/50 text-center py-8">No recent mentions found for this repository across GitHub.</p>
            )}
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-lg font-medium mb-4">{t('projectHealth')}</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-none border-2 border-black shadow-[2px_2px_0px_#000] bg-white">
              <span className="text-sm">{t('openIssues')}</span>
              <span className="font-bold text-red-400 text-lg">{repoData?.open_issues_count || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-none border-2 border-black shadow-[2px_2px_0px_#000] bg-white">
              <span className="text-sm">{t('openPRs')}</span>
              <span className="font-bold text-green-400 text-lg">{pulls ? pulls.filter((p: any) => p.state === 'open').length : 0}</span>
            </div>
            
            <div className="mt-6 pt-4 border-t border-glass-border">
              <h4 className="text-sm font-medium mb-2">{t('conversionRate')}</h4>
              <div className="flex justify-between text-sm p-3 rounded-none border-2 border-black shadow-[2px_2px_0px_#000] bg-white">
                <span>{t('cloneConversion')}</span>
                <span className="text-pixel-blue font-bold text-lg">
                  {views?.uniques && clones?.uniques ? Math.round((clones.uniques / views.uniques) * 100) : 0}%
                </span>
              </div>
              <p className="text-xs text-foreground/40 mt-2">Conversion from unique visitors to unique cloners.</p>
            </div>
          </div>
        </div>
      </div>

    </motion.div>
  );
}

function GlobalDashboard({ repos, t, activeMetric }: { repos: any[]; t: any; activeMetric: string | null }) {
  let displayRepos = [...repos];
  let title = t('trending') + ' - Top 5 Repos';
  
  if (activeMetric === 'stars') {
    displayRepos = displayRepos.sort((a, b) => b.stargazers_count - a.stargazers_count);
    title = 'Top Repositories by Stars';
  } else if (activeMetric === 'forks') {
    displayRepos = displayRepos.sort((a, b) => b.forks_count - a.forks_count);
    title = 'Top Repositories by Forks';
  } else if (activeMetric === 'repos') {
    title = 'All Active Repositories';
  } else {
    // Default trending view
    displayRepos = displayRepos.sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 5);
  }

  // Fetch traffic views for the top 5 display repos
  const topRepos = displayRepos.slice(0, 5);
  const trafficQueries = useQueries({
    queries: topRepos.map(repo => ({
      queryKey: ['views', repo.owner.login, repo.name],
      queryFn: () => getRepoTrafficViews(repo.owner.login, repo.name),
      enabled: !!repo.owner.login && !!repo.name,
    }))
  });

  // Merge traffic data for the Stacked Chart
  const mergedDataMap = new Map<string, any>();
  const repoKeys: string[] = [];

  trafficQueries.forEach((query, index) => {
    const repoName = topRepos[index]?.name;
    if (repoName) repoKeys.push(repoName);
    
    if (query.data && query.data.views) {
      query.data.views.forEach((v: any) => {
        const dateStr = new Date(v.timestamp).toLocaleDateString();
        const existing = mergedDataMap.get(dateStr) || { date: dateStr };
        existing[repoName] = v.count;
        mergedDataMap.set(dateStr, existing);
      });
    }
  });

  const stackedData = Array.from(mergedDataMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Fetch alerts for DEFCON Radar (top 10 repos for performance)
  const radarRepos = displayRepos.slice(0, 10);
  const alertsQueries = useQueries({
    queries: radarRepos.map(repo => ({
      queryKey: ['alerts', repo.owner.login, repo.name],
      queryFn: () => getRepoAlerts(repo.owner.login, repo.name),
      enabled: !!repo.owner.login && !!repo.name,
    }))
  });

  const reposWithAlerts = radarRepos.map((repo, idx) => ({
    ...repo,
    alerts: alertsQueries[idx].data || []
  })).filter(r => r.alerts.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-10"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Globe className="text-pixel-blue w-6 h-6" />
          <span>{t('globalTraffic')}</span>
        </h2>
      </div>

      {/* Global Stacked Chart */}
      {stackedData.length > 0 && (
        <GlobalTrafficChart data={stackedData} keys={repoKeys} />
      )}

      {/* DEFCON Radar (Security Alerts) */}
      {reposWithAlerts.length > 0 && (
        <div className="border-2 border-pixel-red bg-pixel-red/5 p-6 mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2 text-pixel-red mb-4">
            <span className="text-2xl animate-pulse">🚨</span> DEFCON Radar
          </h3>
          <div className="space-y-3">
            {reposWithAlerts.map(repo => (
              <div key={repo.id} className="flex items-center justify-between p-3 border-2 border-pixel-red bg-white/5">
                <div className="font-bold text-pixel-red">{repo.name}</div>
                <div className="flex items-center gap-3 text-sm font-bold text-pixel-red">
                  <span>{repo.alerts.length} Security Alerts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="glass-panel p-6">
        <h3 className="text-lg font-medium mb-4">{title}</h3>
        <div className="space-y-4">
          {displayRepos.map((repo, idx) => (
            <div key={repo.id} className="flex items-center justify-between p-4 rounded-none border-2 border-black bg-white hover:bg-gray-100 transition-colors shadow-[4px_4px_0px_#000]">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-gray-300 w-8">{idx + 1}</span>
                <div>
                  <div className="font-medium text-lg text-pixel-blue">{repo.name}</div>
                  <div className="text-sm text-gray-500">{repo.description || 'No description'}</div>
                </div>
              </div>
              <div className="flex items-center gap-6 text-black">
                <div className={`flex flex-col items-end ${activeMetric === 'stars' ? 'scale-110 font-bold' : ''}`}>
                  <span className="text-xs text-gray-500">{t('totalStars')}</span>
                  <span className="font-bold flex items-center gap-1"><Star className="w-4 h-4 text-pixel-yellow" /> {repo.stargazers_count}</span>
                </div>
                <div className={`flex flex-col items-end ${activeMetric === 'forks' ? 'scale-110 font-bold' : ''}`}>
                  <span className="text-xs text-gray-500">{t('totalForks')}</span>
                  <span className="font-bold flex items-center gap-1"><GitBranch className="w-4 h-4 text-pixel-purple" /> {repo.forks_count}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-500">{t('openIssues')}</span>
                  <span className="font-bold flex items-center gap-1"><GitPullRequest className="w-4 h-4 text-pixel-red" /> {repo.open_issues_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
