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
  CameraOff,
  Volume2,
  RefreshCw,
  Zap,
  Check,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Web Audio API Beep Synthesizer for instant verification feedback
function playSuccessBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // High A5 note
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // Ramp to E6

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    // Audio context not allowed before gesture or not supported
  }
}

export default function QrScannerView({ candidates, onMarkAttendance }) {
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // 'SUCCESS', 'NOT_FOUND', 'ALREADY_PRESENT'
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [isScanningCooldown, setIsScanningCooldown] = useState(false);

  const scannerInstanceRef = useRef(null);
  const cooldownTimerRef = useRef(null);
  const lastScannedCodeRef = useRef('');

  // Fetch available video input cameras on mount
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length) {
          setAvailableCameras(devices);
          // Prefer back/environment camera
          const backCam = devices.find(d =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      })
      .catch(err => {
        console.warn("Could not fetch camera list:", err);
      });

    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    if (scannerInstanceRef.current) {
      try {
        if (scannerInstanceRef.current.isScanning) {
          await scannerInstanceRef.current.stop();
        }
        await scannerInstanceRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner instance:", err);
      } finally {
        scannerInstanceRef.current = null;
      }
    }
  };

  const startScanner = async (cameraIdToUse) => {
    setCameraError('');
    await stopScanner();

    try {
      const html5QrCode = new Html5Qrcode("fast-qr-reader-container");
      scannerInstanceRef.current = html5QrCode;

      const cameraConfig = cameraIdToUse
        ? { deviceId: { exact: cameraIdToUse } }
        : { facingMode: "environment" };

      const config = {
        fps: 25, // Ultra-fast 25 frames per second
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrEdge = Math.floor(minEdge * 0.75);
          return { width: Math.max(qrEdge, 220), height: Math.max(qrEdge, 220) };
        },
        aspectRatio: 1.0,
        disableFlip: false
      };

      await html5QrCode.start(
        cameraConfig,
        config,
        (decodedText) => {
          handleDecodedText(decodedText);
        },
        (errorMessage) => {
          // Frame read misses are normal in continuous video stream; ignore
        }
      );

      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera startup error:", err);
      setCameraError(
        err?.message || "Could not access camera. Please allow camera permissions in your browser."
      );
      setIsCameraActive(false);
    }
  };

  const handleToggleCamera = () => {
    if (isCameraActive) {
      stopScanner();
      setIsCameraActive(false);
    } else {
      startScanner(selectedCameraId);
    }
  };

  const handleSwitchCamera = (newCamId) => {
    setSelectedCameraId(newCamId);
    if (isCameraActive) {
      startScanner(newCamId);
    }
  };

  const handleDecodedText = (text) => {
    if (!text) return;
    const cleanText = text.trim();

    // Prevent duplicate rapid scans of same code within cooldown
    if (lastScannedCodeRef.current === cleanText && isScanningCooldown) {
      return;
    }

    lastScannedCodeRef.current = cleanText;
    setIsScanningCooldown(true);

    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    cooldownTimerRef.current = setTimeout(() => {
      setIsScanningCooldown(false);
      lastScannedCodeRef.current = '';
    }, 1500); // 1.5s rearm time

    // Smart Multi-Format Matcher
    let codeToVerify = cleanText;

    // 1. If JSON payload
    if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
      try {
        const parsed = JSON.parse(cleanText);
        codeToVerify = parsed.uid || parsed.seatNo || parsed.seat || parsed.code || cleanText;
      } catch (e) {
        codeToVerify = cleanText;
      }
    }

    // 2. If URL format (e.g. ?verify=CM-MPSC-9696080)
    if (cleanText.includes('verify=')) {
      try {
        const urlParams = new URLSearchParams(cleanText.split('?')[1]);
        codeToVerify = urlParams.get('verify') || codeToVerify;
      } catch (e) {
        // keep cleanText
      }
    }

    verifyCandidateCode(codeToVerify);
  };

  const verifyCandidateCode = (code) => {
    if (!code) return;
    const cleanCode = code.trim().toLowerCase();
    const digitsOnly = code.replace(/\D/g, '');

    // Search across candidates by uniqueCode, id, seatNo, phone, or email
    const found = candidates.find(c => {
      const matchUnique = c.uniqueCode && c.uniqueCode.toLowerCase() === cleanCode;
      const matchId = c.id && c.id.toLowerCase() === cleanCode;
      const matchSeat = c.seatNo && String(c.seatNo).toLowerCase() === cleanCode;
      const matchPhone = c.phone && c.phone.replace(/\D/g, '').endsWith(digitsOnly && digitsOnly.length >= 7 ? digitsOnly.slice(-7) : cleanCode);
      const matchEmail = c.email && c.email.toLowerCase() === cleanCode;

      return matchUnique || matchId || matchSeat || matchPhone || matchEmail;
    });

    if (found) {
      setScannedResult(found);
      const isAlreadyPresent = found.attendanceStatus === 'Present';
      setScanStatus(isAlreadyPresent ? 'ALREADY_PRESENT' : 'SUCCESS');

      playSuccessBeep();

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
      {/* Left Column: High-Speed QR Scanner & Manual Input */}
      <div className="lg:col-span-6 space-y-4 sm:space-y-6">
        {/* Scanner Card */}
        <div className="p-4 sm:p-6 rounded-3xl glass-panel space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                  <span>Fast QR Code Scanner</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-400" /> Instant 25 FPS
                  </span>
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400">
                  Point camera at candidate's printed Hall Ticket QR code
                </p>
              </div>
            </div>

            {/* Camera Switcher Dropdown if multi-camera */}
            {availableCameras.length > 1 && (
              <select
                value={selectedCameraId}
                onChange={(e) => handleSwitchCamera(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl glass-input text-xs bg-slate-900 font-medium max-w-[160px] truncate"
              >
                {availableCameras.map((cam, idx) => (
                  <option key={cam.id || idx} value={cam.id}>
                    {cam.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Video Container Box */}
          <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-slate-800 aspect-square max-w-sm mx-auto flex items-center justify-center shadow-2xl">
            {/* HTML5 QR Code Mount Element */}
            <div id="fast-qr-reader-container" className="w-full h-full" />

            {/* Offline / Inactive State Overlay */}
            {!isCameraActive && (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
                <div className="w-16 h-16 rounded-3xl bg-blue-600/20 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/10">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Camera is Turned Off</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Click the button below to activate instant QR scanning.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleCamera}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
                >
                  <Camera className="w-4 h-4" />
                  Start Fast Scanner
                </button>
              </div>
            )}

            {/* Active Scanning Animation Overlay */}
            {isCameraActive && (
              <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">
                {/* Laser Scanning Line */}
                <div className="w-4/5 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse" />
                
                {isScanningCooldown && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-600/90 text-white font-bold text-[10px] shadow flex items-center gap-1 animate-fadeIn">
                    <Check className="w-3 h-3" /> Scanned!
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Camera Error Message */}
          {cameraError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Scanner Control Button */}
          {isCameraActive && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleToggleCamera}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 font-bold text-xs transition"
              >
                <CameraOff className="w-4 h-4" />
                Stop Camera Scanner
              </button>
            </div>
          )}
        </div>

        {/* Manual Code / Seat Number Search */}
        <div className="p-4 sm:p-6 rounded-3xl glass-panel space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-400" />
            Manual Seat No / Phone / Code Verification
          </h4>
          <form onSubmit={handleManualSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Seat No, Mobile No, or CM-MPSC Code..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs font-mono"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition shrink-0"
            >
              Verify
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Instant Verification Result Card */}
      <div className="lg:col-span-6">
        {scanStatus === null ? (
          <div className="p-8 sm:p-12 rounded-3xl glass-panel text-center flex flex-col items-center justify-center h-full min-h-[360px] space-y-3 border border-slate-800">
            <div className="w-16 h-16 rounded-3xl bg-slate-800/80 text-slate-500 flex items-center justify-center">
              <Sparkles className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-white text-base">Ready for Verification</h4>
            <p className="text-xs text-slate-400 max-w-sm">
              Scan a student's hall ticket QR code or type their 7-digit Seat No to mark attendance instantly.
            </p>
          </div>
        ) : scanStatus === 'NOT_FOUND' ? (
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-rose-500/40 bg-rose-950/20 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <XCircle className="w-10 h-10" />
            </div>
            <div>
              <h3 className="font-black text-xl text-rose-400 uppercase tracking-wide">
                Candidate Not Found
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                No matching student found for code: <code className="text-white font-bold bg-slate-900 px-2 py-0.5 rounded">{scannedResult?.rawCode}</code>
              </p>
            </div>
            <button
              onClick={() => setScanStatus(null)}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Scan Next
            </button>
          </div>
        ) : (
          /* Success / Already Present Student Card */
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-emerald-500/40 bg-emerald-950/15 space-y-5 animate-fadeIn shadow-2xl">
            {/* Status Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="font-black text-lg text-emerald-400">
                    {scanStatus === 'SUCCESS' ? '✓ ATTENDANCE VERIFIED' : '✓ ALREADY MARKED PRESENT'}
                  </div>
                  <div className="text-xs text-slate-400">
                    Combine Mentor Official • Exam Verification
                  </div>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                Seat #{scannedResult?.seatNo}
              </span>
            </div>

            {/* Candidate Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" /> Student Name
                </span>
                <div className="font-bold text-base text-white">{scannedResult?.name}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> Mobile Number
                </span>
                <div className="font-mono font-bold text-sm text-emerald-300">{scannedResult?.phone || 'N/A'}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-purple-400" /> Email Address
                </span>
                <div className="font-mono text-slate-200 truncate">{scannedResult?.email || 'N/A'}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Verified Timestamp
                </span>
                <div className="font-mono text-slate-200">
                  {scannedResult?.verifiedAt || new Date().toLocaleTimeString()}
                </div>
              </div>

              <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" /> Examination Centre
                </span>
                <div className="font-medium text-slate-200">
                  {scannedResult?.examCentre || 'S.P. College (Sir Parashurambhau College), Tilak Road, Pune'}
                </div>
              </div>
            </div>

            {/* Quick Action footer */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> Ready for next candidate
              </span>

              <button
                onClick={() => setScanStatus(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Clear / Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
