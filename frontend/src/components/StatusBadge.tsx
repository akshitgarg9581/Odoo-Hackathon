const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  // Vehicle statuses
  AVAILABLE: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  ON_TRIP: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  IN_SHOP: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  RETIRED: { bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-500' },
  // Driver statuses
  OFF_DUTY: { bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-500' },
  SUSPENDED: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  // Trip statuses
  DRAFT: { bg: 'bg-slate-500/10', text: 'text-slate-300', dot: 'bg-slate-400' },
  DISPATCHED: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  COMPLETED: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  CANCELLED: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  // Maintenance statuses
  IN_PROGRESS: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-500' };
  const label = status.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium tracking-wide ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {label}
    </span>
  );
}
