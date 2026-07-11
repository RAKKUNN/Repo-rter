'use client';

import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';

interface GlobalTrafficChartProps {
  data: any[];
  keys: string[];
}

export default function GlobalTrafficChart({ data, keys }: GlobalTrafficChartProps) {
  // Use a predefined palette of vivid pixel colors for the stacked areas
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#f43f5e', '#ef4444', '#10b981'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-panel p-6 mt-6 mb-6"
    >
      <h3 className="text-lg font-medium mb-6">Global Stacked Timeline (All-Time)</h3>
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="var(--pixel-border)" strokeWidth={1} vertical={true} />
            <XAxis 
              dataKey="date" 
              stroke="var(--color-foreground)" 
              fontSize={12}
              fontFamily="var(--font-pixel)"
              tickLine={false}
              axisLine={{ stroke: 'var(--pixel-border)', strokeWidth: 3 }}
              tickMargin={10}
            />
            <YAxis 
              stroke="var(--color-foreground)" 
              fontSize={12}
              fontFamily="var(--font-pixel)"
              tickLine={false}
              axisLine={{ stroke: 'var(--pixel-border)', strokeWidth: 3 }}
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
              tickMargin={10}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--pixel-panel-bg)', 
                border: '2px solid var(--pixel-border)',
                borderRadius: '0px',
                boxShadow: '4px 4px 0px var(--pixel-border)',
                color: 'var(--color-foreground)',
                fontFamily: 'var(--font-pixel)'
              }}
              itemStyle={{ color: 'var(--color-foreground)', fontWeight: 'bold' }}
            />
            <Legend 
              wrapperStyle={{
                fontFamily: 'var(--font-pixel)',
                paddingTop: '20px'
              }}
            />
            {keys.map((key, index) => (
              <Area 
                key={key}
                type="stepAfter" 
                dataKey={key} 
                stackId="1"
                stroke="var(--pixel-border)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill={colors[index % colors.length]} 
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
