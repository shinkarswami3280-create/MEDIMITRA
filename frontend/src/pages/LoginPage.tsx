import React, { useState } from 'react';
import {
  User,
  Hospital,
  Shield,
  ArrowRight,
  Zap,
  Lock,
  Phone,
  CheckCircle,
  AlertCircle,
  HeartHandshake,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../api/types';

interface LoginPageProps {
  onSuccess: (role: UserRole) => void;
  defaultRole?: UserRole;
  onCancel?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, defaultRole, onCancel }) => {
  const { demoLogin, login, register, loading } = useAuth();
  const [tab, setTab] = useState<'demo' | 'login' | 'register'>('demo');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleDemoClick = async (role: UserRole) => {
    setError(null);
    try {
      await demoLogin(role);
      onSuccess(role);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(phone, password);
      onSuccess('patient');
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register(name, phone, password);
      onSuccess('patient');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-center relative">
          {onCancel && (
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 text-emerald-100 hover:text-white text-xs bg-white/10 px-2.5 py-1 rounded-full cursor-pointer"
            >
              ✕ Close
            </button>
          )}
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <HeartHandshake className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Welcome to MediMitra</h2>
          <p className="text-xs text-emerald-100 mt-1">One request. The right connection.</p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setTab('demo')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              tab === 'demo'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            1-Click Demo Login
          </button>
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              tab === 'login'
                ? 'bg-white text-slate-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
              tab === 'register'
                ? 'bg-white text-slate-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-4 mb-0 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6">
          {tab === 'demo' ? (
            <div className="space-y-3">
              <div className="text-center mb-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Judges & Demo Access · No Typing Needed
                </span>
                <p className="text-xs text-slate-600 mt-2">
                  Click any role below to drop straight into a realistic seeded dashboard:
                </p>
              </div>

              {/* Patient Demo Button */}
              <button
                disabled={loading}
                onClick={() => handleDemoClick('patient')}
                className="w-full p-4 rounded-2xl border-2 border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center justify-between group cursor-pointer text-left shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                      Login as Patient
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Arjun Mehta · Has upcoming cardiology appointment & ambulance en-route
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Hospital Staff Demo Button */}
              <button
                disabled={loading}
                onClick={() => handleDemoClick('hospital_staff')}
                className="w-full p-4 rounded-2xl border-2 border-sky-200 hover:border-sky-500 hover:bg-sky-50/50 transition-all flex items-center justify-between group cursor-pointer text-left shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                    <Hospital className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm group-hover:text-sky-700 transition-colors">
                      Login as Hospital Staff
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Dr. Priya Verma · Emergency Command Center & Live Appointment Queue
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-sky-600 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Admin Demo Button */}
              <button
                disabled={loading}
                onClick={() => handleDemoClick('admin')}
                className="w-full p-4 rounded-2xl border-2 border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all flex items-center justify-between group cursor-pointer text-left shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">
                      Login as Administrator
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Admin Sharma · System-wide Live Stats, Scheme Management, Audit Logs
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ) : tab === 'login' ? (
            <form onSubmit={handleManualLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9000000003"
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kulkarni"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
              >
                {loading ? 'Registering...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
