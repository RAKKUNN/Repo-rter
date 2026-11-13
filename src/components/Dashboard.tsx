'use client';

import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import {
  getUser,
  getRepos,
  getRepoTrafficViews,
  getRepoTrafficClones,
  getRepoTrafficPaths,
  getRepoTrafficReferrers,
  getRepoLanguages,
  getRepoPulls,
  getRepoAlerts,
  getRepoCommits,
  getRepoReleases,
} from '@/lib/github';
import { removeGithubToken } from '@/lib/auth';
import { open } from '@tauri-apps/plugin-shell';
import { isTauri } from '@tauri-apps/api/core';
import {
  LayoutDashboard,
  Loader2,
  Star,
  Eye,
  GitBranch,
  GitPullRequest,
  EyeOff,
  Globe,
  Download,
  Settings,
  Search,
  RefreshCw,
  ArrowLeft,
  X,
  ExternalLink,
  ChevronRight,
  GitCommit,
  Code2,
  HardDrive,
  Scale,
  Clock,
  Monitor,
} from 'lucide-react';
import MetricCard from './MetricCard';
import TrafficChart from './TrafficChart';
import GlobalTrafficChart from './GlobalTrafficChart';
import SettingsModal, { TabType } from './SettingsModal';
import EmptyState from './EmptyState';
import DashboardSkeleton from './DashboardSkeleton';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { useToast } from './ToastProvider';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { generateMarkdownReport, downloadMarkdown } from '@/lib/export';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

type RepoSortBy = 'stars' | 'forks' | 'name' | ' pushed';
type ActiveMetricTab = 'overview' | 'stars' | 'forks' | 'repos';

