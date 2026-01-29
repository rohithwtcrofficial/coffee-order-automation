// src/hooks/useDashboardLists.ts

import { useMemo } from 'react';
import type { Order, Customer, Product } from '@/lib/types';
import { getOrderDate, filterOrdersByDateRange, getDateRange } from '@/lib/utils/dashboard-utils';

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
  category: string;
  imageUrl?: string;
}

export const useDashboardLists = (
  orders: Order[],
  customers: Customer[],
  products: Product[],
  dateRange: string,
  customStart?: Date | null,
  customEnd?: Date | null
) => {
  const { startDate, endDate } = getDateRange(dateRange, customStart, customEnd);
  const filteredOrders = filterOrdersByDateRange(orders, startDate, endDate);

  // Top selling products (based on date range)
  const topProducts = useMemo((): TopProduct[] => {
    const productSales: Record<string, TopProduct> = {};
    
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.productName,
            sales: 0,
            revenue: 0,
            category: item.category || 'Unknown',
            imageUrl: item.imageUrl
          };
        }
        productSales[item.productId].sales += item.quantity || 0;
        productSales[item.productId].revenue += item.subtotal || 0;
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders]);

  // Recent orders (based on date range)
  const recentOrdersList = useMemo((): Order[] => {
    return [...filteredOrders]
      .sort((a, b) => {
        const dateA = getOrderDate(a);
        const dateB = getOrderDate(b);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  }, [filteredOrders]);

  // Top customers (based on date range)
  const topCustomers = useMemo(() => {
    // Calculate customer spending in the selected date range
    const customerSpending: Record<string, { 
      customer: Customer; 
      spent: number; 
      orderCount: number 
    }> = {};
    
    filteredOrders.forEach(order => {
      if (!customerSpending[order.customerId]) {
        const customer = customers.find(c => c.id === order.customerId);
        if (customer) {
          customerSpending[order.customerId] = {
            customer,
            spent: 0,
            orderCount: 0
          };
        }
      }
      
      if (customerSpending[order.customerId]) {
        customerSpending[order.customerId].spent += order.totalAmount || 0;
        customerSpending[order.customerId].orderCount += 1;
      }
    });

    return Object.values(customerSpending)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5)
      .map(({ customer, spent, orderCount }) => ({
        ...customer,
        periodSpent: spent,
        periodOrders: orderCount
      }));
  }, [filteredOrders, customers]);

  return {
    topProducts,
    recentOrdersList,
    topCustomers,
  };
};