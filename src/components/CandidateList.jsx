import React, { useState } from 'react';
import {
  Search,
  UserPlus,
  FileSpreadsheet,
  Download,
  Printer,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Hash,
  QrCode,
  Send,
  CheckSquare,
  Square,
  MinusSquare,
  AlertTriangle,
  UserCheck,
  UserX,
  ExternalLink
} from 'lucide-react';
import { exportCandidatesToCsv } from '../utils/csvHelper';

export default function CandidateList({
  candidates,
  selectedCandidate,
  onSelectCandidate,
  onAddCandidate,
  onEditCandidate,
  onDeleteCandidate,
  onDeleteMultipleCandidates,
  onOpenBulkImport,
  onDownloadPdf,
  onPrintSingle,
  onOpenBatchPrint,
  onEmailAdmitCard,
  onOpenBatchEmail,
  onMarkMultipleAttendance
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [emailingId, setEmailingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

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

  // Checkbox toggle logic
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredCandidates.length && filteredCandidates.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCandidates.map(c => c.id));
    }
  };

  const handleToggleSelectRow = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (onDeleteMultipleCandidates) {
      onDeleteMultipleCandidates(selectedIds);
      setSelectedIds([]);
    } else if (onDeleteCandidate) {
      if (window.confirm(`Are you sure you want to delete ${selectedIds.length} candidate(s)?`)) {
        selectedIds.forEach(id => onDeleteCandidate(id));
        setSelectedIds([]);
      }
    }
  };

  const handleEmailClick = async (c) => {
    setEmailingId(c.id);
    if (onEmailAdmitCard) {
      await onEmailAdmitCard(c);
    }
    setEmailingId(null);
  };

  const isAllSelected = filteredCandidates.length > 0 && selectedIds.length === filteredCandidates.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < filteredCandidates.length;

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-3xl glass-panel">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Name, Phone, Email, Seat No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs sm:text-sm"
            />
          </div>

          {/* Filter Status Pills */}
          <div className="flex items-center overflow-x-auto gap-1 bg-slate-900/80 p-1 rounded-2xl border border-slate-800 text-xs shrink-0 no-scrollbar">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                filterStatus === 'ALL'
                  ? 'bg-blue-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({candidates.length})
            </button>
            <button
              onClick={() => setFilterStatus('PRESENT')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                filterStatus === 'PRESENT'
                  ? 'bg-emerald-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Present ({candidates.filter(c => c.attendanceStatus === 'Present').length})
            </button>
            <button
              onClick={() => setFilterStatus('NOT_MARKED')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                filterStatus === 'NOT_MARKED'
                  ? 'bg-amber-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pending ({candidates.filter(c => c.attendanceStatus !== 'Present').length})
            </button>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
          <button
            onClick={() => exportCandidatesToCsv(candidates)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
            title="Export full list to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={onOpenBulkImport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold transition"
            title="Import multiple candidates via CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Bulk CSV</span>
          </button>

          <button
            onClick={onOpenBatchEmail}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition shadow-sm"
            title="1-Tap Email Admit Cards to All Students"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Email All</span>
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
            onClick={onAddCandidate}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition transform hover:-translate-y-0.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Dynamic Multi-Selection Batch Actions Ribbon */}
      {selectedIds.length > 0 && (
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow">
              {selectedIds.length}
            </span>
            <div className="text-xs text-indigo-200 font-semibold">
              <span>{selectedIds.length} Candidate{selectedIds.length > 1 ? 's' : ''} Selected</span>
              <span className="text-slate-400 text-[11px] ml-2 hidden sm:inline">(Manage selected students at once)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Deselect All
            </button>

            <button
              onClick={handleDeleteSelected}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition transform hover:-translate-y-0.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      {/* ================= DESKTOP TABLE VIEW (md and up) ================= */}
      <div className="hidden md:block rounded-3xl glass-panel overflow-hidden border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                {/* Select All Checkbox */}
                <th className="p-3.5 w-10 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    className="text-slate-400 hover:text-white transition"
                    title={isAllSelected ? "Deselect All" : "Select All"}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-400" />
                    ) : isPartiallySelected ? (
                      <MinusSquare className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3.5">Candidate Name</th>
                <th className="p-3.5">Contact Details (Mobile & Email)</th>
                <th className="p-3.5">Seat No & Centre</th>
                <th className="p-3.5">Unique QR UID</th>
                <th className="p-3.5 text-center">Attendance</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/40">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No candidates match your search filter.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => {
                  const isSelected = selectedIds.includes(c.id);
                  const isRowActive = selectedCandidate?.id === c.id;

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-800/40 transition group ${
                        isSelected
                          ? 'bg-blue-600/10 border-l-2 border-blue-500'
                          : isRowActive
                          ? 'bg-slate-800/30'
                          : ''
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleSelectRow(c.id)}
                          className="text-slate-500 hover:text-blue-400 transition"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Candidate Name & Avatar */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              c.photoUrl ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name)}`
                            }
                            alt={c.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-white group-hover:text-blue-400 transition flex items-center gap-1.5">
                              {c.name}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {c.examTitle || 'गट क - पूर्व परीक्षा 2026'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td className="p-3.5 space-y-1">
                        <div className="flex items-center gap-2 text-slate-200">
                          <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-mono font-bold text-emerald-300">
                            {c.phone || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="text-[11px] truncate max-w-[200px]" title={c.email}>
                            {c.email || "N/A"}
                          </span>
                        </div>
                      </td>

                      {/* Seat No & Exam Centre */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                            # Seat: {c.seatNo}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 truncate max-w-[180px]" title={c.examCentre}>
                          {c.examCentre || "(11-12) - Ramanbaug, Pune"}
                        </div>
                      </td>

                      {/* Unique Code */}
                      <td className="p-3.5 font-mono text-[11px] text-purple-300">
                        <span className="bg-purple-950/40 px-2 py-1 rounded border border-purple-800/40">
                          {c.uniqueCode || c.id}
                        </span>
                      </td>

                      {/* Attendance Status */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            c.attendanceStatus === 'Present'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {c.attendanceStatus === 'Present' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Present
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              Pending
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Live Preview */}
                          <button
                            onClick={() => onSelectCandidate(c)}
                            className="p-1.5 rounded-lg hover:bg-blue-600/20 text-slate-400 hover:text-blue-400 transition"
                            title="View Hall Ticket"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Email Admit Card */}
                          <button
                            disabled={emailingId === c.id}
                            onClick={() => handleEmailClick(c)}
                            className="p-1.5 rounded-lg hover:bg-emerald-600/20 text-slate-400 hover:text-emerald-400 transition disabled:opacity-50"
                            title={`Email Admit Card to ${c.email || 'student'}`}
                          >
                            <Mail className="w-4 h-4" />
                          </button>

                          {/* Edit Candidate */}
                          <button
                            onClick={() => onEditCandidate(c)}
                            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                            title="Edit Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Single Candidate */}
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete ${c.name}?`)) {
                                onDeleteCandidate(c.id);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 transition"
                            title="Delete Candidate"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* ================= MOBILE CARDS VIEW (under md) ================= */}
      <div className="md:hidden space-y-3">
        {filteredCandidates.length === 0 ? (
          <div className="p-8 text-center text-slate-500 rounded-2xl glass-panel">
            No candidates match your search filter.
          </div>
        ) : (
          filteredCandidates.map((c) => {
            const isSelected = selectedIds.includes(c.id);
            const isPresent = c.attendanceStatus === 'Present';

            return (
              <div
                key={c.id}
                className={`p-4 rounded-2xl glass-panel space-y-3 transition border ${
                  isSelected
                    ? 'border-blue-500 bg-blue-600/10'
                    : 'border-slate-800'
                }`}
              >
                {/* Top Row: Checkbox, Avatar, Name & Seat No */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleSelectRow(c.id)}
                      className="text-slate-500 hover:text-blue-400 transition p-1"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                    <img
                      src={
                        c.photoUrl ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name)}`
                      }
                      alt={c.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-white text-xs">{c.name}</h4>
                      <p className="text-[11px] text-slate-400">{c.examTitle || 'गट क - पूर्व परीक्षा 2026'}</p>
                    </div>
                  </div>

                  <span className="font-mono font-bold text-blue-400 text-xs bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 shrink-0">
                    #{c.seatNo}
                  </span>
                </div>

                {/* Contact Info (Clickable Phone & Email for Mobile) */}
                <div className="grid grid-cols-1 gap-1.5 pt-2 border-t border-slate-800/80 text-xs">
                  <a
                    href={`tel:${c.phone}`}
                    className="flex items-center gap-2 text-emerald-300 font-mono font-bold hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{c.phone || "No phone"}</span>
                  </a>

                  <a
                    href={`mailto:${c.email}`}
                    className="flex items-center gap-2 text-slate-300 font-mono text-[11px] truncate hover:underline"
                  >
                    <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="truncate">{c.email || "No email"}</span>
                  </a>
                </div>

                {/* Exam Centre & Status */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400 truncate max-w-[180px]">
                    {c.examCentre || "(11-12) - Ramanbaug, Pune"}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold shrink-0 ${
                      isPresent
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {isPresent ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {isPresent ? 'Present' : 'Pending'}
                  </span>
                </div>

                {/* Mobile Action Buttons Bar */}
                <div className="flex items-center justify-between gap-1 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => onSelectCandidate(c)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-semibold text-xs transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Hall Ticket</span>
                  </button>

                  <button
                    disabled={emailingId === c.id}
                    onClick={() => handleEmailClick(c)}
                    className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 transition disabled:opacity-50"
                    title="Email Admit Card"
                  >
                    <Mail className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onEditCandidate(c)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Edit Candidate"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete ${c.name}?`)) {
                        onDeleteCandidate(c.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 transition"
                    title="Delete Candidate"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
