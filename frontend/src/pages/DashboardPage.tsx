import { useState, useEffect } from 'react';
import {
  Truck,
  Route,
  Wrench,
  Activity,
  Download,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
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
    <div className="card px-4 py-3 text-sm">
      <p className="text-text-muted font-medium mb-1">{label}</p>
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

const PIE_COLORS = ['var(--accent)', 'var(--warning)', 'var(--danger)'];

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
        <span>{(row.roi * 100).toFixed(2)}%</span>
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Dashboard</h1>
          <p className="mt-1 text-xs text-text-muted font-medium">{getGreeting()}! Here's your fleet overview.</p>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-xl bg-accent/10 px-5 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent/20 disabled:opacity-50"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Fleet Utilization"
            value={`${kpis.fleetUtilization}%`}
            icon={<Activity size={18} />}
            isHero={true}
            accentColor="blue"
            subtitle="Overall efficiency"
            subtitleIcon={<CheckCircle2 size={14} />}
          />
          <KPICard
            label="Active Trips"
            value={kpis.trips.active}
            icon={<Route size={18} />}
            isHero={true}
            accentColor="blue"
            subtitle="Currently en route"
            subtitleIcon={<Activity size={14} />}
          />
          <KPICard
            label="Available Vehicles"
            value={kpis.vehicles.available}
            icon={<Truck size={18} />}
            accentColor="green"
            subtitle="Ready to go"
            subtitleIcon={<CheckCircle2 size={14} />}
          />
          <KPICard
            label="In Maintenance"
            value={kpis.vehicles.inShop}
            icon={<Wrench size={18} />}
            accentColor="amber"
            subtitle="Requires action"
            subtitleIcon={<AlertTriangle size={14} />}
          />
          <KPICard
            label="Pending Trips"
            value={kpis.trips.pending}
            icon={<Route size={18} />}
            accentColor="amber"
            subtitle="Awaiting dispatch"
            subtitleIcon={<Clock size={14} />}
          />
          <KPICard
            label="Total Active Fleet"
            value={kpis.vehicles.totalActiveFleet}
            icon={<Truck size={18} />}
            accentColor="none"
            subtitle="All time"
            subtitleIcon={<Activity size={14} />}
          />
        </div>
      )}

      {/* ── Charts Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Vehicle Status Pie Chart */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-text-primary tracking-wide">Vehicle Status</h2>
          <div className="h-64">
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
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-text-primary tracking-wide">
            Top 5 Vehicles by Operational Cost
          </h2>
          <div className="h-64">
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
                  fill="var(--accent)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Reports Table ────────────────────────────────────────── */}
      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-text-primary tracking-wide">Vehicle Reports</h2>
        <DataTable<VehicleReport> columns={reportColumns} data={reports} />
      </div>
    </div>
  );
}
