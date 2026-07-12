import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Loader2, Fuel, AlertCircle, Pencil } from 'lucide-react';
import { getFuelLogs, createFuelLog, updateFuelLog, type FuelLog, type CreateFuelData } from '../api/fuel';
import { getVehicles, type Vehicle } from '../api/vehicles';
import DataTable, { type Column } from '../components/DataTable';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const inputClass =
  'w-full px-4 py-2.5 rounded-lg bg-bg-surface border border-border-theme text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all text-sm';

const emptyForm = {
  vehicleId: '',
  fillDate: '',
  quantity: 0,
  totalCost: 0,
  odometerReading: 0,
};

export default function FuelPage() {
  const { isReadOnly } = useAuth();

  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter(log => 
    (log.vehicle?.registrationNo || '').toLowerCase().includes(search.toLowerCase())
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<FuelLog | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<CreateFuelData>(emptyForm);

  /* ── Data fetching ──────────────────────────────────────────────── */

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [logsRes, vehiclesRes] = await Promise.all([
        getFuelLogs(),
        getVehicles(),
      ]);
      setLogs(logsRes.data);
      setVehicles(vehiclesRes.data);
    } catch (err) {
      console.error('Failed to fetch fuel data:', err);
      setError('Failed to load fuel logs. Please try again.');
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
        await updateFuelLog(editingLog.id, form);
      } else {
        await createFuelLog(form);
      }
      setModalOpen(false);
      setEditingLog(null);
      setForm(emptyForm);
      await fetchData();
    } catch (err: any) {
      console.error('Failed to save fuel log:', err);
      setError(err?.response?.data?.error || 'Failed to save fuel log.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (log: FuelLog) => {
    setEditingLog(log);
    setForm({
      vehicleId: log.vehicleId,
      fillDate: log.fillDate.split('T')[0],
      quantity: log.quantity,
      totalCost: log.totalCost,
      odometerReading: log.odometerReading,
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

  /* ── Table columns ──────────────────────────────────────────────── */

  const columns: Column<FuelLog>[] = [
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
      key: 'fillDate',
      header: 'Fill Date',
      render: (row) => (
        <span>{new Date(row.fillDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantity (L)',
      render: (row) => <span>{row.quantity.toLocaleString()} L</span>,
    },
    {
      key: 'totalCost',
      header: 'Total Cost (₹)',
      render: (row) => <span>₹{row.totalCost.toLocaleString()}</span>,
    },
    {
      key: 'odometerReading',
      header: 'Odometer (km)',
      render: (row) => <span>{row.odometerReading.toLocaleString()} km</span>,
    },
    {
      key: 'costPerLiter',
      header: 'Cost / Liter',
      sortable: false,
      render: (row) => (
        <span>
          {row.quantity > 0
            ? `₹${(row.totalCost / row.quantity).toFixed(2)}`
            : '—'}
        </span>
      ),
    },
  ];

  if (!isReadOnly) {
    columns.push({
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (row) => (
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
      ),
    });
  }

  /* ── Loading state ──────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <p className="text-text-muted text-sm font-medium">Loading fuel logs…</p>
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
          <div className="p-2 rounded-xl bg-accent/10">
            <Fuel className="text-accent" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">Fuel Logs</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                {logs.length} total
              </span>
            </div>
            <p className="text-xs text-text-muted font-medium mt-0.5">Track vehicle fuel consumption and costs</p>
          </div>
        </div>

        {!isReadOnly && (
          <button
            onClick={openCreate}
            className="px-5 py-2 rounded-lg bg-accent text-[#F5F5F6] font-medium text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} className="stroke-[2.5]" />
            Log Fuel
          </button>
        )}
      </div>

      {/* ── Search & Filters ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by vehicle registration..."
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
      <DataTable<FuelLog>
        columns={columns}
        data={filteredLogs}
        emptyMessage="No fuel logs found"
      />

      {/* ── Create / Edit Modal ───────────────────────────────────────────── */}
      <Modal isOpen={modalOpen} onClose={handleClose} title={editingLog ? 'Edit Fuel Log' : 'Log Fuel'} size="lg">
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
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registrationNo} — {v.nameModel}
                </option>
              ))}
            </select>
          </div>

          {/* Fill Date */}
          <div>
            <label className="block text-sm font-semibold tracking-wide text-text-muted mb-1.5">Fill Date</label>
            <input
              type="date"
              value={form.fillDate}
              onChange={(e) => setForm({ ...form, fillDate: e.target.value })}
              required
              className={inputClass}
            />
          </div>

          {/* Quantity + Total Cost row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold tracking-wide text-text-muted mb-1.5">Quantity (L)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.quantity || ''}
                onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
                required
                placeholder="0.00"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold tracking-wide text-text-muted mb-1.5">Total Cost (₹)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.totalCost || ''}
                onChange={(e) => setForm({ ...form, totalCost: parseFloat(e.target.value) || 0 })}
                required
                placeholder="0.00"
                className={inputClass}
              />
            </div>
          </div>

          {/* Odometer Reading */}
          <div>
            <label className="block text-sm font-semibold tracking-wide text-text-muted mb-1.5">Odometer Reading (km)</label>
            <input
              type="number"
              min={0}
              value={form.odometerReading || ''}
              onChange={(e) => setForm({ ...form, odometerReading: parseFloat(e.target.value) || 0 })}
              required
              placeholder="0"
              className={inputClass}
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
              {submitting ? 'Saving…' : editingLog ? 'Save Changes' : 'Log Fuel'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
