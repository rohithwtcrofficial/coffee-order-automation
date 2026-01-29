// src/components/dashboard/charts/CategoryChart.tsx

import { Card } from '@/components/ui/Card';
import { PieChart } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils/formatters';
import { CATEGORY_LABEL_MAP } from '@/lib/constants/productOptions';


interface CategoryData {
  name: string;
  value: number;
  revenue: number;
  color: string;
  [key: string]: string | number; // Index signature for Recharts compatibility
}

interface CategoryChartProps {
  data: CategoryData[];
}

export const CategoryChart = ({ data }: CategoryChartProps) => {
  return (
    <Card className="p-6 border-none shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-amber-600" />
            Categories
          </h3>
          <p className="text-sm text-gray-600 mt-1">Sales distribution</p>
        </div>
      </div>
      
      {data.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <RePieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                isAnimationActive={true}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #f3f4f6',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }}
                formatter={(value: any, _name: any, props: any) => {
                  const label =
                    CATEGORY_LABEL_MAP[props.payload.name] ?? props.payload.name;
                  return [`${value} units`, label];
                }}
              />
            </RePieChart>
          </ResponsiveContainer>
          
          <div className="space-y-2 mt-4">
            {data.slice(0, 4).map((cat, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                  <span className="text-gray-700 font-medium text-xs line-clamp-1">
                    {CATEGORY_LABEL_MAP[cat.name] ?? cat.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-xs">{cat.value}</span>
                  <span className="text-xs text-gray-500">{formatCurrency(cat.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-80 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <PieChart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No category data</p>
          </div>
        </div>
      )}
    </Card>
  );
};