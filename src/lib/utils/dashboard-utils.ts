// src/lib/utils/dashboard-utils.ts

import type { Order, Customer, Product } from '@/lib/types';

/**
 * Safely convert Firebase timestamps to Date objects
 */
export const getOrderDate = (order: any): Date => {
  const createdAt = order.createdAt;
  
  // Handle Firebase Timestamp objects
  if (createdAt && typeof createdAt === 'object' && 'toDate' in createdAt) {
    return createdAt.toDate();
  }
  
  // Handle Date objects
  if (createdAt instanceof Date) {
    return createdAt;
  }
  
  // Handle ISO strings or timestamp numbers
  if (typeof createdAt === 'string' || typeof createdAt === 'number') {
    return new Date(createdAt);
  }
  
  // Fallback to current date
  return new Date();
};

/**
 * Get date range boundaries based on preset or custom range
 */
export const getDateRange = (
  rangeType: string,
  customStart?: Date | null,
  customEnd?: Date | null
): { startDate: Date; endDate: Date } => {
  const now = new Date();
  now.setHours(23, 59, 59, 999); // End of today
  
  // Handle custom range
  if (rangeType === 'custom' && customStart && customEnd) {
    const start = new Date(customStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }
  
  let startDate = new Date();
  
  switch (rangeType) {
    case 'today':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;
      
    case 'yesterday':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
      
    case 'last7':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      break;
      
    case 'last30':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      break;
      
    case 'thisMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      break;
      
    case 'lastMonth':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      startDate.setHours(0, 0, 0, 0);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      lastMonthEnd.setHours(23, 59, 59, 999);
      return { startDate, endDate: lastMonthEnd };
      
    default:
      // Default to last 30 days
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
  }
  
  return { startDate, endDate: now };
};

/**
 * Get display label for date range
 */
export const getDateRangeLabel = (
  rangeType: string,
  customStart?: Date | null,
  customEnd?: Date | null
): string => {
  if (rangeType === 'custom' && customStart && customEnd) {
    const start = new Date(customStart);
    const end = new Date(customEnd);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
  
  const labels: Record<string, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    last7: 'Last 7 Days',
    last30: 'Last 30 Days',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
  };
  
  return labels[rangeType] || 'Last 30 Days';
};

/**
 * Get number of days in range (for chart calculations)
 */
export const getDaysInRange = (
  rangeType: string,
  customStart?: Date | null,
  customEnd?: Date | null
): number => {
  const { startDate, endDate } = getDateRange(rangeType, customStart, customEnd);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Include both start and end dates
};

/**
 * Filter orders by date range
 */
export const filterOrdersByDateRange = (
  orders: Order[], 
  startDate: Date, 
  endDate: Date
): Order[] => {
  return orders.filter(order => {
    const orderDate = getOrderDate(order);
    return orderDate >= startDate && orderDate <= endDate;
  });
};

/**
 * Calculate previous period date range for comparison
 */
export const getPreviousPeriodRange = (
  rangeType: string,
  customStart?: Date | null,
  customEnd?: Date | null
): { startDate: Date; endDate: Date } => {
  const { startDate, endDate } = getDateRange(rangeType, customStart, customEnd);
  const diffTime = endDate.getTime() - startDate.getTime();
  
  const previousEnd = new Date(startDate.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - diffTime);
  previousStart.setHours(0, 0, 0, 0);
  
  return { startDate: previousStart, endDate: previousEnd };
};

/**
 * Calculate growth percentage
 */
export const calculateGrowth = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};