import React, { useState } from 'react';
import {
  X,
  Droplet,
  MapPin,
  Phone,
  Shield,
  ExternalLink,
  CheckCircle2,
  Lock,
  Sparkles,
  Info,
} from 'lucide-react';
import { api } from '../../api/client';
import { BloodResource, Donor, UrgencyLevel } from '../../api/types';

interface BloodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestCreated?: () => void;
}

export const BloodModal: React.FC<BloodModalProps> = ({
  isOpen,
  onClose,
  onRequestCreated,
}) => {
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [units, setUnits] = useState(2);
  const [urgency, setUrgency] = useState<UrgencyLevel>('HIGH');
  const [location, setLocation] = useState('Mumbai, Maharashtra');
  const [loading, setLoading] = useState(false);
  const [matched, setMatched] = useState(false);
  const [institutionalBanks, setInstitutionalBanks] = useState<BloodResource[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [explanation, setExplanation] = useState('');
  const [consentRequested, setConsentRequested] = useState<Record<number, boolean>>({});

  if (!isOpen) return null;

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Create request
      await api.createBloodRequest({
        blood_group: bloodGroup,
        units,
        urgency,
        location,
      });

      // 2. Query operational matching engine
      const matchResult = await api.matchBlood(bloodGroup, 19.1136, 72.8464);
      setInstitutionalBanks(matchResult.blood_resources);
      setDonors(matchResult.donors);
      setExplanation(matchResult.factors_explanation);
      setMatched(true);
      onRequestCreated?.();
    } catch (err: any) {
      alert(`Matching failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestConsent = async (donorId: number) => {
    try {
      await api.requestDonorConsent(1, donorId);
      setConsentRequested((prev) => ({ ...prev, [donorId]: true }));
    } catch {
      setConsentRequested((prev) => ({ ...prev, [donorId]: true }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-rose-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Droplet className="w-6 h-6 text-rose-200 fill-rose-200" />
            </div>
            <div>
              <h3 className="font-bold text-base">Blood Coordination Engine</h3>
              <p className="text-xs text-rose-100">रक्त शोध एवं समन्वय · Two-Tier Privacy Architecture</p>
            </div>
          </div>
          <button onClick={onClose} className="text-rose-100 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!matched ? (
            /* Input Form */
            <form onSubmit={handleMatch} className="space-y-4">
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-xs text-sky-800 flex items-start gap-3">
                <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block mb-0.5">Strict Privacy Architecture:</strong>
                  Institutional blood banks from eRaktKosh display verified contact details publicly. Individual donors are voluntary and their phone numbers are <em>strictly hidden</em> until they consent to your request.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Required Blood Group
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <button
                      type="button"
                      key={bg}
                      onClick={() => setBloodGroup(bg)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        bloodGroup === bg
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Units Required
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={units}
                    onChange={(e) => setUnits(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Location Area / City
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Urgency Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as UrgencyLevel[]).map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setUrgency(lvl)}
                      className={`py-2 text-xs rounded-xl font-bold border transition-all cursor-pointer ${
                        urgency === lvl
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-2xl text-xs sm:text-sm transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <Droplet className="w-4 h-4 fill-white" />
                {loading ? 'Matching Compatible Banks & Donors...' : 'Match Blood Resources Now'}
              </button>
            </form>
          ) : (
            /* Results View */
            <div className="space-y-6">
              {/* Factors Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <Sparkles className="w-4 h-4 text-rose-600" />
                  Operational Matching Parameters
                </div>
                <p className="leading-relaxed text-[11px] text-slate-600">
                  {explanation || 'Ranked by biological compatibility matrix, distance proximity, reported availability, and last verified timestamp.'}
                </p>
              </div>

              {/* Tier A: Institutional Blood Banks */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Tier A: Institutional Blood Banks ({institutionalBanks.length})
                  </h4>
                  <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-medium">
                    Verified Public Data
                  </span>
                </div>

                <div className="space-y-3">
                  {institutionalBanks.map((bank) => (
                    <div
                      key={bank.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-rose-300 transition-all shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h5 className="font-bold text-slate-900 text-sm">{bank.name}</h5>
                          <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {bank.address}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 mt-2">
                            <span>Last verified: <strong>{bank.last_verified}</strong></span>
                            {bank.distance_km && (
                              <span>Distance: ~<strong>{bank.distance_km.toFixed(1)} km</strong></span>
                            )}
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                          {bank.phone ? (
                            <a
                              href={`tel:${bank.phone}`}
                              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>{bank.phone}</span>
                            </a>
                          ) : (
                            <span className="text-xs text-slate-600 font-mono">104 / 108 helpline</span>
                          )}
                          <a
                            href={bank.source_url || 'https://eraktkosh.in'}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-sky-700 hover:text-sky-900 underline"
                          >
                            <span>Confirm live on eRaktKosh</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tier B: Registered Voluntary Donors */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    Tier B: Registered Voluntary Donors ({donors.length})
                  </h4>
                  <span className="text-[11px] text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 font-medium flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Phone Hidden (Consent Gated)
                  </span>
                </div>

                <div className="space-y-3">
                  {donors.map((d) => (
                    <div
                      key={d.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2 py-0.5 rounded-lg border border-rose-200">
                            {d.blood_group}
                          </span>
                          <span className="font-semibold text-xs text-slate-800">
                            {d.name || `Voluntary Donor #${d.id}`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          General Area: <strong>{d.general_area || 'Greater Mumbai Area'}</strong>
                        </p>
                        <p className="text-[10px] text-slate-600 mt-0.5 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-500" />
                          Phone number encrypted; revealed only after donor approves consent request.
                        </p>
                      </div>

                      <button
                        onClick={() => handleRequestConsent(d.id)}
                        disabled={consentRequested[d.id]}
                        className={`text-xs px-3.5 py-2 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
                          consentRequested[d.id]
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            : 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs'
                        }`}
                      >
                        {consentRequested[d.id] ? 'Consent Request Sent' : 'Request Contact Consent'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setMatched(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                ← Search Another Blood Group / Location
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
