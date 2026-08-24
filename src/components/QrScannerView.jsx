import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, CheckCircle2, XCircle, Search, User, Phone, Mail, Hash, MapPin, Calendar, Clock, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function QrScannerView({ candidates, onMarkAttendance }) {
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // 'SUCCESS', 'NOT_FOUND', 'ALREADY_PRESENT'
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    let html5QrcodeScanner = null;

    if (isCameraActive) {
      try {
        html5QrcodeScanner = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          false
        );

        html5QrcodeScanner.render(
          (decodedText) => {
            handleDecodedText(decodedText);
          },
          (errorMessage) => {
            // scan error (ignore normal continuous frame errors)
          }
        );
        scannerRef.current = html5QrcodeScanner;
      } catch (e) {
        console.error("Scanner init error:", e);
      }
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (err) {
          console.error("Error clearing scanner", err);
        }
        scannerRef.current = null;
      }
    };
  }, [isCameraActive]);

  const handleDecodedText = (text) => {
    try {
      let codeToMatch = text;
      // If it's a JSON string payload from our QR code
      if (text.startsWith('{') && text.endsWith('}')) {
        const parsed = JSON.parse(text);
        codeToMatch = parsed.uid || parsed.seatNo || text;
      }

      verifyCandidateCode(codeToMatch);
    } catch (e) {
      verifyCandidateCode(text);
    }
  };

  const verifyCandidateCode = (code) => {
    if (!code) return;
    const cleanCode = code.trim().toLowerCase();

    // Search across candidates
    const found = candidates.find(c =>
      (c.uniqueCode && c.uniqueCode.toLowerCase() === cleanCode) ||
      (c.id && c.id.toLowerCase() === cleanCode) ||
      (c.seatNo && c.seatNo.toLowerCase() === cleanCode) ||
      (c.phone && c.phone.toLowerCase() === cleanCode) ||
      (c.email && c.email.toLowerCase() === cleanCode)
    );

    if (found) {
      setScannedResult(found);
      const isAlreadyPresent = found.attendanceStatus === 'Present';
      setScanStatus(isAlreadyPresent ? 'ALREADY_PRESENT' : 'SUCCESS');

      if (!isAlreadyPresent) {
        onMarkAttendance(found.id, 'Present');
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    } else {
      setScannedResult({ rawCode: code });
      setScanStatus('NOT_FOUND');
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      verifyCandidateCode(manualCode);
      setManualCode('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: QR Camera Scanner & Manual Input */}
      <div className="lg:col-span-6 space-y-6">
        {/* Scanner Card */}
        <div className="p-6 rounded-2xl glass-panel space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">
                  Admit Card QR Scanner
                </h3>
                <p className="text-xs text-slate-400">
                  Scan the QR code printed on the Hall Ticket to verify & mark attendance
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCameraActive(!isCameraActive)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                isCameraActive
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
              }`}
            >
              {isCameraActive ? 'Stop Camera' : 'Start Camera Scanner'}
            </button>
          </div>

          {/* Camera View Box */}
          {isCameraActive ? (
            <div className="bg-slate-950 rounded-2xl border-2 border-dashed border-blue-500/50 p-3 overflow-hidden">
              <div id="qr-reader" className="w-full text-slate-900 rounded-xl overflow-hidden" />
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                <QrCode className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200">
                Camera is currently idle
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Click "Start Camera Scanner" to enable webcam scanning, or use the manual code lookup below.
              </p>
            </div>
          )}

          {/* Manual Input Fallback */}
          <div className="pt-4 border-t border-slate-800">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Manual Seat Number or Candidate Code Lookup
            </label>
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. 1250042 or CM-MPSC-8849102"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs sm:text-sm font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
              >
                Verify Code
              </button>
            </form>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/30 text-xs text-blue-300/90 space-y-1">
          <p className="font-semibold text-blue-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Instant Attendance Marking
          </p>
          <p>
            When a candidate's admit card QR code is scanned, the system automatically checks their credentials and records their attendance with an exact timestamp.
          </p>
        </div>
      </div>

      {/* Right: Verification Status & Candidate Card */}
      <div className="lg:col-span-6 space-y-6">
        <div className="p-6 rounded-2xl glass-panel h-full flex flex-col">
          <h3 className="font-bold text-lg text-white mb-4">
            Candidate Verification Status
          </h3>

          {!scannedResult ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mb-3">
                <Search className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-medium text-slate-300">
                Awaiting Scanned QR Code
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Scan an admit card QR code or search by seat number to see verification outcome here.
              </p>
            </div>
          ) : scanStatus === 'NOT_FOUND' ? (
            <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-rose-300">
                Invalid or Unregistered Code
              </h4>
              <p className="text-xs text-rose-300/80 font-mono">
                Code scanned: "{scannedResult.rawCode}"
              </p>
              <p className="text-xs text-slate-400">
                This code does not match any registered candidate in this exam batch.
              </p>
            </div>
          ) : (
            /* Verified Student Profile */
            <div className="space-y-5 animate-fadeIn">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-xl flex items-center gap-3 border ${
                  scanStatus === 'SUCCESS'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                }`}
              >
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">
                    {scanStatus === 'SUCCESS' ? '✓ Verification Successful - Marked Present!' : 'Candidate Verified (Already Marked Present)'}
                  </h4>
                  <p className="text-xs opacity-90">
                    Timestamp: {scannedResult.verifiedAt || new Date().toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Candidate Info Card */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center gap-4">
                  <img
                    src={scannedResult.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(scannedResult.name)}`}
                    alt={scannedResult.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-700 shadow-md"
                  />
                  <div>
                    <h3 className="text-lg font-extrabold text-white">
                      {scannedResult.name}
                    </h3>
                    <p className="text-xs text-blue-400 font-semibold">
                      {scannedResult.examTitle || "गट क - पूर्व परीक्षा 2026"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-xs font-bold">
                        Seat: {scannedResult.seatNo}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-xs">
                        {scannedResult.uniqueCode}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span>{scannedResult.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mail className="w-4 h-4 text-purple-400" />
                    <span className="truncate">{scannedResult.email || "N/A"}</span>
                  </div>
                  <div className="col-span-full flex items-start gap-2 text-slate-300">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{scannedResult.examCentre || "Exam Centre"}</span>
                  </div>
                </div>

                {/* Attendance Toggle */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <span className="text-xs text-slate-400">Attendance Status:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onMarkAttendance(scannedResult.id, 'Present')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        scannedResult.attendanceStatus === 'Present'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => onMarkAttendance(scannedResult.id, 'Absent')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        scannedResult.attendanceStatus === 'Absent'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
