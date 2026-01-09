// src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users,
  Coffee,
  TrendingUp,
  Settings,
  Bell,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard,
    badge: null,
    description: 'Overview & Analytics'
  },
  { 
    name: 'Orders', 
    href: '/orders', 
    icon: ShoppingCart,
    badge: 'new',
    description: 'Manage Orders'
  },
  { 
    name: 'Products', 
    href: '/products', 
    icon: Package,
    badge: null,
    description: 'Product Catalog'
  },
  { 
    name: 'Customers', 
    href: '/customers', 
    icon: Users,
    badge: null,
    description: 'Customer Management'
  },
];

const quickActions = [
  { name: 'Analytics', icon: TrendingUp, color: 'text-blue-400' },
  { name: 'Notifications', icon: Bell, color: 'text-purple-400' },
  { name: 'Settings', icon: Settings, color: 'text-gray-400' },
];

interface RevenueData {
  currentMonth: number;
  previousMonth: number;
  percentageChange: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData>({
    currentMonth: 0,
    previousMonth: 0,
    percentageChange: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // Fetch current month orders
        const currentMonthQuery = query(
          collection(db, 'orders'),
          where('createdAt', '>=', Timestamp.fromDate(currentMonthStart))
        );
        const currentMonthSnapshot = await getDocs(currentMonthQuery);
        const currentMonthRevenue = currentMonthSnapshot.docs.reduce((sum, doc) => {
          const data = doc.data();
          return sum + (data.totalAmount || 0);
        }, 0);

        // Fetch previous month orders
        const previousMonthQuery = query(
          collection(db, 'orders'),
          where('createdAt', '>=', Timestamp.fromDate(previousMonthStart)),
          where('createdAt', '<=', Timestamp.fromDate(previousMonthEnd))
        );
        const previousMonthSnapshot = await getDocs(previousMonthQuery);
        const previousMonthRevenue = previousMonthSnapshot.docs.reduce((sum, doc) => {
          const data = doc.data();
          return sum + (data.totalAmount || 0);
        }, 0);

        // Calculate percentage change
        const percentageChange = previousMonthRevenue > 0
          ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
          : 0;

        setRevenueData({
          currentMonth: currentMonthRevenue,
          previousMonth: previousMonthRevenue,
          percentageChange: percentageChange
        });
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching revenue data:', error);
        setIsLoading(false);
      }
    };

    fetchRevenueData();
  }, []);

  const formatCurrency = (amount: number): string => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount.toFixed(0)}`;
  };

  return (
    <aside className="w-72 bg-linear-to-b from-gray-900 via-gray-900 to-gray-950 text-white min-h-screen flex flex-col shadow-2xl border-r border-gray-800">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-800/50 bg-linear-to-r from-amber-600/10 to-orange-600/10">
        <Link href="/dashboard" className="flex items-center gap-4 group">
          {/* Logo */}
          <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-lg group-hover:scale-105 transition-transform bg-white">
            <img 
              src="/logo.png" 
              alt="Western Terrain Coffee Roasters Logo" 
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to Coffee icon if logo fails to load
                e.currentTarget.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'absolute inset-0 bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center';
                fallback.innerHTML = '<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>';
                e.currentTarget.parentElement?.appendChild(fallback);
              }}
            />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse"></div>
          
          <div className="flex-1">
            <h1 className="text-xl font-bold bg-linear-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Western Terrain Coffee Roasters
            </h1>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Sparkles size={10} className="text-amber-500" />
              Admin Portal
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-3">
            Main Menu
          </p>
          
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;
            const isHovered = hoveredItem === item.name;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`
                  relative flex items-center gap-3 px-4 py-3.5 rounded-xl
                  transition-all duration-200 group overflow-hidden
                  ${isActive 
                    ? 'bg-linear-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/20' 
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                  }
                `}
              >
                {/* Animated background */}
                {isActive && (
                  <div className="absolute inset-0 bg-linear-to-r from-amber-500/20 to-orange-500/20 animate-pulse"></div>
                )}
                
                {/* Icon */}
                <div className={`relative z-10 ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>
                  <Icon size={20} />
                </div>
                
                {/* Text Content */}
                <div className="flex-1 relative z-10">
                  <span className="font-medium block">{item.name}</span>
                  {isHovered && !isActive && (
                    <span className="text-xs text-gray-400 block">
                      {item.description}
                    </span>
                  )}
                </div>
                
                {/* Badge */}
                {item.badge && (
                  <span className="relative z-10 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full uppercase">
                    {item.badge}
                  </span>
                )}
                
                {/* Active indicator */}
                {isActive && (
                  <div className="relative z-10">
                    <ChevronRight size={16} className="animate-pulse" />
                  </div>
                )}
                
                {/* Hover effect line */}
                {!isActive && (
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-amber-500 to-orange-500 transition-transform origin-left ${isHovered ? 'scale-y-100' : 'scale-y-0'}`}></div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 pt-6 border-t border-gray-800/50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-3">
            Quick Actions
          </p>
          <div className="grid grid-cols-3 gap-2 px-2">
            {quickActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={action.name}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-800/30 hover:bg-gray-800 transition-all hover:scale-105 group"
                >
                  <ActionIcon size={20} className={`${action.color} group-hover:scale-110 transition-transform`} />
                  <span className="text-xs text-gray-400 group-hover:text-white transition-colors">
                    {action.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Bottom Stats Card - Real Data */}
      <div className="p-4 border-t border-gray-800/50">
        <div className="bg-linear-to-br from-amber-600/20 to-orange-600/20 rounded-xl p-4 border border-amber-600/30">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-linear-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400">This Month</p>
                  <p className="text-lg font-bold text-white">
                    {formatCurrency(revenueData.currentMonth)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Revenue</span>
                <span className={`font-medium flex items-center gap-1 ${
                  revenueData.percentageChange >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  <TrendingUp size={12} className={revenueData.percentageChange < 0 ? 'rotate-180' : ''} />
                  {revenueData.percentageChange >= 0 ? '+' : ''}
                  {revenueData.percentageChange.toFixed(1)}%
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800/50">
        <div className="flex items-center gap-3 px-2">
          <div className="flex-1">
            <p className="text-xs text-gray-500">
              © 2026 Western Terrain Coffee Roasters
            </p>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
      </div>
    </aside>
  );
}