import React, { useState, useEffect } from 'react';
import { X, Mail, Shield, CheckCircle2, AlertCircle, Loader2, Save, Send, Key, Server, User, HelpCircle, Eye, EyeOff } from 'lucide-react';
import { getSmtpConfig, saveSmtpConfig, testSmtpConnection } from '../services/emailService';

const PRESETS = {
  gmail: {
    name: 'Google Gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    help: 'Requires a 16-character Google App Password (not your regular login password). Generate at myaccount.google.com/apppasswords'
  },
  outlook: {
    name: 'Microsoft Outlook / Office 365',
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    help: 'Use your Office 365 / Outlook email credentials.'
  },
  yahoo: {
    name: 'Yahoo Mail',
    host: 'smtp.mail.yahoo.com',
    port: 465,
    secure: true,
    help: 'Requires a Yahoo App Password from Yahoo Security Settings.'
  },
  brevo: {
    name: 'Brevo (formerly Sendinblue)',
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    help: 'Get your SMTP credentials from Brevo > SMTP & API.'
  },
  sendgrid: {
    name: 'SendGrid',
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    help: 'Username is "apikey", and password is your SendGrid API key.'
  },
  custom: {
    name: 'Custom SMTP Server',
    host: '',
    port: 587,
    secure: false,
    help: 'Enter your custom institutional SMTP host and authentication credentials.'
  }
};

export default function SmtpConfigModal({ isOpen, onClose, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    adminName: 'Combine Mentor Official',
    adminEmail: '',
    provider: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    user: '',
    pass: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setIsLoading(true);
    const res = await getSmtpConfig();
    if (res.success && res.config) {
      setFormData({
        adminName: res.config.adminName || 'Combine Mentor Official',
        adminEmail: res.config.adminEmail || '',
        provider: res.config.provider || 'gmail',
        host: res.config.host || 'smtp.gmail.com',
        port: res.config.port || 465,
        secure: res.config.secure !== undefined ? Boolean(res.config.secure) : true,
        user: res.config.user || res.config.adminEmail || '',
        pass: res.config.pass || ''
      });
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  const handlePresetSelect = (presetKey) => {
    const preset = PRESETS[presetKey];
    if (preset) {
      setFormData(prev => ({
        ...prev,
        provider: presetKey,
        host: preset.host || prev.host,
        port: preset.port,
        secure: preset.secure
      }));
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const payload = {
        ...formData,
        user: formData.user || formData.adminEmail
      };
      const res = await testSmtpConnection(payload);
      setTestResult({
        success: res.success,
        message: res.message || (res.success ? "SMTP connection verified successfully!" : "Connection failed.")
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || "Failed to reach backend."
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        user: formData.user || formData.adminEmail
      };
      const res = await saveSmtpConfig(payload);
      if (res.success) {
        if (onSaveSuccess) onSaveSuccess(payload);
        onClose();
      } else {
        setTestResult({ success: false, message: res.message || "Failed to save configuration." });
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message || "Failed to save." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                Admin SMTP & Email Configuration
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Setup your official admin email account to send Admit Cards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1 text-xs">
          {/* Quick Preset Selector */}
          <div>
            <label className="block font-bold text-slate-300 uppercase tracking-wider mb-2">
              Select Email Service Provider Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(PRESETS).map(([key, item]) => {
                const isSelected = formData.provider === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handlePresetSelect(key)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-600/20 text-white font-bold'
                        : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="truncate">{item.name}</div>
                  </button>
                );
              })}
            </div>
            {PRESETS[formData.provider]?.help && (
              <p className="text-[11px] text-blue-300/80 mt-1.5 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                {PRESETS[formData.provider].help}
              </p>
            )}
          </div>

          {/* Admin Sender Details */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-400" />
              Admin Sender Identity (Visible to Students)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Admin / Institution Sender Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Combine Mentor Official"
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Admin Sender Gmail Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. yourname@gmail.com"
                  value={formData.adminEmail}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      adminEmail: val,
                      user: (!prev.user || prev.user === prev.adminEmail) ? val : prev.user
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* SMTP Server Credentials */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Server className="w-4 h-4 text-purple-400" />
              SMTP Server Authentication
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">
                  SMTP Host Server
                </label>
                <input
                  type="text"
                  placeholder="e.g. smtp.gmail.com"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Port
                </label>
                <input
                  type="number"
                  placeholder="587"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 587 })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">
                  SMTP Username / Email
                </label>
                <input
                  type="text"
                  placeholder="e.g. your-email@gmail.com"
                  value={formData.user}
                  onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  App Password / Key
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={formData.pass}
                    onChange={(e) => setFormData({ ...formData, pass: e.target.value })}
                    className="w-full pl-3 pr-8 py-2 rounded-xl glass-input text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium">
                <input
                  type="checkbox"
                  checked={formData.secure}
                  onChange={(e) => setFormData({ ...formData, secure: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                />
                Use SSL / TLS (Mandatory for Port 465)
              </label>
            </div>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 animate-fadeIn ${
                testResult.success
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">
                <span className="font-bold">{testResult.success ? 'Success: ' : 'Error: '}</span>
                {testResult.message}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={isTesting}
              onClick={handleTestConnection}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Test SMTP Connection
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
