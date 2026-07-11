'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: any;
  trend?: {
    value: number;
    isUp: boolean;
  };
  delay?: number;
  onClick?: () => void;
}

export default function MetricCard({ title, value, icon: Icon, trend, delay = 0, onClick }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className={`glass-panel p-6 flex flex-col ${onClick ? 'cursor-pointer glass-panel-hover' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-foreground/70 font-medium">{title}</h3>
        <div className="p-2 rounded-lg bg-glass-border">
          <Icon className="w-5 h-5 text-neon-blue" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div className="text-3xl font-bold">{value}</div>
        {trend && (
          <div className={`text-sm font-medium ${trend.isUp ? 'text-neon-green' : 'text-red-400'}`}>
            {trend.isUp ? '+' : '-'}{Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </motion.div>
  );
}
