import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  Search,
  User,
  Phone,
  Mail,
  Hash,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  Camera,
  RefreshCw,
  Zap,
  Volume2
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Play instant verification audio beep
function playScanBeep() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
  } catch (e) {
    // Ignore audio error if user hasn't interacted with audio context yet
  }
}

export default function QrScannerView({ candidates, onMarkAttendance }) {
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // 'SUCCESS', 'NOT_FOUND', 'ALREADY_PRESENT'
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [cameraError, setCameraError] = useState('');

  const html5QrCodeRef = useRef(null);
  const lastScannedCodeRef = useRef('');
  const lastScannedTimeRef = useRef(0);

  // Discover available cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back/environment camera if available
          const backCam = devices.find(d =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      })
      .catch((err) => {
        console.warn("Could not pre-fetch cameras:", err);
      });
  }, []);

  // Camera start/stop lifecycle with ultra-fast direct Html5Qrcode engine
  useEffect(() => {
    let qrInstance = null;

    if (isCameraActive) {
      setCameraError('');
      const elementId = "qr-reader-viewport";

      try {
        qrInstance = new Html5Qrcode(elementId, {
          // Hardware-accelerated native Barcode/QR detection API
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          },
          verbose: false
        });
        html5QrCodeRef.current = qrInstance;

        const config = {
          fps: 25, // Ultra-fast 25 FPS frame rate for instant recognition
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const boxSize = Math.floor(minEdge * 0.85);
            return { width: boxSize, height: boxSize };
          },
          aspectRatio: 1.0
        };

        const cameraIdOrConfig = selectedCameraId
          ? selectedCameraId
          : { facingMode: "environment" };

        qrInstance
          .start(
            cameraIdOrConfig,
            config,
            (decodedText) => {
              handleFastDecodedText(decodedText);
            },
            (errorMsg) => {
              // Frame scanning progress (ignore normal continuous frame search)
            }
          )
          .catch((err) => {
            console.error("Camera start error:", err);
            setCameraError(
              err?.message || "Camera permission denied or camera unavailable. Please allow camera access in browser."
            );
            setIsCameraActive(false);
          });
      } catch (err) {
        console.error("Scanner init error:", err);
        setCameraError(err.message || "Failed to initialize camera scanner.");
        setIsCameraActive(false);
      }
    }

    return () => {
      if (html5QrCodeRef.current) {
        const instance = html5QrCodeRef.current;
        html5QrCodeRef.current = null;

        if (instance.isScanning) {
          instance
            .stop()
            .then(() => {
              instance.clear();
            })
            .catch((err) => {
              console.warn("Error stopping scanner:", err);
            });
        } else {
          try {
            instance.clear();
          } catch (e) {}
        }
      }
    };
  }, [isCameraActive, selectedCameraId]);

  // Fast decoded text processing with instant debounce
  const handleFastDecodedText = (text) => {
    if (!text) return;
    const now = Date.now();

    // Prevent repeat scan of the exact same code within 1.8 seconds
    if (text === lastScannedCodeRef.current && now - lastScannedTimeRef.current < 1800) {
      return;
    }

    lastScannedCodeRef.current = text;
    lastScannedTimeRef.current = now;

    let codeToMatch = text.trim();

    // 1. If QR encodes a JSON payload
    if (codeToMatch.startsWith('{') && codeToMatch.endsWith('}')) {
      try {
        const parsed = JSON.parse(codeToMatch);
        codeToMatch = parsed.uid || parsed.seatNo || parsed.phone || codeToMatch;
      } catch (e) {}
    }

    // 2. If QR encodes a URL with ?verify= query param
    if (codeToMatch.includes('?verify=')) {
      try {
        const url = new URL(codeToMatch);
        const verifyParam = url.searchParams.get('verify');
        if (verifyParam) codeToMatch = verifyParam;
      } catch (e) {
        const parts = codeToMatch.split('?verify=');
        if (parts[1]) codeToMatch = parts[1].split('&')[0];
      }
    }

    verifyCandidateCode(codeToMatch);
  };

  const verifyCandidateCode = (code) => {
    if (!code) return;
    const cleanCode = String(code).trim().toLowerCase();
    const digitsOnly = cleanCode.replace(/\D/g, '');

    // Search across candidates with multi-field fallback
    const found = candidates.find(c => {
      const cUnique = c.uniqueCode ? c.uniqueCode.toLowerCase() : '';
      const cId = c.id ? c.id.toLowerCase() : '';
      const cSeat = c.seatNo ? String(c.seatNo).toLowerCase() : '';
      const cPhone = c.phone ? String(c.phone).replace(/\D/g, '') : '';
      const cEmail = c.email ? c.email.toLowerCase() : '';

      return (
        cUnique === cleanCode ||
        cId === cleanCode ||
        cSeat === cleanCode ||
        (digitsOnly && cSeat === digitsOnly.slice(-7)) ||
        (digitsOnly && cPhone && (cPhone === digitsOnly || cPhone.slice(-7) === digitsOnly.slice(-7))) ||
        cEmail === cleanCode
      );
    });

    if (found) {
      playScanBeep();
      setScannedResult(found);
      const isAlreadyPresent = found.attendanceStatus === 'Present';
      setScanStatus(isAlreadyPresent ? 'ALREADY_PRESENT' : 'SUCCESS');

      if (!isAlreadyPresent) {
        onMarkAttendance(found.id, 'Present');
        confetti({
          particleCount: 75,
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
        <div className="p-6 rounded-3xl glass-panel space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <span>Admit Card QR Scanner</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-400" /> Ultra-Fast 25 FPS
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Instant camera scan with automatic attendance marking
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCameraActive(!isCameraActive)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg ${
                isCameraActive
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 shadow-rose-600/20'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30'
              }`}
            >
              <Camera className="w-4 h-4" />
              {isCameraActive ? 'Stop Camera' : 'Start Camera Scanner'}
            </button>
          </div>

          {/* Camera Selection if multiple cameras found */}
          {cameras.length > 1 && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <Camera className="w-4 h-4 text-blue-400 shrink-0" />
              <label className="text-slate-400 text-[11px] whitespace-nowrap">Camera Device:</label>
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
              >
                {cameras.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Camera ${cam.id.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Camera View Box */}
          {isCameraActive ? (
            <div className="bg-slate-950 rounded-2xl border-2 border-blue-500/50 p-2 sm:p-3 overflow-hidden shadow-2xl relative">
              <div id="qr-reader-viewport" className="w-full text-slate-900 rounded-xl overflow-hidden min-h-[280px]" />
              <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-700 text-[10px] text-emerald-400 font-mono font-bold backdrop-blur">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                <QrCode className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">
                Camera is currently idle
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Click <strong>"Start Camera Scanner"</strong> for instant high-speed QR verification.
              </p>
            </div>
          )}

          {/* Camera Permission / Device Error */}
          {cameraError && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Manual Input Fallback */}
          <div className="pt-4 border-t border-slate-800">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Manual Seat Number or Mobile Lookup
            </label>
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. 9696080 or 7499696080 or CM-MPSC-9696080"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs sm:text-sm font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition shrink-0"
              >
                Verify Code
              </button>
            </form>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-800/30 text-xs text-blue-300/90 space-y-1">
          <p className="font-semibold text-blue-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> High-Speed Attendance Engine
          </p>
          <p>
            The scanner uses hardware-accelerated QR decoding. Simply hold the printed or digital hall ticket in front of the lens for instant sub-second verification.
          </p>
        </div>
      </div>

      {/* Right: Verification Status & Candidate Card */}
      <div className="lg:col-span-6 space-y-6">
        <div className="p-6 rounded-3xl glass-panel h-full flex flex-col">
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
                className={`p-4 rounded-2xl flex items-center gap-3 border ${
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
                  <p className="text-xs opacity-90 font-mono">
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
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-xs font-bold border border-blue-500/30">
                        Seat: {scannedResult.seatNo}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-xs border border-purple-500/30">
                        {scannedResult.uniqueCode}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-mono font-bold">{scannedResult.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mail className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="truncate">{scannedResult.email || "N/A"}</span>
                  </div>
                  <div className="col-span-full flex items-start gap-2 text-slate-300">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{scannedResult.examCentre || "S.P. College, Pune"}</span>
                  </div>
                </div>

                {/* Attendance Toggle */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <span className="text-xs text-slate-400">Attendance Status:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onMarkAttendance(scannedResult.id, 'Present')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        scannedResult.attendanceStatus === 'Present'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => onMarkAttendance(scannedResult.id, 'Absent')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        scannedResult.attendanceStatus === 'Absent'
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
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
