import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Hash, MapPin, BookOpen, Image as ImageIcon, Sparkles } from 'lucide-react';
import { extractSeatNoFromPhone } from '../utils/csvHelper';

export default function CandidateModal({ isOpen, onClose, onSave, candidate = null }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    examTitle: 'गट क - पूर्व परीक्षा 2026',
    seatNo: '',
    examCentre: '(11-12) - Ramanbaug, New English School, Pune',
    photoUrl: '',
    uniqueCode: ''
  });

  useEffect(() => {
    if (candidate) {
      setFormData({
        name: candidate.name || '',
        phone: candidate.phone || '',
        email: candidate.email || '',
        examTitle: candidate.examTitle || 'गट क - पूर्व परीक्षा 2026',
        seatNo: candidate.seatNo || '',
        examCentre: candidate.examCentre || '(11-12) - Ramanbaug, New English School, Pune',
        photoUrl: candidate.photoUrl || '',
        uniqueCode: candidate.uniqueCode || ''
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        examTitle: 'गट क - पूर्व परीक्षा 2026',
        seatNo: '',
        examCentre: '(11-12) - Ramanbaug, New English School, Pune',
        photoUrl: '',
        uniqueCode: ''
      });
    }
  }, [candidate, isOpen]);

  if (!isOpen) return null;

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    const cleanDigits = val.replace(/\D/g, '');
    const autoSeat = cleanDigits.length >= 7 ? cleanDigits.slice(-7) : cleanDigits;

    setFormData(prev => ({
      ...prev,
      phone: val,
      // If adding new candidate and seatNo matches previous auto-generated, auto-update seatNo
      seatNo: (!candidate || !prev.seatNo || prev.seatNo.length <= 7) && autoSeat ? autoSeat : prev.seatNo,
      uniqueCode: `CM-MPSC-${autoSeat || Math.floor(1000000 + Math.random() * 9000000)}`
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Candidate name is required");
      return;
    }

    const finalSeatNo = formData.seatNo.trim() || extractSeatNoFromPhone(formData.phone, 1);
    const finalUniqueCode = formData.uniqueCode || `CM-MPSC-${finalSeatNo}`;

    const payload = {
      ...formData,
      seatNo: finalSeatNo,
      uniqueCode: finalUniqueCode,
      id: candidate?.id || `CM-2026-${Date.now()}`,
      photoUrl: formData.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formData.name)}`,
      attendanceStatus: candidate?.attendanceStatus || "Not Marked",
      verifiedAt: candidate?.verifiedAt || null
    };

    onSave(payload);
    onClose();
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {candidate ? 'Edit Candidate Details' : 'Add New Candidate'}
              </h3>
              <p className="text-xs text-slate-400">
                Seat number defaults to last 7 digits of mobile number
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* Candidate Name */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              Candidate Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rushikesh Pawar"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
            />
          </div>

          {/* Mobile & Email in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 7499696080"
                value={formData.phone}
                onChange={handlePhoneChange}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-purple-400" />
                Email / Gmail Address *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. student@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          {/* Exam Title & Seat No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                Exam Title (Given by Admin)
              </label>
              <input
                type="text"
                value={formData.examTitle}
                onChange={(e) => setFormData({ ...formData, examTitle: e.target.value })}
                placeholder="e.g. गट क - पूर्व परीक्षा 2026"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-sky-400" />
                Seat No (Last 7 Digits of Mobile)
              </label>
              <input
                type="text"
                value={formData.seatNo}
                onChange={(e) => setFormData({ ...formData, seatNo: e.target.value })}
                placeholder="e.g. 4996960"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono font-bold text-blue-400"
              />
            </div>
          </div>

          {/* Exam Centre */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              Assigned Exam Centre
            </label>
            <input
              type="text"
              value={formData.examCentre}
              onChange={(e) => setFormData({ ...formData, examCentre: e.target.value })}
              placeholder="e.g. (11-12) - Ramanbaug, New English School, Pune"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
            />
          </div>

          {/* Photo URL or Upload */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              Candidate Photo
            </label>
            <div className="flex gap-3 items-center">
              <div className="w-14 h-16 rounded-xl border border-slate-700 bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-slate-500" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <input
                  type="text"
                  placeholder="Paste Image URL or upload below"
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
                />
                <label className="inline-block cursor-pointer px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-[11px] font-medium text-slate-200 transition">
                  Upload Photo File
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Unique QR Identifier */}
          <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-xl">
            <div className="flex items-center justify-between text-xs text-blue-300 mb-1">
              <span className="font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Unique QR Verification Code
              </span>
              <button
                type="button"
                onClick={() =>
                  setFormData(prev => ({
                    ...prev,
                    uniqueCode: `CM-MPSC-${prev.seatNo || Math.floor(1000000 + Math.random() * 9000000)}`
                  }))
                }
                className="text-[11px] text-blue-400 hover:underline"
              >
                Regenerate
              </button>
            </div>
            <input
              type="text"
              value={formData.uniqueCode}
              onChange={(e) => setFormData({ ...formData, uniqueCode: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-blue-700/50 text-xs font-mono font-bold text-blue-300"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
            >
              {candidate ? 'Update Candidate' : 'Add Candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
