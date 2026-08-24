import React, { useState } from 'react';
import { CheckCircle2, Clock, XCircle, Download, Search, RefreshCw, Users } from 'lucide-react';
import { exportAttendanceReport } from '../utils/csvHelper';

export default function AttendanceLogs({ candidates, onMarkAttendance, onResetAllAttendance }) {
  const [searchTerm, setSearchTerm] = useState('');

  const total = candidates.length;
  const presentCount = candidates.filter(c => c.attendanceStatus === 'Present').length;
  const absentCount = candidates.filter(c => c.attendanceStatus === 'Absent').length;
  const pendingCount = total - presentCount - absentCount;
  const percentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  const filtered = candidates.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.seatNo.includes(searchTerm) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.uniqueCode && c.uniqueCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Attendance Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Candidates */}
        <div className="p-4 rounded-2xl glass-panel flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{total}</div>
            <div className="text-xs text-slate-400 font-medium">Total Registered</div>
          </div>
        </div>

        {/* Present */}
        <div className="p-4 rounded-2xl glass-panel flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400">{presentCount}</div>
            <div className="text-xs text-slate-400 font-medium">Present Candidates</div>
          </div>
        </div>

        {/* Pending */}
        <div className="p-4 rounded-2xl glass-panel flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-400">{pendingCount}</div>
            <div className="text-xs text-slate-400 font-medium">Pending Entry</div>
          </div>
        </div>

        {/* Turnout % */}
        <div className="p-4 rounded-2xl glass-panel flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
            <span className="font-mono font-bold text-lg">%</span>
          </div>
          <div>
            <div className="text-2xl font-black text-purple-400">{percentage}%</div>
            <div className="text-xs text-slate-400 font-medium">Attendance Rate</div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl glass-panel">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate attendance logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportAttendanceReport(candidates)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export Attendance Report (CSV)
          </button>
          <button
            onClick={onResetAllAttendance}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition"
            title="Reset all attendance statuses"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="rounded-2xl glass-panel overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Seat No</th>
                <th className="p-3.5">Candidate Name</th>
                <th className="p-3.5">Mobile & Email</th>
                <th className="p-3.5">Unique QR Code</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5">Verified At</th>
                <th className="p-3.5 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No records found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const isPresent = c.attendanceStatus === 'Present';
                  const isAbsent = c.attendanceStatus === 'Absent';

                  return (
                    <tr key={c.id} className="hover:bg-slate-800/30">
                      <td className="p-3.5 font-mono font-bold text-blue-400">{c.seatNo}</td>
                      <td className="p-3.5 font-semibold text-white">{c.name}</td>
                      <td className="p-3.5 text-slate-400 font-mono">
                        <div>{c.phone || "N/A"}</div>
                        <div className="text-[11px] text-slate-500">{c.email || "N/A"}</div>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-purple-300">
                        {c.uniqueCode || c.id}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            isPresent
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isAbsent
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {isPresent ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Present
                            </>
                          ) : isAbsent ? (
                            <>
                              <XCircle className="w-3 h-3 text-rose-400" />
                              Absent
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              Pending
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                        {c.verifiedAt || "—"}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onMarkAttendance(c.id, isPresent ? 'Not Marked' : 'Present')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                              isPresent
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            {isPresent ? 'Unmark' : 'Mark Present'}
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
