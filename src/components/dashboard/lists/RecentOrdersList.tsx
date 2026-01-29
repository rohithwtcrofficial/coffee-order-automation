// src/components/dashboard/lists/RecentOrdersList.tsx

import { Card } from '@/components/ui/Card';
import { Clock, ShoppingCart, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { getOrderDate } from '@/lib/utils/dashboard-utils';
import Link from 'next/link';
import type { Order, Customer } from '@/lib/types';

interface RecentOrdersListProps {
  orders: Order[];
  customers: Customer[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'DELIVERED': return 'text-green-600 bg-green-100';
    case 'SHIPPED': return 'text-blue-600 bg-blue-100';
    case 'PACKED': return 'text-orange-600 bg-orange-100';
    case 'ACCEPTED': return 'text-emerald-600 bg-emerald-100';
    case 'RECEIVED': return 'text-cyan-600 bg-cyan-100';
    case 'CANCELLED': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const RecentOrdersList = ({ orders, customers }: RecentOrdersListProps) => {
  return (
    <Card className="p-6 border-none shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Recent Orders
          </h3>
          <p className="text-sm text-gray-600 mt-1">Latest transactions</p>
        </div>
        <Link href="/orders" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
          View all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="space-y-3">
        {orders.length > 0 ? (
          orders.map((order) => {
            const customer = customers.find(c => c.id === order.customerId);
            const orderDate = getOrderDate(order);
            return (
              <Link 
                key={order.id} 
                href={`/orders/${order.id}`}
                className="flex items-center gap-4 p-4 bg-linear-to-r from-gray-50 to-blue-50 rounded-xl hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                    Order #{order.orderNumber}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-1">{customer?.name || 'Unknown'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(orderDate)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                  <p className="text-xs text-gray-600">{order.items.length} items</p>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No orders yet</p>
          </div>
        )}
      </div>
    </Card>
  );
};
