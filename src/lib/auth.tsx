'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import { useRouter, usePathname } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            email: user.email,
            createdAt: new Date(),
          });
        }
      } else {
        setUser(null);
      }
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


  return (
    <AuthContext.Provider value={{ user, loading }}>
      {loading ? <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div> : children}
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

// This server-side utility is tricky with client-side auth.
// We'll manage getting the user on the server differently.
// For server actions, we'll need to re-authenticate or pass the user ID.
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';

export const getCurrentUser = (): Promise<User | null> => {
  // This is a new Promise-based wrapper around onAuthStateChanged
  // It's designed to be called in Server Actions to get the current user.
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      getAuth(app),
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject
    );
  });
};
