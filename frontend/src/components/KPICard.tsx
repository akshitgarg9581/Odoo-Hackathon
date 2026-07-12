import type { ReactNode } from 'react';

interface KPICardProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  subtitleIcon?: ReactNode;
  isHero?: boolean;
  accentColor?: 'blue' | 'green' | 'amber' | 'red' | 'none';
}

export default function KPICard({ 
  icon, 
  label, 
  value, 
  subtitle, 
  subtitleIcon,
  isHero = false,
  accentColor = 'none'
}: KPICardProps) {
  
  const borderColors = {
    blue: 'border-l-accent',
    green: 'border-l-success',
    amber: 'border-l-warning',
    red: 'border-l-danger',
    none: 'border-l-transparent'
  };

  const textColors = {
    blue: 'text-accent',
    green: 'text-success',
    amber: 'text-warning',
    red: 'text-danger',
    none: 'text-text-muted'
  };

  return (
    <div className={`card p-5 flex flex-col justify-between animate-fade-in border-l-4 ${borderColors[accentColor]} ${isHero ? 'md:col-span-2' : ''}`}>
      <div className="flex items-center gap-2 mb-3 text-text-muted">
        {icon && <div className="text-text-muted">{icon}</div>}
        <h3 className="text-xs font-semibold tracking-wide text-text-muted">{label}</h3>
      </div>
      <div>
        <p className={`${isHero ? 'text-4xl' : 'text-3xl'} font-bold tracking-tight text-text-primary`}>
          {value}
        </p>
        {subtitle && (
          <div className={`flex items-center gap-1.5 mt-2.5 text-xs font-medium ${textColors[accentColor]}`}>
            {subtitleIcon && subtitleIcon}
            <span>{subtitle}</span>
          </div>
        )}
      </div>
    </div>
  );
}
