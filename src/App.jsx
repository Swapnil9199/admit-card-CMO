import React, { useState, useEffect, useRef } from 'react';
import {
  DEFAULT_INSTITUTE_INFO,
  DEFAULT_TIMETABLE,
  DEFAULT_RULES_MARATHI,
  DEFAULT_PROHIBITED_ITEMS,
  INITIAL_CANDIDATES
} from './data/defaultData';
import Navbar from './components/Navbar';
import AdmitCard from './components/AdmitCard';
import CandidateList from './components/CandidateList';
import CandidateModal from './components/CandidateModal';
import BulkImportModal from './components/BulkImportModal';
import TemplateCustomizer from './components/TemplateCustomizer';
import QrScannerView from './components/QrScannerView';
import AttendanceLogs from './components/AttendanceLogs';
import BatchPrintModal from './components/BatchPrintModal';
import BatchEmailModal from './components/BatchEmailModal';
import SmtpConfigModal from './components/SmtpConfigModal';
import Toast from './components/Toast';
import { downloadAdmitCardPdf, generateAdmitCardPdfBase64 } from './utils/pdfGenerator';
import { sendAdmitCardEmail, getSmtpConfig } from './services/emailService';
import {
  Printer,
  Download,
  Users,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Sparkles,
  Layers,
  CheckCircle2,
  FileDown,
  Mail,
  Send,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  // LocalStorage-backed state or defaults
  const [candidates, setCandidates] = useState(() => {
    const saved = localStorage.getItem('cm_candidates');
    return saved ? JSON.parse(saved) : INITIAL_CANDIDATES;
  });

  const [instituteInfo, setInstituteInfo] = useState(() => {
    const saved = localStorage.getItem('cm_institute');
    return saved ? JSON.parse(saved) : DEFAULT_INSTITUTE_INFO;
  });

  const [timetable, setTimetable] = useState(() => {
    const saved = localStorage.getItem('cm_timetable');
    return saved ? JSON.parse(saved) : DEFAULT_TIMETABLE;
  });

  const [rules, setRules] = useState(() => {
    const saved = localStorage.getItem('cm_rules');
    return saved ? JSON.parse(saved) : DEFAULT_RULES_MARATHI;
  });

  const [prohibitedItems, setProhibitedItems] = useState(() => {
    const saved = localStorage.getItem('cm_prohibited');
    return saved ? JSON.parse(saved) : DEFAULT_PROHIBITED_ITEMS;
  });

  // Admin SMTP configuration state
  const [adminSmtpInfo, setAdminSmtpInfo] = useState({
    adminName: 'Combine Mentor Official',
    adminEmail: 'admin@combinementor.in'
  });

  // Navigation and UI state
  const [activeTab, setActiveTab] = useState('PREVIEW'); // 'PREVIEW', 'CANDIDATES', 'SCANNER', 'LOGS', 'SETTINGS'
  const [selectedCandidateId, setSelectedCandidateId] = useState(candidates[0]?.id || null);

  // Modals and Toast state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState(false);
  const [isBatchEmailOpen, setIsBatchEmailOpen] = useState(false);
  const [isSmtpModalOpen, setIsSmtpModalOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailCandidateTarget, setEmailCandidateTarget] = useState(null);
  const [toast, setToast] = useState(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('cm_candidates', JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem('cm_institute', JSON.stringify(instituteInfo));
  }, [instituteInfo]);

  useEffect(() => {
    localStorage.setItem('cm_timetable', JSON.stringify(timetable));
  }, [timetable]);

  useEffect(() => {
    localStorage.setItem('cm_rules', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('cm_prohibited', JSON.stringify(prohibitedItems));
  }, [prohibitedItems]);

  // Load SMTP config on mount
  useEffect(() => {
    getSmtpConfig().then((res) => {
      if (res && res.success && res.config) {
        setAdminSmtpInfo(res.config);
      }
    });
  }, []);

  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId) || candidates[0] || null;
  const currentCandidateIndex = candidates.findIndex(c => c.id === selectedCandidate?.id);

  // Helper to show notification
  const showToast = (type, message, recipient = '') => {
    setToast({ type, message, recipient });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 6000);
  };

  // Automated & Manual Email Dispatch
  const dispatchAdmitCardEmail = async (candidateObj) => {
    if (!candidateObj) return;

    if (!candidateObj.email) {
      showToast('error', 'Admit card generated successfully, but we could not send it to the email address. Please try again.', 'No email address registered');
      return;
    }

    setIsSendingEmail(true);
    setEmailCandidateTarget(candidateObj);

    // Give react time to render the offscreen card
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      // Generate PDF base64 from the offscreen admit card container
      const { pdfBase64, filename } = await generateAdmitCardPdfBase64('admit-card-email-render', candidateObj.name);

      const result = await sendAdmitCardEmail({
        recipientEmail: candidateObj.email,
        recipientName: candidateObj.name,
        seatNo: candidateObj.seatNo,
        examTitle: candidateObj.examTitle || instituteInfo.examTitle,
        examCentre: candidateObj.examCentre,
        pdfBase64,
        filename
      });

      if (result.success) {
        showToast('success', 'Admit card generated successfully and sent to your email.', candidateObj.email);
        confetti({
          particleCount: 60,
          spread: 50,
          origin: { y: 0.7 }
        });
      } else {
        showToast('error', 'Admit card generated successfully, but we could not send it to the email address. Please try again.', candidateObj.email);
      }
    } catch (err) {
      console.error("Admit Card Email Generation Error:", err);
      showToast('error', 'Admit card generated successfully, but we could not send it to the email address. Please try again.', candidateObj.email);
    } finally {
      setIsSendingEmail(false);
      setEmailCandidateTarget(null);
    }
  };

  // Candidate Operations
  const handleSaveCandidate = async (candidateData) => {
    let updatedCandidates;
    if (editingCandidate) {
      updatedCandidates = candidates.map(c => (c.id === candidateData.id ? candidateData : c));
    } else {
      updatedCandidates = [candidateData, ...candidates];
    }

    setCandidates(updatedCandidates);
    setSelectedCandidateId(candidateData.id);

    // Automatically email the generated admit card to the user
    dispatchAdmitCardEmail(candidateData);
  };

  const handleDeleteCandidate = (id) => {
    if (window.confirm("Are you sure you want to delete this candidate?")) {
      const remaining = candidates.filter(c => c.id !== id);
      setCandidates(remaining);
      if (selectedCandidateId === id) {
        setSelectedCandidateId(remaining[0]?.id || null);
      }
    }
  };

  const handleDeleteMultipleCandidates = (idsToDelete) => {
    if (!idsToDelete || idsToDelete.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${idsToDelete.length} selected candidate(s)?`)) {
      const remaining = candidates.filter(c => !idsToDelete.includes(c.id));
      setCandidates(remaining);
      if (idsToDelete.includes(selectedCandidateId)) {
        setSelectedCandidateId(remaining[0]?.id || null);
      }
      showToast('success', `Successfully deleted ${idsToDelete.length} candidate(s).`);
    }
  };

  const handleBulkImport = (importedList) => {
    setCandidates([...importedList, ...candidates]);
    setSelectedCandidateId(importedList[0]?.id || selectedCandidateId);
    setActiveTab('CANDIDATES');
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Attendance marking
  const handleMarkAttendance = (candidateId, status = 'Present') => {
    const nowStr = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' ' + new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    setCandidates(candidates.map(c => {
      if (c.id === candidateId) {
        return {
          ...c,
          attendanceStatus: status,
          verifiedAt: status === 'Present' ? nowStr : null
        };
      }
      return c;
    }));
  };

  const handleResetAllAttendance = () => {
    if (window.confirm("Are you sure you want to reset all candidate attendance logs?")) {
      setCandidates(candidates.map(c => ({ ...c, attendanceStatus: 'Not Marked', verifiedAt: null })));
    }
  };

  // PDF & Print Actions
  const handleDownloadSinglePdf = async (candidateObj) => {
    const target = candidateObj || selectedCandidate;
    if (!target) return;
    setIsDownloadingPdf(true);
    try {
      await downloadAdmitCardPdf('admit-card-live-preview', target.name);
    } catch (err) {
      console.error(err);
      alert(`Error generating PDF: ${err.message || 'Unknown error'}`);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrintSingle = (candidateObj) => {
    if (candidateObj && candidateObj.id !== selectedCandidateId) {
      setSelectedCandidateId(candidateObj.id);
    }
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const presentCount = candidates.filter(c => c.attendanceStatus === 'Present').length;

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Toast Notification Alert */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        candidateCount={candidates.length}
        presentCount={presentCount}
        onOpenAddModal={() => {
          setEditingCandidate(null);
          setIsAddModalOpen(true);
        }}
        onOpenBatchPrint={() => setIsBatchPrintOpen(true)}
        onOpenBatchEmail={() => setIsBatchEmailOpen(true)}
        onOpenSmtpModal={() => setIsSmtpModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ================= TAB 1: ADMIT CARD LIVE PREVIEW ================= */}
        {activeTab === 'PREVIEW' && (
          <div className="space-y-6">
            {/* Candidate Selector Ribbon */}
            <div className="no-print p-4 rounded-2xl glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Candidate Switcher */}
              <div className="flex items-center gap-3">
                <button
                  disabled={currentCandidateIndex <= 0}
                  onClick={() => setSelectedCandidateId(candidates[currentCandidateIndex - 1]?.id)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition"
                  title="Previous Candidate"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3">
                  <img
                    src={selectedCandidate?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedCandidate?.name || 'User')}`}
                    alt={selectedCandidate?.name}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedCandidate?.id || ''}
                        onChange={(e) => setSelectedCandidateId(e.target.value)}
                        className="font-bold text-sm bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        {candidates.map((c, idx) => (
                          <option key={c.id} value={c.id}>
                            #{idx + 1} - {c.name} ({c.seatNo})
                          </option>
                        ))}
                      </select>

                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-xs font-semibold">
                        Seat: {selectedCandidate?.seatNo}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      Email: {selectedCandidate?.email || 'N/A'} • UID: {selectedCandidate?.uniqueCode || selectedCandidate?.id}
                    </p>
                  </div>
                </div>

                <button
                  disabled={currentCandidateIndex >= candidates.length - 1}
                  onClick={() => setSelectedCandidateId(candidates[currentCandidateIndex + 1]?.id)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition"
                  title="Next Candidate"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* 1-Tap Email All Button */}
                <button
                  onClick={() => setIsBatchEmailOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition"
                  title="Send all admit cards to all candidates in one tap"
                >
                  <Send className="w-3.5 h-3.5" />
                  1-Tap Email All ({candidates.length})
                </button>

                {/* Email Single Admit Card Button */}
                <button
                  disabled={isSendingEmail}
                  onClick={() => dispatchAdmitCardEmail(selectedCandidate)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition transform hover:-translate-y-0.5"
                  title="Send Admit Card PDF directly to student email"
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Sending Email...
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5" />
                      Email Admit Card
                    </>
                  )}
                </button>

                {/* Attendance Quick Toggle */}
                <button
                  onClick={() => handleMarkAttendance(selectedCandidate?.id, selectedCandidate?.attendanceStatus === 'Present' ? 'Not Marked' : 'Present')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                    selectedCandidate?.attendanceStatus === 'Present'
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  {selectedCandidate?.attendanceStatus === 'Present' ? 'Present ✓' : 'Mark Present'}
                </button>

                {/* Print Single */}
                <button
                  onClick={() => handlePrintSingle(selectedCandidate)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Hall Ticket
                </button>

                {/* Download PDF */}
                <button
                  disabled={isDownloadingPdf}
                  onClick={() => handleDownloadSinglePdf(selectedCandidate)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isDownloadingPdf ? 'Generating PDF...' : 'Download 2-Page PDF'}
                </button>
              </div>
            </div>

            {/* Live Admit Card Document View */}
            <div className="flex justify-center p-2 sm:p-4 bg-slate-900/40 rounded-3xl border border-slate-800/80 shadow-2xl">
              <AdmitCard
                id="admit-card-live-preview"
                candidate={selectedCandidate}
                instituteInfo={instituteInfo}
                timetable={timetable}
                rules={rules}
                prohibitedItems={prohibitedItems}
              />
            </div>
          </div>
        )}

        {/* ================= TAB 2: CANDIDATES LIST ================= */}
        {activeTab === 'CANDIDATES' && (
          <CandidateList
            candidates={candidates}
            selectedCandidate={selectedCandidate}
            onSelectCandidate={(c) => {
              setSelectedCandidateId(c.id);
              setActiveTab('PREVIEW');
            }}
            onAddCandidate={() => {
              setEditingCandidate(null);
              setIsAddModalOpen(true);
            }}
            onEditCandidate={(c) => {
              setEditingCandidate(c);
              setIsAddModalOpen(true);
            }}
            onDeleteCandidate={handleDeleteCandidate}
            onDeleteMultipleCandidates={handleDeleteMultipleCandidates}
            onOpenBulkImport={() => setIsBulkImportOpen(true)}
            onDownloadPdf={(c) => {
              setSelectedCandidateId(c.id);
              setTimeout(() => handleDownloadSinglePdf(c), 100);
            }}
            onPrintSingle={handlePrintSingle}
            onOpenBatchPrint={() => setIsBatchPrintOpen(true)}
            onEmailAdmitCard={dispatchAdmitCardEmail}
            onOpenBatchEmail={() => setIsBatchEmailOpen(true)}
          />
        )}

        {/* ================= TAB 3: QR ATTENDANCE SCANNER ================= */}
        {activeTab === 'SCANNER' && (
          <QrScannerView
            candidates={candidates}
            onMarkAttendance={handleMarkAttendance}
          />
        )}

        {/* ================= TAB 4: ATTENDANCE RECORDS / LOGS ================= */}
        {activeTab === 'LOGS' && (
          <AttendanceLogs
            candidates={candidates}
            onMarkAttendance={handleMarkAttendance}
            onResetAllAttendance={handleResetAllAttendance}
          />
        )}

        {/* ================= TAB 5: TEMPLATE & TIMETABLE CUSTOMIZER ================= */}
        {activeTab === 'SETTINGS' && (
          <TemplateCustomizer
            instituteInfo={instituteInfo}
            setInstituteInfo={setInstituteInfo}
            timetable={timetable}
            setTimetable={setTimetable}
            rules={rules}
            setRules={setRules}
            prohibitedItems={prohibitedItems}
            setProhibitedItems={setProhibitedItems}
            onOpenSmtpModal={() => setIsSmtpModalOpen(true)}
          />
        )}
      </main>

      {/* Hidden Offscreen Admit Card Renderer for background PDF email generation */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none opacity-0" aria-hidden="true">
        <AdmitCard
          id="admit-card-email-render"
          candidate={emailCandidateTarget || selectedCandidate}
          instituteInfo={instituteInfo}
          timetable={timetable}
          rules={rules}
          prohibitedItems={prohibitedItems}
        />
      </div>

      {/* Candidate Add/Edit Modal */}
      <CandidateModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingCandidate(null);
        }}
        onSave={handleSaveCandidate}
        candidate={editingCandidate}
      />

      {/* Bulk CSV Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImport={handleBulkImport}
        defaultExamTitle={instituteInfo.examTitle}
      />

      {/* Batch Print All Modal */}
      <BatchPrintModal
        isOpen={isBatchPrintOpen}
        onClose={() => setIsBatchPrintOpen(false)}
        candidates={candidates}
        instituteInfo={instituteInfo}
        timetable={timetable}
        rules={rules}
        prohibitedItems={prohibitedItems}
      />

      {/* 1-Tap Batch Email Dispatch Modal */}
      <BatchEmailModal
        isOpen={isBatchEmailOpen}
        onClose={() => setIsBatchEmailOpen(false)}
        candidates={candidates}
        instituteInfo={instituteInfo}
        onSetCurrentCandidateForRender={(c) => setEmailCandidateTarget(c)}
        adminSmtpInfo={adminSmtpInfo}
      />

      {/* Admin SMTP Settings Modal */}
      <SmtpConfigModal
        isOpen={isSmtpModalOpen}
        onClose={() => setIsSmtpModalOpen(false)}
        onSaveSuccess={(newConfig) => {
          setAdminSmtpInfo(newConfig);
          showToast('success', 'Admin SMTP settings saved successfully!');
        }}
      />
    </div>
  );
}