const PALETTE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#f43f5e', '#10b981', '#6366f1'];

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatRelativeDays(dateStr?: string): string {
  if (!dateStr) return '-';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days}d ago`;
}

async function openExternalUrlSafely(url: string) {
  if (!url || (!url.startsWith('https://') && !url.startsWith('http://'))) return;
  if (isTauri()) {
    await open(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [hiddenRepos, setHiddenRepos] = useState<Record<string, boolean>>({});
  const [activeMetric, setActiveMetric] = useState<ActiveMetricTab>('overview');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<TabType>('general');
  const [showForks, setShowForks] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<RepoSortBy>('stars');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');

  // Initialize background scheduler
  useBackgroundSync();

  useEffect(() => {
    setLastRefreshedAt(new Date().toLocaleTimeString());
    const saved = localStorage.getItem('hiddenRepos');
    if (saved) {
      try {
        setHiddenRepos(JSON.parse(saved));
      } catch {
        // ignore invalid json
      }
    }
  }, []);

  const handleManualRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (selectedRepo) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['views'] }),
          queryClient.invalidateQueries({ queryKey: ['clones'] }),
          queryClient.invalidateQueries({ queryKey: ['paths'] }),
          queryClient.invalidateQueries({ queryKey: ['referrers'] }),
          queryClient.invalidateQueries({ queryKey: ['releases'] }),
          queryClient.invalidateQueries({ queryKey: ['pulls'] }),
          queryClient.invalidateQueries({ queryKey: ['languages'] }),
          queryClient.invalidateQueries({ queryKey: ['commits'] }),
        ]);
      } else {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['githubUser'] }),
          queryClient.invalidateQueries({ queryKey: ['githubRepos'] }),
          queryClient.invalidateQueries({ queryKey: ['views'] }),
          queryClient.invalidateQueries({ queryKey: ['alerts'] }),
        ]);
      }
      await queryClient.refetchQueries({ type: 'active' });
      const nowStr = new Date().toLocaleTimeString();
      setLastRefreshedAt(nowStr);
      toast(
        i18n.language.startsWith('ko')
          ? `최신 데이터로 갱신되었습니다 (${nowStr})`
          : `Refreshed latest GitHub data (${nowStr})`,
        'success'
      );
    } catch (e) {
      console.error('Manual refresh failed:', e);
      toast('Failed to refresh data.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, queryClient, selectedRepo, toast, i18n.language]);

  // Keyboard shortcuts: Cmd/Ctrl+K (Search Focus), Cmd/Ctrl+R (Manual Refresh)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        void handleManualRefresh();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleManualRefresh]);

  const toggleHideRepo = useCallback((repoName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHiddenRepos((prev) => {
      const next = { ...prev, [repoName]: !prev[repoName] };
      localStorage.setItem('hiddenRepos', JSON.stringify(next));
      return next;
    });
  }, []);

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

  // Memoize visible & sorted repositories to avoid unnecessary re-computation on filter changes
  const visibleRepos = useMemo(
    () =>
      repos?.filter((r: any) => {
        if (hiddenRepos[r.name]) return false;
        if (!showForks && r.fork) return false;
        return true;
      }) || [],
    [repos, hiddenRepos, showForks]
  );

  const sortedVisibleRepos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...visibleRepos]
      .filter((repo) => !q || repo.name.toLowerCase().includes(q))
      .sort((a: any, b: any) => {
        if (sortBy === 'forks') return b.forks_count - a.forks_count;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === ' pushed') {
          return new Date(b.pushed_at || 0).getTime() - new Date(a.pushed_at || 0).getTime();
        }
        return b.stargazers_count - a.stargazers_count;
      });
  }, [visibleRepos, searchQuery, sortBy]);

  const hiddenReposList = useMemo(
    () => repos?.filter((r: any) => hiddenRepos[r.name]) || [],
    [repos, hiddenRepos]
  );

  // Prefetch repo views & clones on sidebar hover so clicking a repo feels instant (0ms)
  const handlePrefetchRepo = useCallback(
    (repo: any) => {
      const owner = repo?.owner?.login;
      const name = repo?.name;
      if (!owner || !name) return;
      void queryClient.prefetchQuery({
        queryKey: ['views', owner, name],
        queryFn: () => getRepoTrafficViews(owner, name),
        staleTime: 10 * 60 * 1000,
      });
      void queryClient.prefetchQuery({
        queryKey: ['clones', owner, name],
        queryFn: () => getRepoTrafficClones(owner, name),
        staleTime: 10 * 60 * 1000,
      });
    },
    [queryClient]
  );

  const handleLogout = async () => {
    await removeGithubToken();
    window.location.reload();
  };

  const totalStars = useMemo(
    () => visibleRepos.reduce((acc: number, repo: any) => acc + repo.stargazers_count, 0),
    [visibleRepos]
  );
  const totalForks = useMemo(
    () => visibleRepos.reduce((acc: number, repo: any) => acc + repo.forks_count, 0),
    [visibleRepos]
  );

  useEffect(() => {
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
              sendNotification({
                title: 'New GitHub Star!',
                body: `Congratulations! Your total stars increased from ${prev} to ${totalStars}.`,
              });
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
    return <DashboardSkeleton />;
  }

  const isKo = i18n.language.startsWith('ko');

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 border-r border-glass-border bg-glass backdrop-blur-xl flex flex-col h-full shrink-0">
        <div className="p-5 border-b border-glass-border flex items-center justify-between">
          <button
            onClick={() => {
              setSelectedRepo(null);
              setActiveMetric('overview');
            }}
            className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity cursor-pointer"
            title="Return to Global Overview"
          >
            <img
              src="/logo.png"
              alt="Logo"
              className="w-8 h-8 rendering-pixelated"
              style={{ imageRendering: 'pixelated' }}
            />
            <span className="text-2xl font-black tracking-tighter text-pixel-blue">
              {t('appTitle')}
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide relative">
          {/* Global Overview Home Button */}
          <button
            onClick={() => {
              setSelectedRepo(null);
              setActiveMetric('overview');
            }}
            className={`w-full mb-4 px-3 py-2.5 text-sm font-bold flex items-center justify-between transition-all theme-control cursor-pointer ${
              selectedRepo === null && activeMetric === 'overview'
                ? 'bg-pixel-blue text-white border-pixel-blue'
                : 'hover:bg-foreground/10 text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {isKo ? '전체 대시보드 (Overview)' : 'Global Overview'}
            </span>
            <ChevronRight className="w-4 h-4 opacity-70" />
          </button>

          {/* Search Input with Cmd+K shortcut */}
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={isKo ? '레포지토리 검색...' : 'Search repos...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full theme-control pl-9 pr-12 py-2 text-sm focus:ring-2 focus:ring-pixel-blue font-bold placeholder:text-foreground/40"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:text-pixel-red"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono opacity-40 border border-foreground/30 px-1">
                  ⌘K
                </span>
              )}
            </div>
          </div>

          {/* Interactive Sort Pills */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider">
              {t('topRepos')} ({sortedVisibleRepos.length})
            </span>
            <div className="flex items-center gap-1 text-[11px] font-bold">
              <button
                onClick={() => setSortBy('stars')}
                className={`px-1.5 py-0.5 transition-colors cursor-pointer ${
                  sortBy === 'stars' ? 'text-pixel-blue underline' : 'opacity-50 hover:opacity-100'
                }`}
                title="Sort by Stars"
              >
                ★
              </button>
              <button
                onClick={() => setSortBy('forks')}
                className={`px-1.5 py-0.5 transition-colors cursor-pointer ${
                  sortBy === 'forks' ? 'text-pixel-blue underline' : 'opacity-50 hover:opacity-100'
                }`}
                title="Sort by Forks"
              >
                ⑂
              </button>
              <button
                onClick={() => setSortBy(' pushed')}
                className={`px-1.5 py-0.5 transition-colors cursor-pointer ${
                  sortBy === ' pushed' ? 'text-pixel-blue underline' : 'opacity-50 hover:opacity-100'
                }`}
                title="Sort by Recently Pushed"
              >
                🕒
              </button>
              <button
                onClick={() => setSortBy('name')}
                className={`px-1.5 py-0.5 transition-colors cursor-pointer ${
                  sortBy === 'name' ? 'text-pixel-blue underline' : 'opacity-50 hover:opacity-100'
                }`}
                title="Sort by Name"
              >
                A-Z
              </button>
            </div>
          </div>

          <div className="space-y-1.5 mb-6">
            {sortedVisibleRepos.map((repo: any) => (
              <div
                key={repo.id}
                onMouseEnter={() => handlePrefetchRepo(repo)}
                onClick={() => setSelectedRepo(repo.name)}
                className={`w-full text-left px-3 py-2 theme-control transition-all text-sm flex items-center justify-between group cursor-pointer ${
                  selectedRepo === repo.name
                    ? 'bg-pixel-blue text-white border-pixel-blue'
                    : 'hover:bg-foreground/10 text-foreground'
                }`}
              >
                <span className="truncate pr-2 font-medium">{repo.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs opacity-70 flex items-center gap-1">
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
              <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                <EyeOff className="w-3 h-3" /> Hidden ({hiddenReposList.length})
              </div>
              <div className="space-y-1.5 opacity-60">
                {hiddenReposList.map((repo: any) => (
                  <div
                    key={repo.id}
                    className="w-full text-left px-3 py-2 text-sm flex items-center justify-between theme-control"
                  >
                    <span className="truncate pr-2">{repo.name}</span>
                    <button
                      onClick={(e) => toggleHideRepo(repo.name, e)}
                      className="p-1 hover:text-pixel-blue"
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

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-glass-border flex items-center justify-between">
          <button
            onClick={() => {
              if (user?.login) {
                void openExternalUrlSafely(`https://github.com/${user.login}`);
              }
            }}
            className="flex-1 flex items-center gap-3 overflow-hidden p-2 hover:bg-foreground/5 transition-all text-left cursor-pointer"
            title="Open GitHub Profile"
          >
            <img
              src={user?.avatar_url}
              alt="Avatar"
              className="w-8 h-8 border-2 border-[var(--pixel-border)] shrink-0"
            />
            <div className="text-sm font-medium truncate text-foreground">
              {user?.name || user?.login}
            </div>
          </button>

          <button
            onClick={() => {
              setSettingsInitialTab('appearance');
              setIsSettingsModalOpen(true);
            }}
            className="p-2 ml-2 text-foreground/60 hover:text-foreground transition-all active:rotate-45 cursor-pointer"
            title="Settings & Themes"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </aside>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        user={user}
        showForks={showForks}
        setShowForks={setShowForks}
        handleLogout={handleLogout}
        toggleLanguage={toggleLanguage}
        initialTab={settingsInitialTab}
      />

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {/* Top Header */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              {(selectedRepo || activeMetric !== 'overview') && (
                <button
                  onClick={() => {
                    setSelectedRepo(null);
                    setActiveMetric('overview');
                  }}
                  className="p-2 theme-control hover:bg-foreground/10 active:translate-y-0.5 cursor-pointer"
                  title="Back to Global Overview"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <h1 className="text-2xl font-bold">{t('overview')}</h1>
            </div>
            <p className="text-foreground/60 text-sm mt-1">
              {t('welcome', { name: user?.name || user?.login })}
              {lastRefreshedAt && (
                <span className="ml-3 text-xs opacity-70 font-mono">
                  • {isKo ? `최근 동기화: ${lastRefreshedAt}` : `Updated: ${lastRefreshedAt}`}
                </span>
              )}
            </p>
          </div>

          {/* Manual Refresh Button */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => void handleManualRefresh()}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-pixel-blue text-white theme-control hover:opacity-90 active:translate-y-0.5 text-xs font-bold disabled:opacity-50 cursor-pointer"
              title="Refresh latest GitHub traffic & metrics (Cmd/Ctrl + R)"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>
                {isRefreshing
                  ? isKo
                    ? '최신화 중...'
                    : 'Refreshing...'
                  : isKo
                  ? '최신화 (Refresh)'
                  : 'Refresh Now'}
              </span>
            </button>
          </div>
        </header>

        {/* Global Metrics — Clicking toggles dedicated contextual breakdown views with 0 network overhead */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title={t('totalStars')}
            value={totalStars}
            icon={Star}
            delay={0.05}
            isActive={!selectedRepo && activeMetric === 'stars'}
            trend={{
              value: visibleRepos.filter((r: any) => r.stargazers_count > 0).length,
              label: isKo ? '스타 보유 레포' : 'starred repos',
              isUp: true,
            }}
            onClick={() => {
              setSelectedRepo(null);
              setActiveMetric((prev) => (prev === 'stars' ? 'overview' : 'stars'));
            }}
          />
          <MetricCard
            title={t('totalForks')}
            value={totalForks}
            icon={GitBranch}
            delay={0.1}
            isActive={!selectedRepo && activeMetric === 'forks'}
            trend={{
              value: totalStars > 0 ? Math.round((totalForks / totalStars) * 100) : 0,
              label: '% fork/star',
              isUp: true,
            }}
            onClick={() => {
              setSelectedRepo(null);
              setActiveMetric((prev) => (prev === 'forks' ? 'overview' : 'forks'));
            }}
          />
          <MetricCard
            title={t('totalRepos')}
            value={visibleRepos.length}
            icon={LayoutDashboard}
            delay={0.15}
            isActive={!selectedRepo && activeMetric === 'repos'}
            trend={{
              value: Math.round(
                visibleRepos.reduce((acc: number, r: any) => acc + (r.size || 0), 0) / 1024
              ),
              label: 'MB total',
              isUp: true,
            }}
            onClick={() => {
              setSelectedRepo(null);
              setActiveMetric((prev) => (prev === 'repos' ? 'overview' : 'repos'));
            }}
          />
        </div>

        {/* Global or Repo Specific View */}
        {!selectedRepo ? (
          <GlobalDashboard
            repos={visibleRepos}
            t={t}
            isKo={isKo}
            activeMetric={activeMetric}
            setActiveMetric={setActiveMetric}
            totalStars={totalStars}
            totalForks={totalForks}
            onSelectRepo={(name) => setSelectedRepo(name)}
          />
        ) : (
          <RepoDetails
            repoData={visibleRepos.find((r: any) => r.name === selectedRepo)}
            t={t}
            isKo={isKo}
            onRefresh={() => void handleManualRefresh()}
            isRefreshing={isRefreshing}
          />
        )}
      </main>
    </div>
  );
}

function RepoDetails({
  repoData,
  t,
  isKo,
  onRefresh,
  isRefreshing,
}: {
  repoData: any;
  t: any;
  isKo: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const owner = repoData?.owner?.login;
  const repo = repoData?.name;
  const [hoveredLang, setHoveredLang] = useState<string | null>(null);

  const { data: views, isLoading: loadingViews } = useQuery({
    queryKey: ['views', owner, repo],
    queryFn: () => getRepoTrafficViews(owner, repo),
    enabled: !!owner && !!repo,
  });

  const { data: clones, isLoading: loadingClones } = useQuery({
    queryKey: ['clones', owner, repo],
    queryFn: () => getRepoTrafficClones(owner, repo),
    enabled: !!owner && !!repo,
  });

  const { data: paths } = useQuery({
    queryKey: ['paths', owner, repo],
    queryFn: () => getRepoTrafficPaths(owner, repo),
    enabled: !!owner && !!repo,
  });

  const { data: referrers } = useQuery({
    queryKey: ['referrers', owner, repo],
    queryFn: () => getRepoTrafficReferrers(owner, repo),
    enabled: !!owner && !!repo,
  });

  const { data: languages } = useQuery({
    queryKey: ['languages', owner, repo],
    queryFn: () => getRepoLanguages(owner, repo),
    enabled: !!owner && !!repo,
  });

  const { data: pulls } = useQuery({
    queryKey: ['pulls', owner, repo],
    queryFn: () => getRepoPulls(owner, repo),
    enabled: !!owner && !!repo,
  });

  const { data: commits } = useQuery({
    queryKey: ['commits', owner, repo],
    queryFn: () => getRepoCommits(owner, repo),
    enabled: !!owner && !!repo,
  });

  const { data: releases, isLoading: loadingReleases } = useQuery({
    queryKey: ['releases', owner, repo],
    queryFn: () => getRepoReleases(owner, repo),
    enabled: !!owner && !!repo,
  });

  // Language breakdown computation
  const languageStats = useMemo(() => {
    if (!languages || Object.keys(languages).length === 0) {
      return { entries: [], totalBytes: 0, topLang: null };
    }
    const totalBytes = Object.values(languages).reduce((acc: number, v: any) => acc + Number(v), 0);
    const entries = Object.entries(languages)
      .map(([name, val], idx) => {
        const bytes = Number(val);
        const pct = totalBytes > 0 ? (bytes / totalBytes) * 100 : 0;
        return {
          name,
          value: bytes,
          pct,
          pctFormatted: pct < 0.1 ? '<0.1%' : `${pct.toFixed(1)}%`,
          sizeFormatted: formatBytes(bytes),
          color: PALETTE_COLORS[idx % PALETTE_COLORS.length],
        };
      })
      .sort((a, b) => b.value - a.value);

    return { entries, totalBytes, topLang: entries[0] || null };
  }, [languages]);

  // OS Platform breakdown from release assets
  const osBreakdown = useMemo(() => {
    if (!releases || releases.length === 0) return null;
    const counts = { macOS: 0, Windows: 0, Linux: 0, Other: 0 };
    releases.forEach((rel: any) => {
      (rel.assets || []).forEach((asset: any) => {
        const n = (asset.name || '').toLowerCase();
        const dl = Number(asset.download_count) || 0;
        if (n.includes('.dmg') || n.includes('mac') || n.includes('darwin') || n.includes('apple') || n.endsWith('.app.tar.gz')) {
          counts.macOS += dl;
        } else if (n.includes('.exe') || n.includes('.msi') || n.includes('win')) {
          counts.Windows += dl;
        } else if (n.includes('.deb') || n.includes('.rpm') || n.includes('.appimage') || n.includes('linux')) {
          counts.Linux += dl;
        } else {
          counts.Other += dl;
        }
      });
    });
    const total = counts.macOS + counts.Windows + counts.Linux + counts.Other;
    if (total === 0) return null;
    return { counts, total };
  }, [releases]);

  if ((loadingViews || loadingClones) && !views && !clones) {
    return (
      <div className="glass-panel p-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pixel-blue" />
      </div>
    );
  }

  const allTimeViewsCount = views?.views?.reduce((sum: number, v: any) => sum + v.count, 0) || 0;
  const allTimeViewsUniques = views?.views?.reduce((sum: number, v: any) => sum + v.uniques, 0) || 0;

  const allTimeClonesCount = clones?.clones?.reduce((sum: number, v: any) => sum + v.count, 0) || 0;
  const allTimeClonesUniques = clones?.clones?.reduce((sum: number, v: any) => sum + v.uniques, 0) || 0;

  const allTimeDownloads =
    releases?.reduce((sum: number, release: any) => {
      return sum + release.assets.reduce((assetSum: number, asset: any) => assetSum + asset.download_count, 0);
    }, 0) || 0;

  const allTimeConversionRate =
    allTimeViewsUniques > 0 ? Math.min(100, Math.round((allTimeClonesUniques / allTimeViewsUniques) * 100)) : 0;

  const openPullsCount = Array.isArray(pulls) ? pulls.length : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      key={repo}
      className="space-y-6 pb-10"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-pixel-purple">{repo}</span>
          </h2>
          {repoData?.language && (
            <span className="px-2.5 py-0.5 text-xs font-bold theme-control text-pixel-blue">
              {repoData.language}
            </span>
          )}
          {repoData?.license?.spdx_id && (
            <span className="px-2.5 py-0.5 text-xs font-mono theme-control opacity-80">
              {repoData.license.spdx_id}
            </span>
          )}
          {repoData?.html_url && (
            <button
              onClick={() => void openExternalUrlSafely(repoData.html_url)}
              className="p-1.5 theme-control hover:bg-foreground/10 text-xs flex items-center gap-1 opacity-75 hover:opacity-100 cursor-pointer"
              title="Open repository on GitHub"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 theme-control hover:bg-foreground/10 text-sm font-bold active:translate-y-0.5 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Sync Repo
          </button>

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
                openPulls: openPullsCount,
                releases: releases || [],
              });
              downloadMarkdown(`${repo}_report`, md);
            }}
            className="flex items-center gap-2 px-4 py-2 theme-control hover:bg-foreground/10 text-sm font-bold active:translate-y-0.5 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export MD
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title={`${t('views')} (All Time)`}
          value={allTimeViewsCount}
          icon={Eye}
          trend={{ value: allTimeViewsUniques, label: 'uniq', isUp: true }}
        />
        <MetricCard
          title={`${t('clones')} (All Time)`}
          value={allTimeClonesCount}
          icon={GitPullRequest}
          trend={{ value: allTimeClonesUniques, label: 'uniq', isUp: true }}
        />
        <MetricCard
          title={`${t('downloads')} (All Time)`}
          value={allTimeDownloads}
          icon={Download}
          trend={{ value: releases?.length || 0, label: 'releases', isUp: true }}
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

      {/* Referrers & Popular Paths with Share & Unique Conversion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">{t('referrers')}</h3>
            {referrers && referrers.length > 0 && (
              <span className="text-xs opacity-60 font-mono">Top {referrers.length} sources</span>
            )}
          </div>
          <div className="space-y-3">
            {referrers && referrers.length > 0 ? (
              referrers.slice(0, 8).map((ref: any, idx: number) => {
                const maxCount = referrers[0]?.count || 1;
                const pct = Math.max(6, Math.round((ref.count / maxCount) * 100));
                const uniqRatio = ref.count > 0 ? Math.round((ref.uniques / ref.count) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1 p-2 rounded hover:bg-foreground/5 transition-colors">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate font-bold">{ref.referrer}</span>
                      <div className="flex items-center gap-3 text-foreground/70 text-xs">
                        <span>{ref.count.toLocaleString()} views</span>
                        <span className="text-pixel-purple font-bold">
                          {ref.uniques.toLocaleString()} uniq ({uniqRatio}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-foreground/10 overflow-hidden">
                      <div className="h-full bg-pixel-blue" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState message="No referrers data available yet." />
            )}
          </div>
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">{t('popularPaths')}</h3>
            {paths && paths.length > 0 && (
              <span className="text-xs opacity-60 font-mono">Top {paths.length} pages</span>
            )}
          </div>
          <div className="space-y-3">
            {paths && paths.length > 0 ? (
              paths.slice(0, 8).map((path: any, idx: number) => {
                const maxCount = paths[0]?.count || 1;
                const pct = Math.max(6, Math.round((path.count / maxCount) * 100));
                return (
                  <div key={idx} className="space-y-1 p-2 rounded hover:bg-foreground/5 transition-colors">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate font-bold max-w-[230px]" title={path.path}>
                        {path.title || path.path}
                      </span>
                      <div className="flex items-center gap-3 text-foreground/70 text-xs">
                        <span>{path.count.toLocaleString()} views</span>
                        <span className="text-pixel-blue font-bold">{path.uniques.toLocaleString()} uniq</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-foreground/10 overflow-hidden">
                      <div className="h-full bg-pixel-purple" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState message="No path data available yet." />
            )}
          </div>
        </div>
      </div>

      {/* Upgraded Languages Breakdown + Repository Pulse (Replaces Echo Locator) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Languages Panel */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Code2 className="w-5 h-5 text-pixel-blue" />
                {t('languages')}
              </h3>
              {languageStats.totalBytes > 0 && (
                <span className="text-xs font-mono opacity-70 px-2 py-0.5 theme-control">
                  Total: {formatBytes(languageStats.totalBytes)}
                </span>
              )}
            </div>

            {languageStats.entries.length > 0 ? (
              <>
                {/* GitHub-style Multi-color Stacked Language Bar */}
                <div className="w-full h-3 flex overflow-hidden theme-control mb-6 p-0">
                  {languageStats.entries.map((lang) => (
                    <div
                      key={lang.name}
                      onMouseEnter={() => setHoveredLang(lang.name)}
                      onMouseLeave={() => setHoveredLang(null)}
                      style={{
                        width: `${Math.max(lang.pct, 1.5)}%`,
                        backgroundColor: lang.color,
                        opacity: hoveredLang && hoveredLang !== lang.name ? 0.35 : 1,
                      }}
                      className="h-full transition-opacity cursor-pointer"
                      title={`${lang.name}: ${lang.pctFormatted} (${lang.sizeFormatted})`}
                    />
                  ))}
                </div>

                {/* Donut + Interactive Legend List Side-by-Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="h-52 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={languageStats.entries}
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="var(--pixel-border)"
                          strokeWidth={1.5}
                        >
                          {languageStats.entries.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={entry.color}
                              opacity={hoveredLang && hoveredLang !== entry.name ? 0.35 : 1}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any, name: any) => [formatBytes(Number(value)), name]}
                          contentStyle={{
                            backgroundColor: 'var(--pixel-panel-bg)',
                            border: '2px solid var(--pixel-border)',
                            borderRadius: 'var(--card-radius, 0px)',
                            color: 'var(--color-foreground)',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center Label inside Donut */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                      <span className="text-xs opacity-60 font-mono">Primary</span>
                      <span className="text-sm font-bold text-pixel-blue truncate max-w-[90px]">
                        {hoveredLang || languageStats.topLang?.name}
                      </span>
                      <span className="text-xs font-mono font-bold">
                        {hoveredLang
                          ? languageStats.entries.find((e) => e.name === hoveredLang)?.pctFormatted
                          : languageStats.topLang?.pctFormatted}
                      </span>
                    </div>
                  </div>

                  {/* Detailed Language Table */}
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {languageStats.entries.map((lang) => (
                      <div
                        key={lang.name}
                        onMouseEnter={() => setHoveredLang(lang.name)}
                        onMouseLeave={() => setHoveredLang(null)}
                        className={`flex items-center justify-between p-2 text-xs theme-control cursor-pointer transition-all ${
                          hoveredLang === lang.name ? 'border-pixel-blue translate-x-0.5' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3 h-3 shrink-0 inline-block"
                            style={{ backgroundColor: lang.color }}
                          />
                          <span className="font-bold truncate">{lang.name}</span>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0 font-mono">
                          <span className="opacity-60">{lang.sizeFormatted}</span>
                          <span className="font-bold text-pixel-blue w-12 text-right">
                            {lang.pctFormatted}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <EmptyState message="No language data detected." />
            )}
          </div>
        </div>

        {/* Repository Pulse & Recent Commits (Replaces useless Echo Locator) */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-pixel-blue">
                <GitCommit className="w-5 h-5" />
                {isKo ? '최근 커밋 & 저장소 메타데이터' : 'Repository Pulse & Recent Commits'}
              </h3>
              <span className="text-xs font-mono opacity-60">
                {repoData?.default_branch || 'main'}
              </span>
            </div>

            {/* Quick Repo Metadata Badges */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-2.5 theme-control text-center">
                <div className="text-[11px] opacity-60 flex items-center justify-center gap-1">
                  <HardDrive className="w-3 h-3" /> Size
                </div>
                <div className="font-bold text-sm mt-0.5 font-mono">
                  {formatBytes((repoData?.size || 0) * 1024)}
                </div>
              </div>
              <div className="p-2.5 theme-control text-center">
                <div className="text-[11px] opacity-60 flex items-center justify-center gap-1">
                  <Scale className="w-3 h-3" /> License
                </div>
                <div className="font-bold text-sm mt-0.5 truncate">
                  {repoData?.license?.spdx_id || 'None'}
                </div>
              </div>
              <div className="p-2.5 theme-control text-center">
                <div className="text-[11px] opacity-60 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" /> Last Push
                </div>
                <div className="font-bold text-sm mt-0.5">
                  {formatRelativeDays(repoData?.pushed_at)}
                </div>
              </div>
            </div>

            {/* Recent Commits Feed */}
            <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1">
              {commits && Array.isArray(commits) && commits.length > 0 ? (
                commits.slice(0, 5).map((item: any) => {
                  const firstLine = (item.commit?.message || 'Commit').split('\n')[0];
                  const shaShort = (item.sha || '').slice(0, 7);
                  const authorName = item.commit?.author?.name || item.author?.login || 'Author';
                  const commitDate = item.commit?.author?.date;
                  return (
                    <button
                      key={item.sha}
                      onClick={() => void openExternalUrlSafely(item.html_url)}
                      className="w-full text-left p-2.5 theme-control hover:bg-foreground/5 transition-colors cursor-pointer flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs truncate text-foreground hover:text-pixel-blue">
                          {firstLine}
                        </div>
                        <div className="text-[11px] opacity-60 mt-1 flex items-center gap-2">
                          <span>{authorName}</span>
                          <span>•</span>
                          <span>{formatRelativeDays(commitDate)}</span>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] px-1.5 py-0.5 bg-pixel-blue/10 text-pixel-blue shrink-0">
                        {shaShort}
                      </span>
                    </button>
                  );
                })
              ) : (
                <EmptyState message="No recent commit history available." />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Releases & Downloads with OS Platform Breakdown */}
      <div className="glass-panel p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Download className="w-5 h-5 text-pixel-blue" />
            Releases & Downloads
          </h3>

          {/* OS Platform Share Breakdown */}
          {osBreakdown && (
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 opacity-70">
                <Monitor className="w-3.5 h-3.5 text-pixel-blue" /> OS Share:
              </span>
              {osBreakdown.counts.macOS > 0 && (
                <span className="px-2 py-0.5 theme-control">
                  🍎 macOS: <strong>{Math.round((osBreakdown.counts.macOS / osBreakdown.total) * 100)}%</strong> ({osBreakdown.counts.macOS.toLocaleString()})
                </span>
              )}
              {osBreakdown.counts.Windows > 0 && (
                <span className="px-2 py-0.5 theme-control">
                  🪟 Windows: <strong>{Math.round((osBreakdown.counts.Windows / osBreakdown.total) * 100)}%</strong> ({osBreakdown.counts.Windows.toLocaleString()})
                </span>
              )}
              {osBreakdown.counts.Linux > 0 && (
                <span className="px-2 py-0.5 theme-control">
                  🐧 Linux: <strong>{Math.round((osBreakdown.counts.Linux / osBreakdown.total) * 100)}%</strong> ({osBreakdown.counts.Linux.toLocaleString()})
                </span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {loadingReleases ? (
            <div className="flex justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin text-pixel-blue" />
            </div>
          ) : releases && releases.length > 0 ? (
            releases.map((release: any) => {
              const releaseTotal = (release.assets || []).reduce(
                (s: number, a: any) => s + (a.download_count || 0),
                0
              );
              return (
                <div
                  key={release.id}
                  className="flex flex-col sm:flex-row sm:items-start justify-between p-4 theme-control"
                >
                  <div className="mb-3 sm:mb-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{release.name || release.tag_name}</span>
                      <span className="text-xs font-mono px-2 py-0.5 bg-pixel-blue/15 text-pixel-blue font-bold">
                        {releaseTotal.toLocaleString()} total dls
                      </span>
                    </div>
                    <div className="text-xs opacity-60 mt-1">
                      Published: {new Date(release.published_at).toLocaleDateString()} (
                      {formatRelativeDays(release.published_at)})
                    </div>
                  </div>
                  <div className="flex-1 w-full sm:w-auto sm:ml-8">
                    {release.assets.length > 0 ? (
                      <div className="space-y-2">
                        {release.assets.map((asset: any) => (
                          <div
                            key={asset.id}
                            className="flex items-center justify-between text-sm bg-foreground/5 p-2 rounded"
                          >
                            <span className="truncate max-w-[200px] md:max-w-[300px]" title={asset.name}>
                              {asset.name}
                            </span>
                            <span className="font-bold text-pixel-blue shrink-0">
                              {asset.download_count.toLocaleString()} dls
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm opacity-50 sm:text-right">No assets</div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState message="No releases found." />
          )}
        </div>
      </div>

      {/* Project Health Summary */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-bold mb-4">{t('projectHealth')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex justify-between items-center p-4 theme-control">
            <span className="text-sm font-medium">{t('openIssues')}</span>
            <span className="font-bold text-pixel-red text-xl">{repoData?.open_issues_count || 0}</span>
          </div>
          <div className="flex justify-between items-center p-4 theme-control">
            <span className="text-sm font-medium">{t('openPRs')}</span>
            <span className="font-bold text-pixel-green text-xl">{openPullsCount}</span>
          </div>
          <div className="flex justify-between items-center p-4 theme-control">
            <div>
              <div className="text-sm font-medium">{t('cloneConversion')} (All-Time)</div>
              <div className="text-[11px] opacity-60">Unique cloners / Unique visitors</div>
            </div>
            <span className="text-pixel-blue font-bold text-xl">{allTimeConversionRate}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function GlobalDashboard({
  repos,
  t,
  isKo,
  activeMetric,
  setActiveMetric,
  totalStars,
  totalForks,
  onSelectRepo,
}: {
  repos: any[];
  t: any;
  isKo: boolean;
  activeMetric: ActiveMetricTab;
  setActiveMetric: (m: ActiveMetricTab) => void;
  totalStars: number;
  totalForks: number;
  onSelectRepo: (name: string) => void;
}) {
  // IMPORTANT: Fix top5 and top10 queries independently of `activeMetric` so clicking
  // Total Stars / Total Forks / Total Repos NEVER triggers new network queries or chart reloads!
  const top5ByStars = useMemo(
    () => [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 5),
    [repos]
  );

  const top10ByStars = useMemo(
    () => [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 10),
    [repos]
  );

  const trafficQueries = useQueries({
    queries: top5ByStars.map((repo) => ({
      queryKey: ['views', repo.owner.login, repo.name],
      queryFn: () => getRepoTrafficViews(repo.owner.login, repo.name),
      enabled: !!repo.owner.login && !!repo.name,
    })),
  });

  const { stackedData, repoKeys } = useMemo(() => {
    const mergedDataMap = new Map<string, any>();
    const keys: string[] = [];

    trafficQueries.forEach((query, index) => {
      const repoName = top5ByStars[index]?.name;
      if (repoName) keys.push(repoName);

      if (query.data && query.data.views) {
        query.data.views.forEach((v: any) => {
          const dateStr = new Date(v.timestamp).toLocaleDateString();
          const existing = mergedDataMap.get(dateStr) || { date: dateStr };
          existing[repoName] = v.count;
          mergedDataMap.set(dateStr, existing);
        });
      }
    });

    const sorted = Array.from(mergedDataMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return { stackedData: sorted, repoKeys: keys };
  }, [trafficQueries, top5ByStars]);

  const alertsQueries = useQueries({
    queries: top10ByStars.map((repo) => ({
      queryKey: ['alerts', repo.owner.login, repo.name],
      queryFn: () => getRepoAlerts(repo.owner.login, repo.name),
      enabled: !!repo.owner.login && !!repo.name,
    })),
  });

  const reposWithAlerts = useMemo(
    () =>
      top10ByStars
        .map((repo, idx) => ({
          ...repo,
          alerts: alertsQueries[idx].data || [],
        }))
        .filter((r) => r.alerts.length > 0),
    [top10ByStars, alertsQueries]
  );

  // Portfolio Language Breakdown across all repositories (for Total Repos view)
  const portfolioLanguages = useMemo(() => {
    const counts: Record<string, number> = {};
    repos.forEach((r: any) => {
      const lang = r.language || 'Other / Docs';
      counts[lang] = (counts[lang] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count], idx) => ({
        name,
        count,
        pct: repos.length > 0 ? Math.round((count / repos.length) * 100) : 0,
        color: PALETTE_COLORS[idx % PALETTE_COLORS.length],
      }))
      .sort((a, b) => b.count - a.count);
  }, [repos]);

  const sortedByStars = useMemo(
    () => [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count),
    [repos]
  );

  const sortedByForks = useMemo(
    () => [...repos].sort((a, b) => b.forks_count - a.forks_count),
    [repos]
  );

  const sortedByRecent = useMemo(
    () =>
      [...repos].sort(
        (a, b) => new Date(b.pushed_at || 0).getTime() - new Date(a.pushed_at || 0).getTime()
      ),
    [repos]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      {/* Contextual Breakdown Section when user clicks Total Stars / Total Forks / Total Repos */}
      {activeMetric === 'stars' && (
        <div className="glass-panel p-6 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-foreground/15 pb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Star className="w-5 h-5 text-pixel-yellow" />
                {isKo ? '스타 분포 및 영향력 분석 (Star Analytics)' : 'Star Distribution & Impact Breakdown'}
              </h2>
              <p className="text-xs opacity-70 mt-1">
                {isKo
                  ? '네트워크 재호출 없이 전체 레포지토리의 스타 집중도와 전환율을 분석합니다.'
                  : 'Instant breakdown of star concentration across your repositories.'}
              </p>
            </div>
            <button
              onClick={() => setActiveMetric('overview')}
              className="px-3 py-1.5 text-xs font-bold theme-control hover:bg-foreground/10 cursor-pointer"
            >
              {isKo ? 'Overview로 돌아가기' : 'Back to Overview'}
            </button>
          </div>

          {/* Summary KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 theme-control">
              <div className="text-xs opacity-60">{isKo ? '레포당 평균 스타' : 'Avg Stars / Repo'}</div>
              <div className="text-2xl font-bold text-pixel-blue mt-1">
                {repos.length > 0 ? (totalStars / repos.length).toFixed(1) : '0'}
              </div>
            </div>
            <div className="p-4 theme-control">
              <div className="text-xs opacity-60">{isKo ? '최다 스타 1위 레포 비중' : 'Top Repo Concentration'}</div>
              <div className="text-2xl font-bold text-pixel-purple mt-1">
                {totalStars > 0 && sortedByStars[0]
                  ? `${Math.round((sortedByStars[0].stargazers_count / totalStars) * 100)}% (${sortedByStars[0].name})`
                  : '0%'}
              </div>
            </div>
            <div className="p-4 theme-control">
              <div className="text-xs opacity-60">{isKo ? '스타 보유 레포 비율' : 'Starred Repo Ratio'}</div>
              <div className="text-2xl font-bold text-pixel-green mt-1">
                {repos.filter((r) => r.stargazers_count > 0).length} / {repos.length}
              </div>
            </div>
          </div>

          {/* Star Share Stacked Bar */}
          {totalStars > 0 && (
            <div>
              <div className="text-xs font-bold mb-2 opacity-75">
                {isKo ? '레포지토리별 스타 점유율' : 'Star Share Distribution'}
              </div>
              <div className="w-full h-4 flex overflow-hidden theme-control p-0">
                {sortedByStars.slice(0, 8).map((repo, idx) => {
                  const pct = (repo.stargazers_count / totalStars) * 100;
                  if (pct <= 0) return null;
                  return (
                    <div
                      key={repo.id}
                      onClick={() => onSelectRepo(repo.name)}
                      style={{
                        width: `${Math.max(pct, 2)}%`,
                        backgroundColor: PALETTE_COLORS[idx % PALETTE_COLORS.length],
                      }}
                      className="h-full cursor-pointer hover:opacity-80 transition-opacity"
                      title={`${repo.name}: ★ ${repo.stargazers_count} (${pct.toFixed(1)}%)`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Star Leaderboard */}
          <div className="space-y-2.5">
            {sortedByStars.map((repo, idx) => {
              const sharePct = totalStars > 0 ? Math.round((repo.stargazers_count / totalStars) * 100) : 0;
              return (
                <div
                  key={repo.id}
                  onClick={() => onSelectRepo(repo.name)}
                  className="p-3.5 theme-control hover:bg-foreground/5 cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="font-mono font-bold text-sm opacity-40 w-6">#{idx + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-pixel-blue truncate">{repo.name}</div>
                      <div className="w-full max-w-xs h-1.5 bg-foreground/10 mt-1.5 overflow-hidden">
                        <div className="h-full bg-pixel-yellow" style={{ width: `${Math.max(sharePct, 2)}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm font-mono shrink-0">
                    <span className="text-xs opacity-60">{sharePct}% share</span>
                    <span className="font-bold flex items-center gap-1">
                      <Star className="w-4 h-4 text-pixel-yellow" /> {repo.stargazers_count.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeMetric === 'forks' && (
        <div className="glass-panel p-6 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-foreground/15 pb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-pixel-purple" />
                {isKo ? '포크 및 생태계 기여도 분석 (Fork Analytics)' : 'Forks & Ecosystem Contribution Breakdown'}
              </h2>
              <p className="text-xs opacity-70 mt-1">
                {isKo
                  ? '단순 북마크(Star)를 넘어 실제로 코드를 포크해 간 비율(Fork-to-Star Ratio)을 진단합니다.'
                  : 'Measures active developer engagement via Fork-to-Star conversion ratios.'}
              </p>
            </div>
            <button
              onClick={() => setActiveMetric('overview')}
              className="px-3 py-1.5 text-xs font-bold theme-control hover:bg-foreground/10 cursor-pointer"
            >
              {isKo ? 'Overview로 돌아가기' : 'Back to Overview'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 theme-control">
              <div className="text-xs opacity-60">{isKo ? '전체 Fork / Star 비율' : 'Global Fork-to-Star Ratio'}</div>
              <div className="text-2xl font-bold text-pixel-purple mt-1">
                {totalStars > 0 ? `${((totalForks / totalStars) * 100).toFixed(1)}%` : '0%'}
              </div>
            </div>
            <div className="p-4 theme-control">
              <div className="text-xs opacity-60">{isKo ? '포크가 발생한 레포 수' : 'Forked Repositories'}</div>
              <div className="text-2xl font-bold text-pixel-blue mt-1">
                {repos.filter((r) => r.forks_count > 0).length} / {repos.length}
              </div>
            </div>
            <div className="p-4 theme-control">
              <div className="text-xs opacity-60">{isKo ? '최다 포크 1위 레포' : 'Most Forked Repo'}</div>
              <div className="text-2xl font-bold text-pixel-green mt-1 truncate">
                {sortedByForks[0]?.forks_count > 0
                  ? `${sortedByForks[0].name} (${sortedByForks[0].forks_count})`
                  : '-'}
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {sortedByForks.map((repo, idx) => {
              const forkRate =
                repo.stargazers_count > 0
                  ? Math.round((repo.forks_count / repo.stargazers_count) * 100)
                  : 0;
              return (
                <div
                  key={repo.id}
                  onClick={() => onSelectRepo(repo.name)}
                  className="p-3.5 theme-control hover:bg-foreground/5 cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono font-bold text-sm opacity-40 w-6">#{idx + 1}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-pixel-blue truncate">{repo.name}</div>
                      <div className="text-xs opacity-60">
                        ★ {repo.stargazers_count} stars • {repo.open_issues_count} open issues
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 font-mono text-sm">
                    <span className="text-xs px-2 py-0.5 bg-pixel-purple/15 text-pixel-purple font-bold">
                      {forkRate}% fork/star
                    </span>
                    <span className="font-bold flex items-center gap-1">
                      <GitBranch className="w-4 h-4 text-pixel-purple" /> {repo.forks_count.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeMetric === 'repos' && (
        <div className="glass-panel p-6 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-foreground/15 pb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-pixel-blue" />
                {isKo ? '전체 레포지토리 포트폴리오 & 기술 스택 인벤토리' : 'Repository Portfolio & Tech Stack Inventory'}
              </h2>
              <p className="text-xs opacity-70 mt-1">
                {isKo
                  ? '보유 중인 전체 레포지토리의 주력 언어 비중, 용량, 라이선스 및 최근 푸시 현황입니다.'
                  : 'Complete inventory of primary languages, disk footprint, licenses, and recent activity.'}
              </p>
            </div>
            <button
              onClick={() => setActiveMetric('overview')}
              className="px-3 py-1.5 text-xs font-bold theme-control hover:bg-foreground/10 cursor-pointer"
            >
              {isKo ? 'Overview로 돌아가기' : 'Back to Overview'}
            </button>
          </div>

          {/* Primary Language Distribution Across Portfolio */}
          <div>
            <div className="text-xs font-bold mb-2 opacity-75">
              {isKo ? '포트폴리오 주력 언어 분포' : 'Primary Language Distribution Across Repos'}
            </div>
            <div className="w-full h-3.5 flex overflow-hidden theme-control p-0 mb-3">
              {portfolioLanguages.map((lang) => (
                <div
                  key={lang.name}
                  style={{ width: `${Math.max(lang.pct, 2)}%`, backgroundColor: lang.color }}
                  className="h-full"
                  title={`${lang.name}: ${lang.count} repos (${lang.pct}%)`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {portfolioLanguages.map((lang) => (
                <span key={lang.name} className="px-2.5 py-1 text-xs font-bold theme-control flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 inline-block" style={{ backgroundColor: lang.color }} />
                  {lang.name}: {lang.count} ({lang.pct}%)
                </span>
              ))}
            </div>
          </div>

          {/* Recently Pushed Inventory List */}
          <div className="space-y-2.5">
            {sortedByRecent.map((repo) => (
              <div
                key={repo.id}
                onClick={() => onSelectRepo(repo.name)}
                className="p-3.5 theme-control hover:bg-foreground/5 cursor-pointer flex flex-wrap items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-pixel-blue truncate">{repo.name}</span>
                    {repo.language && (
                      <span className="text-[11px] px-2 py-0.5 bg-pixel-blue/10 text-pixel-blue font-bold">
                        {repo.language}
                      </span>
                    )}
                    {repo.license?.spdx_id && (
                      <span className="text-[11px] font-mono opacity-60 border border-foreground/20 px-1.5">
                        {repo.license.spdx_id}
                      </span>
                    )}
                  </div>
                  <div className="text-xs opacity-60 truncate mt-1">
                    {repo.description || 'No description'}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                  <span className="opacity-70">{formatBytes((repo.size || 0) * 1024)}</span>
                  <span className="text-pixel-green font-bold">
                    Pushed {formatRelativeDays(repo.pushed_at)}
                  </span>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Default Overview Content */}
      {activeMetric === 'overview' && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Globe className="text-pixel-blue w-6 h-6" />
              <span>{t('globalTraffic')}</span>
            </h2>
          </div>

          {stackedData.length > 0 && <GlobalTrafficChart data={stackedData} keys={repoKeys} />}

          {/* DEFCON Radar (Security Alerts) */}
          {reposWithAlerts.length > 0 && (
            <div className="border-2 border-pixel-red bg-pixel-red/5 p-6 mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2 text-pixel-red mb-4">
                <span className="text-2xl animate-pulse">🚨</span> DEFCON Radar
              </h3>
              <div className="space-y-3">
                {reposWithAlerts.map((repo) => (
                  <div
                    key={repo.id}
                    onClick={() => onSelectRepo(repo.name)}
                    className="flex items-center justify-between p-3 border-2 border-pixel-red bg-[var(--pixel-panel-bg)] cursor-pointer hover:bg-pixel-red/10 transition-colors"
                  >
                    <div className="font-bold text-pixel-red">{repo.name}</div>
                    <div className="flex items-center gap-3 text-sm font-bold text-pixel-red">
                      <span>{repo.alerts.length} Security Alerts</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold mb-4">{t('trending')} — Top 5 Repositories</h3>
            <div className="space-y-3">
              {top5ByStars.map((repo, idx) => (
                <div
                  key={repo.id}
                  onClick={() => onSelectRepo(repo.name)}
                  className="flex items-center justify-between p-4 theme-control hover:bg-foreground/5 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-2xl font-bold text-foreground/30 w-8 shrink-0">{idx + 1}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-pixel-blue group-hover:underline truncate">
                          {repo.name}
                        </span>
                        {repo.language && (
                          <span className="text-[11px] px-2 py-0.5 bg-foreground/10 font-mono">
                            {repo.language}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-foreground/60 truncate">
                        {repo.description || 'No description'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-foreground shrink-0 ml-4">
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-foreground/60">{t('totalStars')}</span>
                      <span className="font-bold flex items-center gap-1">
                        <Star className="w-4 h-4 text-pixel-yellow" /> {repo.stargazers_count}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-foreground/60">{t('totalForks')}</span>
                      <span className="font-bold flex items-center gap-1">
                        <GitBranch className="w-4 h-4 text-pixel-purple" /> {repo.forks_count}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-foreground/60">{t('openIssues')}</span>
                      <span className="font-bold flex items-center gap-1">
                        <GitPullRequest className="w-4 h-4 text-pixel-red" /> {repo.open_issues_count}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
