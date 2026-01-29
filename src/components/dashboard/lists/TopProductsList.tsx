// src/components/dashboard/lists/TopProductsList.tsx

import { Card } from '@/components/ui/Card';
import { Award, Coffee, Target, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';
import Link from 'next/link';

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
  category: string;
  imageUrl?: string;
}

interface TopProductsListProps {
  products: TopProduct[];
}

export const TopProductsList = ({ products }: TopProductsListProps) => {
  return (
    <Card className="p-6 border-none shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            Top Products
          </h3>
          <p className="text-sm text-gray-600 mt-1">Best sellers this period</p>
        </div>
        <Link href="/products" className="text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1">
          View all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="space-y-3">
        {products.length > 0 ? (
          products.map((product, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-linear-to-r from-gray-50 to-amber-50 rounded-xl hover:shadow-md transition-all group">
              <div className="relative">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-14 h-14 rounded-lg object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Coffee className="w-7 h-7 text-white" />
                  </div>
                )}
                <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                  {index + 1}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-amber-600 transition-colors">
                  {product.name}
                </p>
                <p className="text-xs text-gray-600">{product.category}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-600">{product.sales} sold</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs font-bold text-green-700">{formatCurrency(product.revenue)}</span>
                </div>
              </div>
              <Target className="w-5 h-5 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Coffee className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No sales data available yet</p>
          </div>
        )}
      </div>
    </Card>
  );
};
