'use client';

import { useState } from 'react';
import { setGithubToken } from '@/lib/auth';
import { KeyRound, Loader2, ArrowRight, Copy, Check, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useToast } from './ToastProvider';
import { customFetch, isTauri } from '@/lib/api';
import { open as tauriOpen } from '@tauri-apps/plugin-shell';

const CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '178c6fc778ccc68e1d6a';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const [userCode, setUserCode] = useState('');
  const [verificationUri, setVerificationUri] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const [copied, setCopied] = useState(false);

  const handlePatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    try {
      await setGithubToken(token.trim());
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast('Failed to save token to keychain.', 'error');
      setLoading(false);
    }
  };

  const startDeviceFlow = async () => {
    try {
      const res = await customFetch('https://github.com/login/device/code', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          scope: 'repo',
        }),
      });

      const data = await res.json();
      if (data.device_code) {
        setUserCode(data.user_code);
        setVerificationUri(data.verification_uri);
        setIsPolling(true);
        pollForToken(data.device_code, data.interval);
      }
    } catch (err) {
      console.error('Device flow error:', err);
      toast('Failed to start GitHub login. Please use a Personal Access Token.', 'error');
    }
  };

  const pollForToken = async (deviceCode: string, interval: number) => {
    let polling = true;
    while (polling) {
      await new Promise((resolve) => setTimeout(resolve, interval * 1000));

      try {
        const res = await customFetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: CLIENT_ID,
            device_code: deviceCode,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          }),
        });

        const data = await res.json();

        if (data.access_token) {
          polling = false;
          await setGithubToken(data.access_token);
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
      } catch {
        polling = false;
        setIsPolling(false);
      }
    }
  };

  const handleOpenBrowser = async (url: string) => {
    if (!url.startsWith('https://')) return;
    if (isTauri()) {
      await tauriOpen(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
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
          <div className="w-16 h-16 theme-control flex items-center justify-center mx-auto p-2">
            <img
              src="/logo.png"
              alt="Repo-rter Logo"
              className="w-12 h-12 rendering-pixelated"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">{t('appTitle') || 'Repo-rter'}</h1>
        <p className="text-center text-foreground/60 mb-8 text-sm">{t('loginDesc')}</p>

        {!isPolling ? (
          <div className="space-y-6">
            <button
              onClick={startDeviceFlow}
              disabled={loading}
              className="w-full bg-pixel-purple hover:opacity-90 text-white font-bold py-3 px-4 theme-control active:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              <div className="flex-grow border-t border-foreground/20"></div>
              <span className="flex-shrink-0 mx-4 text-foreground/40 text-xs font-bold">OR USE PAT</span>
              <div className="flex-grow border-t border-foreground/20"></div>
            </div>

            <form onSubmit={handlePatSubmit} className="space-y-4">
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <input
                  type="password"
                  placeholder="ghp_... Personal Access Token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full theme-control py-3 pl-10 pr-4 text-foreground focus:ring-2 focus:ring-pixel-blue transition-all text-sm font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !token.trim()}
                className="w-full py-3 bg-pixel-blue text-white font-bold theme-control hover:opacity-90 active:translate-y-0.5 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Connect with Token</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
            <p className="text-foreground/80 font-medium">{t('enterCode')}</p>
            <div className="flex items-center justify-center gap-4 theme-control py-4 relative">
              <div className="text-3xl font-mono font-bold tracking-widest text-pixel-blue">{userCode}</div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(userCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="absolute right-4 p-2 bg-pixel-blue text-white hover:opacity-90 theme-control active:translate-y-0.5 transition-transform"
                title="Copy Code"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            <div>
              <button
                onClick={() => handleOpenBrowser(verificationUri)}
                className="w-full bg-pixel-blue hover:opacity-90 text-white font-bold py-3 px-4 theme-control active:translate-y-0.5 transition-transform inline-flex items-center justify-center gap-2"
              >
                <span>{t('openGithub')}</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-foreground/60 pt-4">
              <Loader2 className="w-4 h-4 animate-spin text-pixel-blue" />
              {t('waitingAuth')}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
