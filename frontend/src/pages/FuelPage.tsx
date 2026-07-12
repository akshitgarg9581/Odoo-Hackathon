import { useState, useEffect } from 'react';
import { Plus, Loader2, Fuel, AlertCircle } from 'lucide-react';
import { getFuelLogs, createFuelLog, type FuelLog, type CreateFuelData } from '../api/fuel';
import { getVehicles, type Vehicle } from '../api/vehicles';
import DataTable, { type Column } from '../components/DataTable';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const inputClass =
  'w-full px-4 py-2.5 rounded-lg bg-surface-900/80 border border-surface-700 text-white placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all text-sm';

export default function FuelPage() {
  const { isReadOnly } = useAuth();

  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<CreateFuelData>({
    vehicleId: '',
    fillDate: '',
    quantity: 0,
    totalCost: 0,
    odometerReading: 0,
  });

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

  /* ── Create handler ─────────────────────────────────────────────── */

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createFuelLog(form);
      setModalOpen(false);
      setForm({ vehicleId: '', fillDate: '', quantity: 0, totalCost: 0, odometerReading: 0 });
      await fetchData();
    } catch (err) {
      console.error('Failed to create fuel log:', err);
      setError('Failed to create fuel log.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Table columns ──────────────────────────────────────────────── */

  const columns: Column<FuelLog>[] = [
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

  /* ── Loading state ──────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-brand-400" />
          <p className="text-surface-400 text-sm">Loading fuel logs…</p>
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
            <Fuel className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-50 lg:text-3xl">Fuel Logs</h1>
            <p className="text-sm text-surface-400">Track vehicle fuel consumption and costs</p>
          </div>
        </div>

        {!isReadOnly && (
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 text-white font-medium text-sm hover:from-brand-500 hover:to-brand-400 transition-all shadow-lg shadow-brand-500/25 inline-flex items-center gap-2"
          >
            <Plus size={18} />
            Log Fuel
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
      <DataTable<FuelLog>
        columns={columns}
        data={logs}
        emptyMessage="No fuel logs found"
      />

      {/* ── Create Modal ───────────────────────────────────────────── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Log Fuel" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          {/* Vehicle */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Vehicle</label>
            <select
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              required
              className={inputClass}
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
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Fill Date</label>
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
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Quantity (L)</label>
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
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Total Cost (₹)</label>
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
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Odometer Reading (km)</label>
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
              onClick={() => setModalOpen(false)}
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
              {submitting ? 'Saving…' : 'Log Fuel'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
