// src/components/dashboard/charts/RevenueTrendChart.tsx

import { Card } from '@/components/ui/Card';
import { AreaChart as AreaChartIcon, BarChart3, LineChart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils/formatters';
import { getDateRangeLabel } from '@/lib/utils/dashboard-utils';

interface RevenueChartData {
  name: string;
  revenue: number;
  orders: number;
  [key: string]: string | number; // Index signature for Recharts compatibility
}

interface RevenueTrendChartProps {
  data: RevenueChartData[];
  dateRange: string;
  customStart?: Date | null;
  customEnd?: Date | null;
}

export const RevenueTrendChart = ({ data, dateRange, customStart, customEnd }: RevenueTrendChartProps) => {
  const hasData = data.length > 0 && data.some(d => d.revenue > 0);
  const peakRevenue = hasData ? Math.max(...data.map(d => d.revenue), 0) : 0;
  const avgRevenue = hasData ? data.reduce((sum, d) => sum + d.revenue, 0) / data.length : 0;
  const totalOrders = hasData ? data.reduce((sum, d) => sum + d.orders, 0) : 0;
  const rangeLabel = getDateRangeLabel(dateRange, customStart, customEnd);

  return (
    <Card className="lg:col-span-2 p-6 border-none shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <AreaChartIcon className="w-5 h-5 text-green-600" />
            Revenue Trend
          </h3>
          <p className="text-sm text-gray-600 mt-1">{rangeLabel} - Daily revenue breakdown</p>
        </div>
        <BarChart3 className="w-5 h-5 text-gray-400" />
      </div>
      
      {hasData ? (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#9ca3af" 
                style={{ fontSize: '12px' }}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                stroke="#9ca3af" 
                style={{ fontSize: '12px' }}
                tick={{ fill: '#6b7280' }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '2px solid #f3f4f6', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' 
                }}
                formatter={(value: any) => ['₹' + value.toLocaleString('en-IN'), 'Revenue']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#f59e0b" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
          
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-600 font-medium">Peak Revenue</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(peakRevenue)}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-600 font-medium">Avg Daily</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(avgRevenue)}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-xs text-gray-600 font-medium">Total Orders</p>
              <p className="text-lg font-bold text-gray-900">{totalOrders}</p>
            </div>
          </div>
        </>
      ) : (
        <div className="h-80 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <LineChart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No revenue data for selected period</p>
            <p className="text-xs text-gray-400 mt-2">Orders will appear here once they are placed</p>
          </div>
        </div>
      )}
    </Card>
  );
};