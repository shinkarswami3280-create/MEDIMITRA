import React, { useState } from 'react';
import { X, Send, PhoneCall, PhoneOff, MessageSquare, Bot, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  sender: 'user' | 'bot';
  text: string;
  time: string;
  intent?: string;
  actionTaken?: string;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'voice'>('whatsapp');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: 'Namaste! I am your MediMitra healthcare coordination assistant. How can I help you coordinate care today? (Try typing: "Emergency ambulance", "Need O+ blood", "Book appointment", or test medical advice refusal)',
      time: '12:00 PM',
      intent: 'HELP',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [voiceLog, setVoiceLog] = useState<string[]>([
    'Voice coordination engine ready. Zero API keys required.',
  ]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    try {
      const res = await api.sendAssistantChat(query, activeTab);
      const botMsg: Message = {
        sender: 'bot',
        text: res.response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: res.intent,
        actionTaken: res.action_taken,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `Coordination service error: ${err.message}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const handleVoiceTest = async (speechText: string) => {
    setVoiceLog((prev) => [...prev, `👤 Patient: "${speechText}"`]);
    try {
      const res = await api.simulateVoiceCall(speechText);
      setVoiceLog((prev) => [
        ...prev,
        `🤖 MediMitra Voice (Aditi): "${res.response}"`,
        `📌 Intent Classified: [${res.intent}]`,
      ]);
    } catch (err: any) {
      setVoiceLog((prev) => [...prev, `❌ Error: ${err.message}`]);
    }
  };

  const samplePrompts = [
    { label: '🩺 Test Medical Refusal', text: 'I have severe fever and chest pain, what medicine should I take?' },
    { label: '🚨 Emergency Ambulance', text: 'Emergency! Send an ambulance to Andheri station immediately.' },
    { label: '🩸 Need O+ Blood', text: 'Urgent requirement of 2 units of O+ blood.' },
    { label: '📅 Book Appointment', text: 'I want to book an appointment for General Medicine.' },
    { label: '📋 Check Status', text: 'What is the current status of my requests?' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base">MediMitra Simulated Assistant</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-medium border border-emerald-500/30">
                  Demo Mode (Zero Keys)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Interactive coordination engine with strict medical disclaimer safeguard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channel Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-white text-emerald-700 border-t-2 border-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            WhatsApp Simulator
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'voice'
                ? 'bg-white text-sky-700 border-t-2 border-sky-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PhoneCall className="w-4 h-4 text-sky-600" />
            Voice Call Console (Simulated)
          </button>
        </div>

        {/* Safeguard Notice */}
        <div className="bg-amber-50/70 border-b border-amber-200/60 px-6 py-2 flex items-center justify-between text-[11px] text-amber-800">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            Active Rule: Medical inquiries automatically trigger scripted coordination refusal
          </span>
          <span className="text-[10px] text-amber-700/80">Non-Clinical Coordination Only</span>
        </div>

        {/* Content Body */}
        {activeTab === 'whatsapp' ? (
          <div className="flex-1 flex flex-col p-4 overflow-hidden bg-slate-50">
            {/* Quick Test Prompt Chips */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p.text)}
                  className="text-[11px] bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-slate-700 px-2.5 py-1 rounded-full shadow-2xs transition-all cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Chat Thread */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-[#e5ddd5]/30 rounded-xl border border-slate-200 mb-3 min-h-[260px] max-h-[340px]">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-xs text-xs whitespace-pre-line leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-xs'
                        : m.intent === 'MEDICAL_REFUSAL'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 rounded-tl-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                    }`}
                  >
                    {m.intent === 'MEDICAL_REFUSAL' && (
                      <div className="flex items-center gap-1 font-semibold text-amber-800 mb-1 text-[10px] uppercase">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Medical Disclaimer Guard
                      </div>
                    )}
                    {m.text}
                    <div
                      className={`text-[9px] mt-1 text-right ${
                        m.sender === 'user' ? 'text-emerald-100' : 'text-slate-400'
                      }`}
                    >
                      {m.time} {m.intent && `• [${m.intent}]`}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message (e.g. 'book', 'ambulance', or ask medical advice)..."
                className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 p-6 flex flex-col justify-between bg-slate-900 text-white">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-2 border border-sky-400/30">
                <PhoneCall className={`w-8 h-8 ${isCalling ? 'animate-pulse' : ''}`} />
              </div>
              <h4 className="font-semibold text-base">MediMitra Inbound Voice Line</h4>
              <p className="text-xs text-slate-400">1800-MEDIMITRA (Simulated Interactive TwiML)</p>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-2 max-h-52 overflow-y-auto border border-slate-700">
              {voiceLog.map((line, idx) => (
                <div key={idx} className="leading-relaxed">
                  {line}
                </div>
              ))}
            </div>

            <div className="mt-4">
              <p className="text-[11px] text-slate-400 mb-2 font-medium">Click simulated caller speech:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleVoiceTest('I need an ambulance immediately')}
                  className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-600 cursor-pointer"
                >
                  "Need ambulance"
                </button>
                <button
                  onClick={() => handleVoiceTest('Can you diagnose my fever and vomiting?')}
                  className="text-xs bg-amber-900/40 hover:bg-amber-900/60 text-amber-300 px-3 py-1.5 rounded-lg border border-amber-700/50 cursor-pointer"
                >
                  "Diagnose fever" (Refusal check)
                </button>
                <button
                  onClick={() => handleVoiceTest('Check status of my appointment')}
                  className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-600 cursor-pointer"
                >
                  "Check status"
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
