'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Line,
  LineChart,
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
  Brush,
} from 'recharts';
import { TrendingUp, BarChart3, Activity, Maximize2 } from 'lucide-react';

interface TrafficChartProps {
  data: { timestamp: string; count: number; uniques: number }[];
  title: string;
}

type RangeFilter = '7d' | '14d' | '30d' | '90d' | 'all';
type ChartMode = 'line' | 'area' | 'bar';
type SeriesVisibility = 'both' | 'count' | 'uniques';

export default function TrafficChart({ data, title }: TrafficChartProps) {
  const [range, setRange] = useState<RangeFilter>('all');
  const [chartMode, setChartMode] = useState<ChartMode>('area');
  const [series, setSeries] = useState<SeriesVisibility>('both');
  const [showBrush, setShowBrush] = useState(false);

  const filteredData = useMemo(() => {
    const sorted = [...data].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const sliced =
      range === '7d'
        ? sorted.slice(-7)
        : range === '14d'
        ? sorted.slice(-14)
        : range === '30d'
        ? sorted.slice(-30)
        : range === '90d'
        ? sorted.slice(-90)
        : sorted;

    return sliced.map((d) => {
      const date = new Date(d.timestamp);
      return {
        ...d,
        displayDate: `${date.getMonth() + 1}/${date.getDate()}`,
        fullDate: date.toISOString().split('T')[0],
      };
    });
  }, [data, range]);

  const stats = useMemo(() => {
    if (filteredData.length === 0) {
      return { totalCount: 0, totalUniques: 0, avgCount: 0, peakDay: '-', peakVal: 0 };
    }
    const totalCount = filteredData.reduce((acc, d) => acc + (d.count || 0), 0);
    const totalUniques = filteredData.reduce((acc, d) => acc + (d.uniques || 0), 0);
    const avgCount = Math.round(totalCount / filteredData.length);
    const peak = filteredData.reduce(
      (max, d) => (d.count > max.count ? d : max),
      filteredData[0]
    );
    return {
      totalCount,
      totalUniques,
      avgCount,
      peakDay: peak.displayDate,
      peakVal: peak.count,
    };
  }, [filteredData]);

  const showTotal = series === 'both' || series === 'count';
  const showUniques = series === 'both' || series === 'uniques';

  const tooltipStyle = {
    backgroundColor: 'var(--pixel-panel-bg)',
    border: 'var(--card-border-width, 2px) solid var(--pixel-border)',
    borderRadius: 'var(--card-radius, 0px)',
    boxShadow: 'var(--control-shadow, none)',
    color: 'var(--color-foreground)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-panel p-6 flex flex-col gap-4"
    >
      {/* Top Interactive Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold tracking-tight">{title}</h3>
          <div className="flex flex-wrap items-center gap-3 text-xs opacity-70 mt-1">
            <span>
              Sum: <strong className="text-pixel-blue">{stats.totalCount.toLocaleString()}</strong>
            </span>
            <span>•</span>
            <span>
              Avg/day: <strong>{stats.avgCount.toLocaleString()}</strong>
            </span>
            <span>•</span>
            <span>
              Peak: <strong className="text-pixel-purple">{stats.peakVal.toLocaleString()}</strong> ({stats.peakDay})
            </span>
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Range Selector */}
          <div className="flex items-center border border-[var(--pixel-border)] bg-foreground/5 p-0.5 text-xs font-bold">
            {(['7d', '14d', '30d', '90d', 'all'] as RangeFilter[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2 py-1 uppercase transition-colors ${
                  range === r ? 'bg-pixel-blue text-white' : 'hover:bg-foreground/10 opacity-70 hover:opacity-100'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Chart Type Switcher */}
          <div className="flex items-center border border-[var(--pixel-border)] bg-foreground/5 p-0.5">
            <button
              onClick={() => setChartMode('area')}
              title="Area Chart"
              className={`p-1.5 transition-colors ${
                chartMode === 'area' ? 'bg-pixel-blue text-white' : 'hover:bg-foreground/10 opacity-70'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartMode('line')}
              title="Line Chart"
              className={`p-1.5 transition-colors ${
                chartMode === 'line' ? 'bg-pixel-blue text-white' : 'hover:bg-foreground/10 opacity-70'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartMode('bar')}
              title="Bar Chart"
              className={`p-1.5 transition-colors ${
                chartMode === 'bar' ? 'bg-pixel-blue text-white' : 'hover:bg-foreground/10 opacity-70'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            {filteredData.length > 7 && (
              <button
                onClick={() => setShowBrush((v) => !v)}
                title="Toggle Range Zoom Slider"
                className={`p-1.5 transition-colors ${
                  showBrush ? 'bg-pixel-purple text-white' : 'hover:bg-foreground/10 opacity-70'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Series Filter Pills */}
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => setSeries('both')}
          className={`px-2.5 py-1 font-bold transition-all theme-control ${
            series === 'both' ? 'bg-pixel-blue text-white' : 'opacity-70 hover:opacity-100'
          }`}
        >
          All Series
        </button>
        <button
          onClick={() => setSeries(series === 'count' ? 'both' : 'count')}
          className={`px-2.5 py-1 font-bold flex items-center gap-1.5 transition-all theme-control ${
            series === 'count' ? 'bg-pixel-blue text-white' : 'opacity-75 hover:opacity-100'
          }`}
        >
          <span className="w-2 h-2 inline-block bg-pixel-blue" />
          Total ({stats.totalCount.toLocaleString()})
        </button>
        <button
          onClick={() => setSeries(series === 'uniques' ? 'both' : 'uniques')}
          className={`px-2.5 py-1 font-bold flex items-center gap-1.5 transition-all theme-control ${
            series === 'uniques' ? 'bg-pixel-purple text-white' : 'opacity-75 hover:opacity-100'
          }`}
        >
          <span className="w-2 h-2 inline-block bg-pixel-purple" />
          Uniques ({stats.totalUniques.toLocaleString()})
        </button>
      </div>

      {/* Chart Canvas */}
      <div className="h-[290px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'bar' ? (
            <BarChart data={filteredData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid stroke="var(--pixel-border)" strokeOpacity={0.2} strokeDasharray="3 3" />
              <XAxis dataKey="displayDate" stroke="var(--color-foreground)" fontSize={11} tickLine={false} />
              <YAxis
                stroke="var(--color-foreground)"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              {showTotal && <Bar dataKey="count" name="Total" fill="var(--pixel-blue)" radius={[4, 4, 0, 0]} />}
              {showUniques && <Bar dataKey="uniques" name="Uniques" fill="var(--pixel-purple)" radius={[4, 4, 0, 0]} />}
              {showBrush && <Brush dataKey="displayDate" height={22} stroke="var(--pixel-blue)" fill="var(--pixel-panel-bg)" />}
            </BarChart>
          ) : chartMode === 'area' ? (
            <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradTotal-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--pixel-blue)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--pixel-blue)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id={`gradUniq-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--pixel-purple)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--pixel-purple)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--pixel-border)" strokeOpacity={0.2} strokeDasharray="3 3" />
              <XAxis dataKey="displayDate" stroke="var(--color-foreground)" fontSize={11} tickLine={false} />
              <YAxis
                stroke="var(--color-foreground)"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              {showTotal && (
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Total"
                  stroke="var(--pixel-blue)"
                  strokeWidth={3}
                  fill={`url(#gradTotal-${title})`}
                />
              )}
              {showUniques && (
                <Area
                  type="monotone"
                  dataKey="uniques"
                  name="Uniques"
                  stroke="var(--pixel-purple)"
                  strokeWidth={3}
                  fill={`url(#gradUniq-${title})`}
                />
              )}
              {showBrush && <Brush dataKey="displayDate" height={22} stroke="var(--pixel-blue)" fill="var(--pixel-panel-bg)" />}
            </AreaChart>
          ) : (
            <LineChart data={filteredData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid stroke="var(--pixel-border)" strokeOpacity={0.2} strokeDasharray="3 3" />
              <XAxis dataKey="displayDate" stroke="var(--color-foreground)" fontSize={11} tickLine={false} />
              <YAxis
                stroke="var(--color-foreground)"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              {showTotal && (
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Total"
                  stroke="var(--pixel-blue)"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              )}
              {showUniques && (
                <Line
                  type="monotone"
                  dataKey="uniques"
                  name="Uniques"
                  stroke="var(--pixel-purple)"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              )}
              {showBrush && <Brush dataKey="displayDate" height={22} stroke="var(--pixel-blue)" fill="var(--pixel-panel-bg)" />}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
