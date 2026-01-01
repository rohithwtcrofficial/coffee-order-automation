// src/components/auth/ProtectedRoute.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, admin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !admin)) {
      router.push('/login');
    }
  }, [user, admin, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!user || !admin) {
    return null;
  }

  return <>{children}</>;
}