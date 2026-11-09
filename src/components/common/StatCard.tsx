import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  subtext,
  icon: Icon,
  trend,
}) => {
  return (
    <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-5 hover:border-zinc-700/80 transition-colors">
      <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
        <span>{label}</span>
        {Icon && <Icon className="w-4 h-4 text-purple-400/80 shrink-0" />}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight text-[#FAFAFA] font-mono tabular-nums">
          {value}
        </span>
        {unit && <span className="text-xs font-medium text-zinc-400">{unit}</span>}
      </div>
      {(subtext || trend) && (
        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
          {trend && (
            <span className={trend.isPositive ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
              {trend.value}
            </span>
          )}
          {trend && subtext && <span aria-hidden="true">·</span>}
          {subtext && <span>{subtext}</span>}
        </div>
      )}
    </div>
  );
};
