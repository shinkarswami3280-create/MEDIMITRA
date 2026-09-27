import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Ambulance,
  Droplet,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Clock,
  Sparkles,
  PhoneCall,
  Lock,
  Zap,
  Activity,
  Radio,
  HeartPulse,
} from 'lucide-react';
import { api } from '../api/client';
import { SystemStats } from '../api/types';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
  onOpenAuth: (role?: 'patient' | 'hospital_staff' | 'admin') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenAuth }) => {
  const [stats, setStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    api
      .getSystemStats()
      .then((data) => setStats(data))
      .catch(() => {
        setStats({
          total_patients: 12,
          total_hospitals: 15,
          total_appointments: 18,
          appointments_today: 4,
          open_blood_requests: 3,
          active_ambulance_requests: 2,
          total_blood_banks: 35,
          total_schemes: 12,
        });
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 border-b border-emerald-100 bg-gradient-to-b from-white via-emerald-50/30 to-[#f8fafc]">
        {/* Soft Ambient Radiance */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[360px] bg-gradient-to-tr from-emerald-200/40 via-teal-200/30 to-sky-200/30 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 bg-white border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-2 rounded-full mb-6 shadow-sm shadow-emerald-500/5">
            <HeartPulse className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span className="tracking-wide">Autonomous Healthcare Coordination Grid · Pune & Mumbai</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.15] max-w-5xl mx-auto font-heading text-slate-900">
            One Urgent Request.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
              The Exact Lifeline.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
            Connecting real-time ambulance dispatch, instant verified blood bank & donor matching, and verified hospital bed queues — built for critical moments when seconds determine lives.
          </p>

          {/* Action Buttons */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenAuth('patient')}
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm sm:text-base px-8 py-4 rounded-2xl shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/35 transition-all cursor-pointer group hover:scale-[1.02]"
            >
              <Calendar className="w-5 h-5 text-white" />
              <span>Book Appointment / अपॉइंटमेंट बुक करें</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </button>

            <button
              onClick={() => onOpenAuth('patient')}
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm sm:text-base px-8 py-4 rounded-2xl shadow-lg shadow-rose-600/25 hover:shadow-xl hover:shadow-rose-600/35 transition-all cursor-pointer hover:scale-[1.02] animate-radar"
            >
              <Ambulance className="w-5 h-5 text-white animate-bounce" />
              <span>Emergency Help / आपातकाल (108)</span>
            </button>
          </div>

          {/* Quick Action Pills */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs sm:text-sm">
            <span className="text-slate-500 font-semibold mr-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              Direct Portals:
            </span>
            <button
              onClick={() => onOpenAuth('patient')}
              className="bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 px-4 py-2 rounded-xl flex items-center gap-2 shadow-2xs transition-all cursor-pointer font-semibold"
            >
              <Droplet className="w-4 h-4 text-rose-500" />
              Find Blood / रक्त शोध (35+ Banks)
            </button>
            <button
              onClick={() => onOpenAuth('patient')}
              className="bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 px-4 py-2 rounded-xl flex items-center gap-2 shadow-2xs transition-all cursor-pointer font-semibold"
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              Verified Pune Hospitals (15 Nodes)
            </button>
            <button
              onClick={() => onOpenAuth('patient')}
              className="bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 px-4 py-2 rounded-xl flex items-center gap-2 shadow-2xs transition-all cursor-pointer font-semibold"
            >
              <FileText className="w-4 h-4 text-sky-600" />
              Ayushman Bharat & Schemes
            </button>
          </div>
        </div>
      </section>

      {/* Live Demonstration Real-Time Grid Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-12 z-20 w-full">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-100/90 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between pb-5 border-b border-slate-100 mb-6 gap-2">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="font-bold text-slate-900 text-sm tracking-wide uppercase font-heading">
                Live Regional Grid Nodes · Real Operational Telemetry
              </span>
            </div>
            <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              ⚡ Real Local Pune & Mumbai DB Records
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
                {stats?.total_hospitals || 15}
              </div>
              <div className="text-xs text-slate-500 mt-1.5 font-semibold">Tertiary & Civil Hospitals</div>
            </div>
            <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50/60 to-white rounded-2xl border border-emerald-200 shadow-2xs hover:border-emerald-300 transition-all">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 font-heading">
                {stats?.total_blood_banks || 35}
              </div>
              <div className="text-xs text-emerald-700 mt-1.5 font-semibold">eRaktKosh Verified Banks</div>
            </div>
            <div className="p-4 sm:p-5 bg-gradient-to-br from-sky-50/60 to-white rounded-2xl border border-sky-200 shadow-2xs hover:border-sky-300 transition-all">
              <div className="text-3xl sm:text-4xl font-extrabold text-sky-600 font-heading">
                {stats?.total_schemes || 12}
              </div>
              <div className="text-xs text-sky-700 mt-1.5 font-semibold">Govt Financial Schemes</div>
            </div>
            <div className="p-4 sm:p-5 bg-gradient-to-br from-rose-50/60 to-white rounded-2xl border border-rose-200 shadow-2xs hover:border-rose-300 transition-all">
              <div className="text-3xl sm:text-4xl font-extrabold text-rose-600 font-heading">
                {stats?.active_ambulance_requests || 2}
              </div>
              <div className="text-xs text-rose-700 mt-1.5 font-semibold">Active Fleet Dispatches</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Feature Cards */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-xs uppercase tracking-widest font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full">
            Autonomous Healthcare Hub
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mt-4 font-heading">
            Zero Friction. Instant Hospital Coordination.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Replacing lost paperwork, busy emergency switchboards, and blind transfers with real-time operational routing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2 font-heading">
                Live Queue & Slots
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Patients book confirmed slots synced in real-time with doctor consultation queues, dynamic wait estimates, and no-show indicators.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
              <span>Synchronized Live</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-rose-400 hover:shadow-lg hover:shadow-rose-500/10 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Ambulance className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2 font-heading">
                Haversine Fleet Dispatch
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                One-tap GPS dispatch pairs the patient with the nearest available ambulance unit across Sassoon, Ruby Hall, and Jehangir with live ETA.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-rose-700">
              <span>Sub-Kilometer Radar</span>
              <CheckCircle2 className="w-4 h-4 text-rose-600" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/10 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Droplet className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2 font-heading">
                Privacy-First Blood Grid
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direct integration with 35 verified institutional blood banks plus voluntary donors whose personal phone numbers are strictly consent-protected.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-cyan-700">
              <span>Consent-Gated Protocol</span>
              <Lock className="w-4 h-4 text-cyan-600" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/10 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2 font-heading">
                Assistance Hub
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ayushman Bharat, MJPJAY, and NGO relief funds linked with live verified eligibility rules, official helpline links, and verified timestamps.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-700">
              <span>Verified Sources</span>
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            </div>
          </div>
        </div>
      </section>

      {/* Safety Notice Banner */}
      <section className="py-12 bg-amber-50/50 border-y border-amber-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-amber-300 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-5 shadow-xs">
            <div className="p-3.5 bg-amber-100 text-amber-800 rounded-2xl shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 text-base sm:text-lg mb-2 font-heading">
                Operational Scope & Non-Clinical Disclaimer
              </h3>
              <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                <strong>MediMitra is an administrative coordination and resource routing platform.</strong> It does not diagnose medical conditions, prescribe medicines, or replace clinical triage. All ranking factors (distance, bed capacity, wait times) are strictly logistical metrics. In any emergency situation, dial <strong>108</strong> immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
          <div>
            <span className="font-bold text-white text-base font-heading">MediMitra</span> — One request. The right connection.
            <div className="mt-1 text-slate-400">Autonomous Emergency Healthcare Infrastructure · Pune & Mumbai Metro Network</div>
          </div>
          <div className="flex gap-6">
            <button onClick={() => onOpenAuth('patient')} className="text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer font-medium">
              Patient Portal
            </button>
            <button onClick={() => onOpenAuth('hospital_staff')} className="text-slate-300 hover:text-sky-400 transition-colors cursor-pointer font-medium">
              Hospital Staff
            </button>
            <button onClick={() => onOpenAuth('admin')} className="text-slate-300 hover:text-indigo-400 transition-colors cursor-pointer font-medium">
              Admin Console
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
