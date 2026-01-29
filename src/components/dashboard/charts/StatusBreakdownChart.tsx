// src/components/dashboard/charts/StatusBreakdownChart.tsx

import { Card } from '@/components/ui/Card';
import { Gauge } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StatusChartData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number; // Index signature for Recharts compatibility
}

interface StatusBreakdownChartProps {
  data: StatusChartData[];
}

export const StatusBreakdownChart = ({ data }: StatusBreakdownChartProps) => {
  if (data.length === 0) return null;

  return (
    <Card className="p-6 border-none shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-indigo-600" />
            Order Status Breakdown
          </h3>
          <p className="text-sm text-gray-600 mt-1">Current order pipeline</p>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <YAxis dataKey="name" type="category" stroke="#9ca3af" style={{ fontSize: '12px' }} width={100} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              border: '2px solid #f3f4f6', 
              borderRadius: '12px', 
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' 
            }}
            formatter={(value: any) => [value + ' orders', 'Count']}
          />
          <Bar dataKey="value" fill="#f59e0b" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};