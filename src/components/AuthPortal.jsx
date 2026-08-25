import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Building2,
  FileCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { loginAdmin, registerAdmin } from '../services/authService';

export default function AuthPortal({ onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('LOGIN'); // 'LOGIN' | 'REGISTER'

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const res = loginAdmin(email, password);
      if (res.success) {
        setSuccessMsg(res.message);
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 500);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = registerAdmin({ name, email, password });
      if (res.success) {
        setSuccessMsg(res.message);
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 }
        });
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 700);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseDemoAccount = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 p-1 shadow-2xl shadow-blue-500/30">
            <img
              src="/assets/combine_mentor_logo.jpg"
              alt="Combine Mentor Logo"
              className="w-full h-full object-cover rounded-[20px]"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<span class="text-white font-black text-xl">CM</span>';
              }}
            />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider uppercase">
              COMBINE MENTOR
            </h1>
            <p className="text-xs sm:text-sm text-blue-400 font-semibold mt-0.5">
              Official Examination & Hall Ticket System
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Authorized Administrator Access Only</span>
          </div>
        </div>

        {/* Auth Glass Card */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel shadow-2xl border border-slate-800 space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('LOGIN');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2.5 rounded-xl transition-all ${
                authMode === 'LOGIN'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Admin Sign In
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('REGISTER');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2.5 rounded-xl transition-all ${
                authMode === 'REGISTER'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Admin Register
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ================= LOGIN FORM ================= */}
          {authMode === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  Admin Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@combinementor.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  Admin Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-input text-xs pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <span>Sign In to Admin Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Default Accounts for Admin convenience */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[11px] text-slate-400 block text-center">
                  Quick Login Presets (Click to autofill):
                </span>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUseDemoAccount('admin@combinementor.in', 'admin@combinementor')}
                    className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-left border border-slate-800 flex items-center justify-between text-[11px] text-slate-300 transition"
                  >
                    <span className="font-mono text-blue-300">admin@combinementor.in</span>
                    <span className="text-slate-500">Root Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUseDemoAccount('swapnilnikat9399@gmail.com', 'admin@combinementor')}
                    className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-left border border-slate-800 flex items-center justify-between text-[11px] text-slate-300 transition"
                  >
                    <span className="font-mono text-emerald-300">swapnilnikat9399@gmail.com</span>
                    <span className="text-slate-500">Chief Admin</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ================= REGISTER FORM ================= */}
          {authMode === 'REGISTER' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  Admin Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swapnil Nikat"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  Official Admin Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="your.email@combinementor.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  Create Password (Min 6 Characters) *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-input text-xs pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-xs font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <span>Register & Access Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Security Footer */}
        <div className="text-center text-[11px] text-slate-500">
          Combine Mentor Official • Rayat Prabodhini Examination Portal
        </div>
      </div>
    </div>
  );
}
