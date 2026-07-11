'use client';

import { motion } from 'framer-motion';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';

interface TrafficChartProps {
  data: { timestamp: string; count: number; uniques: number }[];
  title: string;
}

// Custom square dot for the line chart
const CustomizedDot = (props: any) => {
  const { cx, cy, stroke, payload, value } = props;
  if (!cx || !cy) return null;
  return (
    <rect 
      x={cx - 5} 
      y={cy - 5} 
      width={10} 
      height={10} 
      fill={stroke} 
      stroke="var(--pixel-border)" 
      strokeWidth={3} 
      filter="url(#neoShadow)"
    />
  );
};

const CustomizedActiveDot = (props: any) => {
  const { cx, cy, stroke } = props;
  if (!cx || !cy) return null;
  return (
    <rect 
      x={cx - 7} 
      y={cy - 7} 
      width={14} 
      height={14} 
      fill={stroke} 
      stroke="var(--pixel-border)" 
      strokeWidth={3} 
      filter="url(#neoShadow)"
    />
  );
};

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
      className="glass-panel p-6 border-4 border-[var(--pixel-border)]"
    >
      <h3 className="text-lg font-medium mb-6 uppercase tracking-wider">{title}</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <filter id="neoShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="3" dy="3" stdDeviation="0" floodColor="var(--pixel-border)" floodOpacity="1" />
              </filter>
            </defs>
            <CartesianGrid stroke="var(--pixel-border)" strokeWidth={1} vertical={true} />
            <XAxis 
              dataKey="displayDate" 
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
                border: '3px solid var(--pixel-border)',
                borderRadius: '0px',
                boxShadow: '4px 4px 0px var(--pixel-border)',
                color: 'var(--color-foreground)',
                fontFamily: 'var(--font-pixel)'
              }}
              itemStyle={{ color: 'var(--color-foreground)', fontWeight: 'bold' }}
            />
            <Legend 
              wrapperStyle={{ fontFamily: 'var(--font-pixel)', paddingTop: '10px' }}
              iconType="square"
            />
            <Line 
              type="linear" 
              dataKey="count" 
              stroke="var(--pixel-blue)" 
              strokeWidth={4}
              strokeLinecap="square"
              strokeLinejoin="miter"
              name="Total Views/Clones"
              filter="url(#neoShadow)"
              dot={<CustomizedDot />}
              activeDot={<CustomizedActiveDot />}
            />
            <Line 
              type="linear" 
              dataKey="uniques" 
              stroke="var(--pixel-purple)" 
              strokeWidth={4}
              strokeLinecap="square"
              strokeLinejoin="miter"
              name="Unique Visitors/Cloners"
              filter="url(#neoShadow)"
              dot={<CustomizedDot />}
              activeDot={<CustomizedActiveDot />}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
