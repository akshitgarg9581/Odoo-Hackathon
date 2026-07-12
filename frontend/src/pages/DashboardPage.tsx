import { useState, useEffect } from 'react';
import {
  Truck,
  Route,
  Wrench,
  Activity,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { getKPIs, getReports, exportCSV, type KPIs, type VehicleReport } from '../api/dashboard';
import KPICard from '../components/KPICard';
import DataTable, { type Column } from '../components/DataTable';

/* ── Custom Recharts Tooltip ────────────────────────────────────────── */

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs">
      <p className="text-surface-300 font-medium">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="font-semibold">
          {entry.name}:{' '}
          {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
};

/* ── Pie‑chart label renderer ───────────────────────────────────────── */

const RADIAN = Math.PI / 180;

const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

/* ── Constants ──────────────────────────────────────────────────────── */

const PIE_COLORS = ['#34d399', '#60a5fa', '#fbbf24']; // emerald-400, blue-400, amber-400

const reportColumns: Column<VehicleReport>[] = [
  {
    key: 'registrationNo',
    header: 'Registration No',
    render: (row) => <span className="font-mono text-surface-100">{row.registrationNo}</span>,
  },
  {
    key: 'nameModel',
    header: 'Model',
  },
  {
    key: 'fuelEfficiency',
    header: 'Fuel Efficiency (km/L)',
    render: (row) =>
      row.fuelEfficiency !== null ? (
        <span>{row.fuelEfficiency.toFixed(1)}</span>
      ) : (
        <span className="text-surface-500 italic">N/A</span>
      ),
  },
  {
    key: 'operationalCost',
    header: 'Operational Cost (₹)',
    render: (row) => <span>₹{row.operationalCost.toLocaleString()}</span>,
  },
  {
    key: 'roi',
    header: 'ROI',
    render: (row) =>
      row.roi !== null ? (
        <span>{row.roi.toFixed(1)}%</span>
      ) : (
        <span className="text-surface-500 italic">N/A</span>
      ),
  },
];

/* ── Greeting helper ────────────────────────────────────────────────── */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ── Page Component ─────────────────────────────────────────────────── */

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [reports, setReports] = useState<VehicleReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  /* ── Data fetching ─────────────────────────────────────────────── */

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [kpiRes, reportRes] = await Promise.all([getKPIs(), getReports()]);
        setKpis(kpiRes.data);
        setReports(reportRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ── CSV Export ────────────────────────────────────────────────── */

  const handleExport = async () => {
    try {
      setExporting(true);
      const { data } = await exportCSV();
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fleet_reports.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  /* ── Derived chart data ────────────────────────────────────────── */

  const pieData = kpis
    ? [
        { name: 'Available', value: kpis.vehicles.available },
        { name: 'On Trip', value: kpis.vehicles.onTrip },
        { name: 'In Shop', value: kpis.vehicles.inShop },
      ]
    : [];

  const barData = [...reports]
    .sort((a, b) => b.operationalCost - a.operationalCost)
    .slice(0, 5)
    .map((r) => ({
      name: r.registrationNo,
      cost: r.operationalCost,
    }));

  /* ── Loading state ─────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary-400" />
          <p className="text-surface-400 text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  /* ── Error state ───────────────────────────────────────────────── */

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="glass flex flex-col items-center gap-4 rounded-2xl p-8 text-center">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-surface-200 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded-lg bg-primary-500/20 px-5 py-2 text-sm font-semibold text-primary-300 transition hover:bg-primary-500/30"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ── Main render ───────────────────────────────────────────────── */

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-50 lg:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-surface-400">{getGreeting()}! Here's your fleet overview.</p>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-500/20 px-5 py-2.5 text-sm font-semibold text-primary-300 transition hover:bg-primary-500/30 disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export CSV
        </button>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      {kpis && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KPICard
            label="Active Fleet"
            value={kpis.vehicles.totalActiveFleet}
            icon={<Truck size={24} />}
          />
          <KPICard
            label="Available Vehicles"
            value={kpis.vehicles.available}
            icon={<Truck size={24} />}
          />
          <KPICard
            label="In Maintenance"
            value={kpis.vehicles.inShop}
            icon={<Wrench size={24} />}
          />
          <KPICard
            label="Active Trips"
            value={kpis.trips.active}
            icon={<Route size={24} />}
          />
          <KPICard
            label="Pending Trips"
            value={kpis.trips.pending}
            icon={<Route size={24} />}
          />
          <KPICard
            label="Fleet Utilization"
            value={`${kpis.fleetUtilization}%`}
            icon={<Activity size={24} />}
          />
        </div>
      )}

      {/* ── Charts Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Vehicle Status Pie Chart */}
        <div className="glass rounded-2xl p-6">
          <h2 className="mb-4 text-lg font-semibold text-surface-100">Vehicle Status</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomLabel}
                  stroke="none"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="mt-2 flex items-center justify-center gap-6">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs text-surface-300">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[index] }}
                />
                {entry.name}
              </div>
            ))}
          </div>
        </div>

        {/* Operational Cost Bar Chart */}
        <div className="glass rounded-2xl p-6">
          <h2 className="mb-4 text-lg font-semibold text-surface-100">
            Top 5 Vehicles by Operational Cost
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barCategoryGap="20%">
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar
                  dataKey="cost"
                  name="Op. Cost"
                  fill="#60a5fa"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Reports Table ────────────────────────────────────────── */}
      <div className="glass rounded-2xl p-6">
        <h2 className="mb-4 text-lg font-semibold text-surface-100">Vehicle Reports</h2>
        <DataTable<VehicleReport> columns={reportColumns} data={reports} />
      </div>
    </div>
  );
}
