import React, { useState, useEffect } from 'react';
import { X, FileText, Download, ShieldCheck, FileCheck2 } from 'lucide-react';
import { api } from '../../api/client';
import { DocumentItem } from '../../api/types';

interface DocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentsModal: React.FC<DocumentsModalProps> = ({ isOpen, onClose }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api
      .getMyDocuments()
      .then((data) => setDocuments(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-teal-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <FileCheck2 className="w-6 h-6 text-teal-200" />
            </div>
            <div>
              <h3 className="font-bold text-base">Documents & Medical Records</h3>
              <p className="text-xs text-teal-100">Prescriptions, bills, and discharge summaries</p>
            </div>
          </div>
          <button onClick={onClose} className="text-teal-100 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-emerald-50/70 border-b border-emerald-200/80 text-[11px] text-emerald-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>NABH & ABDM Compliant: Electronic health records & verified hospital discharge summaries.</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-500">Loading patient documents...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">No documents on file yet.</div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-slate-900">{doc.filename}</h5>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="uppercase font-medium text-teal-700">{doc.type}</span>
                      <span>•</span>
                      <span>{doc.file_size_kb} KB</span>
                      <span>•</span>
                      <span>{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Recent'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => alert(`Simulated document download for: ${doc.filename}`)}
                  className="p-2 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors cursor-pointer"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
