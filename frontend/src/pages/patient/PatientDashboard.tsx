import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Ambulance,
  Droplet,
  FileText,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Phone,
  XCircle,
  FileCheck2,
} from 'lucide-react';
import { api } from '../../api/client';
import { Appointment, AmbulanceRequest, BloodRequest } from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import { BookAppointmentModal } from './BookAppointmentModal';
import { AmbulanceModal } from './AmbulanceModal';
import { BloodModal } from './BloodModal';
import { AssistanceHubModal } from './AssistanceHubModal';
import { DocumentsModal } from './DocumentsModal';

export const PatientDashboard: React.FC = () => {
  const { userName } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [ambulanceRequest, setAmbulanceRequest] = useState<AmbulanceRequest | null>(null);
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [ambulanceModalOpen, setAmbulanceModalOpen] = useState(false);
  const [bloodModalOpen, setBloodModalOpen] = useState(false);
  const [schemesModalOpen, setSchemesModalOpen] = useState(false);
  const [docsModalOpen, setDocsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [appts, amb, blood] = await Promise.all([
        api.getMyAppointments(),
        api.getMyAmbulanceRequest(),
        api.getMyBloodRequests(),
      ]);
      setAppointments(appts);
      setAmbulanceRequest(amb);
      setBloodRequests(blood);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); // Poll for live sync
    return () => clearInterval(interval);
  }, []);

  const handleCancelAppointment = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.cancelAppointment(id);
      fetchData();
    } catch (err: any) {
      alert(`Error cancelling appointment: ${err.message}`);
    }
  };

  const upcomingAppt = appointments.find(
    (a) => a.status === 'CONFIRMED' || a.status === 'REQUESTED'
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Welcome Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Patient Portal · पेशंट डॅशबोर्ड
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Namaste, {userName || 'Patient'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              One central portal for your appointments, emergencies, blood requests, and records.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setBookModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
            <button
              onClick={() => setAmbulanceModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Ambulance className="w-4 h-4 animate-pulse" />
              <span>Emergency Help</span>
            </button>
          </div>
        </div>

        {/* Live Active Ambulance Status Strip */}
        {ambulanceRequest && ambulanceRequest.status !== 'COMPLETED' && (
          <div className="bg-gradient-to-r from-rose-600 to-red-700 text-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Ambulance className="w-6 h-6 text-white animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-200">
                    Emergency Dispatch En-Route
                  </span>
                  <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {ambulanceRequest.status}
                  </span>
                </div>
                <h3 className="text-base font-bold mt-0.5">
                  Ambulance arriving in ~{ambulanceRequest.eta_minutes || 8} minutes
                </h3>
                <p className="text-xs text-rose-100">
                  Pickup: {ambulanceRequest.pickup_address || `${ambulanceRequest.pickup_lat}, ${ambulanceRequest.pickup_lng}`}
                </p>
              </div>
            </div>

            <button
              onClick={() => setAmbulanceModalOpen(true)}
              className="bg-white text-rose-700 hover:bg-rose-50 font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
            >
              View Live GPS Map & Details →
            </button>
          </div>
        )}

        {/* 4 Quick Action Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => setBookModalOpen(true)}
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-400 hover:shadow-xs transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="font-bold text-slate-900 text-sm">Book Appointment</div>
            <div className="text-[11px] text-slate-400 mt-0.5">अपॉइंटमेंट बुक करें</div>
          </button>

          <button
            onClick={() => setAmbulanceModalOpen(true)}
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-rose-400 hover:shadow-xs transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Ambulance className="w-5 h-5" />
            </div>
            <div className="font-bold text-slate-900 text-sm">Request Ambulance</div>
            <div className="text-[11px] text-slate-400 mt-0.5">आपातकाल एम्बुलेंस</div>
          </button>

          <button
            onClick={() => setBloodModalOpen(true)}
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-sky-400 hover:shadow-xs transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Droplet className="w-5 h-5" />
            </div>
            <div className="font-bold text-slate-900 text-sm">Find Blood Resources</div>
            <div className="text-[11px] text-slate-400 mt-0.5">रक्त शोध व समन्वय</div>
          </button>

          <button
            onClick={() => setSchemesModalOpen(true)}
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-400 hover:shadow-xs transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="font-bold text-slate-900 text-sm">Assistance Hub</div>
            <div className="text-[11px] text-slate-400 mt-0.5">शासकीय योजना</div>
          </button>
        </div>

        {/* Main Grid: Upcoming Appointment & Requests */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Appointment Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Your Appointments</h3>
              </div>
              <button
                onClick={() => setBookModalOpen(true)}
                className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold cursor-pointer"
              >
                + New Booking
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading appointments...</div>
            ) : appointments.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">No appointments booked yet</p>
                <button
                  onClick={() => setBookModalOpen(true)}
                  className="text-xs bg-emerald-600 text-white font-semibold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Book your first slot
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appt) => {
                  const dt = new Date(appt.slot_time);
                  const isUpcoming = appt.status === 'CONFIRMED' || appt.status === 'REQUESTED';
                  return (
                    <div
                      key={appt.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isUpcoming
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                appt.status === 'CONFIRMED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : appt.status === 'COMPLETED'
                                  ? 'bg-slate-200 text-slate-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {appt.status}
                            </span>
                            <span className="font-bold text-slate-900 text-sm">
                              {appt.service}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {dt.toLocaleDateString([], {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              at {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {appt.hospital && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{appt.hospital.name} ({appt.hospital.address})</span>
                            </div>
                          )}
                        </div>

                        {isUpcoming && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleCancelAppointment(appt.id)}
                              className="text-xs text-rose-600 hover:text-rose-800 font-medium px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Blood Requests & Documents */}
          <div className="space-y-6">
            {/* Open Blood Request Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-rose-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Active Blood Requests</h3>
                </div>
                <button
                  onClick={() => setBloodModalOpen(true)}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                >
                  + Request
                </button>
              </div>

              {bloodRequests.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No active blood requests.
                </div>
              ) : (
                <div className="space-y-2">
                  {bloodRequests.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-800">
                          {b.blood_group} ({b.units} units)
                        </span>
                        <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-semibold">
                          {b.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">{b.location || 'Local area'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Documents Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-teal-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Medical Documents</h3>
                </div>
                <button
                  onClick={() => setDocsModalOpen(true)}
                  className="text-xs text-teal-600 hover:text-teal-800 font-semibold cursor-pointer"
                >
                  View All
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Prescriptions, lab test reports, and bills safely kept in your demo patient record.
              </p>
              <button
                onClick={() => setDocsModalOpen(true)}
                className="w-full py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Access My Records
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BookAppointmentModal
        isOpen={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        onSuccess={fetchData}
      />
      <AmbulanceModal
        isOpen={ambulanceModalOpen}
        onClose={() => setAmbulanceModalOpen(false)}
        activeRequest={ambulanceRequest}
        onRequestUpdated={fetchData}
      />
      <BloodModal
        isOpen={bloodModalOpen}
        onClose={() => setBloodModalOpen(false)}
        onRequestCreated={fetchData}
      />
      <AssistanceHubModal
        isOpen={schemesModalOpen}
        onClose={() => setSchemesModalOpen(false)}
      />
      <DocumentsModal
        isOpen={docsModalOpen}
        onClose={() => setDocsModalOpen(false)}
      />
    </div>
  );
};
