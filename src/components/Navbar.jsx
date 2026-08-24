import React from 'react';
import { Award, Users, QrCode, ClipboardCheck, Settings, Download, Printer, Plus, Send, Mail } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  candidateCount,
  presentCount,
  onOpenAddModal,
  onOpenBatchPrint,
  onOpenBatchEmail,
  onOpenSmtpModal
}) {
  const tabs = [
    { id: 'PREVIEW', label: 'Admit Card Live Preview', icon: Award },
    { id: 'CANDIDATES', label: `Candidates List (${candidateCount})`, icon: Users },
    { id: 'SCANNER', label: 'QR Attendance Scanner', icon: QrCode },
    { id: 'LOGS', label: `Attendance Records (${presentCount}/${candidateCount})`, icon: ClipboardCheck },
    { id: 'SETTINGS', label: 'Template & Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center overflow-hidden">
              <img
                src="/assets/combine_mentor_logo.jpg"
                alt="Logo"
                className="w-full h-full object-cover rounded-[10px]"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span class="text-white font-black text-xs">CM</span>';
                }}
              />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base text-white tracking-wide flex items-center gap-2">
                <span>COMBINE MENTOR</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold border border-blue-500/30">
                  Admit Card & Attendance
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Hall Ticket Generator & 1-Tap Email Dispatch System
              </div>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            {/* 1-Tap Send All Email */}
            <button
              onClick={onOpenBatchEmail}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition shadow-sm"
              title="Send All Admit Cards via Email in One Tap"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">1-Tap Email All</span>
            </button>

            {/* Admin SMTP Config */}
            <button
              onClick={onOpenSmtpModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
              title="Configure Admin Sender Email & SMTP"
            >
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden xl:inline">SMTP Settings</span>
            </button>

            <button
              onClick={onOpenBatchPrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-semibold transition"
              title="Batch Print All Hall Tickets"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Batch Print</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Student</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center overflow-x-auto py-2 gap-1 border-t border-slate-800/60 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
