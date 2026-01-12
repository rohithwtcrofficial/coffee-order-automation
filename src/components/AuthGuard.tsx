// src/components/AuthGuard.tsx
'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Coffee } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, admin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('AuthGuard: Auth state', { loading, user: !!user, admin: !!admin });
    
    if (!loading && (!user || !admin)) {
      console.log('AuthGuard: Redirecting to login');
      router.replace('/login');
    }
  }, [user, admin, loading, router]);

  if (loading) {
    console.log('AuthGuard: Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-amber-50 via-white to-orange-50">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-linear-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
              <Coffee size={40} className="text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Western Terrain Coffee Roasters</h2>
          <p className="text-gray-600">Loading your dashboard...</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !admin) {
    console.log('AuthGuard: No user or admin, returning null');
    return null;
  }

  console.log('AuthGuard: Rendering children');
  return <>{children}</>;
}