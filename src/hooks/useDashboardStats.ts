// src/hooks/useDashboardStats.ts

import { useMemo } from 'react';
import type { Order, Customer, Product } from '@/lib/types';
import { 
  getDateRange, 
  filterOrdersByDateRange, 
  getPreviousPeriodRange,
  calculateGrowth 
} from '@/lib/utils/dashboard-utils';

interface DashboardStats {
  totalOrders: number;
  recentOrders: number;
  totalRevenue: number;
  recentRevenue: number;
  activeProducts: number;
  totalCustomers: number;
  avgOrderValue: number;
  lowStockProducts: number;
  statusCounts: {
    RECEIVED: number;
    ACCEPTED: number;
    PACKED: number;
    SHIPPED: number;
    DELIVERED: number;
    CANCELLED: number;
  };
  revenueGrowth: number;
  orderGrowth: number;
  customerGrowth: number;
  startDate: Date;
  endDate: Date;
}

export const useDashboardStats = (
  orders: Order[],
  customers: Customer[],
  products: Product[],
  dateRange: string,
  customStart?: Date | null,
  customEnd?: Date | null
): DashboardStats => {
  return useMemo(() => {
    const { startDate, endDate } = getDateRange(dateRange, customStart, customEnd);
    
    // Filter orders for current period
    const recentOrders = filterOrdersByDateRange(orders, startDate, endDate);
    
    // Calculate revenues
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const recentRevenue = recentOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Product stats
    const activeProducts = products.filter(p => p.isActive).length;
    const lowStockProducts = products.filter(p => p.stockQuantity < 10).length;
    
    // Average order value
    const avgOrderValue = recentOrders.length > 0 ? recentRevenue / recentOrders.length : 0;
    
    // Status counts (for current period)
    const statusCounts = {
      RECEIVED: recentOrders.filter(o => o.status === 'RECEIVED').length,
      ACCEPTED: recentOrders.filter(o => o.status === 'ACCEPTED').length,
      PACKED: recentOrders.filter(o => o.status === 'PACKED').length,
      SHIPPED: recentOrders.filter(o => o.status === 'SHIPPED').length,
      DELIVERED: recentOrders.filter(o => o.status === 'DELIVERED').length,
      CANCELLED: recentOrders.filter(o => o.status === 'CANCELLED').length,
    };

    // Previous period comparison
    const { startDate: prevStart, endDate: prevEnd } = getPreviousPeriodRange(dateRange, customStart, customEnd);
    const previousOrders = filterOrdersByDateRange(orders, prevStart, prevEnd);
    const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Calculate growth rates
    const revenueGrowth = calculateGrowth(recentRevenue, previousRevenue);
    const orderGrowth = calculateGrowth(recentOrders.length, previousOrders.length);
    
    // Customer growth (customers who made their first order in this period)
    const recentCustomerIds = new Set(recentOrders.map(o => o.customerId));
    const previousCustomerIds = new Set(previousOrders.map(o => o.customerId));
    const newCustomers = Array.from(recentCustomerIds).filter(id => !previousCustomerIds.has(id)).length;
    const previousNewCustomers = previousCustomerIds.size;
    const customerGrowth = calculateGrowth(newCustomers, previousNewCustomers);

    return {
      totalOrders: orders.length,
      recentOrders: recentOrders.length,
      totalRevenue,
      recentRevenue,
      activeProducts,
      totalCustomers: customers.length,
      avgOrderValue,
      lowStockProducts,
      statusCounts,
      revenueGrowth,
      orderGrowth,
      customerGrowth,
      startDate,
      endDate,
    };
  }, [orders, customers, products, dateRange, customStart, customEnd]);
};