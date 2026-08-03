import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: 'purple' | 'blue' | 'green' | 'amber' | 'red' | 'cyan';
  loading?: boolean;
  subtitle?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  trendUp,
  color = 'purple',
  loading,
  subtitle,
  className = ''
}: StatCardProps) {
  const colorMap = {
    purple: 'text-purple-600 bg-purple-100',
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    amber: 'text-amber-600 bg-amber-100',
    red: 'text-red-600 bg-red-100',
    cyan: 'text-cyan-600 bg-cyan-100',
  };

  const trendColor = trendUp === true ? 'text-green-500' : trendUp === false ? 'text-red-500' : 'text-gray-500';

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse skeleton" />
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse skeleton" />
          </div>
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse skeleton" />
        </div>
        {(trend || subtitle) && <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse skeleton" />}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-2 relative overflow-hidden ${className}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-sm text-gray-500 font-medium">{title}</span>
          <span className="text-3xl font-black text-gray-900 dark:text-white mt-1">{value}</span>
        </div>
        <div className={`flex items-center justify-center w-12 h-12 rounded-full ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      
      {(trend || subtitle) && (
        <div className="mt-2 flex items-center gap-1.5 text-sm">
          {trend && (
            <span className={`flex items-center font-medium ${trendColor}`}>
              {trendUp === true && <TrendingUp className="w-4 h-4 mr-1" />}
              {trendUp === false && <TrendingDown className="w-4 h-4 mr-1" />}
              {trend}
            </span>
          )}
          {subtitle && (
            <span className="text-gray-500">{subtitle}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default StatCard;
