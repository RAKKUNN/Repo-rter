'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Moon, Sun, User, LogOut, Info, Settings as SettingsIcon, Download, Database, Upload, Cloud, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { useToast } from './ToastProvider';
import { useQueryClient } from '@tanstack/react-query';
import { mergeTrafficData, cleanExpiredCache } from '@/lib/storage';
import { uploadSync, downloadAndMergeSync } from '@/lib/sync';
import { getSecret, setSecret } from '@/lib/secrets';
import packageInfo from '../../package.json';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  toggleLanguage: () => void;
  showForks: boolean;
  setShowForks: (val: boolean) => void;
  handleLogout: () => void;
}

type TabType = 'general' | 'appearance' | 'data' | 'sync' | 'account' | 'about';

export default function SettingsModal({
  isOpen,
  onClose,
  user,
  toggleLanguage,
  showForks,
  setShowForks,
  handleLogout
}: SettingsModalProps) {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [mounted, setMounted] = useState(false);
  const [retentionDays, setRetentionDays] = useState<number>(-1);

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

      (async () => {
        setWebdavPass((await getSecret('sync_webdav_pass')) || '');
        setEncryptionKey((await getSecret('sync_encryption_key')) || '');
      })();
    }
  }, []);

  const handleManualSync = async () => {
    if (syncProvider === 'none') return;
    if (!webdavUrl || !webdavUser || !webdavPass || !encryptionKey) {
      toast('Please fill out all sync configuration fields first.', 'error');
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

        if (!Array.isArray(data)) {
          toast('Invalid backup format. Expected a JSON array.', 'error');
          return;
        }

        let importCount = 0;
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

        if (importCount > 0) {
          toast(`Successfully imported ${importCount} repositories.`, 'success');
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const exportData = (format: 'json' | 'csv') => {
    try {
      const cacheStr = localStorage.getItem('REACT_QUERY_OFFLINE_CACHE');
      if (!cacheStr) {
        toast('No data to export.', 'error');
        return;
      }
      const cache = JSON.parse(cacheStr);
      const queries = cache?.clientState?.queries || [];
      
      const viewsQueries = queries.filter((q: any) => q.queryKey[0] === 'views');
      
      let blob: Blob;
      let filename = `reporter_export_${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'json') {
        const extract = viewsQueries.map((q: any) => ({
          repo: q.queryKey[2],
          data: q.state.data
        }));
        blob = new Blob([JSON.stringify(extract, null, 2)], { type: 'application/json' });
        filename += '.json';
      } else {
        // CSV Format
        let csvContent = "Repository,Date,Views,Unique Views\n";
        viewsQueries.forEach((q: any) => {
          const repo = q.queryKey[2];
          const views = q.state?.data?.views || [];
          views.forEach((v: any) => {
            const date = new Date(v.timestamp).toLocaleDateString();
            csvContent += `${repo},${date},${v.count},${v.uniques}\n`;
          });
        });
        blob = new Blob([csvContent], { type: 'text/csv' });
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
      toast(`Successfully exported data as ${format.toUpperCase()}`, 'success');
    } catch (e) {
      console.error('Export failed', e);
      toast('Export failed. Please check the console.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          className="w-full max-w-4xl h-[600px] glass-panel flex flex-col relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-[var(--pixel-border)] px-6 py-4 bg-[var(--pixel-panel-bg)]">
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-6 h-6" />
              <h2 className="text-2xl font-bold font-pixel">{t('settings')}</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-foreground/10 transition-colors active:translate-y-[2px]"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden bg-[var(--pixel-panel-bg)]">
            
            {/* Sidebar Tabs */}
            <div className="w-64 border-r-2 border-[var(--pixel-border)] flex flex-col bg-foreground/5">
              <nav className="flex-1 p-4 space-y-2">
                <TabButton 
                  icon={SettingsIcon} 
                  label={t('general')} 
                  isActive={activeTab === 'general'} 
                  onClick={() => setActiveTab('general')} 
                />
                <TabButton 
                  icon={Sun} 
                  label={t('appearance')} 
                  isActive={activeTab === 'appearance'} 
                  onClick={() => setActiveTab('appearance')} 
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
            <div className="flex-1 overflow-y-auto p-8 bg-[var(--pixel-panel-bg)]">
              {activeTab === 'general' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <section>
                    <h3 className="text-xl font-bold mb-4 border-b-2 border-foreground/20 pb-2">{t('language')}</h3>
                    <div className="flex items-center justify-between p-4 border-2 border-[var(--pixel-border)]">
                      <div>
                        <div className="font-bold flex items-center gap-2"><Globe className="w-4 h-4"/> {t('displayLanguage')}</div>
                        <div className="text-sm opacity-70 mt-1">{t('changeLanguageDesc')}</div>
                      </div>
                      <select 
                        value={i18n.language.split('-')[0]}
                        onChange={(e) => i18n.changeLanguage(e.target.value)}
                        className="px-4 py-2 border-2 border-[var(--pixel-border)] font-bold bg-[var(--pixel-panel-bg)] hover:bg-foreground/5 cursor-pointer outline-none focus:ring-2 focus:ring-pixel-blue"
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
                    <h3 className="text-xl font-bold mb-4 border-b-2 border-foreground/20 pb-2">{t('dataPreferences')}</h3>
                    <label className="flex items-center justify-between p-4 border-2 border-[var(--pixel-border)] cursor-pointer hover:bg-foreground/5 transition-colors">
                      <div>
                        <div className="font-bold">{t('includeForks')}</div>
                        <div className="text-sm opacity-70 mt-1">{t('includeForksDesc')}</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={showForks} 
                        onChange={(e) => setShowForks(e.target.checked)} 
                        className="w-6 h-6 border-2 border-[var(--pixel-border)] rounded-none bg-background accent-pixel-blue"
                      />
                    </label>
                  </section>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <section>
                    <h3 className="text-xl font-bold mb-4 border-b-2 border-foreground/20 pb-2">{t('theme')}</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <button 
                        onClick={() => setTheme('light')}
                        className={`p-6 border-2 flex flex-col items-center gap-3 transition-all ${theme === 'light' ? 'border-pixel-blue shadow-[4px_4px_0px_var(--pixel-blue)] bg-pixel-blue/10' : 'border-[var(--pixel-border)] hover:bg-foreground/5'}`}
                      >
                        <Sun className={`w-8 h-8 ${theme === 'light' ? 'text-pixel-blue' : ''}`} />
                        <span className="font-bold">{t('lightMode') || 'Light'}</span>
                      </button>
                      <button 
                        onClick={() => setTheme('dark')}
                        className={`p-6 border-2 flex flex-col items-center gap-3 transition-all ${theme === 'dark' ? 'border-pixel-blue shadow-[4px_4px_0px_var(--pixel-blue)] bg-pixel-blue/10' : 'border-[var(--pixel-border)] hover:bg-foreground/5'}`}
                      >
                        <Moon className={`w-8 h-8 ${theme === 'dark' ? 'text-pixel-blue' : ''}`} />
                        <span className="font-bold">{t('darkMode') || 'Dark'}</span>
                      </button>
                      <button 
                        onClick={() => setTheme('system')}
                        className={`p-6 border-2 flex flex-col items-center gap-3 transition-all ${theme === 'system' ? 'border-pixel-blue shadow-[4px_4px_0px_var(--pixel-blue)] bg-pixel-blue/10' : 'border-[var(--pixel-border)] hover:bg-foreground/5'}`}
                      >
                        <SettingsIcon className={`w-8 h-8 ${theme === 'system' ? 'text-pixel-blue' : ''}`} />
                        <span className="font-bold">{t('systemTheme') || 'System'}</span>
                      </button>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <section>
                    <h3 className="text-xl font-bold mb-4 border-b-2 border-foreground/20 pb-2">{t('exportData')}</h3>
                    <div className="p-6 border-2 border-[var(--pixel-border)] bg-foreground/5 space-y-6">
                      <div>
                        <div className="font-bold text-lg mb-2">{t('downloadLocalCache')}</div>
                        <div className="text-sm opacity-70">
                          {t('exportDesc')}
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        <button 
                          onClick={() => exportData('csv')}
                          className="flex items-center gap-2 px-6 py-3 bg-[var(--pixel-panel-bg)] border-2 border-[var(--pixel-border)] hover:bg-foreground/10 active:translate-y-[2px] transition-all font-bold"
                        >
                          <Download className="w-5 h-5" />
                          {t('exportCsv')}
                        </button>
                        <button 
                          onClick={() => exportData('json')}
                          className="flex items-center gap-2 px-6 py-3 bg-pixel-blue text-white border-2 border-[var(--pixel-border)] shadow-[4px_4px_0px_var(--pixel-border)] hover:bg-pixel-blue/90 active:translate-y-[2px] active:shadow-none transition-all font-bold"
                        >
                          <Database className="w-5 h-5" />
                          {t('exportJson')}
                        </button>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold mb-4 border-b-2 border-foreground/20 pb-2">{t('importData') || 'Import Data'}</h3>
                    <div className="p-6 border-2 border-[var(--pixel-border)] bg-foreground/5 space-y-6">
                      <div>
                        <div className="font-bold text-lg mb-2">{t('uploadBackupFile') || 'Upload Backup File'}</div>
                        <div className="text-sm opacity-70">
                          {t('importDesc') || 'Restore your repository traffic cache from a previously exported JSON backup file.'}
                        </div>
                      </div>
                      
                      <div>
                        <label className="inline-flex items-center gap-2 px-6 py-3 bg-pixel-purple text-white border-2 border-[var(--pixel-border)] shadow-[4px_4px_0px_var(--pixel-border)] hover:bg-pixel-purple/90 active:translate-y-[2px] active:shadow-none transition-all font-bold cursor-pointer">
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
                    <h3 className="text-xl font-bold mb-4 border-b-2 border-foreground/20 pb-2">{t('dataRetention') || 'Data Retention'}</h3>
                    <div className="p-6 border-2 border-[var(--pixel-border)] bg-foreground/5 space-y-6">
                      <div>
                        <div className="font-bold text-lg mb-2">{t('retentionPeriod') || 'Retention Period'}</div>
                        <div className="text-sm opacity-70">
                          {t('retentionDesc') || 'Automatically purge local traffic data points older than the selected period to save storage space.'}
                        </div>
                      </div>
                      
                      <div>
                        <select 
                          value={retentionDays}
                          onChange={(e) => handleRetentionChange(Number(e.target.value))}
                          className="px-4 py-2 border-2 border-[var(--pixel-border)] font-bold bg-[var(--pixel-panel-bg)] hover:bg-foreground/5 cursor-pointer outline-none focus:ring-2 focus:ring-pixel-blue"
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
                    <h3 className="text-xl font-bold mb-4 border-b-2 border-foreground/20 pb-2">{t('cloudSync') || 'Cloud Synchronization'}</h3>
                    <div className="p-6 border-2 border-[var(--pixel-border)] bg-foreground/5 space-y-6">
                      
                      <div className="flex flex-col gap-2">
                        <label className="font-bold text-lg">{t('syncProvider') || 'Sync Provider'}</label>
                        <select
                          value={syncProvider}
                          onChange={(e) => {
                            const val = e.target.value as 'none' | 'webdav';
                            setSyncProvider(val);
                            localStorage.setItem('sync_provider', val);
                          }}
                          className="px-4 py-2 border-2 border-[var(--pixel-border)] font-bold bg-[var(--pixel-panel-bg)] hover:bg-foreground/5 cursor-pointer outline-none focus:ring-2 focus:ring-pixel-blue"
                        >
                          <option value="none">{t('none') || 'None (Local Only)'}</option>
                          <option value="webdav">WebDAV</option>
                        </select>
                      </div>

                      {syncProvider === 'webdav' && (
                        <div className="space-y-4">
                          <div className="flex flex-col gap-2">
                            <label className="font-bold">{t('webdavUrl') || 'WebDAV URL'}</label>
                            <input
                              type="text"
                              value={webdavUrl}
                              placeholder="https://example.com/remote.php/dav/files/username/"
                              onChange={(e) => {
                                setWebdavUrl(e.target.value);
                                localStorage.setItem('sync_webdav_url', e.target.value);
                              }}
                              className="px-4 py-2 border-2 border-[var(--pixel-border)] bg-[var(--pixel-panel-bg)] outline-none focus:ring-2 focus:ring-pixel-blue font-mono text-sm"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
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
                                className="px-4 py-2 border-2 border-[var(--pixel-border)] bg-[var(--pixel-panel-bg)] outline-none focus:ring-2 focus:ring-pixel-blue text-sm"
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="font-bold">{t('passwordAppPass') || 'Password / App Password'}</label>
                              <input
                                type="password"
                                value={webdavPass}
                                placeholder="Password"
                                onChange={(e) => setWebdavPass(e.target.value)}
                                onBlur={(e) => { void setSecret('sync_webdav_pass', e.target.value); }}
                                className="px-4 py-2 border-2 border-[var(--pixel-border)] bg-[var(--pixel-panel-bg)] outline-none focus:ring-2 focus:ring-pixel-blue text-sm"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="font-bold flex items-center gap-1">
                              {t('encryptionPassphrase') || 'Encryption Passphrase'}
                              <span className="text-xs font-normal text-pixel-purple">({t('e2eeActive') || 'For E2EE'})</span>
                            </label>
                            <input
                              type="password"
                              value={encryptionKey}
                              placeholder="Never sent to servers. Must be kept safe."
                              onChange={(e) => setEncryptionKey(e.target.value)}
                              onBlur={(e) => { void setSecret('sync_encryption_key', e.target.value); }}
                              className="px-4 py-2 border-2 border-[var(--pixel-border)] bg-[var(--pixel-panel-bg)] outline-none focus:ring-2 focus:ring-pixel-blue text-sm"
                            />
                            <p className="text-xs opacity-60">
                              {t('encryptionDesc') || 'Your local data is encrypted using AES-256-GCM before upload. Keep this key safe to restore stats on another device.'}
                            </p>
                          </div>

                          <div className="pt-4 border-t border-foreground/10">
                            <button
                              onClick={handleManualSync}
                              disabled={isSyncing}
                              className="flex items-center gap-2 px-6 py-3 bg-pixel-blue text-white border-2 border-[var(--pixel-border)] shadow-[4px_4px_0px_var(--pixel-border)] hover:bg-pixel-blue/90 active:translate-y-[2px] active:shadow-none transition-all font-bold disabled:opacity-50"
                            >
                              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                              {isSyncing ? (t('syncing') || 'Syncing...') : (t('syncNow') || 'Sync Now')}
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
                    <h3 className="text-xl font-bold mb-4 border-b-2 border-foreground/20 pb-2">{t('githubProfile')}</h3>
                    <div className="p-6 border-2 border-[var(--pixel-border)] flex items-center gap-6">
                      <img src={user?.avatar_url} alt="Avatar" className="w-20 h-20 border-2 border-[var(--pixel-border)]" />
                      <div>
                        <div className="text-2xl font-bold">{user?.name || user?.login}</div>
                        <div className="text-foreground/60">@{user?.login}</div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold mb-4 border-b-2 border-foreground/20 pb-2 text-pixel-red">{t('dangerZone')}</h3>
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
                  <img src="/logo.png" alt="Repo-rter Logo" className="w-24 h-24 mb-6 rendering-pixelated" style={{ imageRendering: 'pixelated' }} />
                  <h2 className="text-3xl font-bold text-gradient mb-2">Repo-rter</h2>
                  <p className="text-foreground/70 mb-8">Version {packageInfo.version}</p>
                  
                  <div className="max-w-md mx-auto text-sm text-left border-2 border-[var(--pixel-border)] p-6 bg-foreground/5">
                    <p className="mb-4"><strong>Repo-rter</strong> is an advanced desktop traffic viewer built with React, Tauri, and Neo-Brutalist pixel art.</p>
                    <p>Designed to bypass the 14-day GitHub traffic limit using local persistence.</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function TabButton({ icon: Icon, label, isActive, onClick }: { icon: any, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 border-2 transition-all font-bold ${
        isActive 
          ? 'border-[var(--pixel-border)] bg-[var(--pixel-panel-bg)] shadow-[4px_4px_0px_var(--pixel-border)] translate-x-1' 
          : 'border-transparent hover:border-foreground/20 text-foreground/70 hover:text-foreground'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
}
