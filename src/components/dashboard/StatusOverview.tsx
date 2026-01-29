// src/components/dashboard/StatusOverview.tsx

import { Card } from '@/components/ui/Card';
import { Clock, CheckCircle, Package, Box, XCircle } from 'lucide-react';

interface StatusOverviewProps {
  statusCounts: {
    RECEIVED: number;
    ACCEPTED: number;
    PACKED: number;
    SHIPPED: number;
    DELIVERED: number;
    CANCELLED: number;
  };
}

export const StatusOverview = ({ statusCounts }: StatusOverviewProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <Card className="p-4 border-l-4 border-cyan-500 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-cyan-600" />
          <div>
            <p className="text-xs text-gray-600 font-medium">Received</p>
            <p className="text-xl font-bold text-gray-900">{statusCounts.RECEIVED}</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4 border-l-4 border-emerald-500 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="text-xs text-gray-600 font-medium">Accepted</p>
            <p className="text-xl font-bold text-gray-900">{statusCounts.ACCEPTED}</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4 border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-orange-600" />
          <div>
            <p className="text-xs text-gray-600 font-medium">Packed</p>
            <p className="text-xl font-bold text-gray-900">{statusCounts.PACKED}</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3">
          <Box className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-xs text-gray-600 font-medium">Shipped</p>
            <p className="text-xl font-bold text-gray-900">{statusCounts.SHIPPED}</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-xs text-gray-600 font-medium">Delivered</p>
            <p className="text-xl font-bold text-gray-900">{statusCounts.DELIVERED}</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-xs text-gray-600 font-medium">Cancelled</p>
            <p className="text-xl font-bold text-gray-900">{statusCounts.CANCELLED}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
