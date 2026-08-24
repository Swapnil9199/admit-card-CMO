import React, { useState, useEffect } from 'react';
import { Settings, Building2, Calendar, FileText, Plus, Trash2, Save, RotateCcw, Check, Sparkles, Mail, ShieldCheck, Send, Loader2 } from 'lucide-react';
import { DEFAULT_INSTITUTE_INFO, DEFAULT_TIMETABLE, DEFAULT_RULES_MARATHI } from '../data/defaultData';
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
  onOpenSmtpModal
}) {
  const [activeSubTab, setActiveSubTab] = useState('INSTITUTE');
  const [savedAlert, setSavedAlert] = useState(false);

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

  const handleAddTimetableRow = () => {
    const newRow = {
      id: Date.now(),
      subject: `Comprehensive Test ${timetable.length + 1}`,
      date: "18-10-2026",
      time: "11:00 AM - 12:00 PM"
    };
    setTimetable([...timetable, newRow]);
  };

  const handleUpdateTimetable = (id, field, value) => {
    setTimetable(timetable.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const handleDeleteTimetableRow = (id) => {
    setTimetable(timetable.filter(row => row.id !== id));
  };

  const handleAddRule = () => {
    setRules([...rules, "नवीन सूचना येथे टाईप करा (New Instruction)"]);
  };

  const handleUpdateRule = (index, value) => {
    const updated = [...rules];
    updated[index] = value;
    setRules(updated);
  };

  const handleDeleteRule = (index) => {
    setRules(rules.filter((_, idx) => idx !== index));
  };

  const handleResetToDefault = () => {
    if (window.confirm("Are you sure you want to reset all template settings to default?")) {
      setInstituteInfo(DEFAULT_INSTITUTE_INFO);
      setTimetable(DEFAULT_TIMETABLE);
      setRules(DEFAULT_RULES_MARATHI);
      triggerSaveAlert();
    }
  };

  const triggerSaveAlert = () => {
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2500);
  };

  const handleSaveSmtp = async (e) => {
    e.preventDefault();
    const res = await saveSmtpConfig(smtpForm);
    if (res.success) {
      triggerSaveAlert();
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl glass-panel">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">
              Admit Card Template & Email Customizer
            </h3>
            <p className="text-xs text-slate-400">
              Customize institute branding, exam timetable schedule, Marathi rules, and Admin SMTP credentials
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {savedAlert && (
            <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold px-2.5 py-1 bg-emerald-500/10 rounded-lg animate-fadeIn">
              <Check className="w-3.5 h-3.5" /> Saved Live!
            </span>
          )}
          <button
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
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
          Examination Timetable ({timetable.length})
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
          Rules & Regulations (Page 2)
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

      {/* Tab 1: Institute Branding */}
      {activeSubTab === 'INSTITUTE' && (
        <div className="p-6 rounded-2xl glass-panel space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Institute / Academy Name
              </label>
              <input
                type="text"
                value={instituteInfo.instituteName}
                onChange={(e) => setInstituteInfo({ ...instituteInfo, instituteName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Tagline / Subtext
              </label>
              <input
                type="text"
                value={instituteInfo.instituteTagline}
                onChange={(e) => setInstituteInfo({ ...instituteInfo, instituteTagline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Institute Official Address (Printed on Header)
              </label>
              <textarea
                rows={2}
                value={instituteInfo.instituteAddress}
                onChange={(e) => setInstituteInfo({ ...instituteInfo, instituteAddress: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Default Exam Series Title
              </label>
              <input
                type="text"
                value={instituteInfo.examTitle || ""}
                onChange={(e) => setInstituteInfo({ ...instituteInfo, examTitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Default Examination Centre Venue
              </label>
              <input
                type="text"
                value={instituteInfo.examCentre || "(11-12) - Ramanbaug, New English School, Pune"}
                onChange={(e) => setInstituteInfo({ ...instituteInfo, examCentre: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
                placeholder="e.g. (11-12) - Ramanbaug, New English School, Pune"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Institute Logo Path or URL
              </label>
              <input
                type="text"
                value={instituteInfo.logoUrl}
                onChange={(e) => setInstituteInfo({ ...instituteInfo, logoUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Authorized Signatory Name
              </label>
              <input
                type="text"
                value={instituteInfo.signatoryName}
                onChange={(e) => setInstituteInfo({ ...instituteInfo, signatoryName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Signatory Authority Title
              </label>
              <input
                type="text"
                value={instituteInfo.signatoryTitle}
                onChange={(e) => setInstituteInfo({ ...instituteInfo, signatoryTitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Timetable Customizer */}
      {activeSubTab === 'TIMETABLE' && (
        <div className="p-6 rounded-2xl glass-panel space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white">
              Schedule of Examination Papers / Tests
            </h4>
            <button
              onClick={handleAddTimetableRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Test Row
            </button>
          </div>

          <div className="space-y-2">
            {timetable.map((row, idx) => (
              <div key={row.id || idx} className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  placeholder="Subject / Test Name"
                  value={row.subject}
                  onChange={(e) => handleUpdateTimetable(row.id, 'subject', e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg glass-input text-xs"
                />
                <input
                  type="text"
                  placeholder="Date (DD-MM-YYYY)"
                  value={row.date}
                  onChange={(e) => handleUpdateTimetable(row.id, 'date', e.target.value)}
                  className="w-32 px-3 py-1.5 rounded-lg glass-input text-xs font-mono"
                />
                <input
                  type="text"
                  placeholder="Time (e.g. 11:00 AM - 12:00 PM)"
                  value={row.time}
                  onChange={(e) => handleUpdateTimetable(row.id, 'time', e.target.value)}
                  className="w-48 px-3 py-1.5 rounded-lg glass-input text-xs font-mono"
                />
                <button
                  onClick={() => handleDeleteTimetableRow(row.id)}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  title="Remove test"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Rules & Regulations */}
      {activeSubTab === 'RULES' && (
        <div className="p-6 rounded-2xl glass-panel space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white">
              Important Instructions (परीक्षार्थ्यांसाठी महत्त्वाच्या सूचना)
            </h4>
            <button
              onClick={handleAddRule}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Instruction
            </button>
          </div>

          <div className="space-y-2">
            {rules.map((rule, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center shrink-0 mt-1">
                  {idx + 1}
                </span>
                <textarea
                  rows={2}
                  value={rule}
                  onChange={(e) => handleUpdateRule(idx, e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg glass-input text-xs font-marathi leading-relaxed"
                />
                <button
                  onClick={() => handleDeleteRule(idx)}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition mt-1"
                  title="Remove instruction"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800">
            <label className="block text-xs font-bold text-rose-300 uppercase tracking-wider mb-1.5">
              Prohibited Items Warning Text
            </label>
            <textarea
              rows={3}
              value={prohibitedItems}
              onChange={(e) => setProhibitedItems(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-marathi leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* Tab 4: Admin SMTP & Email Settings */}
      {activeSubTab === 'SMTP' && (
        <form onSubmit={handleSaveSmtp} className="p-6 rounded-2xl glass-panel space-y-5 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Admin SMTP Configuration (Email Sender Account)
              </h4>
              <p className="text-slate-400 mt-0.5">
                Emails with attached Admit Cards will be sent from this Admin account to candidate emails.
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
                SMTP Password / App Password
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
              className={`p-3 rounded-xl border flex items-center gap-2 ${
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
