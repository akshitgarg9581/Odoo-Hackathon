const statusConfig: Record<string, string> = {
  // Vehicle statuses
  AVAILABLE: 'badge-success',
  ON_TRIP: 'badge-accent',
  IN_SHOP: 'badge-warning',
  RETIRED: 'badge-muted',
  // Driver statuses
  OFF_DUTY: 'badge-muted',
  SUSPENDED: 'badge-danger',
  // Trip statuses
  DRAFT: 'badge-muted',
  DISPATCHED: 'badge-accent',
  COMPLETED: 'badge-success',
  CANCELLED: 'badge-danger',
  // Maintenance statuses
  IN_PROGRESS: 'badge-warning',
};

export default function StatusBadge({ status }: { status: string }) {
  const badgeClass = statusConfig[status] || 'badge-muted';
  const label = status.replace(/_/g, ' ');

  return (
    <span className={`badge ${badgeClass}`}>
      {label}
    </span>
  );
}
