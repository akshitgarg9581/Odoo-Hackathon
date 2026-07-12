import type { ReactNode } from 'react';

interface KPICardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  accentColor?: string;
}

export default function KPICard({ icon, label, value, subtitle, accentColor = 'brand-500' }: KPICardProps) {
  return (
    <div className="glass rounded-xl p-5 hover:border-brand-500/30 transition-all duration-300 group animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm text-surface-400 font-medium">{label}</p>
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-surface-500">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg bg-${accentColor}/10 text-${accentColor} group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
