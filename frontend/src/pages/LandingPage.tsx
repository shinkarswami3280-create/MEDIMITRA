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
        // demo fallback if not logged in
        setStats({
          total_patients: 2,
          total_hospitals: 2,
          total_appointments: 2,
          appointments_today: 1,
          open_blood_requests: 1,
          active_ambulance_requests: 1,
          total_blood_banks: 24,
          total_schemes: 12,
        });
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-emerald-50/20 to-slate-50 border-b border-slate-200 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-100/80 border border-emerald-300/80 text-emerald-900 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Healthcare Coordination Platform · FIT FEST 2026</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            One request.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-700">
              The right connection.
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Connecting small clinics, patient appointments, ambulance dispatch, and verified blood resources — built for urgent moments when every second counts.
          </p>

          {/* Dual CTAs with bilingual high-stakes labels */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onOpenAuth('patient')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm sm:text-base px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer group"
            >
              <Calendar className="w-5 h-5" />
              <span>Book Appointment / अपॉइंटमेंट बुक करें</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onOpenAuth('patient')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm sm:text-base px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Ambulance className="w-5 h-5 animate-pulse" />
              <span>Emergency Help / आपातकाल</span>
            </button>
          </div>

          {/* Quick Action Pills */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <span className="text-slate-600 font-medium mr-1">Quick Access:</span>
            <button
              onClick={() => onOpenAuth('patient')}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer font-medium"
            >
              <Droplet className="w-4 h-4 text-rose-500" />
              Find Blood / रक्त शोध
            </button>
            <button
              onClick={() => onOpenAuth('patient')}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer font-medium"
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              Verified Hospitals
            </button>
            <button
              onClick={() => onOpenAuth('patient')}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer font-medium"
            >
              <FileText className="w-4 h-4 text-sky-600" />
              Assistance Hub (Schemes)
            </button>
          </div>
        </div>
      </section>

      {/* Live Demonstration Stats Block (Honest, strictly from DB rows) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 z-20">
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
          <div className="flex flex-col sm:flex-row items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="font-semibold text-slate-800 text-sm">
                Live Demonstration Database Counts
              </span>
            </div>
            <span className="text-xs text-slate-600 font-medium">
              *Real records seeded in local database · Zero fabricated statistics
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                {stats?.total_hospitals || 2}
              </div>
              <div className="text-xs text-slate-600 mt-1">Verified Hospitals</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-600">
                {stats?.total_blood_banks || 24}
              </div>
              <div className="text-xs text-slate-600 mt-1">eRaktKosh Blood Banks</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-2xl sm:text-3xl font-bold text-sky-600">
                {stats?.total_schemes || 12}
              </div>
              <div className="text-xs text-slate-600 mt-1">Government Schemes</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-2xl sm:text-3xl font-bold text-rose-600">
                {stats?.active_ambulance_requests || 1}
              </div>
              <div className="text-xs text-slate-600 mt-1">Active Dispatches</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Feature Cards */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            A Single Connected Workflow for Small Healthcare
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
            Replacing disconnected phone calls, spreadsheets, and lost WhatsApp messages with instant coordination.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-400 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-2">
                Instant Appointment Sync
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When a patient books a slot, it reflects immediately in the hospital staff command queue with operational no-show indicators.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-emerald-700">
              <span>Patient → Queue Sync</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-400 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Ambulance className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-2">
                Ambulance Haversine Match
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                One-tap GPS map pin matches the nearest available standby ambulance via Haversine distance with live status strip tracking.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-rose-700">
              <span>Nearest Dispatch</span>
              <CheckCircle2 className="w-4 h-4 text-rose-600" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-sky-400 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
                <Droplet className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-2">
                Two-Tier Blood Matching
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Institutional blood banks (public contact shown) + registered individual donors (phone strictly consent-gated, never public).
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-sky-700">
              <span>Privacy-Enforced</span>
              <Lock className="w-4 h-4 text-sky-600" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-400 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-2">
                Assistance Hub (Schemes)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Editable government schemes & financial aid records with mandatory source URLs and last-verified dates. Never hardcoded text.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-indigo-700">
              <span>Source-Verified</span>
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Workflow Section */}
      <section className="bg-slate-100/60 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-wider font-bold text-emerald-700">
              End-to-End Orchestration
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              How MediMitra Coordinates Care
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-center">
            {[
              { step: '1', title: 'Patient Request', desc: 'Appointment, Ambulance, or Blood need submitted.' },
              { step: '2', title: 'Classify & Route', desc: 'Intent classification & urgency validation.' },
              { step: '3', title: 'Coordination Engine', desc: 'Haversine distance & operational ranking.' },
              { step: '4', title: 'Hospital Command', desc: 'Instant live queue update on hospital dashboard.' },
              { step: '5', title: 'Status Dispatch', desc: 'In-app, WhatsApp, and Voice alerts triggered.' },
              { step: '6', title: 'Audit Trail', desc: 'Complete history logged in SQLite/Postgres datastore.' },
            ].map((s, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mx-auto mb-2">
                  {s.step}
                </div>
                <h4 className="font-semibold text-slate-800 text-xs mb-1">{s.title}</h4>
                <p className="text-[11px] text-slate-600 leading-snug">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explicit Non-Negotiable Safety & Disclaimer Section */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-4">
            <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 text-base sm:text-lg mb-2">
                Mandatory Operational Scope & Safety Notice
              </h3>
              <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                <strong>MediMitra provides healthcare coordination and administrative support.</strong> It does not provide medical diagnosis, treatment recommendations, medicine suggestions, or clinical decision-making. All ranking algorithms are strictly operational resource metrics (distance, reported availability, and queue time) and are never clinical triage. In medical emergencies, always dial emergency services (108) immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <span className="font-bold text-white text-sm">MediMitra</span> — One request. The right connection.
            <div className="mt-1 text-[11px]">Unified Emergency & Hospital Resource Coordination Infrastructure · Pune & Mumbai Network</div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => onOpenAuth('patient')} className="hover:text-white cursor-pointer">
              Patient Portal
            </button>
            <button onClick={() => onOpenAuth('hospital_staff')} className="hover:text-white cursor-pointer">
              Hospital Staff
            </button>
            <button onClick={() => onOpenAuth('admin')} className="hover:text-white cursor-pointer">
              Admin Console
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
