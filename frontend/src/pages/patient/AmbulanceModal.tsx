import React, { useState, useEffect } from 'react';
import {
  X,
  Ambulance,
  MapPin,
  AlertTriangle,
  Clock,
  Phone,
  CheckCircle2,
  Navigation,
} from 'lucide-react';
import { api } from '../../api/client';
import { LeafletMap } from '../../components/LeafletMap';
import { AmbulanceRequest, UrgencyLevel } from '../../api/types';

interface AmbulanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRequest: AmbulanceRequest | null;
  onRequestUpdated: () => void;
}

export const AmbulanceModal: React.FC<AmbulanceModalProps> = ({
  isOpen,
  onClose,
  activeRequest,
  onRequestUpdated,
}) => {
  const [pickupLat, setPickupLat] = useState<number>(19.1136); // Default Andheri West
  const [pickupLng, setPickupLng] = useState<number>(72.8464);
  const [pickupAddress, setPickupAddress] = useState('Near Andheri Station West, Mumbai');
  const [urgency, setUrgency] = useState<UrgencyLevel>('HIGH');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.requestAmbulance({
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        pickup_address: pickupAddress,
        urgency,
      });
      onRequestUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch ambulance');
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = [
    { key: 'REQUESTED', label: 'Requested' },
    { key: 'ACCEPTED', label: 'Accepted' },
    { key: 'DISPATCHED', label: 'Dispatched' },
    { key: 'ARRIVING', label: 'Arriving' },
    { key: 'ARRIVED', label: 'Arrived' },
    { key: 'COMPLETED', label: 'Completed' },
  ];

  const currentStepIdx = activeRequest
    ? statusSteps.findIndex((s) => s.key === activeRequest.status)
    : -1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-rose-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Ambulance className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base">Ambulance Coordination</h3>
              <p className="text-xs text-rose-100">आपातकाल एम्बुलेंस · Nearest standby unit match</p>
            </div>
          </div>
          <button onClick={onClose} className="text-rose-100 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {activeRequest && activeRequest.status !== 'COMPLETED' ? (
            /* Live Tracking View */
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block">
                    Active Emergency Dispatch En-Route
                  </span>
                  <h4 className="text-lg font-extrabold text-emerald-950 mt-0.5">
                    ETA: ~{activeRequest.eta_minutes || 8} minutes
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1">
                    Pickup: {activeRequest.pickup_address || `${activeRequest.pickup_lat}, ${activeRequest.pickup_lng}`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-xs">
                    {activeRequest.status}
                  </span>
                </div>
              </div>

              {/* Status progression bar */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-3">
                  Live Dispatch Progression
                </label>
                <div className="grid grid-cols-6 gap-1 text-center">
                  {statusSteps.map((step, idx) => {
                    const isDone = currentStepIdx >= idx;
                    const isCurrent = currentStepIdx === idx;
                    return (
                      <div key={step.key} className="space-y-1">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isDone ? 'bg-rose-600' : 'bg-slate-200'
                          } ${isCurrent ? 'ring-2 ring-rose-400 ring-offset-1 animate-pulse' : ''}`}
                        />
                        <span
                          className={`text-[10px] block truncate font-medium ${
                            isDone ? 'text-rose-700 font-bold' : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Map View */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                  <span>GPS Tracking (OpenStreetMap)</span>
                  <span className="text-[11px] text-slate-500 font-normal">Haversine Calculated Route</span>
                </label>
                <LeafletMap
                  height="260px"
                  markers={[
                    {
                      id: 'pickup',
                      lat: activeRequest.pickup_lat,
                      lng: activeRequest.pickup_lng,
                      title: 'Patient Pickup Point',
                      subtitle: activeRequest.pickup_address,
                      isPickup: true,
                    },
                    {
                      id: 'amb',
                      lat: activeRequest.pickup_lat + 0.008,
                      lng: activeRequest.pickup_lng + 0.007,
                      title: 'Ambulance MH01-AA-1234',
                      subtitle: 'Status: En-route to patient',
                    },
                  ]}
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>Emergency Control Helpline: <strong>108 / 112</strong></span>
                <span className="text-[11px] text-slate-400">Driver contact direct on arrival</span>
              </div>
            </div>
          ) : (
            /* Dispatch Form */
            <form onSubmit={handleDispatch} className="space-y-4">
              <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 text-xs text-rose-800">
                <strong>Mid-Crisis Design Principle:</strong> Tap the map to set your pickup location or confirm address below. Nearest ambulance will be dispatched automatically.
              </div>

              {/* Map Pin Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Tap to Adjust Pickup Location Pin</span>
                  <span className="text-[11px] text-slate-500">
                    Lat: {pickupLat.toFixed(4)}, Lng: {pickupLng.toFixed(4)}
                  </span>
                </label>
                <LeafletMap
                  height="220px"
                  markers={[
                    {
                      id: 'current_pickup',
                      lat: pickupLat,
                      lng: pickupLng,
                      title: 'Selected Pickup Point',
                      isPickup: true,
                    },
                  ]}
                  onLocationSelect={(lat, lng) => {
                    setPickupLat(lat);
                    setPickupLng(lng);
                    setPickupAddress(`GPS Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pickup Landmark / Address
                </label>
                <input
                  type="text"
                  required
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="e.g. Near Metro Gate 2, Link Road, Andheri"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Urgency Level (Operational dispatch factor)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as UrgencyLevel[]).map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setUrgency(lvl)}
                      className={`py-2 text-xs rounded-xl font-bold border transition-all cursor-pointer ${
                        urgency === lvl
                          ? lvl === 'CRITICAL'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-amber-500 text-white border-amber-500 shadow-xs'
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
                <Navigation className="w-4 h-4" />
                {loading ? 'Finding Nearest Unit...' : 'Dispatch Nearest Ambulance Now'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
