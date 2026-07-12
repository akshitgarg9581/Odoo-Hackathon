import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Loader2, Wrench, CheckCircle, AlertCircle, Pencil } from 'lucide-react';
import { getMaintenanceLogs, createMaintenanceLog, completeMaintenance, updateMaintenanceLog, type MaintenanceLog, type CreateMaintenanceData } from '../api/maintenance';
import { getVehicles, type Vehicle } from '../api/vehicles';
import DataTable, { type Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const SERVICE_TYPES = [
  'Oil Change',
  'Tire Replacement',
  'Engine Repair',
  'Brake Service',
  'General Inspection',
  'Other',
];

const inputClass =
  'w-full px-4 py-2.5 rounded-lg bg-bg-surface border border-border-theme text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all text-sm';

const emptyForm = {
  vehicleId: '',
  serviceType: '',
  cost: 0,
  serviceDate: '',
  description: '',
};

export default function MaintenancePage() {
  const { isReadOnly } = useAuth();

  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter(log => 
    (log.vehicle?.registrationNo || '').toLowerCase().includes(search.toLowerCase()) || 
    log.serviceType.toLowerCase().includes(search.toLowerCase()) ||
    log.description.toLowerCase().includes(search.toLowerCase())
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<MaintenanceLog | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<CreateMaintenanceData>(emptyForm);

  /* ── Data fetching ──────────────────────────────────────────────── */

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [logsRes, vehiclesRes] = await Promise.all([
        getMaintenanceLogs(),
        getVehicles(),
      ]);
      setLogs(logsRes.data);
      setVehicles(vehiclesRes.data);
    } catch (err) {
      console.error('Failed to fetch maintenance data:', err);
      setError('Failed to load maintenance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ── Save handler ─────────────────────────────────────────────── */

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      if (editingLog) {
        await updateMaintenanceLog(editingLog.id, form);
      } else {
        await createMaintenanceLog(form);
      }
      setModalOpen(false);
      setEditingLog(null);
      setForm(emptyForm);
      await fetchData();
    } catch (err: any) {
      console.error('Failed to save maintenance log:', err);
      setError(err?.response?.data?.error || 'Failed to save maintenance log.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (log: MaintenanceLog) => {
    setEditingLog(log);
    setForm({
      vehicleId: log.vehicleId,
      serviceType: log.serviceType,
      cost: log.cost,
      serviceDate: log.serviceDate.split('T')[0],
      description: log.description,
    });
    setError(null);
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditingLog(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingLog(null);
    setForm(emptyForm);
  };

  /* ── Complete handler ───────────────────────────────────────────── */

  const handleComplete = async (id: string) => {
    if (!window.confirm('Are you sure you want to mark this maintenance as completed?')) return;
    try {
      await completeMaintenance(id);
      await fetchData();
    } catch (err) {
      console.error('Failed to complete maintenance:', err);
      setError('Failed to complete maintenance log.');
    }
  };

  /* ── Available vehicles for modal (exclude IN_SHOP and RETIRED unless editing) ─ */

  const availableVehicles = vehicles.filter((v) => {
    if (editingLog && editingLog.vehicleId === v.id) return true;
    return v.status !== 'IN_SHOP' && v.status !== 'RETIRED';
  });

  /* ── Table columns ──────────────────────────────────────────────── */

  const columns: Column<MaintenanceLog>[] = [
    {
      key: 'vehicleId',
      header: 'Vehicle',
      render: (row) => (
        <span className="font-mono text-text-muted">
          {row.vehicle?.registrationNo ?? row.vehicleId}
        </span>
      ),
    },
    {
      key: 'serviceType',
      header: 'Service Type',
    },
    {
      key: 'cost',
      header: 'Cost (₹)',
      render: (row) => <span>₹{row.cost.toLocaleString()}</span>,
    },
    {
      key: 'serviceDate',
      header: 'Service Date',
      render: (row) => (
        <span>{new Date(row.serviceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => (
        <span className="block break-words whitespace-normal min-w-[200px] text-sm text-text-muted leading-relaxed" title={row.description}>
          {row.description}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (row) => {
        if (isReadOnly) return null;
        return (
          <div className="flex items-center gap-2">
            {row.status === 'IN_PROGRESS' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleComplete(row.id);
                }}
                className="px-3 py-1.5 rounded-md bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-all inline-flex items-center gap-1.5"
              >
                <CheckCircle size={14} className="stroke-[2.5]" />
                Complete
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEdit(row);
              }}
              className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
              title="Edit"
            >
              <Pencil size={16} />
            </button>
          </div>
        );
      },
    },
  ];

  /* ── Loading state ──────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <p className="text-text-muted text-sm font-medium">Loading maintenance logs…</p>
        </div>
      </div>
    );
  }

  /* ── Error state ────────────────────────────────────────────────── */

  if (error && logs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="card flex flex-col items-center gap-4 p-8 text-center border-danger/20">
          <AlertCircle className="h-10 w-10 text-danger" />
          <p className="text-text-primary font-medium">{error}</p>
          <button
            onClick={() => fetchData()}
            className="mt-2 rounded-lg bg-accent/20 px-5 py-2 text-sm font-semibold text-accent transition hover:bg-accent/30"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ── Main render ────────────────────────────────────────────────── */

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-warning/10">
            <Wrench className="text-warning" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">Maintenance</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-semibold">
                {logs.length} total
              </span>
            </div>
            <p className="text-xs text-text-muted font-medium mt-0.5">Track vehicle service and repair logs</p>
          </div>
        </div>

        {!isReadOnly && (
          <button
            onClick={openCreate}
            className="px-5 py-2 rounded-lg bg-accent text-[#F5F5F6] font-medium text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} className="stroke-[2.5]" />
            Log Maintenance
          </button>
        )}
      </div>

      {/* ── Search & Filters ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by vehicle, service type, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-bg-surface border border-border-theme text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all text-sm shadow-sm"
          />
        </div>
        <button className="px-4 py-2 rounded-lg bg-bg-surface border border-border-theme text-text-primary font-medium text-sm hover:bg-bg-elevated transition-colors inline-flex items-center gap-2 shadow-sm whitespace-nowrap">
          <Filter size={16} className="text-text-muted stroke-[2]" />
          Filters
        </button>
      </div>

      {/* ── Inline error banner ────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 text-sm text-danger font-medium">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* ── Data Table ─────────────────────────────────────────────── */}
      <DataTable<MaintenanceLog>
        columns={columns}
        data={filteredLogs}
        emptyMessage="No maintenance logs found"
      />

      {/* ── Create / Edit Modal ───────────────────────────────────────────── */}
      <Modal isOpen={modalOpen} onClose={handleClose} title={editingLog ? 'Edit Maintenance Log' : 'Log Maintenance'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          {/* Vehicle */}
          <div>
            <label className="block text-sm font-semibold tracking-wide text-text-muted mb-1.5">Vehicle</label>
            <select
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              required
              disabled={!!editingLog}
              className={`${inputClass} disabled:opacity-50`}
            >
              <option value="">Select a vehicle</option>
              {availableVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registrationNo} — {v.nameModel}
                </option>
              ))}
            </select>
          </div>

          {/* Service Type */}
          <div>
            <label className="block text-sm font-semibold tracking-wide text-text-muted mb-1.5">Service Type</label>
            <select
              value={form.serviceType}
              onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
              required
              className={inputClass}
            >
              <option value="">Select service type</option>
              {SERVICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Cost + Date row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold tracking-wide text-text-muted mb-1.5">Cost (₹)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.cost || ''}
                onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })}
                required
                placeholder="0.00"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold tracking-wide text-text-muted mb-1.5">Service Date</label>
              <input
                type="date"
                value={form.serviceDate}
                onChange={(e) => setForm({ ...form, serviceDate: e.target.value })}
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold tracking-wide text-text-muted mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              rows={3}
              placeholder="Describe the maintenance work…"
              className={inputClass + ' resize-none'}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-lg border border-border-theme text-text-muted font-medium text-sm hover:bg-bg-elevated hover:text-text-primary transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 rounded-lg bg-accent text-[#F5F5F6] font-medium text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} className="stroke-[2.5]" />}
              {submitting ? 'Saving…' : editingLog ? 'Save Changes' : 'Log Maintenance'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
