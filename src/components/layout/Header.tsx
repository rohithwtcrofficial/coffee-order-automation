// src/components/layout/Header.tsx
'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function Header() {
  const { admin, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      await fetch('/api/auth/session', { method: 'DELETE' });
      toast.success('Signed out successfully');
      router.push('/login');
    } catch {
      // Error is caught but not used
      toast.error('Failed to sign out');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Coffee Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500">Manage orders and products</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
            <div className="p-2 bg-gray-200 rounded-full">
              <User size={20} className="text-gray-600" />
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-900">{admin?.name}</div>
              <div className="text-gray-500">{admin?.email}</div>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}