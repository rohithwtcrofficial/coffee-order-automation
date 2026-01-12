// src/lib/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { Admin } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  admin: Admin | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  admin: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log('AuthContext: Setting up auth listener');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('AuthContext: Auth state changed', firebaseUser?.email || 'No user');
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch admin data from Firestore
        try {
          console.log('AuthContext: Fetching admin data for', firebaseUser.uid);
          const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
          
          if (adminDoc.exists()) {
            console.log('AuthContext: Admin found');
            setAdmin({
              id: adminDoc.id,
              ...adminDoc.data(),
              createdAt: adminDoc.data().createdAt?.toDate(),
            } as Admin);
          } else {
            console.log('AuthContext: User is not an admin');
            // User authenticated but not an admin
            await firebaseSignOut(auth);
            setUser(null);
            setAdmin(null);
          }
        } catch (error) {
          console.error('AuthContext: Error fetching admin data:', error);
          setAdmin(null);
        }
      } else {
        setAdmin(null);
      }
      
      console.log('AuthContext: Setting loading to false');
      setLoading(false);
    });

    return () => {
      console.log('AuthContext: Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  // Handle redirects based on auth state
  useEffect(() => {
    console.log('AuthContext: Redirect check', { loading, user: !!user, admin: !!admin, pathname });
    
    // Don't redirect while still loading
    if (loading) {
      console.log('AuthContext: Still loading, skipping redirect');
      return;
    }

    // Don't redirect if already on the target page to avoid loops
    const publicPaths = ['/login', '/register', '/forgot-password'];
    const isPublicPath = publicPaths.some(path => pathname?.startsWith(path));

    if (!user && !isPublicPath && pathname !== '/login') {
      // Not authenticated and trying to access protected route
      console.log('AuthContext: Redirecting to /login (no user)');
      router.replace('/login');
    } else if (user && admin && isPublicPath && pathname !== '/dashboard') {
      // Authenticated and on public route, redirect to dashboard
      console.log('AuthContext: Redirecting to /dashboard (already logged in)');
      router.replace('/dashboard');
    } else {
      console.log('AuthContext: No redirect needed');
    }
  }, [user, admin, loading, pathname, router]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Signing in', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Verify user is an admin
      const adminDoc = await getDoc(doc(db, 'admins', userCredential.user.uid));
      if (!adminDoc.exists()) {
        console.log('AuthContext: Sign in failed - not an admin');
        await firebaseSignOut(auth);
        throw new Error('Access denied. Admin privileges required.');
      }
      
      console.log('AuthContext: Sign in successful, redirecting to dashboard');
      // Redirect to dashboard after successful login
      router.replace('/dashboard');
    } catch (error: any) {
      // Don't log Firebase errors to console to keep it clean
      // Just re-throw with user-friendly message
      if (error?.code) {
        // Firebase error - throw it as-is for LoginForm to handle
        throw error;
      } else {
        // Custom error
        console.error('AuthContext: Sign in error:', error);
        throw error;
      }
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthContext: Signing out');
      
      // Clear user state first
      setUser(null);
      setAdmin(null);
      
      // Sign out from Firebase
      await firebaseSignOut(auth);
      
      // Clear any cached data
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        localStorage.removeItem('firebase:authUser');
      }
      
      console.log('AuthContext: Sign out successful, redirecting to login');
      
      // Redirect to login
      router.replace('/login');
      
      // Force reload to clear all component state
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('AuthContext: Sign out error:', error);
      // Force redirect even on error
      window.location.replace('/login');
    }
  };

  console.log('AuthContext: Rendering', { loading, user: !!user, admin: !!admin });

  return (
    <AuthContext.Provider value={{ user, admin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);