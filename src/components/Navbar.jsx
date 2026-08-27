import React from 'react';
import { Award, Users, QrCode, ClipboardCheck, Settings, Printer, Plus, Send, Mail, LogOut, ShieldCheck, User } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  candidateCount,
  presentCount,
  currentAdmin,
  onLogout,
  onOpenAddModal,
  onOpenBatchPrint,
  onOpenBatchEmail,
  onOpenSmtpModal
}) {
  const tabs = [
    { id: 'PREVIEW', label: 'Live Preview', icon: Award },
    { id: 'CANDIDATES', label: `Candidates (${candidateCount})`, icon: Users },
    { id: 'SCANNER', label: 'QR Scanner', icon: QrCode },
    { id: 'LOGS', label: `Attendance (${presentCount}/${candidateCount})`, icon: ClipboardCheck },
    { id: 'SETTINGS', label: 'Template & Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center overflow-hidden shrink-0">
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
              <div className="font-extrabold text-xs sm:text-base text-white tracking-wide flex items-center gap-1.5 sm:gap-2">
                <span>COMBINE MENTOR</span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[9px] sm:text-[10px] font-bold border border-blue-500/30 whitespace-nowrap">
                  Admin Panel
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden md:block">
                Hall Ticket Generator & Attendance System
              </div>
            </div>
          </div>

          {/* Desktop Nav Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
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

          {/* Quick Header Actions & Admin Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Multi-Device Live Sync Badge */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 shrink-0 cursor-default"
              title="Real-Time Multi-Device Sync Active (Auto-syncs attendance, candidates, and settings across all admin devices)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Sync</span>
            </div>

            {/* 1-Tap Send All Email */}
            <button
              onClick={onOpenBatchEmail}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-[11px] sm:text-xs font-bold transition shadow-sm shrink-0"
              title="Send All Admit Cards via Email in One Tap"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">1-Tap Email All</span>
            </button>

            {/* Admin SMTP Config */}
            <button
              onClick={onOpenSmtpModal}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] sm:text-xs font-semibold transition shrink-0"
              title="Configure Admin Sender Email & SMTP"
            >
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden xl:inline">SMTP Settings</span>
            </button>

            {/* Batch Print */}
            <button
              onClick={onOpenBatchPrint}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-[11px] sm:text-xs font-semibold transition shrink-0"
              title="Batch Print All Hall Tickets"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Batch Print</span>
            </button>

            {/* Add Student */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] sm:text-xs font-bold shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>

            {/* Logged in Admin Badge & Logout */}
            <div className="flex items-center gap-1 pl-1 border-l border-slate-800 ml-1">
              <div
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300"
                title={`Logged in as ${currentAdmin?.name || 'Admin'} (${currentAdmin?.email})`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate max-w-[110px] font-semibold">{currentAdmin?.name?.split(' ')[0] || 'Admin'}</span>
              </div>

              <button
                onClick={onLogout}
                className="p-1.5 sm:p-2 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-300 transition"
                title="Logout Admin Session"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Horizontal Scroll Bar */}
        <div className="lg:hidden flex items-center overflow-x-auto py-2 gap-1 border-t border-slate-800/60 no-scrollbar touch-pan-x">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800/50'
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
