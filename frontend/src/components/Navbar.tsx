import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Truck, Users, Route, Wrench, Fuel, LogOut, Sun, Moon, Menu, X } from 'lucide-react';
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

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-bg-surface border-b border-border-theme transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Left: Logo & Nav Links */}
        <div className="flex items-center gap-4 sm:gap-8 h-full">
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 -ml-2 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-sm">
              <Truck size={16} className="text-[#F5F5F6]" />
            </div>
            <h1 className="text-lg font-bold text-text-primary tracking-tight">TransitOps</h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex h-full items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 h-10 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-bg-elevated text-text-primary'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated/50'
                  }`
                }
              >
                <item.icon size={15} className="stroke-[1.5]" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right: Theme & User */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="h-6 w-[1px] bg-border-theme mx-1"></div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-text-primary leading-tight">{user?.name}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                {user?.role?.replace(/_/g, ' ')}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-bg-elevated border border-border-theme flex items-center justify-center text-xs font-bold text-text-primary cursor-pointer">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut size={16} className="stroke-[2]" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border-theme bg-bg-surface px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-bg-elevated text-text-primary'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated/50'
                }`
              }
            >
              <item.icon size={18} className="stroke-[1.5]" />
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
