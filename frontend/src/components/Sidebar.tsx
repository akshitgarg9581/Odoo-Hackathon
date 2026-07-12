import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Truck, Users, Route, Wrench, Fuel, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vehicles', icon: Truck, label: 'Vehicles' },
  { to: '/drivers', icon: Users, label: 'Drivers' },
  { to: '/trips', icon: Route, label: 'Trips' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
  { to: '/fuel', icon: Fuel, label: 'Fuel Logs' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-bg-surface border-r border-border-theme flex flex-col z-40 transition-colors duration-200">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border-theme">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shadow-sm">
            <Truck size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary tracking-tight">TransitOps</h1>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-medium">Fleet Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-bg-elevated text-accent border-l-2 border-accent'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated border-l-2 border-transparent'
              }`
            }
          >
            <item.icon size={18} className="stroke-[1.5]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User & Theme section */}
      <div className="px-4 py-4 border-t border-border-theme">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs text-text-muted font-medium">Theme</span>
          <button 
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-bg-elevated border border-border-theme flex items-center justify-center text-xs font-bold text-text-primary">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
              {user?.role?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
        >
          <LogOut size={16} className="stroke-[1.5]" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
