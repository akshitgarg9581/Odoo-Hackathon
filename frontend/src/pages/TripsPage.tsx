import { useState, useEffect } from 'react';
import { getTrips, createTrip, dispatchTrip, completeTrip, cancelTrip, deleteTrip, type Trip } from '../api/trips';
import { getVehicles, type Vehicle } from '../api/vehicles';
import { getDrivers, type Driver } from '../api/drivers';
import DataTable, { type Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Play, Check, XCircle, Trash2, Loader2, Route as RouteIcon, AlertCircle } from 'lucide-react';

const TABS = ['ALL', 'DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'];

export default function TripsPage() {
  const { isReadOnly } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'dispatch' | 'cancel' | 'delete', id: string } | null>(null);
  
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Forms state
  const [createForm, setCreateForm] = useState({
    vehicleId: '',
    driverId: '',
    source: '',
    destination: '',
    cargoWeight: '',
    plannedDistance: ''
  });

  const [completeForm, setCompleteForm] = useState({
    id: '',
    actualDistance: '',
    fuelConsumed: '',
    revenue: ''
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        getTrips(activeTab === 'ALL' ? undefined : activeTab),
        getVehicles(),
        getDrivers()
      ]);
      setTrips(tripsRes.data);
      setVehicles(vehiclesRes.data);
      setDrivers(driversRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const filteredTrips = trips.filter(trip => 
    trip.source.toLowerCase().includes(search.toLowerCase()) || 
    trip.destination.toLowerCase().includes(search.toLowerCase()) ||
    trip.vehicle?.registrationNo.toLowerCase().includes(search.toLowerCase()) ||
    trip.driver?.name.toLowerCase().includes(search.toLowerCase())
  );

  const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE');
  const availableDrivers = drivers.filter(d => d.status === 'AVAILABLE');

  const selectedVehicle = availableVehicles.find(v => v.id === createForm.vehicleId);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionLoading(true);
    try {
      await createTrip({
        vehicleId: createForm.vehicleId,
        driverId: createForm.driverId,
        source: createForm.source,
        destination: createForm.destination,
        cargoWeight: Number(createForm.cargoWeight),
        plannedDistance: Number(createForm.plannedDistance)
      });
      setIsCreateModalOpen(false);
      setCreateForm({ vehicleId: '', driverId: '', source: '', destination: '', cargoWeight: '', plannedDistance: '' });
      fetchData();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to create trip');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionLoading(true);
    try {
      await completeTrip(completeForm.id, {
        actualDistance: Number(completeForm.actualDistance),
        fuelConsumed: Number(completeForm.fuelConsumed),
        revenue: completeForm.revenue ? Number(completeForm.revenue) : undefined
      });
      setIsCompleteModalOpen(false);
      setCompleteForm({ id: '', actualDistance: '', fuelConsumed: '', revenue: '' });
      fetchData();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to complete trip');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setActionError(null);
    setActionLoading(true);
    try {
      if (confirmAction.type === 'dispatch') await dispatchTrip(confirmAction.id);
      if (confirmAction.type === 'cancel') await cancelTrip(confirmAction.id);
      if (confirmAction.type === 'delete') await deleteTrip(confirmAction.id);
      setIsConfirmModalOpen(false);
      setConfirmAction(null);
      fetchData();
    } catch (err: any) {
      setActionError(err.response?.data?.error || `Failed to ${confirmAction.type} trip`);
    } finally {
      setActionLoading(false);
    }
  };

  const openConfirm = (type: 'dispatch' | 'cancel' | 'delete', id: string) => {
    setConfirmAction({ type, id });
    setActionError(null);
    setIsConfirmModalOpen(true);
  };

  const columns: Column<Trip>[] = [
    {
      key: 'route',
      header: 'Route',
      render: (t) => <span className="font-medium">{t.source} &rarr; {t.destination}</span>,
      sortable: false
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (t) => t.vehicle?.registrationNo || 'N/A',
      sortable: false
    },
    {
      key: 'driver',
      header: 'Driver',
      render: (t) => t.driver?.name || 'N/A',
      sortable: false
    },
    {
      key: 'cargoWeight',
      header: 'Cargo (kg)',
    },
    {
      key: 'distance',
      header: 'Distance',
      render: (t) => `${t.actualDistance || t.plannedDistance} km`
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => <StatusBadge status={t.status} />
    }
  ];

  if (!isReadOnly) {
    columns.push({
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (t) => (
        <div className="flex gap-2 items-center">
          {t.status === 'DRAFT' && (
            <>
              <button onClick={() => openConfirm('dispatch', t.id)} className="px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-all flex items-center gap-1" title="Dispatch"><Play size={14}/> Dispatch</button>
              <button onClick={() => openConfirm('delete', t.id)} className="px-3 py-1.5 rounded-md bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all" title="Delete"><Trash2 size={14}/></button>
            </>
          )}
          {t.status === 'DISPATCHED' && (
            <>
              <button onClick={() => { setCompleteForm(prev => ({ ...prev, id: t.id })); setActionError(null); setIsCompleteModalOpen(true); }} className="px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-all flex items-center gap-1" title="Complete"><Check size={14}/> Complete</button>
              <button onClick={() => openConfirm('cancel', t.id)} className="px-3 py-1.5 rounded-md bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all flex items-center gap-1" title="Cancel"><XCircle size={14}/> Cancel</button>
            </>
          )}
        </div>
      )
    });
  }

  const inputClass = "w-full px-4 py-2.5 rounded-lg bg-surface-900/80 border border-surface-700 text-white placeholder-surface-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all text-sm";
  const primaryBtn = "px-4 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 text-white font-medium text-sm hover:from-brand-500 hover:to-brand-400 transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 disabled:opacity-50";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-500/10 rounded-lg text-brand-500">
            <RouteIcon size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Trips</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-800 text-surface-300 text-xs font-medium">
                {trips.length} total
              </span>
            </div>
            <p className="text-sm text-surface-400">Manage route planning and dispatching</p>
          </div>
        </div>
        {!isReadOnly && (
          <button onClick={() => { setIsCreateModalOpen(true); setActionError(null); }} className={primaryBtn}>
            <Plus size={18} />
            Create Trip
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface-900/50 p-2 rounded-xl border border-surface-800">
        <div className="flex overflow-x-auto gap-1 w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-brand-500 text-white shadow-md' 
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
          <input
            type="text"
            placeholder="Search trips..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} pl-10`}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-brand-500" />
        </div>
      ) : error ? (
        <div className="glass rounded-xl p-8 text-center border-red-500/20">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4 opacity-80" />
          <h3 className="text-lg font-medium text-white mb-2">Failed to load trips</h3>
          <p className="text-surface-400 mb-4">{error}</p>
          <button onClick={fetchData} className={primaryBtn}>Retry</button>
        </div>
      ) : (
        <DataTable columns={columns} data={filteredTrips} emptyMessage="No trips found matching your criteria." />
      )}

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Trip" size="lg">
        {actionError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Vehicle</label>
              <select required value={createForm.vehicleId} onChange={e => setCreateForm({...createForm, vehicleId: e.target.value})} className={inputClass}>
                <option value="">Select Available Vehicle</option>
                {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.registrationNo} ({v.nameModel})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Driver</label>
              <select required value={createForm.driverId} onChange={e => setCreateForm({...createForm, driverId: e.target.value})} className={inputClass}>
                <option value="">Select Available Driver</option>
                {availableDrivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.licenseCategory})</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Source</label>
              <input type="text" required value={createForm.source} onChange={e => setCreateForm({...createForm, source: e.target.value})} className={inputClass} placeholder="Origin location" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Destination</label>
              <input type="text" required value={createForm.destination} onChange={e => setCreateForm({...createForm, destination: e.target.value})} className={inputClass} placeholder="Destination location" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Cargo Weight (kg)</label>
              <input type="number" required min="0" step="0.1" value={createForm.cargoWeight} onChange={e => setCreateForm({...createForm, cargoWeight: e.target.value})} className={inputClass} />
              {selectedVehicle && (
                <p className="text-xs mt-1 text-surface-400">Max capacity: <span className="font-medium text-white">{selectedVehicle.maxLoadCapacity} kg</span></p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Planned Distance (km)</label>
              <input type="number" required min="0" step="0.1" value={createForm.plannedDistance} onChange={e => setCreateForm({...createForm, plannedDistance: e.target.value})} className={inputClass} />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2.5 rounded-lg border border-surface-700 text-surface-300 font-medium text-sm hover:bg-surface-800 transition-all">Cancel</button>
            <button type="submit" disabled={actionLoading} className={primaryBtn}>
              {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Create Trip'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Complete Modal */}
      <Modal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} title="Complete Trip">
        {actionError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
        <form onSubmit={handleCompleteSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Actual Distance (km)</label>
            <input type="number" required min="0" step="0.1" value={completeForm.actualDistance} onChange={e => setCompleteForm({...completeForm, actualDistance: e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Fuel Consumed (L)</label>
            <input type="number" required min="0" step="0.1" value={completeForm.fuelConsumed} onChange={e => setCompleteForm({...completeForm, fuelConsumed: e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Revenue Generated (₹) <span className="text-surface-500 font-normal">(Optional)</span></label>
            <input type="number" min="0" step="0.01" value={completeForm.revenue} onChange={e => setCompleteForm({...completeForm, revenue: e.target.value})} className={inputClass} />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsCompleteModalOpen(false)} className="px-4 py-2.5 rounded-lg border border-surface-700 text-surface-300 font-medium text-sm hover:bg-surface-800 transition-all">Cancel</button>
            <button type="submit" disabled={actionLoading} className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-medium text-sm hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg flex items-center gap-2">
              {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Mark as Completed'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Action Modal */}
      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirm Action">
        {actionError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
        <p className="text-surface-300">Are you sure you want to {confirmAction?.type} this trip?</p>
        <div className="pt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setIsConfirmModalOpen(false)} className="px-4 py-2.5 rounded-lg border border-surface-700 text-surface-300 font-medium text-sm hover:bg-surface-800 transition-all">No, Cancel</button>
          <button onClick={handleConfirmAction} disabled={actionLoading} className={`px-4 py-2.5 rounded-lg text-white font-medium text-sm transition-all shadow-lg flex items-center gap-2 ${
            confirmAction?.type === 'dispatch' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-red-600 hover:bg-red-500'
          }`}>
            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : `Yes, ${confirmAction?.type}`}
          </button>
        </div>
      </Modal>
    </div>
  );
}
