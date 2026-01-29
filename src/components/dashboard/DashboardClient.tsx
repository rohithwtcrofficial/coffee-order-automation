// src/components/dashboard/DashboardClient.tsx
'use client';

import { useState } from 'react';
import { Activity, RefreshCw, Download } from 'lucide-react';
import type { Order, Customer, Product } from '@/lib/types';

// Hooks
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useDashboardCharts } from '@/hooks/useDashboardCharts';
import { useDashboardLists } from '@/hooks/useDashboardLists';

// Components
import { MetricCards } from './MetricCards';
import { StatusOverview } from './StatusOverview';
import { RevenueTrendChart } from './charts/RevenueTrendChart';
import { CategoryChart } from './charts/CategoryChart';
import { StatusBreakdownChart } from './charts/StatusBreakdownChart';
import { TopProductsList } from './lists/TopProductsList';
import { RecentOrdersList } from './lists/RecentOrdersList';
import { TopCustomersList } from './lists/TopCustomersList';
import { QuickActions } from './QuickActions';
import { DateRangePicker } from './DateRangePicker';

interface DashboardClientProps {
  orders: Order[];
  customers: Customer[];
  products: Product[];
}

export default function DashboardClient({ orders, customers, products }: DashboardClientProps) {
  const [dateRange, setDateRange] = useState('last30');
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);

  const handleDateRangeChange = (range: string, start?: Date, end?: Date) => {
    setDateRange(range);
    if (range === 'custom' && start && end) {
      setCustomStart(start);
      setCustomEnd(end);
    } else {
      setCustomStart(null);
      setCustomEnd(null);
    }
  };

  // Calculate all statistics using custom hooks
  const stats = useDashboardStats(orders, customers, products, dateRange, customStart, customEnd);
  const { revenueChartData, categoryData, statusChartData } = useDashboardCharts(orders, dateRange, customStart, customEnd);
  const { topProducts, recentOrdersList, topCustomers } = useDashboardLists(orders, customers, products, dateRange, customStart, customEnd);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-orange-50 to-amber-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-xl">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">Real-time business analytics</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <DateRangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                customStart={customStart}
                customEnd={customEnd}
              />
              <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
                <Download className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Key Metrics */}
        <MetricCards 
          stats={stats} 
          dateRange={dateRange}
          customStart={customStart}
          customEnd={customEnd}
        />

        {/* Order Status Overview */}
        <StatusOverview statusCounts={stats.statusCounts} />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RevenueTrendChart 
            data={revenueChartData} 
            dateRange={dateRange}
            customStart={customStart}
            customEnd={customEnd}
          />
          <CategoryChart data={categoryData} />
        </div>

        {/* Order Status Breakdown */}
        <StatusBreakdownChart data={statusChartData} />

        {/* Top Products & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopProductsList products={topProducts} />
          <RecentOrdersList orders={recentOrdersList} customers={customers} />
        </div>

        {/* Top Customers */}
        <TopCustomersList 
          customers={topCustomers} 
          dateRange={dateRange}
          customStart={customStart}
          customEnd={customEnd}
        />

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </div>
  );
}