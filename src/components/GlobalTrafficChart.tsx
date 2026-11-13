'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Layers, BarChart3 } from 'lucide-react';

interface GlobalTrafficChartProps {
  data: any[];
  keys: string[];
}

type RangeFilter = '7d' | '14d' | '30d' | '90d' | 'all';

export default function GlobalTrafficChart({ data, keys }: GlobalTrafficChartProps) {
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#f43f5e', '#ef4444', '#10b981'];
  const [range, setRange] = useState<RangeFilter>('all');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [activeKeys, setActiveKeys] = useState<Record<string, boolean>>({});

  const isKeyVisible = (k: string) => activeKeys[k] !== false;

  const toggleKey = (k: string) => {
    setActiveKeys((prev) => ({
      ...prev,
      [k]: prev[k] === false ? true : false,
    }));
  };

  const filteredData = useMemo(() => {
    if (range === '7d') return data.slice(-7);
    if (range === '14d') return data.slice(-14);
    if (range === '30d') return data.slice(-30);
    if (range === '90d') return data.slice(-90);
    return data;
  }, [data, range]);

  const tooltipStyle = {
    backgroundColor: 'var(--pixel-panel-bg)',
    border: 'var(--card-border-width, 2px) solid var(--pixel-border)',
    borderRadius: 'var(--card-radius, 0px)',
    boxShadow: 'var(--control-shadow, none)',
    color: 'var(--color-foreground)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-panel p-6 mt-6 mb-6 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">Global Stacked Timeline (All-Time)</h3>
          <p className="text-xs opacity-60">Click repository pills below to filter individual timelines</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border border-[var(--pixel-border)] bg-foreground/5 p-0.5 text-xs font-bold">
            {(['7d', '14d', '30d', '90d', 'all'] as RangeFilter[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 uppercase transition-colors ${
                  range === r ? 'bg-pixel-blue text-white' : 'hover:bg-foreground/10 opacity-70'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="flex items-center border border-[var(--pixel-border)] bg-foreground/5 p-0.5">
            <button
              onClick={() => setChartType('area')}
              title="Stacked Area"
              className={`p-1.5 transition-colors ${
                chartType === 'area' ? 'bg-pixel-blue text-white' : 'hover:bg-foreground/10 opacity-70'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              title="Stacked Bar"
              className={`p-1.5 transition-colors ${
                chartType === 'bar' ? 'bg-pixel-blue text-white' : 'hover:bg-foreground/10 opacity-70'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Repository Toggle Pills */}
      <div className="flex flex-wrap gap-2">
        {keys.map((key, index) => {
          const visible = isKeyVisible(key);
          const color = colors[index % colors.length];
          return (
            <button
              key={key}
              onClick={() => toggleKey(key)}
              className={`px-3 py-1 text-xs font-bold flex items-center gap-2 transition-all theme-control ${
                visible ? 'opacity-100' : 'opacity-35 line-through'
              }`}
            >
              <span className="w-2.5 h-2.5 inline-block shrink-0" style={{ backgroundColor: color }} />
              {key}
            </button>
          );
        })}
      </div>

      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={filteredData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="var(--pixel-border)" strokeOpacity={0.2} strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="var(--color-foreground)" fontSize={12} tickLine={false} />
              <YAxis
                stroke="var(--color-foreground)"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value)}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              {keys.filter(isKeyVisible).map((key) => {
                const origIdx = keys.indexOf(key);
                return (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="1"
                    fill={colors[origIdx % colors.length]}
                  />
                );
              })}
            </BarChart>
          ) : (
            <AreaChart data={filteredData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="var(--pixel-border)" strokeOpacity={0.2} strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="var(--color-foreground)" fontSize={12} tickLine={false} />
              <YAxis
                stroke="var(--color-foreground)"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value)}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              {keys.filter(isKeyVisible).map((key) => {
                const origIdx = keys.indexOf(key);
                return (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stackId="1"
                    stroke={colors[origIdx % colors.length]}
                    strokeWidth={2}
                    fillOpacity={0.75}
                    fill={colors[origIdx % colors.length]}
                  />
                );
              })}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
