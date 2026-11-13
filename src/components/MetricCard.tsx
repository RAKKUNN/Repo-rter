'use client';

import { motion } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: any;
  trend?: {
    value: number;
    label?: string;
    isUp: boolean;
  };
  delay?: number;
  isActive?: boolean;
  onClick?: () => void;
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  delay = 0,
  isActive = false,
  onClick,
}: MetricCardProps) {
  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className={`glass-panel p-6 flex flex-col justify-between transition-all ${
        onClick ? 'cursor-pointer glass-panel-hover' : ''
      } ${isActive ? 'ring-2 ring-pixel-blue border-pixel-blue' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-foreground/70 font-semibold text-sm">{title}</h3>
        <div className="p-2 theme-control bg-pixel-blue/10">
          <Icon className="w-5 h-5 text-pixel-blue" />
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="text-3xl font-bold tracking-tight">{formattedValue}</div>
        {trend && (
          <div
            className={`text-xs font-bold px-2 py-1 theme-control ${
              trend.isUp ? 'text-pixel-green' : 'text-pixel-red'
            }`}
          >
            {trend.label
              ? `${trend.value.toLocaleString()} ${trend.label}`
              : `${trend.isUp ? '+' : '-'}${Math.abs(trend.value).toLocaleString()}`}
          </div>
        )}
      </div>
    </motion.div>
  );
}
