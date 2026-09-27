import React, { useState } from 'react';
import {
  Activity,
  Bot,
  User,
  LogOut,
  Hospital,
  Shield,
  HeartHandshake,
  Menu,
  X,
  PhoneCall,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from './NotificationBell';
import { SimulatorModal } from './SimulatorModal';

interface NavbarProps {
  currentTab?: string;
  onTabChange?: (tab: string) => void;
  onOpenLoginModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenLoginModal,
}) => {
  const { token, role, userName, logout, demoLogin } = useAuth();
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-emerald-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onTabChange?.('landing')}
                className="flex items-center gap-3 text-left cursor-pointer group"
              >
                <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-all">
                  <HeartHandshake className="w-6 h-6 stroke-[2.5]" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping opacity-75" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xl tracking-tight text-slate-900 font-heading">
                      Medi<span className="text-emerald-600">Mitra</span>
                    </span>
                    <span className="text-[10px] tracking-wider uppercase bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE HEALTH GRID
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block font-medium">
                    Unified Healthcare & Emergency Network
                  </span>
                </div>
              </button>
            </div>

            {/* Quick role switch buttons */}
            {token && (
              <div className="hidden lg:flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 text-xs">
                <span className="text-slate-500 text-[11px] px-2 font-medium">Portal:</span>
                <button
                  onClick={() => {
                    demoLogin('patient');
                    onTabChange?.('dashboard');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    role === 'patient'
                      ? 'bg-white text-emerald-700 shadow-xs border border-emerald-100 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  Patient
                </button>
                <button
                  onClick={() => {
                    demoLogin('hospital_staff');
                    onTabChange?.('hospital');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    role === 'hospital_staff'
                      ? 'bg-white text-sky-700 shadow-xs border border-sky-100 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  Hospital Staff
                </button>
                <button
                  onClick={() => {
                    demoLogin('admin');
                    onTabChange?.('admin');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    role === 'admin'
                      ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  Admin
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Emergency Hotline Banner */}
              <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3.5 py-1.5 rounded-xl shadow-2xs">
                <PhoneCall className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
                <span>108 / 102 Helpline</span>
              </div>

              {/* Multilingual */}
              <div className="hidden md:flex items-center text-[11px] text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl font-medium">
                EN · मराठी · हिंदी
              </div>

              {/* AI Simulator Launcher */}
              <button
                onClick={() => setSimulatorOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-800 text-xs font-bold px-3.5 py-2 rounded-xl border border-emerald-200 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                title="Launch Simulated WhatsApp & Voice Engine"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">WhatsApp / Voice AI</span>
              </button>

              {/* Notification Bell */}
              {token && <NotificationBell />}

              {/* Profile / Login */}
              {token ? (
                <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
                  <div className="hidden md:block text-right">
                    <div className="text-xs font-bold text-slate-800 leading-tight">
                      {userName || 'User'}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                      {role?.replace('_', ' ')}
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenLoginModal}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-4.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer hover:scale-105"
                >
                  Instant Demo Sign In
                </button>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
            {token && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-600 block">
                  Switch Active Portal:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      demoLogin('patient');
                      onTabChange?.('dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className={`py-2 text-xs rounded-lg font-bold ${
                      role === 'patient' ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-700'
                    }`}
                  >
                    Patient
                  </button>
                  <button
                    onClick={() => {
                      demoLogin('hospital_staff');
                      onTabChange?.('hospital');
                      setMobileMenuOpen(false);
                    }}
                    className={`py-2 text-xs rounded-lg font-bold ${
                      role === 'hospital_staff' ? 'bg-sky-600 text-white' : 'bg-white border text-slate-700'
                    }`}
                  >
                    Staff
                  </button>
                  <button
                    onClick={() => {
                      demoLogin('admin');
                      onTabChange?.('admin');
                      setMobileMenuOpen(false);
                    }}
                    className={`py-2 text-xs rounded-lg font-bold ${
                      role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-700'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* WhatsApp / Voice Simulator Modal */}
      <SimulatorModal isOpen={simulatorOpen} onClose={() => setSimulatorOpen(false)} />
    </>
  );
};
