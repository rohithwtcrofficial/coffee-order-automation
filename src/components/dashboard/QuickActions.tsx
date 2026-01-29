// src/components/dashboard/QuickActions.tsx

import { Card } from '@/components/ui/Card';
import { Zap, ShoppingCart, Package, Eye, Coffee } from 'lucide-react';
import Link from 'next/link';

export const QuickActions = () => {
  return (
    <Card className="p-6 border-none shadow-lg bg-linear-to-br from-amber-50 to-orange-50">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Zap className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
          <p className="text-sm text-gray-600">Frequently used features</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/orders/new"
          className="flex items-center gap-3 p-4 bg-white hover:bg-linear-to-br hover:from-blue-50 hover:to-blue-100 rounded-xl transition-all group shadow-sm hover:shadow-md border-2 border-transparent hover:border-blue-200"
        >
          <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">New Order</p>
            <p className="text-xs text-gray-600">Create order</p>
          </div>
        </Link>
        
        <Link
          href="/products/new"
          className="flex items-center gap-3 p-4 bg-white hover:bg-linear-to-br hover:from-green-50 hover:to-green-100 rounded-xl transition-all group shadow-sm hover:shadow-md border-2 border-transparent hover:border-green-200"
        >
          <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Add Product</p>
            <p className="text-xs text-gray-600">New product</p>
          </div>
        </Link>
        
        <Link
          href="/orders"
          className="flex items-center gap-3 p-4 bg-white hover:bg-linear-to-br hover:from-purple-50 hover:to-purple-100 rounded-xl transition-all group shadow-sm hover:shadow-md border-2 border-transparent hover:border-purple-200"
        >
          <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
            <Eye className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">View Orders</p>
            <p className="text-xs text-gray-600">All orders</p>
          </div>
        </Link>
        
        <Link
          href="/products"
          className="flex items-center gap-3 p-4 bg-white hover:bg-linear-to-br hover:from-amber-50 hover:to-amber-100 rounded-xl transition-all group shadow-sm hover:shadow-md border-2 border-transparent hover:border-amber-200"
        >
          <div className="p-3 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
            <Coffee className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Manage Products</p>
            <p className="text-xs text-gray-600">Catalog</p>
          </div>
        </Link>
      </div>
    </Card>
  );
};
