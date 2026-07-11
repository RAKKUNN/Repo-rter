'use client';

import { useState } from 'react';
import { setGithubToken } from '@/lib/auth';
import { GitPullRequest, KeyRound, Loader2, ArrowRight, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useToast } from './ToastProvider';
import { customFetch, isTauri } from '@/lib/api';
import { open as tauriOpen } from '@tauri-apps/plugin-shell';

const CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '178c6fc778ccc68e1d6a'; // Fallback to GitHub CLI client ID for testing if none provided

export default function LoginScreen() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [deviceCode, setDeviceCode] = useState('');
  const [userCode, setUserCode] = useState('');
  const [verificationUri, setVerificationUri] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const [copied, setCopied] = useState(false);

  const handlePatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    try {
      setGithubToken(token);
      window.location.reload();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const startDeviceFlow = async () => {
    try {
      const res = await customFetch('https://github.com/login/device/code', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          scope: 'repo'
        })
      });
      
      const data = await res.json();
      if (data.device_code) {
        setDeviceCode(data.device_code);
        setUserCode(data.user_code);
        setVerificationUri(data.verification_uri);
        setIsPolling(true);
        
        // Start polling
        pollForToken(data.device_code, data.interval);
      }
    } catch (err) {
      console.error('Device flow error:', err);
      toast('Failed to start GitHub login. Please use a PAT.', 'error');
    }
  };

  const pollForToken = async (deviceCode: string, interval: number) => {
    let polling = true;
    while (polling) {
      await new Promise(resolve => setTimeout(resolve, interval * 1000));
      
      try {
        const res = await customFetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            client_id: CLIENT_ID,
            device_code: deviceCode,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
          })
        });
        
        const data = await res.json();
        
        if (data.access_token) {
          polling = false;
          setGithubToken(data.access_token);
          window.location.reload();
        } else if (data.error === 'authorization_pending') {
          // keep polling
        } else if (data.error === 'slow_down') {
          interval += 5;
        } else {
          polling = false;
          setIsPolling(false);
          toast('Login failed or expired.', 'error');
        }
      } catch (e) {
        polling = false;
        setIsPolling(false);
      }
    }
  };

  const handleOpenBrowser = async (url: string) => {
    if (isTauri()) {
      await tauriOpen(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel w-full max-w-md p-8"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-pixel-blue/20 rounded-none border-2 border-[var(--pixel-border)] flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_var(--pixel-border)]">
            <GitPullRequest className="w-8 h-8 text-pixel-blue" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">GitHub Traffic</h1>
        <p className="text-center text-foreground/60 mb-8 text-sm">
          {t('loginDesc')}
        </p>

        {!isPolling ? (
          <div className="space-y-6">
            <button
              onClick={startDeviceFlow}
              disabled={loading}
              className="w-full bg-pixel-purple hover:bg-pixel-purple/80 text-white font-medium py-3 px-4 rounded-none border-2 border-[var(--pixel-border)] shadow-[4px_4px_0px_var(--pixel-border)] active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_var(--pixel-border)] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-5 h-5" />
                  {t('connectGithub')}
                </>
              )}
            </button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-glass-border"></div>
              <span className="flex-shrink-0 mx-4 text-foreground/40 text-sm">OR</span>
              <div className="flex-grow border-t border-glass-border"></div>
            </div>

            <form onSubmit={handlePatSubmit} className="space-y-4">
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <input
                  type="password"
                  placeholder="Personal Access Token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full bg-glass-border border border-foreground/10 rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || !token.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              </button>
            </form>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-6"
          >
            <p className="text-foreground/80 font-medium">
              {t('enterCode')}
            </p>
            <div className="flex items-center justify-center gap-4 bg-[var(--pixel-panel-bg)] border-2 border-[var(--pixel-border)] py-4 rounded-none shadow-[4px_4px_0px_var(--pixel-border)] relative">
              <div className="text-4xl font-mono font-bold tracking-widest text-pixel-blue">
                {userCode}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(userCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="absolute right-4 p-2 bg-pixel-blue text-white hover:bg-pixel-blue/80 border-2 border-[var(--pixel-border)] active:translate-y-1 active:translate-x-1 transition-transform"
                title="Copy Code"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <button 
              onClick={() => handleOpenBrowser(verificationUri)}
              className="inline-flex items-center gap-2 text-pixel-purple hover:underline cursor-pointer font-bold"
            >
              {t('openBrowser')} <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex items-center justify-center gap-2 text-foreground/50 text-sm mt-8">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('waitingAuth')}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
