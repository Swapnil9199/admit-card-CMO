import React, { useState, useEffect, useRef } from 'react';
import {
  DEFAULT_INSTITUTE_INFO,
  DEFAULT_TIMETABLE,
  DEFAULT_RULES_MARATHI,
  DEFAULT_PROHIBITED_ITEMS,
  INITIAL_CANDIDATES,
  DEFAULT_EXAM_CENTRES
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
import AuthPortal from './components/AuthPortal';
import Toast from './components/Toast';
import { downloadAdmitCardPdf, generateAdmitCardPdfBase64 } from './utils/pdfGenerator';
import { sendAdmitCardEmail, getSmtpConfig } from './services/emailService';
import { getCurrentAdmin, logoutAdmin } from './services/authService';
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
  // Admin Authentication Session State
  const [currentAdmin, setCurrentAdmin] = useState(() => getCurrentAdmin());

  // Auto-sync template updates from code when codebase is edited
  const CURRENT_TEMPLATE_VER = 'cm_tpl_v2026_mpsc_c_sync';

  // Exam Centres State (Default: S.P. College Pune)
  const [examCentres, setExamCentres] = useState(() => {
    if (localStorage.getItem('cm_tpl_sync') !== CURRENT_TEMPLATE_VER) {
      return DEFAULT_EXAM_CENTRES;
    }
    const saved = localStorage.getItem('cm_exam_centres');
    return saved ? JSON.parse(saved) : DEFAULT_EXAM_CENTRES;
  });

  // LocalStorage-backed state or defaults
  const [candidates, setCandidates] = useState(() => {
    if (localStorage.getItem('cm_tpl_sync') !== CURRENT_TEMPLATE_VER) {
      return INITIAL_CANDIDATES;
    }
    const saved = localStorage.getItem('cm_candidates');
    return saved ? JSON.parse(saved) : INITIAL_CANDIDATES;
  });

  const [instituteInfo, setInstituteInfo] = useState(() => {
    if (localStorage.getItem('cm_tpl_sync') !== CURRENT_TEMPLATE_VER) {
      return DEFAULT_INSTITUTE_INFO;
    }
    const saved = localStorage.getItem('cm_institute');
    return saved ? { ...DEFAULT_INSTITUTE_INFO, ...JSON.parse(saved) } : DEFAULT_INSTITUTE_INFO;
  });

  const [timetable, setTimetable] = useState(() => {
    if (localStorage.getItem('cm_tpl_sync') !== CURRENT_TEMPLATE_VER) {
      return DEFAULT_TIMETABLE;
    }
    const saved = localStorage.getItem('cm_timetable');
    return saved ? JSON.parse(saved) : DEFAULT_TIMETABLE;
  });

  const [rules, setRules] = useState(() => {
    if (localStorage.getItem('cm_tpl_sync') !== CURRENT_TEMPLATE_VER) {
      return DEFAULT_RULES_MARATHI;
    }
    const saved = localStorage.getItem('cm_rules');
    return saved ? JSON.parse(saved) : DEFAULT_RULES_MARATHI;
  });

  const [prohibitedItems, setProhibitedItems] = useState(() => {
    if (localStorage.getItem('cm_tpl_sync') !== CURRENT_TEMPLATE_VER) {
      return DEFAULT_PROHIBITED_ITEMS;
    }
    const saved = localStorage.getItem('cm_prohibited');
    return saved ? JSON.parse(saved) : DEFAULT_PROHIBITED_ITEMS;
  });

  // Stamp template sync version
  useEffect(() => {
    localStorage.setItem('cm_tpl_sync', CURRENT_TEMPLATE_VER);
  }, []);

  // Admin SMTP configuration state
  const [adminSmtpInfo, setAdminSmtpInfo] = useState({
    adminName: 'Combine Mentor Official',
    adminEmail: 'admin@combinementor.in'
  });

  // UI state
  const [activeTab, setActiveTab] = useState('PREVIEW'); // 'PREVIEW' | 'CANDIDATES' | 'SCANNER' | 'LOGS' | 'SETTINGS'
  const [selectedCandidateId, setSelectedCandidateId] = useState(() => candidates[0]?.id || null);

  // Mobile & Live Preview Viewport / Zoom State
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [isAutoFit, setIsAutoFit] = useState(true);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState(false);
  const [isBatchEmailOpen, setIsBatchEmailOpen] = useState(false);
  const [isSmtpModalOpen, setIsSmtpModalOpen] = useState(false);

  // Action states
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailCandidateTarget, setEmailCandidateTarget] = useState(null);
  const [toast, setToast] = useState(null);

  // Selected candidate object
  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId) || candidates[0];
  const currentCandidateIndex = candidates.findIndex(c => c.id === (selectedCandidate?.id || selectedCandidateId));

  // Sync state changes to LocalStorage
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

  useEffect(() => {
    localStorage.setItem('cm_exam_centres', JSON.stringify(examCentres));
  }, [examCentres]);

  useEffect(() => {
    loadSmtpStatus();
  }, []);

  const loadSmtpStatus = async () => {
    const res = await getSmtpConfig();
    if (res.success && res.config) {
      setAdminSmtpInfo({
        adminName: res.config.adminName || 'Combine Mentor Official',
        adminEmail: res.config.adminEmail || ''
      });
    }
  };

  const showToast = (type, message, details = '') => {
    setToast({ type, message, details });
  };

  // Add new exam centre handler
  const handleAddExamCentre = (newCentre) => {
    if (!newCentre || !newCentre.trim()) return;
    const clean = newCentre.trim();
    if (!examCentres.includes(clean)) {
      const updated = [...examCentres, clean];
      setExamCentres(updated);
      localStorage.setItem('cm_exam_centres', JSON.stringify(updated));
      showToast('success', `Added new exam centre: ${clean}`);
    }
  };

  // Logout handler
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out of the Admin Dashboard?")) {
      logoutAdmin();
      setCurrentAdmin(null);
      showToast('info', 'Logged out successfully.');
    }
  };

  // Download PDF handler
  const handleDownloadSinglePdf = async (candidateObj) => {
    if (!candidateObj) return;
    setIsDownloadingPdf(true);
    try {
      const filename = `AdmitCard_${candidateObj.seatNo || candidateObj.name.replace(/\s+/g, '_')}.pdf`;
      await downloadAdmitCardPdf('admit-card-live-preview', filename);
      showToast('success', 'Admit Card downloaded successfully!', filename);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Print Single Hall Ticket handler
  const handlePrintSingle = (candidateObj) => {
    if (!candidateObj) return;
    setSelectedCandidateId(candidateObj.id);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Email Admit Card to Candidate (Explicit Admin Action)
  const dispatchAdmitCardEmail = async (candidateObj) => {
    if (!candidateObj || !candidateObj.email) {
      showToast('error', 'Candidate does not have a valid email address configured.');
      return;
    }

    setIsSendingEmail(true);
    setEmailCandidateTarget(candidateObj);

    try {
      await new Promise(r => setTimeout(r, 350));
      const pdfResult = await generateAdmitCardPdfBase64('admit-card-email-render', candidateObj.name);
      const rawPdfBase64 = typeof pdfResult === 'object' ? pdfResult.pdfBase64 : pdfResult;
      const pdfFilename = typeof pdfResult === 'object' ? pdfResult.filename : `Admit_Card_${candidateObj.name.replace(/\s+/g, '_')}.pdf`;

      const response = await sendAdmitCardEmail({
        recipientEmail: candidateObj.email,
        recipientName: candidateObj.name,
        examTitle: candidateObj.examTitle || instituteInfo?.examTitle,
        examCentre: candidateObj.examCentre || instituteInfo?.examCentre,
        seatNo: candidateObj.seatNo,
        pdfBase64: rawPdfBase64,
        filename: pdfFilename
      });

      if (response.success) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
        showToast('success', 'Admit card generated & sent to candidate email!', candidateObj.email);
      } else {
        showToast('error', 'Admit card generated successfully, but we could not send it to the email address. Please check SMTP settings.', candidateObj.email);
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
  const handleSaveCandidate = async (candidateData, sendEmail = false) => {
    let updatedCandidates;
    if (editingCandidate) {
      updatedCandidates = candidates.map(c => (c.id === candidateData.id ? candidateData : c));
      showToast('success', `Candidate "${candidateData.name}" updated successfully.`);
    } else {
      updatedCandidates = [candidateData, ...candidates];
      showToast('success', `Candidate "${candidateData.name}" added successfully.`);
    }

    setCandidates(updatedCandidates);
    setSelectedCandidateId(candidateData.id);

    // ONLY send email if Admin explicitly checked the sendEmail permission checkbox
    if (sendEmail) {
      dispatchAdmitCardEmail(candidateData);
    }
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
    showToast('success', `Successfully imported ${importedList.length} candidates.`);
  };

  // Attendance Operations
  const handleMarkAttendance = (id, newStatus = 'Present') => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setCandidates(prevCandidates => {
      const updated = prevCandidates.map(c => {
        if (c.id === id) {
          return {
            ...c,
            attendanceStatus: newStatus,
            verifiedAt: newStatus === 'Present' ? timeStr : null
          };
        }
        return c;
      });
      localStorage.setItem('cm_candidates', JSON.stringify(updated));
      return updated;
    });
  };

  const handleResetAllAttendance = () => {
    if (window.confirm("Are you sure you want to reset attendance for all candidates to 'Not Marked'?")) {
      const updated = candidates.map(c => ({
        ...c,
        attendanceStatus: 'Not Marked',
        verifiedAt: null
      }));
      setCandidates(updated);
      showToast('info', 'All candidate attendance statuses have been reset.');
    }
  };

  const presentCount = candidates.filter(c => c.attendanceStatus === 'Present').length;

  // ================= ADMIN SECURITY GUARD =================
  // If no admin is logged in, show the Admin Authentication Portal exclusively
  if (!currentAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans">
        <AuthPortal onLoginSuccess={(adminUser) => setCurrentAdmin(adminUser)} />
        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            details={toast.details}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Toast Notification Alert */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          details={toast.details}
          onClose={() => setToast(null)}
        />
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        candidateCount={candidates.length}
        presentCount={presentCount}
        currentAdmin={currentAdmin}
        onLogout={handleLogout}
        onOpenAddModal={() => {
          setEditingCandidate(null);
          setIsAddModalOpen(true);
        }}
        onOpenBatchPrint={() => setIsBatchPrintOpen(true)}
        onOpenBatchEmail={() => setIsBatchEmailOpen(true)}
        onOpenSmtpModal={() => setIsSmtpModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* ================= TAB 1: ADMIT CARD LIVE PREVIEW ================= */}
        {activeTab === 'PREVIEW' && (
          <div className="space-y-4">
            {/* Candidate Selector Ribbon */}
            <div className="p-3.5 sm:p-4 rounded-3xl glass-panel space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Candidate Switcher */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    disabled={currentCandidateIndex <= 0}
                    onClick={() => setSelectedCandidateId(candidates[currentCandidateIndex - 1]?.id)}
                    className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition shrink-0"
                    title="Previous Candidate"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <img
                      src={selectedCandidate?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedCandidate?.name || 'User')}`}
                      alt={selectedCandidate?.name}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border border-slate-700 shrink-0 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <select
                          value={selectedCandidate?.id || ''}
                          onChange={(e) => setSelectedCandidateId(e.target.value)}
                          className="font-bold text-xs sm:text-sm bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500 cursor-pointer max-w-[170px] sm:max-w-xs truncate"
                        >
                          {candidates.map((c, idx) => (
                            <option key={c.id} value={c.id}>
                              #{idx + 1} - {c.name} ({c.seatNo})
                            </option>
                          ))}
                        </select>

                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-[11px] sm:text-xs font-bold border border-blue-500/30 shrink-0">
                          Seat: {selectedCandidate?.seatNo}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 font-mono truncate">
                        {selectedCandidate?.email ? `${selectedCandidate.email} • ` : ''}{selectedCandidate?.examCentre || 'S.P. College Pune'}
                      </p>
                    </div>
                  </div>

                  <button
                    disabled={currentCandidateIndex >= candidates.length - 1}
                    onClick={() => setSelectedCandidateId(candidates[currentCandidateIndex + 1]?.id)}
                    className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition shrink-0"
                    title="Next Candidate"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  {/* 1-Tap Email All Button */}
                  <button
                    onClick={() => setIsBatchEmailOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition"
                    title="Send all admit cards to all candidates in one tap"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="truncate">Email All ({candidates.length})</span>
                  </button>

                  {/* Email Single Admit Card Button */}
                  <button
                    disabled={isSendingEmail}
                    onClick={() => dispatchAdmitCardEmail(selectedCandidate)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition transform hover:-translate-y-0.5"
                    title="Send Admit Card PDF directly to student email"
                  >
                    {isSendingEmail ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="truncate">Sending...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">Email Admit</span>
                      </>
                    )}
                  </button>

                  {/* Attendance Quick Toggle */}
                  <button
                    onClick={() => handleMarkAttendance(selectedCandidate?.id, selectedCandidate?.attendanceStatus === 'Present' ? 'Not Marked' : 'Present')}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${selectedCandidate?.attendanceStatus === 'Present'
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                      }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span className="truncate">{selectedCandidate?.attendanceStatus === 'Present' ? 'Present ✓' : 'Mark Present'}</span>
                  </button>

                  {/* Print Single */}
                  <button
                    onClick={() => handlePrintSingle(selectedCandidate)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="truncate">Print</span>
                  </button>

                  {/* Download PDF */}
                  <button
                    disabled={isDownloadingPdf}
                    onClick={() => handleDownloadSinglePdf(selectedCandidate)}
                    className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="truncate">{isDownloadingPdf ? 'Generating PDF...' : 'Download 2-Page PDF'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Smart Zoom, Fit & Mobile Viewport Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md text-xs">
              {/* Left: View Mode Presets */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setIsAutoFit(true);
                    setZoomLevel(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${isAutoFit
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  title="Fit complete Admit Card into screen without horizontal scrolling"
                >
                  <span>📱 Fit Screen</span>
                </button>

                <button
                  onClick={() => {
                    setIsAutoFit(false);
                    setZoomLevel(1.0);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${!isAutoFit && zoomLevel === 1.0
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  title="View at full 100% resolution (780px)"
                >
                  <span>📄 100% Original</span>
                </button>
              </div>

              {/* Right: Fine Zoom & Fullscreen Controls */}
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  onClick={() => {
                    setIsAutoFit(false);
                    setZoomLevel(prev => Math.max(0.4, Number((prev - 0.15).toFixed(2))));
                  }}
                  disabled={zoomLevel <= 0.4 && !isAutoFit}
                  className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold disabled:opacity-30 transition"
                  title="Zoom Out"
                >
                  <span>🔍 -</span>
                </button>

                <span className="font-mono text-[11px] font-bold text-slate-300 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 min-w-[50px] text-center">
                  {isAutoFit ? 'Auto' : `${Math.round(zoomLevel * 100)}%`}
                </span>

                <button
                  onClick={() => {
                    setIsAutoFit(false);
                    setZoomLevel(prev => Math.min(2.0, Number((prev + 0.15).toFixed(2))));
                  }}
                  disabled={zoomLevel >= 2.0 && !isAutoFit}
                  className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold disabled:opacity-30 transition"
                  title="Zoom In"
                >
                  <span>🔍 +</span>
                </button>

                <button
                  onClick={() => setIsFullscreenPreview(!isFullscreenPreview)}
                  className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl font-bold transition ${isFullscreenPreview
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  title="Toggle Fullscreen View"
                >
                  <span>{isFullscreenPreview ? 'Exit Fullscreen' : '⛶ Fullscreen'}</span>
                </button>
              </div>
            </div>

            {/* Live Admit Card Document View (With Smart Touch Pan & Zoom Viewport) */}
            <div
              className={`w-full rounded-3xl bg-slate-900/40 border border-slate-800/80 shadow-2xl overflow-hidden flex flex-col items-center ${isFullscreenPreview
                  ? 'fixed inset-0 z-50 rounded-none bg-slate-950/98 p-4 overflow-auto backdrop-blur-2xl'
                  : ''
                }`}
            >
              {/* Fullscreen header exit button if in fullscreen */}
              {isFullscreenPreview && (
                <div className="flex items-center justify-between w-full max-w-4xl pb-3 border-b border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Admit Card Fullscreen Viewer</span>
                    <span className="text-xs text-blue-400 font-mono">#{selectedCandidate?.seatNo}</span>
                  </div>
                  <button
                    onClick={() => setIsFullscreenPreview(false)}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow"
                  >
                    ✕ Close Fullscreen
                  </button>
                </div>
              )}

              {/* Mobile Double-tap hint */}
              <div className="md:hidden flex items-center justify-between w-full px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <span>💡</span> Double-tap card to toggle Zoom
                </span>
                <span className="text-blue-400 font-bold flex items-center gap-1">
                  <span>↔</span> Swipe to pan
                </span>
              </div>

              {/* Scrollable & Scalable Viewport */}
              <div
                onDoubleClick={() => setIsAutoFit(prev => !prev)}
                className="w-full overflow-x-auto overflow-y-auto touch-pan-x touch-pan-y p-2 sm:p-6 flex justify-start md:justify-center items-start min-h-[400px] cursor-grab active:cursor-grabbing"
              >
                <div
                  style={{
                    transform: isAutoFit
                      ? `scale(min(1, calc((100vw - 32px) / 780)))`
                      : `scale(${zoomLevel})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.2s ease-out'
                  }}
                  className="shrink-0 my-2"
                >
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
            candidates={candidates}
            setCandidates={setCandidates}
            examCentres={examCentres}
            setExamCentres={setExamCentres}
            onOpenSmtpModal={() => setIsSmtpModalOpen(true)}
            onGoToPreview={() => setActiveTab('PREVIEW')}
          />
        )}
      </main>

      {/* Hidden Offscreen Admit Card Renderer for background PDF email generation */}
      <div style={{ position: 'fixed', left: 0, top: 0, width: '800px', zIndex: -99999, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden="true">
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
        examCentres={examCentres}
        onAddExamCentre={handleAddExamCentre}
      />

      {/* Bulk CSV Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImport={handleBulkImport}
        defaultExamTitle={instituteInfo.examTitle}
        examCentres={examCentres}
        onAddExamCentre={handleAddExamCentre}
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
