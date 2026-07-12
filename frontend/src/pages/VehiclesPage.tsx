import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Loader2, Truck } from 'lucide-react';
import DataTable, { type Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  type Vehicle,
} from '../api/vehicles';

/* ── Constants ──────────────────────────────────────────────────────── */

const VEHICLE_TYPES = ['Truck', 'Van', 'Bus', 'Trailer'] as const;
const VEHICLE_STATUSES = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'] as const;

const INPUT_CLASS =
  'w-full px-4 py-2.5 rounded-lg bg-surface-900/80 border border-surface-700 text-white placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all text-sm';

const INITIAL_FORM = {
  registrationNo: '',
  nameModel: '',
  type: 'Truck',
  maxLoadCapacity: '',
  odometer: '',
  acquisitionCost: '',
  status: 'AVAILABLE' as Vehicle['status'],
};

/* ── Page Component ─────────────────────────────────────────────────── */

export default function VehiclesPage() {
  const { isReadOnly } = useAuth();

  /* ── State ──────────────────────────────────────────────────────── */

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /* ── Data fetching ─────────────────────────────────────────────── */

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getVehicles();
      setVehicles(data);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  /* ── Search filtering ──────────────────────────────────────────── */

  const filtered = useMemo(() => {
    if (!search.trim()) return vehicles;
    const q = search.toLowerCase();
    return vehicles.filter(
      (v) =>
        v.registrationNo.toLowerCase().includes(q) ||
        v.nameModel.toLowerCase().includes(q),
    );
  }, [vehicles, search]);

  /* ── Modal helpers ─────────────────────────────────────────────── */

  const openCreate = () => {
    setEditingVehicle(null);
    setForm(INITIAL_FORM);
    setModalError(null);
    setModalOpen(true);
  };

  const openEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setForm({
      registrationNo: vehicle.registrationNo,
      nameModel: vehicle.nameModel,
      type: vehicle.type,
      maxLoadCapacity: String(vehicle.maxLoadCapacity),
      odometer: String(vehicle.odometer),
      acquisitionCost: String(vehicle.acquisitionCost),
      status: vehicle.status,
    });
    setModalError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingVehicle(null);
    setModalError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /* ── Submit (create / update) ──────────────────────────────────── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    const payload: Partial<Vehicle> = {
      registrationNo: form.registrationNo.trim(),
      nameModel: form.nameModel.trim(),
      type: form.type,
      maxLoadCapacity: Number(form.maxLoadCapacity),
      odometer: Number(form.odometer),
      acquisitionCost: Number(form.acquisitionCost),
    };

    if (editingVehicle) {
      payload.status = form.status;
    }

    try {
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, payload);
      } else {
        await createVehicle(payload);
      }
      closeModal();
      await fetchVehicles();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Something went wrong. Please try again.';
      setModalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Delete ────────────────────────────────────────────────────── */

  const openDelete = (vehicle: Vehicle) => {
    setDeleteTarget(vehicle);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteVehicle(deleteTarget.id);
      setDeleteTarget(null);
      await fetchVehicles();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to delete vehicle.';
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  /* ── Table columns ─────────────────────────────────────────────── */

  const columns: Column<Vehicle>[] = useMemo(() => {
    const cols: Column<Vehicle>[] = [
      {
        key: 'registrationNo',
        header: 'Registration No',
        render: (v) => <span className="font-mono text-surface-100">{v.registrationNo}</span>,
      },
      {
        key: 'nameModel',
        header: 'Model',
      },
      {
        key: 'type',
        header: 'Type',
        render: (v) => (
          <span className="inline-flex items-center gap-1.5 text-surface-300">
            <Truck size={14} className="text-surface-500" />
            {v.type}
          </span>
        ),
      },
      {
        key: 'maxLoadCapacity',
        header: 'Max Load (kg)',
        render: (v) => <span>{v.maxLoadCapacity.toLocaleString()}</span>,
      },
      {
        key: 'odometer',
        header: 'Odometer (km)',
        render: (v) => <span>{v.odometer.toLocaleString()}</span>,
      },
      {
        key: 'acquisitionCost',
        header: 'Acquisition Cost (₹)',
        render: (v) => <span>₹{v.acquisitionCost.toLocaleString()}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (v) => <StatusBadge status={v.status} />,
      },
    ];

    if (!isReadOnly) {
      cols.push({
        key: 'actions',
        header: 'Actions',
        sortable: false,
        render: (v) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEdit(v);
              }}
              className="p-1.5 rounded-lg text-surface-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
              title="Edit"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openDelete(v);
              }}
              className="p-1.5 rounded-lg text-surface-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      });
    }

    return cols;
  }, [isReadOnly]);

  /* ── Loading state ─────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-brand-400" />
          <p className="text-surface-400 text-sm">Loading vehicles…</p>
        </div>
      </div>
    );
  }

  /* ── Main render ───────────────────────────────────────────────── */

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-surface-50 lg:text-3xl">Vehicles</h1>
          <span className="inline-flex items-center justify-center rounded-full bg-brand-500/15 px-2.5 py-0.5 text-xs font-semibold text-brand-400">
            {vehicles.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
            <input
              type="text"
              placeholder="Search by registration or model…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9 pr-4 py-2.5 rounded-lg bg-surface-900/80 border border-surface-700 text-white placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all text-sm"
            />
          </div>

          {/* Add button */}
          {!isReadOnly && (
            <button onClick={openCreate} className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 text-white font-medium text-sm hover:from-brand-500 hover:to-brand-400 transition-all shadow-lg shadow-brand-500/25 inline-flex items-center gap-2">
              <Plus size={16} />
              Add Vehicle
            </button>
          )}
        </div>
      </div>

      {/* ── Data Table ─────────────────────────────────────────────── */}
      <DataTable<Vehicle>
        columns={columns}
        data={filtered}
        emptyMessage="No vehicles found."
      />

      {/* ── Create / Edit Modal ────────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {modalError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Registration No */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-surface-400 uppercase tracking-wider">
                Registration No
              </label>
              <input
                type="text"
                name="registrationNo"
                value={form.registrationNo}
                onChange={handleChange}
                placeholder="e.g. MH-12-AB-1234"
                required
                className={INPUT_CLASS}
              />
            </div>

            {/* Model */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-surface-400 uppercase tracking-wider">
                Model
              </label>
              <input
                type="text"
                name="nameModel"
                value={form.nameModel}
                onChange={handleChange}
                placeholder="e.g. Tata Ace Gold"
                required
                className={INPUT_CLASS}
              />
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-surface-400 uppercase tracking-wider">
                Type
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className={INPUT_CLASS}
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Load Capacity */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-surface-400 uppercase tracking-wider">
                Max Load Capacity (kg)
              </label>
              <input
                type="number"
                name="maxLoadCapacity"
                value={form.maxLoadCapacity}
                onChange={handleChange}
                placeholder="e.g. 5000"
                required
                min={0}
                className={INPUT_CLASS}
              />
            </div>

            {/* Odometer */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-surface-400 uppercase tracking-wider">
                Odometer (km)
              </label>
              <input
                type="number"
                name="odometer"
                value={form.odometer}
                onChange={handleChange}
                placeholder="e.g. 12000"
                required
                min={0}
                className={INPUT_CLASS}
              />
            </div>

            {/* Acquisition Cost */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-surface-400 uppercase tracking-wider">
                Acquisition Cost (₹)
              </label>
              <input
                type="number"
                name="acquisitionCost"
                value={form.acquisitionCost}
                onChange={handleChange}
                placeholder="e.g. 750000"
                required
                min={0}
                className={INPUT_CLASS}
              />
            </div>

            {/* Status (edit only) */}
            {editingVehicle && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Status
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className={INPUT_CLASS}
                >
                  {VEHICLE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Form actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={submitting}
              className="px-4 py-2.5 rounded-lg border border-surface-700 text-surface-300 font-medium text-sm hover:bg-surface-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 text-white font-medium text-sm hover:from-brand-500 hover:to-brand-400 transition-all shadow-lg shadow-brand-500/25 inline-flex items-center gap-2 disabled:opacity-50"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {editingVehicle ? 'Update Vehicle' : 'Create Vehicle'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirmation Modal ──────────────────────────────── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Vehicle"
        size="sm"
      >
        <div className="space-y-4">
          {deleteError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {deleteError}
            </div>
          )}

          <p className="text-sm text-surface-300">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-white">{deleteTarget?.registrationNo}</span>
            {deleteTarget?.nameModel && (
              <> ({deleteTarget.nameModel})</>
            )}
            ? This action cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="px-4 py-2.5 rounded-lg border border-surface-700 text-surface-300 font-medium text-sm hover:bg-surface-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 font-medium text-sm hover:bg-red-500/20 transition-all inline-flex items-center gap-2 disabled:opacity-50"
            >
              {deleting && <Loader2 size={16} className="animate-spin" />}
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
