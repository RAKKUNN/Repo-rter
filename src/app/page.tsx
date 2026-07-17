'use client';

import { useEffect, useState } from 'react';
import { hasGithubToken } from '@/lib/auth';
import LoginScreen from '@/components/LoginScreen';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    hasGithubToken().then(setIsAuth);
  }, []);

  if (isAuth === null) return null; // Or a loading spinner

  return (
    <main className="min-h-screen">
      {isAuth ? <Dashboard /> : <LoginScreen />}
    </main>
  );
}
