'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Globe,
  Moon,
  Sun,
  User,
  LogOut,
  Info,
  Settings as SettingsIcon,
  Download,
  Database,
  Upload,
  Cloud,
  RefreshCw,
  Palette,
  Check,
  Sparkles,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from './ToastProvider';
import { useQueryClient } from '@tanstack/react-query';
import { mergeTrafficData, cleanExpiredCache, loadAllBundledTraffic } from '@/lib/storage';
import { uploadSync, downloadAndMergeSync } from '@/lib/sync';
import { getSecret, setSecret } from '@/lib/secrets';
import { UI_THEMES, THEME_CATEGORIES, ThemeCategory, useUITheme } from '@/lib/themes';
import packageInfo from '../../package.json';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  toggleLanguage: () => void;
  showForks: boolean;
  setShowForks: (val: boolean) => void;
  handleLogout: () => void;
  initialTab?: TabType;
}

export type TabType = 'general' | 'appearance' | 'data' | 'sync' | 'account' | 'about';

export default function SettingsModal({
  isOpen,
  onClose,
  user,
  showForks,
  setShowForks,
  handleLogout,
  initialTab = 'general',
}: SettingsModalProps) {
  const { t, i18n } = useTranslation();
  const { uiTheme, setUITheme, currentThemeDef } = useUITheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [retentionDays, setRetentionDays] = useState<number>(-1);
  const [themeCategoryFilter, setThemeCategoryFilter] = useState<ThemeCategory | 'all'>('all');
  const [themeModeFilter, setThemeModeFilter] = useState<'all' | 'light' | 'dark'>('all');

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const saved = localStorage.getItem('data_retention_days');
    if (saved) {
      setRetentionDays(Number(saved));
    }
  }, []);

  const handleRetentionChange = async (days: number) => {
    setRetentionDays(days);
    localStorage.setItem('data_retention_days', days.toString());
    try {
      await cleanExpiredCache(days);
      toast('Applied data retention policy and purged old entries.', 'success');
      queryClient.invalidateQueries();
    } catch (e) {
      console.error('Failed to apply retention policy:', e);
      toast('Failed to purge old data.', 'error');
    }
  };

  const [syncProvider, setSyncProvider] = useState<'none' | 'webdav'>('none');
  const [webdavUrl, setWebdavUrl] = useState('');
  const [webdavUser, setWebdavUser] = useState('');
  const [webdavPass, setWebdavPass] = useState('');
  const [encryptionKey, setEncryptionKey] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSyncProvider((localStorage.getItem('sync_provider') as 'none' | 'webdav') || 'none');
      setWebdavUrl(localStorage.getItem('sync_webdav_url') || '');
      setWebdavUser(localStorage.getItem('sync_webdav_user') || '');
    }
  }, []);

  // Only access OS Keychain for WebDAV secrets when the Sync tab is actually opened and WebDAV is selected
  useEffect(() => {
    if (isOpen && activeTab === 'sync' && syncProvider === 'webdav') {
      (async () => {
        setWebdavPass((await getSecret('sync_webdav_pass')) || '');
        setEncryptionKey((await getSecret('sync_encryption_key')) || '');
      })();
    }
  }, [isOpen, activeTab, syncProvider]);

  const handleManualSync = async () => {
    if (syncProvider === 'none') return;
    if (!webdavUrl || !webdavUser || !webdavPass || !encryptionKey) {
      toast('Please fill out all sync configuration fields (including Encryption Passphrase) first.', 'error');
      return;
    }

    setIsSyncing(true);
    toast('Starting encrypted synchronization...', 'info');
    try {
      await downloadAndMergeSync();
      await uploadSync();
      toast('Sync completed successfully!', 'success');
      queryClient.invalidateQueries();
    } catch (e: any) {
      console.error('Sync failed:', e);
      toast(`Sync failed: ${e.message || e}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        let importCount = 0;

        // Support both bundled object format ({ views: {...}, clones: {...} }) and legacy array format
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item.repo && item.data) {
              if (item.data.views && Array.isArray(item.data.views)) {
                await mergeTrafficData(item.repo, 'views', item.data.views);
                importCount++;
              }
              if (item.data.clones && Array.isArray(item.data.clones)) {
                await mergeTrafficData(item.repo, 'clones', item.data.clones);
              }
            }
          }
        } else if (data && typeof data === 'object' && (data.views || data.clones)) {
          const viewsMap = data.views || {};
          const clonesMap = data.clones || {};
          for (const [repoKey, pts] of Object.entries(viewsMap)) {
            if (Array.isArray(pts)) {
              await mergeTrafficData(repoKey, 'views', pts as any);
              importCount++;
            }
          }
          for (const [repoKey, pts] of Object.entries(clonesMap)) {
            if (Array.isArray(pts)) {
              await mergeTrafficData(repoKey, 'clones', pts as any);
            }
          }
        } else {
          toast('Invalid backup format.', 'error');
          return;
        }

        if (importCount > 0) {
          toast(`Successfully imported traffic data for ${importCount} repositories.`, 'success');
          queryClient.invalidateQueries();
        } else {
          toast('No valid repository data found in the file.', 'error');
        }
      } catch (err) {
        console.error('Import failed:', err);
        toast('Failed to parse JSON file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const exportData = async (format: 'json' | 'csv') => {
    try {
      const bundled = await loadAllBundledTraffic();
      const repoKeys = Array.from(
        new Set([...Object.keys(bundled.views), ...Object.keys(bundled.clones)])
      ).sort();

      if (repoKeys.length === 0) {
        toast('No persisted traffic data to export yet.', 'error');
        return;
      }

      let blob: Blob;
      let filename = `reporter_export_${new Date().toISOString().split('T')[0]}`;

      if (format === 'json') {
        const extract = repoKeys.map((repo) => ({
          repo,
          data: {
            views: bundled.views[repo] || [],
            clones: bundled.clones[repo] || [],
          },
        }));
        blob = new Blob([JSON.stringify(extract, null, 2)], { type: 'application/json' });
        filename += '.json';
      } else {
        let csvContent = 'Repository,Type,Date,Count,Uniques\n';
        repoKeys.forEach((repo) => {
          (bundled.views[repo] || []).forEach((v) => {
            const date = new Date(v.timestamp).toISOString().split('T')[0];
            csvContent += `"${repo}",views,${date},${v.count},${v.uniques}\n`;
          });
          (bundled.clones[repo] || []).forEach((c) => {
            const date = new Date(c.timestamp).toISOString().split('T')[0];
            csvContent += `"${repo}",clones,${date},${c.count},${c.uniques}\n`;
          });
        });
        blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        filename += '.csv';
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast(`Exported ${repoKeys.length} repositories as ${format.toUpperCase()}`, 'success');
    } catch (e) {
      console.error('Export failed', e);
      toast('Export failed. Please check the console.', 'error');
    }
  };

  const filteredThemes = UI_THEMES.filter((themeItem) => {
    if (themeCategoryFilter !== 'all' && themeItem.category !== themeCategoryFilter) return false;
    if (themeModeFilter === 'light' && themeItem.isDark) return false;
    if (themeModeFilter === 'dark' && !themeItem.isDark) return false;
    return true;
  });

  const isKo = i18n.language.startsWith('ko');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl h-[680px] max-h-[90vh] glass-panel flex flex-col relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-[var(--pixel-border)] px-6 py-4 bg-[var(--pixel-panel-bg)]">
              <div className="flex items-center gap-3">
                <SettingsIcon className="w-6 h-6 text-pixel-blue" />
                <h2 className="text-2xl font-bold">{t('settings')}</h2>
                <span className="text-xs px-2 py-0.5 border border-[var(--pixel-border)] opacity-60 hidden sm:inline">
                  ESC to close
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-foreground/10 transition-colors active:translate-y-[2px]"
                title="Close (Esc)"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden bg-[var(--pixel-panel-bg)]">
              {/* Sidebar Tabs */}
              <div className="w-60 border-r-2 border-[var(--pixel-border)] flex flex-col bg-foreground/5">
                <nav className="flex-1 p-4 space-y-2">
                  <TabButton
                    icon={Palette}
                    label={isKo ? '디자인 테마 (22)' : 'UI Themes (22)'}
                    isActive={activeTab === 'appearance'}
                    onClick={() => setActiveTab('appearance')}
                  />
                  <TabButton
                    icon={SettingsIcon}
                    label={t('general')}
                    isActive={activeTab === 'general'}
                    onClick={() => setActiveTab('general')}
                  />
                  <TabButton
                    icon={Database}
                    label={t('data')}
                    isActive={activeTab === 'data'}
                    onClick={() => setActiveTab('data')}
                  />
                  <TabButton
                    icon={Cloud}
                    label={t('sync') || 'Sync'}
                    isActive={activeTab === 'sync'}
                    onClick={() => setActiveTab('sync')}
                  />
                  <TabButton
                    icon={User}
                    label={t('account')}
                    isActive={activeTab === 'account'}
                    onClick={() => setActiveTab('account')}
                  />
                  <TabButton
                    icon={Info}
                    label={t('about')}
                    isActive={activeTab === 'about'}
                    onClick={() => setActiveTab('about')}
                  />
                </nav>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[var(--pixel-panel-bg)]">
                {activeTab === 'general' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <section>
                      <h3 className="text-xl font-bold mb-4 border-b-2 border-foreground/20 pb-2">{t('language')}</h3>
                      <div className="flex items-center justify-between p-4 theme-control">
                        <div>
                          <div className="font-bold flex items-center gap-2">
                            <Globe className="w-4 h-4 text-pixel-blue" /> {t('displayLanguage')}
                          </div>
                          <div className="text-sm opacity-70 mt-1">{t('changeLanguageDesc')}</div>
                        </div>
                        <select
                          value={i18n.language.split('-')[0]}
                          onChange={(e) => i18n.changeLanguage(e.target.value)}
                          className="px-4 py-2 theme-control font-bold hover:bg-foreground/5 cursor-pointer outline-none focus:ring-2 focus:ring-pixel-blue"
                        >
                          <option value="en">English</option>
                          <option value="ko">한국어 (Korean)</option>
                          <option value="zh">中文 (Chinese)</option>
                          <option value="hi">हिन्दी (Hindi)</option>
                          <option value="es">Español (Spanish)</option>
                          <option value="fr">Français (French)</option>
                          <option value="ar">العربية (Arabic)</option>
                          <option value="ru">Русский (Russian)</option>
                          <option value="pt">Português (Portuguese)</option>
                          <option value="id">Bahasa Indonesia</option>
                          <option value="de">Deutsch (German)</option>
                          <option value="ja">日本語 (Japanese)</option>
                        </select>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xl font-bold mb-4 border-b-2 border-foreground/20 pb-2">
                        {t('dataPreferences')}
                      </h3>
                      <label className="flex items-center justify-between p-4 theme-control cursor-pointer hover:bg-foreground/5 transition-colors">
                        <div>
                          <div className="font-bold">{t('includeForks')}</div>
                          <div className="text-sm opacity-70 mt-1">{t('includeForksDesc')}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={showForks}
                          onChange={(e) => setShowForks(e.target.checked)}
                          className="w-6 h-6 border-2 border-[var(--pixel-border)] bg-background accent-pixel-blue"
                        />
                      </label>
                    </section>
                  </div>
                )}

                {activeTab === 'appearance' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-foreground/20 pb-4">
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-pixel-blue" />
                          {isKo ? 'UI 디자인 스타일 테마 스튜디오 (22종)' : 'UI Design Style Theme Studio (22 Styles)'}
                        </h3>
                        <p className="text-sm opacity-70 mt-1">
                          {isKo
                            ? `현재 적용 중: ${currentThemeDef.nameKo} (${currentThemeDef.reference})`
                            : `Active Style: ${currentThemeDef.nameEn} (${currentThemeDef.reference})`}
                        </p>
                      </div>

                      {/* Light / Dark Mode Filter */}
                      <div className="flex items-center gap-1 p-1 border border-[var(--pixel-border)] bg-foreground/5 self-start">
                        <button
                          onClick={() => setThemeModeFilter('all')}
                          className={`px-3 py-1 text-xs font-bold transition-colors ${
                            themeModeFilter === 'all' ? 'bg-pixel-blue text-white' : 'hover:bg-foreground/10'
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setThemeModeFilter('light')}
                          className={`px-3 py-1 text-xs font-bold flex items-center gap-1 transition-colors ${
                            themeModeFilter === 'light' ? 'bg-pixel-blue text-white' : 'hover:bg-foreground/10'
                          }`}
                        >
                          <Sun className="w-3 h-3" /> Light
                        </button>
                        <button
                          onClick={() => setThemeModeFilter('dark')}
                          className={`px-3 py-1 text-xs font-bold flex items-center gap-1 transition-colors ${
                            themeModeFilter === 'dark' ? 'bg-pixel-blue text-white' : 'hover:bg-foreground/10'
                          }`}
                        >
                          <Moon className="w-3 h-3" /> Dark
                        </button>
                      </div>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap gap-2">
                      {THEME_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setThemeCategoryFilter(cat.id)}
                          className={`px-3.5 py-1.5 text-xs font-bold transition-all theme-control ${
                            themeCategoryFilter === cat.id
                              ? 'bg-pixel-blue text-white border-pixel-blue'
                              : 'hover:bg-foreground/10'
                          }`}
                        >
                          {isKo ? cat.labelKo : cat.labelEn}
                        </button>
                      ))}
                    </div>

                    {/* 22 Themes Interactive Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredThemes.map((item) => {
                        const isSelected = uiTheme === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setUITheme(item.id);
                              toast(
                                isKo
                                  ? `테마 적용: ${item.nameKo}`
                                  : `Applied theme: ${item.nameEn}`,
                                'success'
                              );
                            }}
                            className={`text-left p-4 transition-all relative flex flex-col justify-between group theme-control ${
                              isSelected
                                ? 'ring-2 ring-pixel-blue border-pixel-blue -translate-y-0.5'
                                : 'hover:-translate-y-0.5 hover:border-pixel-blue/60'
                            }`}
                          >
                            {/* Visual Mini Mockup Preview of the Theme's CSS Architecture */}
                            <div
                              className="w-full h-20 mb-3 p-3 flex items-center justify-between overflow-hidden relative"
                              style={{
                                background: item.preview.bg,
                                borderRadius: item.preview.radius,
                                border: '1px solid rgba(128,128,128,0.25)',
                              }}
                            >
                              {/* Mini Card inside Preview */}
                              <div
                                className="px-3 py-2 flex items-center gap-2.5 w-3/4"
                                style={{
                                  background: item.preview.panel,
                                  borderRadius: item.preview.radius,
                                  border: `2px solid ${item.preview.border}`,
                                  boxShadow: item.preview.shadow,
                                }}
                              >
                                <span
                                  className="w-4 h-4 shrink-0 inline-block"
                                  style={{
                                    backgroundColor: item.preview.primary,
                                    borderRadius: item.preview.radius === '0px' ? '0px' : '999px',
                                  }}
                                />
                                <div className="space-y-1 flex-1">
                                  <div
                                    className="h-2 w-16"
                                    style={{
                                      backgroundColor: item.preview.primary,
                                      borderRadius: '2px',
                                    }}
                                  />
                                  <div
                                    className="h-1.5 w-10 opacity-70"
                                    style={{
                                      backgroundColor: item.preview.secondary,
                                      borderRadius: '2px',
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Mode + Badge */}
                              <div className="flex flex-col items-end gap-1">
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5"
                                  style={{
                                    backgroundColor: item.preview.primary,
                                    color: '#FFFFFF',
                                    borderRadius: item.preview.radius === '0px' ? '0px' : '6px',
                                  }}
                                >
                                  {item.badge}
                                </span>
                                <span
                                  className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                                  style={{
                                    backgroundColor: item.isDark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)',
                                    color: item.isDark ? '#F8FAFC' : '#0F172A',
                                  }}
                                >
                                  {item.isDark ? 'DARK' : 'LIGHT'}
                                </span>
                              </div>
                            </div>

                            {/* Theme Info */}
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-bold text-base flex items-center gap-1.5">
                                  {isKo ? item.nameKo : item.nameEn}
                                </div>
                                {isSelected && (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-pixel-blue bg-pixel-blue/10 px-2 py-0.5">
                                    <Check className="w-3.5 h-3.5" /> Active
                                  </span>
                                )}
                              </div>
                              <p className="text-xs opacity-75 mt-1 line-clamp-2">{item.description}</p>
                              <div className="text-[11px] opacity-50 mt-2 font-mono">
                                Ref: {item.reference}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'data' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <section>
                      <h3 className="text-xl font-bold mb-4 border-b-2 border-foreground/20 pb-2">{t('exportData')}</h3>
                      <div className="p-6 theme-control space-y-6">
                        <div>
                          <div className="font-bold text-lg mb-2">{t('downloadLocalCache')}</div>
                          <div className="text-sm opacity-70">{t('exportDesc')}</div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                          <button
                            onClick={() => void exportData('csv')}
                            className="flex items-center gap-2 px-6 py-3 theme-control hover:bg-foreground/10 active:translate-y-[2px] transition-all font-bold"
                          >
                            <Download className="w-5 h-5" />
                            {t('exportCsv')}
                          </button>
                          <button
                            onClick={() => void exportData('json')}
                            className="flex items-center gap-2 px-6 py-3 bg-pixel-blue text-white theme-control hover:opacity-90 active:translate-y-[2px] transition-all font-bold"
                          >
                            <Database className="w-5 h-5" />
                            {t('exportJson')}
                          </button>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xl font-bold mb-4 border-b-2 border-foreground/20 pb-2">
                        {t('importData') || 'Import Data'}
                      </h3>
                      <div className="p-6 theme-control space-y-6">
                        <div>
                          <div className="font-bold text-lg mb-2">
                            {t('uploadBackupFile') || 'Upload Backup File'}
                          </div>
                          <div className="text-sm opacity-70">
                            {t('importDesc') ||
                              'Restore your repository traffic cache from a previously exported JSON backup file.'}
                          </div>
                        </div>

                        <div>
                          <label className="inline-flex items-center gap-2 px-6 py-3 bg-pixel-purple text-white theme-control hover:opacity-90 active:translate-y-[2px] transition-all font-bold cursor-pointer">
                            <Upload className="w-5 h-5" />
                            {t('selectJsonFile') || 'Select JSON File'}
                            <input
                              type="file"
                              accept=".json"
                              onChange={handleImportJson}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xl font-bold mb-4 border-b-2 border-foreground/20 pb-2">
                        {t('dataRetention') || 'Data Retention'}
                      </h3>
                      <div className="p-6 theme-control space-y-6">
                        <div>
                          <div className="font-bold text-lg mb-2">
                            {t('retentionPeriod') || 'Retention Period'}
                          </div>
                          <div className="text-sm opacity-70">
                            {t('retentionDesc') ||
                              'Automatically purge local traffic data points older than the selected period to save storage space.'}
                          </div>
                        </div>

                        <div>
                          <select
                            value={retentionDays}
                            onChange={(e) => handleRetentionChange(Number(e.target.value))}
                            className="px-4 py-2 theme-control font-bold hover:bg-foreground/5 cursor-pointer outline-none focus:ring-2 focus:ring-pixel-blue"
                          >
                            <option value="-1">{t('keepForever') || 'Keep Forever'}</option>
                            <option value="30">{t('30days') || '30 Days'}</option>
                            <option value="90">{t('90days') || '90 Days'}</option>
                            <option value="180">{t('180days') || '180 Days'}</option>
                            <option value="365">{t('1year') || '1 Year'}</option>
                          </select>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === 'sync' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <section>
                      <h3 className="text-xl font-bold mb-4 border-b-2 border-foreground/20 pb-2">
                        {t('cloudSync') || 'Cloud Synchronization'}
                      </h3>
                      <div className="p-6 theme-control space-y-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-bold text-lg">{t('syncProvider') || 'Sync Provider'}</label>
                          <select
                            value={syncProvider}
                            onChange={(e) => {
                              const val = e.target.value as 'none' | 'webdav';
                              setSyncProvider(val);
                              localStorage.setItem('sync_provider', val);
                            }}
                            className="px-4 py-2 theme-control font-bold hover:bg-foreground/5 cursor-pointer outline-none focus:ring-2 focus:ring-pixel-blue"
                          >
                            <option value="none">{t('none') || 'None (Local Only)'}</option>
                            <option value="webdav">WebDAV (HTTPS + AES-256-GCM E2EE)</option>
                          </select>
                        </div>

                        {syncProvider === 'webdav' && (
                          <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                              <label className="font-bold">{t('webdavUrl') || 'WebDAV URL (HTTPS)'}</label>
                              <input
                                type="text"
                                value={webdavUrl}
                                placeholder="https://example.com/remote.php/dav/files/username/"
                                onChange={(e) => {
                                  setWebdavUrl(e.target.value);
                                  localStorage.setItem('sync_webdav_url', e.target.value);
                                }}
                                className="px-4 py-2 theme-control outline-none focus:ring-2 focus:ring-pixel-blue font-mono text-sm"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="flex flex-col gap-2">
                                <label className="font-bold">{t('username') || 'Username'}</label>
                                <input
                                  type="text"
                                  value={webdavUser}
                                  placeholder="Username"
                                  onChange={(e) => {
                                    setWebdavUser(e.target.value);
                                    localStorage.setItem('sync_webdav_user', e.target.value);
                                  }}
                                  className="px-4 py-2 theme-control outline-none focus:ring-2 focus:ring-pixel-blue text-sm"
                                />
                              </div>
                              <div className="flex flex-col gap-2">
                                <label className="font-bold">
                                  {t('passwordAppPass') || 'Password / App Password'}
                                </label>
                                <input
                                  type="password"
                                  value={webdavPass}
                                  placeholder="Stored in OS Keychain"
                                  onChange={(e) => setWebdavPass(e.target.value)}
                                  onBlur={(e) => {
                                    void setSecret('sync_webdav_pass', e.target.value);
                                  }}
                                  className="px-4 py-2 theme-control outline-none focus:ring-2 focus:ring-pixel-blue text-sm"
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <label className="font-bold flex items-center gap-1">
                                {t('encryptionPassphrase') || 'Encryption Passphrase'}
                                <span className="text-xs font-normal text-pixel-purple">
                                  ({t('e2eeActive') || 'Required for E2EE'})
                                </span>
                              </label>
                              <input
                                type="password"
                                value={encryptionKey}
                                placeholder="Required — Never sent to servers"
                                onChange={(e) => setEncryptionKey(e.target.value)}
                                onBlur={(e) => {
                                  void setSecret('sync_encryption_key', e.target.value);
                                }}
                                className="px-4 py-2 theme-control outline-none focus:ring-2 focus:ring-pixel-blue text-sm"
                              />
                              <p className="text-xs opacity-60">
                                {t('encryptionDesc') ||
                                  'Your local data is encrypted using AES-256-GCM (PBKDF2 100k iterations) before upload. Plaintext uploads are strictly blocked.'}
                              </p>
                            </div>

                            <div className="pt-4 border-t border-foreground/10">
                              <button
                                onClick={handleManualSync}
                                disabled={isSyncing}
                                className="flex items-center gap-2 px-6 py-3 bg-pixel-blue text-white theme-control hover:opacity-90 active:translate-y-[2px] transition-all font-bold disabled:opacity-50"
                              >
                                <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                                {isSyncing ? t('syncing') || 'Syncing...' : t('syncNow') || 'Sync Now'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === 'account' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <section>
                      <h3 className="text-xl font-bold mb-4 border-b-2 border-foreground/20 pb-2">
                        {t('githubProfile')}
                      </h3>
                      <div className="p-6 theme-control flex items-center gap-6">
                        <img
                          src={user?.avatar_url}
                          alt="Avatar"
                          className="w-20 h-20 border-2 border-[var(--pixel-border)]"
                        />
                        <div>
                          <div className="text-2xl font-bold">{user?.name || user?.login}</div>
                          <div className="text-foreground/60">@{user?.login}</div>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xl font-bold mb-4 border-b-2 border-foreground/20 pb-2 text-pixel-red">
                        {t('dangerZone')}
                      </h3>
                      <div className="p-6 border-2 border-pixel-red flex items-center justify-between bg-pixel-red/5">
                        <div>
                          <div className="font-bold text-pixel-red">{t('disconnectAccount')}</div>
                          <div className="text-sm opacity-70 mt-1">{t('disconnectDesc')}</div>
                        </div>
                        <button
                          onClick={() => {
                            handleLogout();
                            onClose();
                          }}
                          className="px-6 py-2 bg-pixel-red text-white font-bold flex items-center gap-2 active:translate-y-[2px]"
                        >
                          <LogOut className="w-4 h-4" />
                          {t('disconnect')}
                        </button>
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === 'about' && (
                  <div className="space-y-8 animate-in fade-in duration-300 text-center py-10 flex flex-col items-center">
                    <img
                      src="/logo.png"
                      alt="Repo-rter Logo"
                      className="w-24 h-24 mb-4 rendering-pixelated"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <h2 className="text-3xl font-bold text-gradient mb-1">Repo-rter</h2>
                    <p className="text-foreground/70 mb-6 font-mono">Version {packageInfo.version}</p>

                    <div className="max-w-md mx-auto text-sm text-left theme-control p-6 space-y-3">
                      <p>
                        <strong>Repo-rter</strong> is a local-first, zero-knowledge desktop dashboard built with
                        Next.js, React 19, and Tauri v2 (Rust).
                      </p>
                      <p>
                        Designed to permanently preserve GitHub traffic insights past the 14-day cliff with OS
                        Keychain security, AES-256-GCM E2EE sync, and 22 customizable UI design paradigms.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TabButton({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: any;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-all font-bold text-sm ${
        isActive
          ? 'theme-control text-pixel-blue translate-x-1'
          : 'border-2 border-transparent hover:border-foreground/20 text-foreground/70 hover:text-foreground'
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}
