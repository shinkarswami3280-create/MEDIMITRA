import React, { useState, useEffect } from 'react';
import {
  Hospital,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ambulance,
  Droplet,
  Download,
  Share2,
  Calendar,
  Sparkles,
  TrendingUp,
  UserCheck,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { api } from '../../api/client';
import { Appointment, AmbulanceRequest, BloodRequest, NoShowRisk, DemandForecast } from '../../api/types';
import { useAuth } from '../../context/AuthContext';

export const HospitalDashboard: React.FC = () => {
  const { userName } = useAuth();
  const [activeTab, setActiveTab] = useState<'command' | 'appointments' | 'ambulances' | 'blood' | 'ml'>('command');
  const [feed, setFeed] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [ambulanceQueue, setAmbulanceQueue] = useState<AmbulanceRequest[]>([]);
  const [bloodInbox, setBloodInbox] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [searchPatient, setSearchPatient] = useState('');

  // ML state for selected appointment
  const [selectedApptId, setSelectedApptId] = useState<number | null>(null);
  const [noShowData, setNoShowData] = useState<NoShowRisk | null>(null);
  const [demandForecast, setDemandForecast] = useState<DemandForecast | null>(null);

  const fetchHospitalData = async () => {
    try {
      const [cmdFeed, appts, ambQueue, blood] = await Promise.all([
        api.getCommandCenterFeed(1),
        api.getHospitalAppointments(1),
        api.getHospitalAmbulanceQueue(1),
        api.getHospitalBloodInbox(),
      ]);
      setFeed(cmdFeed);
      setAppointments(appts);
      setAmbulanceQueue(ambQueue);
      setBloodInbox(blood);

      // Check demand forecast for General Medicine
      api.getDemandForecast(1, 'General Medicine').then(setDemandForecast).catch(() => {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitalData();
    const interval = setInterval(fetchHospitalData, 5000); // 5-second interval verifies instant booking reflection
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await api.updateAppointmentStatus(id, newStatus);
      fetchHospitalData();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleAmbulanceStatus = async (id: number, newStatus: string) => {
    try {
      await api.updateAmbulanceStatus(id, newStatus);
      fetchHospitalData();
    } catch (err: any) {
      alert(`Ambulance update failed: ${err.message}`);
    }
  };

  const handleExportCSV = async () => {
    try {
      await api.downloadAppointmentsCSV(1);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSyncSheets = async () => {
    setSyncStatus('Syncing with Google Sheets...');
    try {
      const res = await api.syncGoogleSheets(1);
      setSyncStatus(res.message);
      setTimeout(() => setSyncStatus(null), 5000);
    } catch (err: any) {
      setSyncStatus(`Sync info: ${err.message}`);
      setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  const inspectNoShowRisk = async (apptId: number) => {
    setSelectedApptId(apptId);
    try {
      const res = await api.getNoShowRisk(apptId);
      setNoShowData(res);
    } catch {
      // fallback
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (!searchPatient) return true;
    const name = a.patient?.name || '';
    const phone = a.patient?.phone || '';
    return (
      name.toLowerCase().includes(searchPatient.toLowerCase()) ||
      phone.includes(searchPatient) ||
      a.service.toLowerCase().includes(searchPatient.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                Hospital Command Center · रुग्णालय नियंत्रण
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Live Sync (5s Refresh)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              {userName || 'Staff Command'} — Kokilaben Dhirubhai Ambani Hospital
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Active dispatch queues, emergency triage-free coordination, and instant patient booking synchronization.
            </p>
          </div>

          {/* Export Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
              title="Download appointments as direct CSV file"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleSyncSheets}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              title="Optional mirror export to Google Sheets via gspread"
            >
              <Share2 className="w-4 h-4" />
              <span>Sync Sheets</span>
            </button>
          </div>
        </div>

        {/* Sync notification toast */}
        {syncStatus && (
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-800 flex items-center justify-between">
            <span>{syncStatus}</span>
            <button onClick={() => setSyncStatus(null)} className="font-bold text-sky-700 cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium mb-1">
              <span>Active Ambulances</span>
              <Ambulance className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {feed?.active_ambulances_count ?? 1}
            </div>
            <div className="text-[10px] text-rose-600 font-medium mt-1">En-route dispatches</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium mb-1">
              <span>Pending Appointments</span>
              <Calendar className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {feed?.pending_appointments_count ?? appointments.length}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium mt-1">Synced with patient side</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium mb-1">
              <span>Open Blood Requests</span>
              <Droplet className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {feed?.open_blood_requests_count ?? bloodInbox.length}
            </div>
            <div className="text-[10px] text-slate-600 font-medium mt-1">Awaiting donor match</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium mb-1">
              <span>Operational Demand</span>
              <TrendingUp className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-indigo-700">
              {demandForecast?.forecast || 'MEDIUM'}
            </div>
            <div className="text-[10px] text-indigo-600 font-medium mt-1">General Medicine inflow</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white rounded-2xl p-2 gap-2 shadow-2xs overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('command')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'command'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Emergency Command Feed
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'appointments'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live Appointments Queue ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('ambulances')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ambulances'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ambulance Dispatch Queue ({ambulanceQueue.length})
          </button>
          <button
            onClick={() => setActiveTab('blood')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'blood'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Blood Requests Inbox ({bloodInbox.length})
          </button>
        </div>

        {/* Tab 1: Emergency Command Feed */}
        {activeTab === 'command' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Incoming Ambulances */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Ambulance className="w-5 h-5 text-rose-600" />
                  <h3 className="font-bold text-slate-900 text-base">Incoming Emergency Dispatches</h3>
                </div>
                <span className="text-xs bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full font-bold">
                  {feed?.ambulances?.length || 0} Active
                </span>
              </div>

              {!feed?.ambulances || feed.ambulances.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No active incoming ambulance dispatches.
                </div>
              ) : (
                <div className="space-y-3">
                  {feed.ambulances.map((amb: any) => (
                    <div
                      key={amb.id}
                      className="p-4 rounded-2xl border border-rose-200 bg-rose-50/30 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{amb.patient_name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white uppercase">
                            Urgency: {amb.urgency}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">Pickup: {amb.pickup_address}</p>
                        <div className="text-[11px] text-rose-700 font-semibold mt-1">
                          Status: {amb.status} · ETA: ~{amb.eta_minutes || 8} mins
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 shrink-0">
                        {amb.status !== 'ARRIVED' && (
                          <button
                            onClick={() => handleAmbulanceStatus(amb.id, 'ARRIVED')}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
                          >
                            Mark Arrived
                          </button>
                        )}
                        {amb.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleAmbulanceStatus(amb.id, 'COMPLETED')}
                            className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Urgent Blood Requests Inbox */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-rose-600" />
                  <h3 className="font-bold text-slate-900 text-base">Active Blood Inflow Needs</h3>
                </div>
                <span className="text-xs bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full font-bold">
                  {feed?.blood_requests?.length || 0} Open
                </span>
              </div>

              {!feed?.blood_requests || feed.blood_requests.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No open blood coordination requests right now.
                </div>
              ) : (
                <div className="space-y-3">
                  {feed.blood_requests.map((b: any) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-rose-700">
                            {b.blood_group} ({b.units} Units)
                          </span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                            {b.urgency}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">Patient: {b.patient_name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{b.location}</p>
                      </div>

                      <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Live Appointments Queue */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchPatient}
                  onChange={(e) => setSearchPatient(e.target.value)}
                  placeholder="Search patient name, phone, service..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-sky-500 bg-white"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Total Booked: <strong>{appointments.length}</strong></span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold">Changes sync instantly</span>
              </div>
            </div>

            {/* Appointments Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Slot Time</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">ML No-Show Risk</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No appointments found matching search.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((a) => {
                      const dt = new Date(a.slot_time);
                      return (
                        <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {a.patient?.name || 'Walk-in Patient'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            {a.patient?.phone || '—'}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-800">
                            {a.service}
                          </td>
                          <td className="py-3.5 px-4">
                            {dt.toLocaleDateString([], { month: 'short', day: 'numeric' })},{' '}
                            {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3.5 px-4 uppercase text-[10px] font-semibold text-slate-500">
                            {a.source || 'web'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                a.status === 'CONFIRMED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : a.status === 'COMPLETED'
                                  ? 'bg-slate-200 text-slate-700'
                                  : a.status === 'CANCELLED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {a.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => inspectNoShowRisk(a.id)}
                              className="text-[11px] text-sky-600 hover:text-sky-800 font-semibold underline flex items-center gap-1 cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3 text-sky-500" />
                              Evaluate Risk
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                            {a.status === 'REQUESTED' && (
                              <button
                                onClick={() => handleStatusChange(a.id, 'CONFIRMED')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer"
                              >
                                Confirm
                              </button>
                            )}
                            {a.status === 'CONFIRMED' && (
                              <button
                                onClick={() => handleStatusChange(a.id, 'COMPLETED')}
                                className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer"
                              >
                                Complete
                              </button>
                            )}
                            {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
                              <button
                                onClick={() => handleStatusChange(a.id, 'NO_SHOW')}
                                className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer"
                              >
                                No-Show
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ML Evaluation Modal Drawer */}
            {noShowData && selectedApptId && (
              <div className="mt-4 p-5 rounded-2xl bg-sky-50 border border-sky-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    <h4 className="font-bold text-sky-950 text-sm">
                      Operational Attendance Risk Indicator (Appointment #{selectedApptId})
                    </h4>
                  </div>
                  <button
                    onClick={() => setNoShowData(null)}
                    className="text-xs text-sky-800 font-bold cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      noShowData.risk_level === 'HIGH'
                        ? 'bg-rose-100 text-rose-800'
                        : noShowData.risk_level === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Risk Level: {noShowData.risk_level} (Score: {(noShowData.score * 100).toFixed(0)}%)
                  </span>
                  <span className="text-xs text-sky-800">
                    Suggested action: {noShowData.risk_level === 'HIGH' ? 'Dispatch extra SMS/call reminder' : 'Standard in-app reminder'}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1 mt-1">
                  <strong>Contributing Factors:</strong>
                  <ul className="list-disc pl-5 text-[11px] text-slate-500">
                    {noShowData.factors.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
                <p className="text-[10px] text-slate-600 pt-1 border-t border-sky-200">
                  {noShowData.disclaimer}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Ambulance Queue */}
        {activeTab === 'ambulances' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
              Ambulance Dispatch Queue
            </h3>
            {ambulanceQueue.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No active ambulance dispatches.
              </div>
            ) : (
              <div className="space-y-3">
                {ambulanceQueue.map((amb) => (
                  <div
                    key={amb.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          Patient #{amb.patient_id}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white uppercase">
                          Urgency: {amb.urgency}
                        </span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                          Status: {amb.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">Pickup: {amb.pickup_address}</p>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ETA: ~{amb.eta_minutes || 8} mins
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={amb.status}
                        onChange={(e) => handleAmbulanceStatus(amb.id, e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                      >
                        <option value="REQUESTED">REQUESTED</option>
                        <option value="ACCEPTED">ACCEPTED</option>
                        <option value="DISPATCHED">DISPATCHED</option>
                        <option value="ARRIVING">ARRIVING</option>
                        <option value="ARRIVED">ARRIVED</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Blood Inbox */}
        {activeTab === 'blood' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
              Blood Coordination Inbox
            </h3>
            {bloodInbox.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No active blood coordination requests.
              </div>
            ) : (
              <div className="space-y-3">
                {bloodInbox.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-rose-700">
                          {b.blood_group} ({b.units} Units)
                        </span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                          Urgency: {b.urgency}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">Location: {b.location}</p>
                    </div>

                    <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
