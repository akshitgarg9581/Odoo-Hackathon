import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Loader2, Users, Filter } from 'lucide-react';
import DataTable, { type Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import {
  type Driver,
  getDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
} from '../api/drivers';

const LICENSE_CATEGORIES = ['Class A CDL', 'Class B CDL', 'Class C CDL', 'LMV', 'HMV'] as const;
const DRIVER_STATUSES: Driver['status'][] = ['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED'];

const emptyForm = {
  name: '',
  licenseNumber: '',
  licenseCategory: 'LMV' as typeof LICENSE_CATEGORIES[number],
  licenseExpiryDate: '',
  contactNumber: '',
  status: 'AVAILABLE' as Driver['status'],
};

export default function DriversPage() {
  const { isReadOnly } = useAuth();

  /* ── data state ── */
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  /* ── modal state ── */
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  /* ── delete state ── */
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ── fetch ── */
  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getDrivers();
      setDrivers(data);
    } catch {
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  /* ── filtered data ── */
  const filtered = useMemo(() => {
    if (!search.trim()) return drivers;
    const q = search.toLowerCase();
    return drivers.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.licenseNumber.toLowerCase().includes(q),
    );
  }, [drivers, search]);

  /* ── helpers ── */
  const isExpired = (dateStr: string) => new Date(dateStr) < new Date();

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalError('');
    setModalOpen(true);
  };

  const openEdit = (driver: Driver) => {
    setEditing(driver);
    setForm({
      name: driver.name,
      licenseNumber: driver.licenseNumber,
      licenseCategory: driver.licenseCategory as typeof LICENSE_CATEGORIES[number],
      licenseExpiryDate: driver.licenseExpiryDate?.split('T')[0] ?? '',
      contactNumber: driver.contactNumber,
      status: driver.status,
    });
    setModalError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setModalError('');
  };

  /* ── save ── */
  const handleSave = async () => {
    if (!form.name.trim() || !form.licenseNumber.trim() || !form.licenseExpiryDate || !form.contactNumber.trim()) {
      setModalError('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    setModalError('');
    try {
      if (editing) {
        await updateDriver(editing.id, form);
      } else {
        await createDriver(form);
      }
      closeModal();
      await fetchDrivers();
    } catch (err: any) {
      setModalError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Something went wrong. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  /* ── delete ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDriver(deleteTarget.id);
      setDeleteTarget(null);
      await fetchDrivers();
    } catch {
      /* silently close */
    } finally {
      setDeleting(false);
    }
  };

  /* ── field helper ── */
  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const inputCls =
    'w-full px-4 py-2.5 rounded-lg bg-bg-surface border border-border-theme text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all text-sm';

  /* ── columns ── */
  const columns = useMemo<Column<Driver>[]>(() => {
    const cols: Column<Driver>[] = [
      { key: 'name', header: 'Name', sortable: true },
      { key: 'licenseNumber', header: 'License Number', sortable: true },
      { key: 'licenseCategory', header: 'License Category', sortable: true },
      {
        key: 'licenseExpiryDate',
        header: 'License Expiry',
        sortable: true,
        render: (d) => (
          <span className={isExpired(d.licenseExpiryDate) ? 'text-danger font-medium' : ''}>
            {formatDate(d.licenseExpiryDate)}
          </span>
        ),
      },
      { key: 'contactNumber', header: 'Contact', sortable: false },
      {
        key: 'safetyScore',
        header: 'Safety Score',
        sortable: true,
        render: (d) => {
          const score = d.safetyScore;
          const color =
            score >= 80
              ? 'bg-success'
              : score >= 60
                ? 'bg-warning'
                : 'bg-danger';
          const trackColor =
            score >= 80
              ? 'bg-success/20'
              : score >= 60
                ? 'bg-warning/20'
                : 'bg-danger/20';
          return (
            <div className="flex items-center gap-2.5">
              <div className={`w-20 h-2 rounded-full ${trackColor}`}>
                <div
                  className={`h-full rounded-full ${color} transition-all`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="text-xs font-medium text-text-muted">{score}</span>
            </div>
          );
        },
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (d) => <StatusBadge status={d.status} />,
      },
    ];

    if (!isReadOnly) {
      cols.push({
        key: 'actions',
        header: '',
        sortable: false,
        render: (d) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEdit(d);
              }}
              className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-bg-elevated transition-colors"
              title="Edit"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(d);
              }}
              className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-bg-elevated transition-colors"
              title="Delete"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ),
      });
    }

    return cols;
  }, [isReadOnly]);

  /* ── render ── */
  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/10">
            <Users className="text-accent" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">Drivers</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-accent">
                {drivers.length}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5 font-medium">Manage your driver fleet</p>
          </div>
        </div>

        {!isReadOnly && (
          <button
            onClick={openCreate}
            className="px-5 py-2 rounded-lg bg-accent text-[#F5F5F6] font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} className="stroke-[2.5]" />
            Add Driver
          </button>
        )}
      </div>

      {/* ── Search & Filters ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search drivers..."
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

      {/* Table / Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-accent" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="No drivers found"
        />
      )}

      {/* ── Create / Edit Modal ── */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Driver' : 'Add Driver'}
      >
        <div className="space-y-4">
          {modalError && (
            <div className="px-4 py-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm font-medium">
              {modalError}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-text-muted mb-1.5 tracking-wide">
              Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              className={inputCls}
            />
          </div>

          {/* License Number */}
          <div>
            <label className="block text-sm font-semibold text-text-muted mb-1.5 tracking-wide">
              License Number <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. DL-1234567890"
              value={form.licenseNumber}
              onChange={(e) => setField('licenseNumber', e.target.value)}
              className={inputCls}
            />
          </div>

          {/* License Category + Expiry row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-muted mb-1.5 tracking-wide">
                License Category <span className="text-danger">*</span>
              </label>
              <select
                value={form.licenseCategory}
                onChange={(e) => setField('licenseCategory', e.target.value as typeof LICENSE_CATEGORIES[number])}
                className={inputCls}
              >
                {LICENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-muted mb-1.5 tracking-wide">
                License Expiry <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                value={form.licenseExpiryDate}
                onChange={(e) => setField('licenseExpiryDate', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-sm font-semibold text-text-muted mb-1.5 tracking-wide">
              Contact Number <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. +1 555-0100"
              value={form.contactNumber}
              onChange={(e) => setField('contactNumber', e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Status (edit only) */}
          {editing && (
            <div>
              <label className="block text-sm font-semibold text-text-muted mb-1.5 tracking-wide">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setField('status', e.target.value as Driver['status'])}
                className={inputCls}
              >
                {DRIVER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={closeModal}
              disabled={saving}
              className="px-4 py-2.5 rounded-lg border border-surface-700 text-surface-300 font-medium text-sm hover:bg-surface-800 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2.5 rounded-lg bg-accent text-[#F5F5F6] font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {editing ? 'Save Changes' : 'Create Driver'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Driver"
        size="sm"
      >
        <div className="space-y-5">
          <p className="text-sm text-text-muted font-medium">
            Are you sure you want to delete{' '}
            <span className="text-text-primary font-semibold">{deleteTarget?.name}</span>? This action
            cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="px-4 py-2.5 rounded-lg border border-surface-700 text-surface-300 font-medium text-sm hover:bg-surface-800 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2.5 rounded-lg bg-danger/10 text-danger font-medium text-sm hover:bg-danger/20 transition-all flex items-center gap-2 disabled:opacity-50"
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
