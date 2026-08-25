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
  Volume2,
  Upload,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Play instant verification audio beep
function playScanBeep() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz A5 note
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (e) {
    // Ignore audio error
  }
}

export default function QrScannerView({ candidates = [], onMarkAttendance }) {
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // 'SUCCESS', 'NOT_FOUND', 'ALREADY_PRESENT'
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [lastScannedText, setLastScannedText] = useState('');

  const html5QrCodeRef = useRef(null);
  const lastScannedCodeRef = useRef('');
  const lastScannedTimeRef = useRef(0);

  // Use refs for fresh access to props in camera scanner callbacks (fixes stale closure!)
  const candidatesRef = useRef(candidates);
  const onMarkAttendanceRef = useRef(onMarkAttendance);

  useEffect(() => {
    candidatesRef.current = candidates;
  }, [candidates]);

  useEffect(() => {
    onMarkAttendanceRef.current = onMarkAttendance;
  }, [onMarkAttendance]);

  // Discover available cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find(d =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        }
      })
      .catch((err) => {
        console.warn("Could not discover cameras initially:", err);
      });
  }, []);

  // Robust Camera Start Function
  const startScanning = async (targetCameraId) => {
    setCameraError('');
    setIsCameraStarting(true);

    try {
      // Ensure any existing instance is cleanly stopped
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
          await html5QrCodeRef.current.clear();
        } catch (e) {}
        html5QrCodeRef.current = null;
      }

      const elementId = "qr-reader-viewport";
      const viewportEl = document.getElementById(elementId);
      if (!viewportEl) {
        throw new Error("Scanner viewport element not ready. Please try again.");
      }

      const qrInstance = new Html5Qrcode(elementId, {
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        },
        verbose: false
      });
      html5QrCodeRef.current = qrInstance;

      const scanConfig = {
        fps: 20,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const boxSize = Math.max(180, Math.floor(minEdge * 0.82));
          return { width: boxSize, height: boxSize };
        },
        aspectRatio: 1.0
      };

      // Try camera launch with graceful fallback
      let started = false;

      // 1. Try selectedCameraId if user picked one
      if (targetCameraId) {
        try {
          await qrInstance.start(
            targetCameraId,
            scanConfig,
            (decodedText) => handleDecodedText(decodedText),
            () => {}
          );
          started = true;
        } catch (e) {
          console.warn("Could not start specific camera ID, trying environment camera:", e);
        }
      }

      // 2. Try rear/environment camera
      if (!started) {
        try {
          await qrInstance.start(
            { facingMode: "environment" },
            scanConfig,
            (decodedText) => handleDecodedText(decodedText),
            () => {}
          );
          started = true;
        } catch (e) {
          console.warn("Could not start environment camera, trying default user camera:", e);
        }
      }

      // 3. Try standard/user camera fallback
      if (!started) {
        await qrInstance.start(
          { facingMode: "user" },
          scanConfig,
          (decodedText) => handleDecodedText(decodedText),
          () => {}
        );
        started = true;
      }

      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera startup failed:", err);
      setCameraError(
        err.message || "Camera permission denied or camera device is in use by another application."
      );
      setIsCameraActive(false);
    } finally {
      setIsCameraStarting(false);
    }
  };

  // Clean stop function
  const stopScanning = async () => {
    setIsCameraActive(false);
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn("Error stopping scanner:", err);
      }
      html5QrCodeRef.current = null;
    }
  };

  // Toggle Camera
  const handleToggleCamera = () => {
    if (isCameraActive) {
      stopScanning();
    } else {
      startScanning(selectedCameraId);
    }
  };

  // Change camera device
  const handleCameraChange = (e) => {
    const newId = e.target.value;
    setSelectedCameraId(newId);
    if (isCameraActive) {
      startScanning(newId);
    }
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop();
          }
          html5QrCodeRef.current.clear();
        } catch (e) {}
        html5QrCodeRef.current = null;
      }
    };
  }, []);

  // Universal Decoded Text Processing
  const handleDecodedText = (text) => {
    if (!text) return;
    const now = Date.now();

    // Prevent repeat scan of identical code within 1.5 seconds
    if (text === lastScannedCodeRef.current && now - lastScannedTimeRef.current < 1500) {
      return;
    }

    lastScannedCodeRef.current = text;
    lastScannedTimeRef.current = now;
    setLastScannedText(text);

    let codeToMatch = String(text).trim();

    // 1. Check if payload is a JSON string
    if (codeToMatch.startsWith('{') && codeToMatch.endsWith('}')) {
      try {
        const parsed = JSON.parse(codeToMatch);
        // Look up by candidate object directly
        if (parsed.uid || parsed.seatNo || parsed.phone || parsed.email) {
          verifyCandidateObject(parsed, text);
          return;
        }
      } catch (e) {}
    }

    // 2. Check if payload is URL with ?verify= param
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

    verifyCandidateCode(codeToMatch, text);
  };

  // Verification matching logic
  const verifyCandidateCode = (code, rawOriginal = '') => {
    if (!code) return;
    const cleanCode = String(code).trim().toLowerCase();
    const digitsOnly = cleanCode.replace(/\D/g, '');
    const currentList = candidatesRef.current || [];

    // Search across candidate records
    const found = currentList.find(c => {
      const cUnique = c.uniqueCode ? String(c.uniqueCode).toLowerCase().trim() : '';
      const cId = c.id ? String(c.id).toLowerCase().trim() : '';
      const cSeat = c.seatNo ? String(c.seatNo).toLowerCase().trim() : '';
      const cPhone = c.phone ? String(c.phone).replace(/\D/g, '') : '';
      const cEmail = c.email ? String(c.email).toLowerCase().trim() : '';

      return (
        cUnique === cleanCode ||
        cId === cleanCode ||
        cSeat === cleanCode ||
        (digitsOnly.length >= 7 && (cSeat === digitsOnly.slice(-7) || cSeat === digitsOnly)) ||
        (digitsOnly.length >= 7 && cPhone.length >= 7 && (cPhone === digitsOnly || cPhone.slice(-7) === digitsOnly.slice(-7))) ||
        (cEmail && cEmail === cleanCode)
      );
    });

    finalizeVerification(found, code, rawOriginal);
  };

  const verifyCandidateObject = (parsedObj, rawOriginal = '') => {
    const currentList = candidatesRef.current || [];
    const uid = parsedObj.uid ? String(parsedObj.uid).toLowerCase().trim() : '';
    const seatNo = parsedObj.seatNo ? String(parsedObj.seatNo).toLowerCase().trim() : '';
    const phone = parsedObj.phone ? String(parsedObj.phone).replace(/\D/g, '') : '';
    const email = parsedObj.email ? String(parsedObj.email).toLowerCase().trim() : '';

    const found = currentList.find(c => {
      const cUnique = c.uniqueCode ? String(c.uniqueCode).toLowerCase().trim() : '';
      const cId = c.id ? String(c.id).toLowerCase().trim() : '';
      const cSeat = c.seatNo ? String(c.seatNo).toLowerCase().trim() : '';
      const cPhone = c.phone ? String(c.phone).replace(/\D/g, '') : '';
      const cEmail = c.email ? String(c.email).toLowerCase().trim() : '';

      return (
        (uid && (cUnique === uid || cId === uid)) ||
        (seatNo && cSeat === seatNo) ||
        (phone && (cPhone === phone || cPhone.slice(-7) === phone.slice(-7))) ||
        (email && cEmail === email)
      );
    });

    finalizeVerification(found, parsedObj.uid || parsedObj.seatNo || parsedObj.name, rawOriginal);
  };

  const finalizeVerification = (found, codeUsed, rawOriginal) => {
    if (found) {
      playScanBeep();
      setScannedResult(found);
      const isAlreadyPresent = found.attendanceStatus === 'Present';
      setScanStatus(isAlreadyPresent ? 'ALREADY_PRESENT' : 'SUCCESS');

      // Mark Present immediately
      if (onMarkAttendanceRef.current) {
        onMarkAttendanceRef.current(found.id, 'Present');
      }

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    } else {
      setScannedResult({ rawCode: codeUsed || rawOriginal });
      setScanStatus('NOT_FOUND');
    }
  };

  // Manual Search Handler
  const handleManualSearch = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      verifyCandidateCode(manualCode.trim(), manualCode);
      setManualCode('');
    }
  };

  // Image Upload Scanner Fallback
  const handleImageFileScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode("qr-reader-viewport");
      const decodedResult = await html5QrCode.scanFile(file, true);
      handleDecodedText(decodedResult);
      html5QrCode.clear();
    } catch (err) {
      setCameraError("Could not find or decode a QR code in the uploaded image. Please ensure the image is clear.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: QR Camera Scanner & Controls */}
      <div className="lg:col-span-6 space-y-6">
        <div className="p-6 rounded-3xl glass-panel space-y-5">
          {/* Header & Toggle Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <span>Admit Card QR Scanner</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-400" /> Instant Verify
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Scan Hall Ticket QR code or upload image to mark attendance
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isCameraStarting}
              onClick={handleToggleCamera}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg ${
                isCameraActive
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 shadow-rose-600/20'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30'
              }`}
            >
              <Camera className="w-4 h-4" />
              {isCameraStarting ? 'Starting...' : isCameraActive ? 'Stop Camera' : 'Start Camera Scanner'}
            </button>
          </div>

          {/* Camera Selection if multiple cameras found */}
          {cameras.length > 1 && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <Camera className="w-4 h-4 text-blue-400 shrink-0" />
              <label className="text-slate-400 text-[11px] whitespace-nowrap">Camera Device:</label>
              <select
                value={selectedCameraId}
                onChange={handleCameraChange}
                className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
              >
                {cameras.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Camera ${cam.id.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Scanner Viewport Container (Always mounted in DOM to prevent mount race condition) */}
          <div className="bg-slate-950 rounded-2xl border-2 border-slate-800 p-2 sm:p-3 overflow-hidden shadow-2xl relative">
            <div
              id="qr-reader-viewport"
              className="w-full text-slate-900 rounded-xl overflow-hidden min-h-[280px]"
            />

            {/* Overlay when Camera is Idle */}
            {!isCameraActive && (
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <QrCode className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">
                    Camera Scanner Idle
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 max-w-xs">
                    Click <strong>"Start Camera Scanner"</strong> to scan admit cards, or upload an image file below.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => startScanning(selectedCameraId)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Open Camera
                  </button>

                  <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-purple-400" />
                    Scan Image File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileScan}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {isCameraActive && (
              <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/85 border border-slate-700 text-[10px] text-emerald-400 font-mono font-bold backdrop-blur">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                CAMERA SCANNING
              </div>
            )}
          </div>

          {/* Camera Error Alert */}
          {cameraError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Manual Input Fallback */}
          <div className="pt-3 border-t border-slate-800">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Manual Lookup (Seat No / Mobile Number / Unique ID)
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
                Mark Attendance
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
            Total candidates registered in system: <strong>{candidates.length}</strong>. Hold the QR code in front of the lens to automatically record attendance with a live timestamp.
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
                Scan an admit card QR code, upload an admit card image, or search by seat number to see verification outcome here.
              </p>
            </div>
          ) : scanStatus === 'NOT_FOUND' ? (
            <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-3 animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-rose-300">
                Invalid or Unregistered Code
              </h4>
              <p className="text-xs text-rose-300/80 font-mono break-all max-w-md mx-auto">
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
                <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-400" />
                <div>
                  <h4 className="font-bold text-sm">
                    {scanStatus === 'SUCCESS' ? '✓ Attendance Marked Present Successfully!' : 'Candidate Verified (Already Marked Present)'}
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
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-xs border border-purple-500/30">
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
                      type="button"
                      onClick={() => {
                        if (onMarkAttendanceRef.current) {
                          onMarkAttendanceRef.current(scannedResult.id, 'Present');
                          setScannedResult(prev => ({ ...prev, attendanceStatus: 'Present' }));
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        scannedResult.attendanceStatus === 'Present'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onMarkAttendanceRef.current) {
                          onMarkAttendanceRef.current(scannedResult.id, 'Absent');
                          setScannedResult(prev => ({ ...prev, attendanceStatus: 'Absent' }));
                        }
                      }}
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
