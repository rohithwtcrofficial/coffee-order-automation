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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch admin data from Firestore
        try {
          const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
          if (adminDoc.exists()) {
            setAdmin({
              id: adminDoc.id,
              ...adminDoc.data(),
              createdAt: adminDoc.data().createdAt?.toDate(),
            } as Admin);
          } else {
            // User authenticated but not an admin
            await firebaseSignOut(auth);
            setUser(null);
            setAdmin(null);
          }
        } catch (error) {
          console.error('Error fetching admin data:', error);
          setAdmin(null);
        }
      } else {
        setAdmin(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Verify user is an admin
      const adminDoc = await getDoc(doc(db, 'admins', userCredential.user.uid));
      if (!adminDoc.exists()) {
        await firebaseSignOut(auth);
        throw new Error('Access denied. Admin privileges required.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      throw new Error(errorMessage);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ user, admin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);