import React, { useState } from 'react';
import { Search, UserPlus, FileSpreadsheet, Download, Printer, Eye, Edit3, Trash2, CheckCircle2, Clock, Mail, Phone, Hash, QrCode, Send } from 'lucide-react';
import { exportCandidatesToCsv } from '../utils/csvHelper';

export default function CandidateList({
  candidates,
  selectedCandidate,
  onSelectCandidate,
  onAddCandidate,
  onEditCandidate,
  onDeleteCandidate,
  onOpenBulkImport,
  onDownloadPdf,
  onPrintSingle,
  onOpenBatchPrint,
  onEmailAdmitCard,
  onOpenBatchEmail
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [emailingId, setEmailingId] = useState(null);

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.seatNo.includes(searchTerm) ||
      (c.uniqueCode && c.uniqueCode.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterStatus === 'ALL') return matchesSearch;
    if (filterStatus === 'PRESENT') return matchesSearch && c.attendanceStatus === 'Present';
    if (filterStatus === 'NOT_MARKED') return matchesSearch && c.attendanceStatus !== 'Present';
    return matchesSearch;
  });

  const handleEmailClick = async (c) => {
    setEmailingId(c.id);
    if (onEmailAdmitCard) {
      await onEmailAdmitCard(c);
    }
    setEmailingId(null);
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-2xl glass-panel">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Name, Mobile, Email, Seat No, Unique Code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs sm:text-sm"
            />
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterStatus === 'ALL'
                  ? 'bg-blue-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({candidates.length})
            </button>
            <button
              onClick={() => setFilterStatus('PRESENT')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterStatus === 'PRESENT'
                  ? 'bg-emerald-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Present ({candidates.filter(c => c.attendanceStatus === 'Present').length})
            </button>
            <button
              onClick={() => setFilterStatus('NOT_MARKED')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterStatus === 'NOT_MARKED'
                  ? 'bg-amber-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pending ({candidates.filter(c => c.attendanceStatus !== 'Present').length})
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportCandidatesToCsv(candidates)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
            title="Export full list to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            onClick={onOpenBulkImport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Bulk CSV Import
          </button>

          <button
            onClick={onOpenBatchEmail}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition shadow-sm"
            title="Send all admit cards via email in one tap"
          >
            <Send className="w-3.5 h-3.5" />
            1-Tap Email All
          </button>

          <button
            onClick={onOpenBatchPrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-semibold transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Batch Print All
          </button>

          <button
            onClick={onAddCandidate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Candidate
          </button>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="rounded-2xl glass-panel overflow-hidden border border-slate-800/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Candidate</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5">Seat No & Center</th>
                <th className="p-3.5">Unique QR Code</th>
                <th className="p-3.5 text-center">Attendance</th>
                <th className="p-3.5 text-right">Admit Card Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/30">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No candidates found matching your query.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => {
                  const isSelected = selectedCandidate?.id === c.id;
                  const isPresent = c.attendanceStatus === 'Present';
                  const isEmailingThis = emailingId === c.id;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => onSelectCandidate(c)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-600/15 border-l-4 border-l-blue-500'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Candidate Avatar & Name */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={c.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name)}`}
                            alt={c.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-700 bg-slate-800 shadow-sm"
                          />
                          <div>
                            <div className="font-bold text-sm text-white flex items-center gap-1.5">
                              {c.name}
                              {isSelected && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-normal">
                                  Previewing
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                              {c.examTitle || "गट क - पूर्व परीक्षा 2026"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-300 font-mono">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            {c.phone || "N/A"}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Mail className="w-3 h-3 text-purple-400" />
                            {c.email || "N/A"}
                          </div>
                        </div>
                      </td>

                      {/* Seat No & Center */}
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-blue-400 flex items-center gap-1">
                          <Hash className="w-3.5 h-3.5" />
                          {c.seatNo}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]" title={c.examCentre}>
                          {c.examCentre}
                        </div>
                      </td>

                      {/* Unique QR Code */}
                      <td className="p-3.5">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 font-mono text-[11px] text-blue-300">
                          <QrCode className="w-3.5 h-3.5 text-blue-400" />
                          {c.uniqueCode || c.id}
                        </div>
                      </td>

                      {/* Attendance Status */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            isPresent
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {isPresent ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Present
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              Pending
                            </>
                          )}
                        </span>
                        {c.verifiedAt && (
                          <div className="text-[9px] text-slate-500 mt-0.5">
                            {c.verifiedAt}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            disabled={isEmailingThis}
                            onClick={() => handleEmailClick(c)}
                            className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 transition disabled:opacity-50"
                            title="Email Admit Card PDF to student"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              onSelectCandidate(c);
                              onDownloadPdf(c);
                            }}
                            className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 transition"
                            title="Download 2-Page PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              onSelectCandidate(c);
                              onPrintSingle(c);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                            title="Print Admit Card"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditCandidate(c)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                            title="Edit Candidate"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteCandidate(c.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 border border-rose-500/20 transition"
                            title="Delete Candidate"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
