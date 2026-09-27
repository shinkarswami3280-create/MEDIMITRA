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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onTabChange?.('landing')}
                className="flex items-center gap-2.5 text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-lg text-slate-900 tracking-tight">
                      MediMitra
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                      LIVE · Pune & Mumbai
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-600 block -mt-0.5">
                    One request. The right connection.
                  </span>
                </div>
              </button>
            </div>

            {/* Quick switch between Patient, Hospital Staff, and Admin */}
            {token && (
              <div className="hidden lg:flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-600 text-[11px] px-2 font-medium">Active Portal:</span>
                <button
                  onClick={() => {
                    demoLogin('patient');
                    onTabChange?.('dashboard');
                  }}
                  className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    role === 'patient'
                      ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Patient
                </button>
                <button
                  onClick={() => {
                    demoLogin('hospital_staff');
                    onTabChange?.('hospital');
                  }}
                  className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    role === 'hospital_staff'
                      ? 'bg-white text-sky-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hospital Staff
                </button>
                <button
                  onClick={() => {
                    demoLogin('admin');
                    onTabChange?.('admin');
                  }}
                  className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    role === 'admin'
                      ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Admin
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Multilingual Label Pill */}
              <div className="hidden sm:flex items-center text-[11px] text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                EN · हिन्दी · मराठी
              </div>

              {/* Simulated Assistant Launcher */}
              <button
                onClick={() => setSimulatorOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-2 rounded-xl border border-emerald-200 transition-all cursor-pointer shadow-2xs"
                title="Launch Simulated WhatsApp & Voice Engine"
              >
                <Bot className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">WhatsApp / Voice Demo</span>
              </button>

              {/* Notification Bell */}
              {token && <NotificationBell />}

              {/* Profile / Login */}
              {token ? (
                <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                  <div className="hidden md:block text-right">
                    <div className="text-xs font-semibold text-slate-800 leading-tight">
                      {userName || 'User'}
                    </div>
                    <div className="text-[10px] text-slate-600 capitalize">
                      {role?.replace('_', ' ')}
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenLoginModal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Demo Sign In
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
              <div className="p-2 bg-slate-50 rounded-xl space-y-1">
                <span className="text-xs font-semibold text-slate-600 block mb-1">
                  Switch Active Role (Demo):
                </span>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => {
                      demoLogin('patient');
                      onTabChange?.('dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className={`py-1.5 text-xs rounded-lg font-medium ${
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
                    className={`py-1.5 text-xs rounded-lg font-medium ${
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
                    className={`py-1.5 text-xs rounded-lg font-medium ${
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
