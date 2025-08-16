'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export type ViewMode = 'auto' | 'desktop' | 'mobile';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, viewMode: 'auto', setViewMode: () => {} });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('auto');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login' || pathname === '/signup';

    if (!user && !isAuthPage) {
      router.push('/login');
    } else if (user && isAuthPage) {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('force-mobile', 'force-desktop');
    if (viewMode === 'mobile') {
        root.classList.add('force-mobile');
    } else if (viewMode === 'desktop') {
        root.classList.add('force-desktop');
    }
  }, [viewMode]);


  if (loading) {
      return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>
  }

  return (
    <AuthContext.Provider value={{ user, loading, viewMode, setViewMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
