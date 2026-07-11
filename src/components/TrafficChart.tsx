'use client';

import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

interface TrafficChartProps {
  data: { timestamp: string; count: number; uniques: number }[];
  title: string;
}

export default function TrafficChart({ data, title }: TrafficChartProps) {
  // Format dates for X-axis
  const formattedData = data.map(d => {
    const date = new Date(d.timestamp);
    return {
      ...d,
      displayDate: `${date.getMonth() + 1}/${date.getDate()}`,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-panel p-6"
    >
      <h3 className="text-lg font-medium mb-6">{title}</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ccc" vertical={false} />
            <XAxis 
              dataKey="displayDate" 
              stroke="var(--color-foreground)" 
              fontSize={14}
              fontFamily="var(--font-pixel)"
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="var(--color-foreground)" 
              fontSize={14}
              fontFamily="var(--font-pixel)"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
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
            <Area 
              type="stepAfter" 
              dataKey="count" 
              stroke="var(--pixel-border)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="var(--pixel-blue)" 
              name="Total"
            />
            <Area 
              type="stepAfter" 
              dataKey="uniques" 
              stroke="var(--pixel-border)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="var(--pixel-purple)" 
              name="Unique"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
