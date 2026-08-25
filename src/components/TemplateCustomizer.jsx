import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Calendar,
  FileText,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Check,
  Sparkles,
  Mail,
  ShieldCheck,
  Send,
  Loader2,
  CheckCircle2,
  Users,
  Eye
} from 'lucide-react';
import { DEFAULT_INSTITUTE_INFO, DEFAULT_TIMETABLE, DEFAULT_RULES_MARATHI, DEFAULT_PROHIBITED_ITEMS } from '../data/defaultData';
import { getSmtpConfig, saveSmtpConfig, testSmtpConnection } from '../services/emailService';

export default function TemplateCustomizer({
  instituteInfo,
  setInstituteInfo,
  timetable,
  setTimetable,
  rules,
  setRules,
  prohibitedItems,
  setProhibitedItems,
  candidates = [],
  setCandidates,
  examCentres,
  setExamCentres,
  onOpenSmtpModal,
  onGoToPreview
}) {
  const [activeSubTab, setActiveSubTab] = useState('INSTITUTE');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Local draft states
  const [draftInstitute, setDraftInstitute] = useState({ ...instituteInfo });
  const [draftTimetable, setDraftTimetable] = useState([...timetable]);
  const [draftRules, setDraftRules] = useState([...rules]);
  const [draftProhibited, setDraftProhibited] = useState(prohibitedItems);

  // Sync draft state if props change externally
  useEffect(() => {
    setDraftInstitute({ ...instituteInfo });
  }, [instituteInfo]);

  useEffect(() => {
    setDraftTimetable([...timetable]);
  }, [timetable]);

  useEffect(() => {
    setDraftRules([...rules]);
  }, [rules]);

  useEffect(() => {
    setDraftProhibited(prohibitedItems);
  }, [prohibitedItems]);

  // SMTP state inside customizer
  const [smtpForm, setSmtpForm] = useState({
    adminName: 'Combine Mentor Official',
    adminEmail: 'admin@combinementor.in',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: '',
    pass: ''
  });
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState(null);

  useEffect(() => {
    loadSmtp();
  }, []);

  const loadSmtp = async () => {
    const res = await getSmtpConfig();
    if (res.success && res.config) {
      setSmtpForm({
        adminName: res.config.adminName || 'Combine Mentor Official',
        adminEmail: res.config.adminEmail || '',
        host: res.config.host || '',
        port: res.config.port || 587,
        secure: Boolean(res.config.secure),
        user: res.config.user || '',
        pass: res.config.pass || ''
      });
    }
  };

  const triggerSaveNotification = (msg = 'Changes saved successfully & live on all Admit Cards!') => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // SAVE HANDLERS
  const handleSaveInstitute = (e) => {
    if (e) e.preventDefault();
    setInstituteInfo(draftInstitute);
    localStorage.setItem('cm_institute', JSON.stringify(draftInstitute));
    triggerSaveNotification('Institute & Exam details saved to all Admit Cards!');
  };

  const handleApplyExamDetailsToAllCandidates = () => {
    if (!setCandidates || candidates.length === 0) return;
    if (
      window.confirm(
        `Apply Exam Title "${draftInstitute.examTitle}" and Exam Centre "${draftInstitute.examCentre}" to all ${candidates.length} registered candidate(s)?`
      )
    ) {
      const updated = candidates.map(c => ({
        ...c,
        examTitle: draftInstitute.examTitle,
        examCentre: draftInstitute.examCentre || c.examCentre
      }));
      setCandidates(updated);
      setInstituteInfo(draftInstitute);
      localStorage.setItem('cm_institute', JSON.stringify(draftInstitute));
      localStorage.setItem('cm_candidates', JSON.stringify(updated));
      triggerSaveNotification(`Updated Exam Title & Centre for all ${candidates.length} candidates!`);
    }
  };

  const handleSaveTimetable = () => {
    setTimetable(draftTimetable);
    localStorage.setItem('cm_timetable', JSON.stringify(draftTimetable));
    triggerSaveNotification('Timetable saved to all Admit Cards!');
  };

  const handleSaveRules = () => {
    setRules(draftRules);
    setProhibitedItems(draftProhibited);
    localStorage.setItem('cm_rules', JSON.stringify(draftRules));
    localStorage.setItem('cm_prohibited', JSON.stringify(draftProhibited));
    triggerSaveNotification('Marathi Rules & Instructions saved to Page 2 of all Admit Cards!');
  };

  const handleSaveAll = () => {
    setInstituteInfo(draftInstitute);
    setTimetable(draftTimetable);
    setRules(draftRules);
    setProhibitedItems(draftProhibited);
    localStorage.setItem('cm_institute', JSON.stringify(draftInstitute));
    localStorage.setItem('cm_timetable', JSON.stringify(draftTimetable));
    localStorage.setItem('cm_rules', JSON.stringify(draftRules));
    localStorage.setItem('cm_prohibited', JSON.stringify(draftProhibited));
    triggerSaveNotification('All Template & Examination data saved successfully!');
  };

  const handleResetToDefault = () => {
    if (window.confirm("Are you sure you want to reset all template settings to default?")) {
      setDraftInstitute(DEFAULT_INSTITUTE_INFO);
      setDraftTimetable(DEFAULT_TIMETABLE);
      setDraftRules(DEFAULT_RULES_MARATHI);
      setDraftProhibited(DEFAULT_PROHIBITED_ITEMS);

      setInstituteInfo(DEFAULT_INSTITUTE_INFO);
      setTimetable(DEFAULT_TIMETABLE);
      setRules(DEFAULT_RULES_MARATHI);
      setProhibitedItems(DEFAULT_PROHIBITED_ITEMS);

      localStorage.setItem('cm_institute', JSON.stringify(DEFAULT_INSTITUTE_INFO));
      localStorage.setItem('cm_timetable', JSON.stringify(DEFAULT_TIMETABLE));
      localStorage.setItem('cm_rules', JSON.stringify(DEFAULT_RULES_MARATHI));
      localStorage.setItem('cm_prohibited', JSON.stringify(DEFAULT_PROHIBITED_ITEMS));

      triggerSaveNotification('Template reset to default settings.');
    }
  };

  const handleAddTimetableRow = () => {
    const newRow = {
      id: Date.now(),
      subject: `Comprehensive Test ${draftTimetable.length + 1}`,
      date: "18-10-2026",
      time: "11:00 AM - 12:00 PM"
    };
    setDraftTimetable([...draftTimetable, newRow]);
  };

  const handleUpdateTimetable = (id, field, value) => {
    setDraftTimetable(draftTimetable.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const handleDeleteTimetableRow = (id) => {
    setDraftTimetable(draftTimetable.filter(row => row.id !== id));
  };

  const handleAddRule = () => {
    setDraftRules([...draftRules, "नवीन सूचना येथे टाईप करा (New Instruction)"]);
  };

  const handleUpdateRule = (index, value) => {
    const updated = [...draftRules];
    updated[index] = value;
    setDraftRules(updated);
  };

  const handleDeleteRule = (index) => {
    setDraftRules(draftRules.filter((_, idx) => idx !== index));
  };

  const handleSaveSmtp = async (e) => {
    e.preventDefault();
    const res = await saveSmtpConfig(smtpForm);
    if (res.success) {
      triggerSaveNotification('Admin SMTP configuration saved successfully!');
    }
  };

  const handleTestSmtp = async () => {
    setIsTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const res = await testSmtpConnection(smtpForm);
      setSmtpTestResult({
        success: res.success,
        message: res.message
      });
    } catch (err) {
      setSmtpTestResult({
        success: false,
        message: err.message || 'Test failed.'
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl glass-panel">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">
              Admit Card Template & Examination Settings
            </h3>
            <p className="text-xs text-slate-400">
              Edit any information below and click <strong>"Save Changes"</strong> to display it live on all candidate Hall Tickets.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {saveSuccessMsg && (
            <span className="inline-flex items-center gap-1.5 text-emerald-300 text-xs font-bold px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {saveSuccessMsg}
            </span>
          )}

          <button
            onClick={handleSaveAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5"
          >
            <Save className="w-3.5 h-3.5" />
            Save All Changes
          </button>

          <button
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-slate-800 gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar touch-pan-x">
        <button
          onClick={() => setActiveSubTab('INSTITUTE')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'INSTITUTE'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Institute Branding & Header
        </button>
        <button
          onClick={() => setActiveSubTab('TIMETABLE')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'TIMETABLE'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Examination Timetable ({draftTimetable.length})
        </button>
        <button
          onClick={() => setActiveSubTab('RULES')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'RULES'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Marathi Rules & Instructions (Page 2)
        </button>
        <button
          onClick={() => setActiveSubTab('SMTP')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'SMTP'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mail className="w-4 h-4" />
          Admin SMTP & Email Settings
        </button>
      </div>

      {/* ================= TAB 1: INSTITUTE BRANDING ================= */}
      {activeSubTab === 'INSTITUTE' && (
        <form onSubmit={handleSaveInstitute} className="p-6 rounded-3xl glass-panel space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                Institute Branding, Exam Title & Centre
              </h4>
              <p className="text-xs text-slate-400">
                All saved values here will immediately display on every candidate's Admit Card.
              </p>
            </div>

            <button
              type="button"
              onClick={handleApplyExamDetailsToAllCandidates}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition"
              title="Apply Exam Title & Centre to all existing candidate records"
            >
              <Users className="w-3.5 h-3.5" />
              Apply to All {candidates.length} Candidates
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Institute / Academy Name *
              </label>
              <input
                type="text"
                required
                value={draftInstitute.instituteName || ""}
                onChange={(e) => setDraftInstitute({ ...draftInstitute, instituteName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Tagline / Subtext
              </label>
              <input
                type="text"
                value={draftInstitute.instituteTagline || ""}
                onChange={(e) => setDraftInstitute({ ...draftInstitute, instituteTagline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Institute Official Address (Printed on Admit Card Header) *
              </label>
              <textarea
                rows={2}
                required
                value={draftInstitute.instituteAddress || ""}
                onChange={(e) => setDraftInstitute({ ...draftInstitute, instituteAddress: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-xs leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Default Examination Title *
              </label>
              <input
                type="text"
                required
                value={draftInstitute.examTitle || ""}
                onChange={(e) => setDraftInstitute({ ...draftInstitute, examTitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Default Examination Centre / Venue Address *
              </label>
              <input
                type="text"
                required
                value={draftInstitute.examCentre || ""}
                onChange={(e) => setDraftInstitute({ ...draftInstitute, examCentre: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Institute Logo Path or URL
              </label>
              <input
                type="text"
                value={draftInstitute.logoUrl || ""}
                onChange={(e) => setDraftInstitute({ ...draftInstitute, logoUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Authorized Signatory Name *
              </label>
              <input
                type="text"
                required
                value={draftInstitute.signatoryName || ""}
                onChange={(e) => setDraftInstitute({ ...draftInstitute, signatoryName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Signatory Authority Title *
              </label>
              <input
                type="text"
                required
                value={draftInstitute.signatoryTitle || ""}
                onChange={(e) => setDraftInstitute({ ...draftInstitute, signatoryTitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          {/* Exam Centres Management Box */}
          {examCentres && setExamCentres && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    Manage Examination Centres ({examCentres.length})
                  </h5>
                  <p className="text-[11px] text-slate-400">
                    Add new centres or delete unused centres. S.P. College Pune is default.
                  </p>
                </div>
              </div>

              {/* Add Centre Row */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter new examination centre name & address..."
                  id="template-add-centre-input"
                  className="flex-1 px-3 py-2 rounded-xl glass-input text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = e.target.value.trim();
                      if (val && !examCentres.includes(val)) {
                        const updated = [...examCentres, val];
                        setExamCentres(updated);
                        localStorage.setItem('cm_exam_centres', JSON.stringify(updated));
                        e.target.value = '';
                        triggerSaveNotification(`Added centre: ${val}`);
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('template-add-centre-input');
                    const val = input ? input.value.trim() : '';
                    if (val && !examCentres.includes(val)) {
                      const updated = [...examCentres, val];
                      setExamCentres(updated);
                      localStorage.setItem('cm_exam_centres', JSON.stringify(updated));
                      input.value = '';
                      triggerSaveNotification(`Added centre: ${val}`);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0"
                >
                  + Add Centre
                </button>
              </div>

              {/* Centre List Chips */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {examCentres.map((centre, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-slate-200 font-medium">{centre}</span>
                      {centre.includes('S.P. College') && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[9px] font-bold border border-blue-500/30">
                          Default
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setDraftInstitute({ ...draftInstitute, examCentre: centre });
                          triggerSaveNotification(`Selected ${centre} as default centre`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-[11px] font-semibold"
                      >
                        Set Default
                      </button>

                      {examCentres.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete centre "${centre}"?`)) {
                              const updated = examCentres.filter((_, i) => i !== idx);
                              setExamCentres(updated);
                              localStorage.setItem('cm_exam_centres', JSON.stringify(updated));
                              triggerSaveNotification(`Removed centre`);
                            }
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Delete centre"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
            >
              <Save className="w-4 h-4" />
              Save Institute Branding & Header
            </button>
          </div>
        </form>
      )}

      {/* ================= TAB 2: TIMETABLE CUSTOMIZER ================= */}
      {activeSubTab === 'TIMETABLE' && (
        <div className="p-6 rounded-3xl glass-panel space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                Schedule of Examination Papers & Tests
              </h4>
              <p className="text-xs text-slate-400">
                Add, edit, or remove exam papers. Saved timetable displays in the Page 1 table of all Admit Cards.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddTimetableRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Test Row
              </button>

              <button
                type="button"
                onClick={handleSaveTimetable}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition"
              >
                <Save className="w-3.5 h-3.5" />
                Save Timetable
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {draftTimetable.map((row, idx) => (
              <div
                key={row.id || idx}
                className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl"
              >
                <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  placeholder="Subject / Test Paper Name"
                  value={row.subject}
                  onChange={(e) => handleUpdateTimetable(row.id, 'subject', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl glass-input text-xs font-medium"
                />
                <input
                  type="text"
                  placeholder="Date (DD-MM-YYYY)"
                  value={row.date}
                  onChange={(e) => handleUpdateTimetable(row.id, 'date', e.target.value)}
                  className="w-36 px-3 py-2 rounded-xl glass-input text-xs font-mono"
                />
                <input
                  type="text"
                  placeholder="Time (e.g. 11:00 AM - 12:00 PM)"
                  value={row.time}
                  onChange={(e) => handleUpdateTimetable(row.id, 'time', e.target.value)}
                  className="w-48 px-3 py-2 rounded-xl glass-input text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteTimetableRow(row.id)}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  title="Remove test paper"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleSaveTimetable}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5"
            >
              <Save className="w-4 h-4" />
              Save Examination Timetable
            </button>
          </div>
        </div>
      )}

      {/* ================= TAB 3: RULES & REGULATIONS ================= */}
      {activeSubTab === 'RULES' && (
        <div className="p-6 rounded-3xl glass-panel space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Important Instructions (परीक्षार्थ्यांसाठी महत्त्वाच्या सूचना - Page 2)
              </h4>
              <p className="text-xs text-slate-400">
                Edit rules and prohibited items warning. Saved instructions appear on Page 2 of all Admit Cards.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddRule}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Instruction
              </button>

              <button
                type="button"
                onClick={handleSaveRules}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition"
              >
                <Save className="w-3.5 h-3.5" />
                Save Rules
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {draftRules.map((rule, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl"
              >
                <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center shrink-0 mt-1">
                  {idx + 1}
                </span>
                <textarea
                  rows={2}
                  value={rule}
                  onChange={(e) => handleUpdateRule(idx, e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl glass-input text-xs font-marathi leading-relaxed"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteRule(idx)}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition mt-1"
                  title="Remove instruction"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800">
            <label className="block text-xs font-bold text-rose-300 uppercase tracking-wider mb-1.5">
              Prohibited Items Warning Text (Page 2 Footer)
            </label>
            <textarea
              rows={3}
              value={draftProhibited}
              onChange={(e) => setDraftProhibited(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-marathi leading-relaxed border-rose-500/30"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleSaveRules}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5"
            >
              <Save className="w-4 h-4" />
              Save Rules & Prohibited Items
            </button>
          </div>
        </div>
      )}

      {/* ================= TAB 4: ADMIN SMTP & EMAIL SETTINGS ================= */}
      {activeSubTab === 'SMTP' && (
        <form onSubmit={handleSaveSmtp} className="p-6 rounded-3xl glass-panel space-y-5 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Admin SMTP Configuration (Sender Account)
              </h4>
              <p className="text-slate-400 mt-0.5">
                Admit Card emails will be sent from this Admin account to candidate email addresses.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenSmtpModal}
              className="px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 font-semibold"
            >
              Open Full SMTP Setup Wizard
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Admin Sender Name (Displayed in candidate inbox) *
              </label>
              <input
                type="text"
                required
                value={smtpForm.adminName}
                onChange={(e) => setSmtpForm({ ...smtpForm, adminName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Admin Sender Email Address *
              </label>
              <input
                type="email"
                required
                value={smtpForm.adminEmail}
                onChange={(e) => setSmtpForm({ ...smtpForm, adminEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                SMTP Server Host (e.g. smtp.gmail.com)
              </label>
              <input
                type="text"
                value={smtpForm.host}
                onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Port
                </label>
                <input
                  type="number"
                  value={smtpForm.port}
                  onChange={(e) => setSmtpForm({ ...smtpForm, port: parseInt(e.target.value) || 587 })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  SSL/TLS
                </label>
                <select
                  value={smtpForm.secure ? 'true' : 'false'}
                  onChange={(e) => setSmtpForm({ ...smtpForm, secure: e.target.value === 'true' })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-slate-900"
                >
                  <option value="false">STARTTLS (Port 587)</option>
                  <option value="true">SSL (Port 465)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                SMTP Username
              </label>
              <input
                type="text"
                value={smtpForm.user}
                onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                SMTP Password / 16-Letter App Password
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={smtpForm.pass}
                onChange={(e) => setSmtpForm({ ...smtpForm, pass: e.target.value })}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
              />
            </div>
          </div>

          {/* Test connection alert */}
          {smtpTestResult && (
            <div
              className={`p-3 rounded-2xl border flex items-center gap-2 ${
                smtpTestResult.success
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              }`}
            >
              {smtpTestResult.success ? <Check className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
              <span>{smtpTestResult.message}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              disabled={isTestingSmtp}
              onClick={handleTestSmtp}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition disabled:opacity-50"
            >
              {isTestingSmtp ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Test SMTP Connection
                </>
              )}
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5"
            >
              <Save className="w-3.5 h-3.5" />
              Save SMTP Configuration
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
