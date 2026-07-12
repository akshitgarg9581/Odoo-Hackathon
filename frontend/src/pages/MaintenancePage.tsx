import { useState, useEffect } from 'react';
import { Plus, Loader2, Wrench, CheckCircle, AlertCircle, Pencil } from 'lucide-react';
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
  'w-full px-4 py-2.5 rounded-lg bg-surface-900/80 border border-surface-700 text-white placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all text-sm';

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
        <span className="font-mono text-surface-100">
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
        <span className="max-w-[200px] truncate block" title={row.description}>
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
                className="px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-all inline-flex items-center gap-1.5"
              >
                <CheckCircle size={14} />
                Complete
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEdit(row);
              }}
              className="p-1.5 rounded-lg text-surface-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
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
          <Loader2 className="h-10 w-10 animate-spin text-brand-400" />
          <p className="text-surface-400 text-sm">Loading maintenance logs…</p>
        </div>
      </div>
    );
  }

  /* ── Error state ────────────────────────────────────────────────── */

  if (error && logs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="glass flex flex-col items-center gap-4 rounded-2xl p-8 text-center">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-surface-200 font-medium">{error}</p>
          <button
            onClick={() => fetchData()}
            className="mt-2 rounded-lg bg-brand-500/20 px-5 py-2 text-sm font-semibold text-brand-300 transition hover:bg-brand-500/30"
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <Wrench className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-50 lg:text-3xl">Maintenance</h1>
            <p className="text-sm text-surface-400">Track vehicle service and repair logs</p>
          </div>
        </div>

        {!isReadOnly && (
          <button
            onClick={openCreate}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 text-white font-medium text-sm hover:from-brand-500 hover:to-brand-400 transition-all shadow-lg shadow-brand-500/25 inline-flex items-center gap-2"
          >
            <Plus size={18} />
            Log Maintenance
          </button>
        )}
      </div>

      {/* ── Inline error banner ────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* ── Data Table ─────────────────────────────────────────────── */}
      <DataTable<MaintenanceLog>
        columns={columns}
        data={logs}
        emptyMessage="No maintenance logs found"
      />

      {/* ── Create / Edit Modal ───────────────────────────────────────────── */}
      <Modal isOpen={modalOpen} onClose={handleClose} title={editingLog ? 'Edit Maintenance Log' : 'Log Maintenance'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          {/* Vehicle */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Vehicle</label>
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
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Service Type</label>
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
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Cost (₹)</label>
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
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Service Date</label>
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
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Description</label>
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
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-surface-300 hover:text-white hover:bg-surface-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 text-white font-medium text-sm hover:from-brand-500 hover:to-brand-400 transition-all shadow-lg shadow-brand-500/25 inline-flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {submitting ? 'Saving…' : editingLog ? 'Save Changes' : 'Log Maintenance'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
