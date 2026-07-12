import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Truck, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

const ROLES = [
  { value: 'FLEET_MANAGER', label: 'Fleet Manager' },
  { value: 'DRIVER', label: 'Driver' },
  { value: 'SAFETY_OFFICER', label: 'Safety Officer' },
  { value: 'FINANCIAL_ANALYST', label: 'Financial Analyst' },
];

export default function LoginPage() {
  const { isAuthenticated, login, signup } = useAuth();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'FLEET_MANAGER',
  });

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        await signup(form.name, form.email, form.password, form.role);
      } else {
        await login(form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const inputClass = 'w-full px-4 py-3 rounded-lg bg-bg-surface border border-border-theme text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all text-sm';

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-bg-base">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Login card */}
      <div className="relative w-full max-w-md mx-4 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-4">
            <Truck size={28} className="text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">TransitOps</h1>
          <p className="text-text-muted text-sm mt-1 font-medium">Smart Transport Operations Platform</p>
        </div>

        {/* Card */}
        <div className="card rounded-2xl p-8">
          {/* Tab toggle */}
          <div className="flex gap-1 p-1 rounded-lg bg-bg-surface border border-border-theme mb-6">
            <button
              onClick={() => { setIsSignup(false); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold tracking-wide rounded-md transition-all ${
                !isSignup ? 'bg-bg-elevated text-text-primary shadow-md border border-border-theme' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignup(true); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold tracking-wide rounded-md transition-all ${
                isSignup ? 'bg-bg-elevated text-text-primary shadow-md border border-border-theme' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm font-medium animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-sm font-semibold tracking-wide text-text-muted mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="John Doe"
                  className={inputClass}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold tracking-wide text-text-muted mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="you@company.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold tracking-wide text-text-muted mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="Min 8 characters"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {isSignup && (
              <div>
                <label className="block text-sm font-semibold tracking-wide text-text-muted mb-1.5">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => updateField('role', e.target.value)}
                  className={inputClass}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-accent text-[#F5F5F6] font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {isSignup ? 'Create Account' : 'Sign In'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
