'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Moon, Sun, User, LogOut, Info, Settings as SettingsIcon, Download, Database } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  isDarkMode: boolean;
  toggleTheme: () => void;
  toggleLanguage: () => void;
  showForks: boolean;
  setShowForks: (val: boolean) => void;
  handleLogout: () => void;
}

type TabType = 'general' | 'appearance' | 'data' | 'account' | 'about';

export default function SettingsModal({
  isOpen,
  onClose,
  user,
  isDarkMode,
  toggleTheme,
  toggleLanguage,
  showForks,
  setShowForks,
  handleLogout
}: SettingsModalProps) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('general');

  const exportData = (format: 'json' | 'csv') => {
    try {
      const cacheStr = localStorage.getItem('REACT_QUERY_OFFLINE_CACHE');
      if (!cacheStr) {
        alert('No data to export.');
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
    } catch (e) {
      console.error('Export failed', e);
      alert('Export failed. Please check the console.');
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
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => { if(isDarkMode) toggleTheme(); }}
                        className={`p-6 border-2 flex flex-col items-center gap-3 transition-all ${!isDarkMode ? 'border-pixel-blue shadow-[4px_4px_0px_var(--pixel-blue)] bg-pixel-blue/10' : 'border-[var(--pixel-border)] hover:bg-foreground/5'}`}
                      >
                        <Sun className={`w-8 h-8 ${!isDarkMode ? 'text-pixel-blue' : ''}`} />
                        <span className="font-bold">{t('lightMode')}</span>
                      </button>
                      <button 
                        onClick={() => { if(!isDarkMode) toggleTheme(); }}
                        className={`p-6 border-2 flex flex-col items-center gap-3 transition-all ${isDarkMode ? 'border-pixel-blue shadow-[4px_4px_0px_var(--pixel-blue)] bg-pixel-blue/10' : 'border-[var(--pixel-border)] hover:bg-foreground/5'}`}
                      >
                        <Moon className={`w-8 h-8 ${isDarkMode ? 'text-pixel-blue' : ''}`} />
                        <span className="font-bold">{t('darkMode')}</span>
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
                  <p className="text-foreground/70 mb-8">Version 1.0.0-pixel</p>
                  
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
