// src/hooks/useDashboardCharts.ts

import { useMemo } from 'react';
import type { Order } from '@/lib/types';
import { getOrderDate, filterOrdersByDateRange, getDateRange, getDaysInRange } from '@/lib/utils/dashboard-utils';

interface RevenueChartData {
  name: string;
  revenue: number;
  orders: number;
  [key: string]: string | number; // Index signature for Recharts compatibility
}

interface CategoryData {
  name: string;
  value: number;
  revenue: number;
  color: string;
  [key: string]: string | number; // Index signature for Recharts compatibility
}

interface StatusChartData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number; // Index signature for Recharts compatibility
}

export const useDashboardCharts = (
  orders: Order[], 
  dateRange: string,
  customStart?: Date | null,
  customEnd?: Date | null
) => {
  const { startDate, endDate } = getDateRange(dateRange, customStart, customEnd);
  const filteredOrders = filterOrdersByDateRange(orders, startDate, endDate);
  const daysInRange = getDaysInRange(dateRange, customStart, customEnd);

  // Revenue trend chart data
  const revenueChartData = useMemo((): RevenueChartData[] => {
    const dataMap: Record<string, { revenue: number; orderCount: number }> = {};
    
    // Initialize all days in range
    for (let i = daysInRange - 1; i >= 0; i--) {
      const date = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (!dataMap[dateKey]) {
        dataMap[dateKey] = { revenue: 0, orderCount: 0 };
      }
    }

    // Aggregate orders by date
    filteredOrders.forEach(order => {
      const orderDate = getOrderDate(order);
      const dateKey = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (dataMap[dateKey]) {
        dataMap[dateKey].revenue += order.totalAmount || 0;
        dataMap[dateKey].orderCount += 1;
      }
    });

    // Convert to sorted array
    return Object.entries(dataMap).map(([name, data]) => ({
      name,
      revenue: Math.round(data.revenue),
      orders: data.orderCount
    }));
  }, [filteredOrders, daysInRange, endDate]);

  // Category distribution
  const categoryData = useMemo((): CategoryData[] => {
    const categoryCounts: Record<string, number> = {};
    const categoryRevenue: Record<string, number> = {};
    
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const category = item.category || 'Unknown';
        categoryCounts[category] = (categoryCounts[category] || 0) + item.quantity;
        categoryRevenue[category] = (categoryRevenue[category] || 0) + (item.subtotal || 0);
      });
    });

    const colors = ['#f59e0b', '#d97706', '#92400e', '#78350f', '#451a03'];
    
    return Object.entries(categoryCounts)
      .map(([name, value], index) => ({
        name,
        value,
        revenue: categoryRevenue[name] || 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  // Order status breakdown
  const statusChartData = useMemo((): StatusChartData[] => {
    const statusCounts = {
      RECEIVED: 0,
      ACCEPTED: 0,
      PACKED: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    filteredOrders.forEach(order => {
      if (statusCounts.hasOwnProperty(order.status)) {
        statusCounts[order.status as keyof typeof statusCounts]++;
      }
    });

    const statusMap: Record<string, { count: number; color: string }> = {
      RECEIVED: { count: statusCounts.RECEIVED, color: '#06b6d4' },
      ACCEPTED: { count: statusCounts.ACCEPTED, color: '#10b981' },
      PACKED: { count: statusCounts.PACKED, color: '#f97316' },
      SHIPPED: { count: statusCounts.SHIPPED, color: '#3b82f6' },
      DELIVERED: { count: statusCounts.DELIVERED, color: '#22c55e' },
      CANCELLED: { count: statusCounts.CANCELLED, color: '#ef4444' },
    };

    return Object.entries(statusMap)
      .map(([name, data]) => ({
        name,
        value: data.count,
        color: data.color
      }))
      .filter(item => item.value > 0);
  }, [filteredOrders]);

  return {
    revenueChartData,
    categoryData,
    statusChartData,
  };
};