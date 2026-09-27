import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';
import { Hospital, AppointmentSlot } from '../../api/types';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);
  const [services, setServices] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    api
      .getHospitals()
      .then((data) => {
        setHospitals(data);
        if (data.length > 0) {
          setSelectedHospitalId(data[0].id);
          try {
            const sList = JSON.parse(data[0].services || '[]');
            setServices(sList);
            if (sList.length > 0) setSelectedService(sList[0]);
          } catch {
            setServices(['General Medicine', 'Cardiology', 'Pediatrics']);
            setSelectedService('General Medicine');
          }
        }
      })
      .catch((e) => setError(e.message));
  }, [isOpen]);

  useEffect(() => {
    if (!selectedHospitalId) return;
    const h = hospitals.find((item) => item.id === selectedHospitalId);
    if (h) {
      try {
        const sList = JSON.parse(h.services || '[]');
        setServices(sList);
        if (!sList.includes(selectedService) && sList.length > 0) {
          setSelectedService(sList[0]);
        }
      } catch {
        // fallback
      }
    }
  }, [selectedHospitalId]);

  useEffect(() => {
    if (!selectedHospitalId) return;
    setLoading(true);
    api
      .getSlots(selectedHospitalId, selectedService)
      .then((data) => {
        setSlots(data.filter((s) => s.is_available));
        if (data.length > 0) setSelectedSlotId(data[0].id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedHospitalId, selectedService]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospitalId || !selectedSlotId || !selectedService) return;
    setLoading(true);
    setError(null);
    try {
      await api.bookAppointment({
        hospital_id: selectedHospitalId,
        service: selectedService,
        slot_id: selectedSlotId,
        notes,
      });
      setConfirmed(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setConfirmed(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-700 text-white">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-200" />
            <div>
              <h3 className="font-semibold text-base">Book Appointment</h3>
              <p className="text-[11px] text-emerald-200">अपॉइंटमेंट बुक करें · Real-time hospital sync</p>
            </div>
          </div>
          <button onClick={onClose} className="text-emerald-100 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmed ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-slate-800 text-lg">Booking Confirmed!</h4>
            <p className="text-xs text-slate-500">
              Your appointment is instantly registered and visible in the hospital queue.
            </p>
          </div>
        ) : (
          <form onSubmit={handleBooking} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Select Hospital */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Hospital / Facility
              </label>
              <select
                value={selectedHospitalId || ''}
                onChange={(e) => setSelectedHospitalId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.address})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Department / Service */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Department / Service
              </label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {services.map((s, idx) => (
                  <option key={idx} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Time Slot */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Available Time Slots (Synced live)
              </label>
              {loading ? (
                <div className="p-4 text-center text-xs text-slate-500 animate-pulse">
                  Checking real-time slot capacity...
                </div>
              ) : slots.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                  No slots open for selected department today. Check tomorrow's schedule.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                  {slots.map((s) => {
                    const dt = new Date(s.slot_datetime);
                    const formatted = dt.toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const isSelected = selectedSlotId === s.id;
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => setSelectedSlotId(s.id)}
                        className={`p-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold shadow-2xs'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{formatted}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {s.capacity - s.booked} spots left
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Visit / Symptoms (Administrative notes only)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Regular follow-up, consultation"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !selectedSlotId}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
            >
              {loading ? 'Confirming with Hospital Queue...' : 'Confirm Appointment'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
