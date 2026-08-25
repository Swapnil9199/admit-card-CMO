import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
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
  Upload,
  AlertCircle,
  Volume2
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Play instant verification audio beep using Web Audio API
function playScanBeep() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz A5 note
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.16);
  } catch (e) {
    // Ignore if audio context not allowed
  }
}

export default function QrScannerView({ candidates = [], onMarkAttendance }) {
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // 'SUCCESS', 'NOT_FOUND', 'ALREADY_PRESENT'
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const streamRef = useRef(null);

  const lastScannedCodeRef = useRef('');
  const lastScannedTimeRef = useRef(0);

  // Fresh refs for live candidate list and attendance callback (solves stale closure!)
  const candidatesRef = useRef(candidates);
  const onMarkAttendanceRef = useRef(onMarkAttendance);

  useEffect(() => {
    candidatesRef.current = candidates;
  }, [candidates]);

  useEffect(() => {
    onMarkAttendanceRef.current = onMarkAttendance;
  }, [onMarkAttendance]);

  // Enumerate cameras
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
          const videoInputs = devices.filter(d => d.kind === 'videoinput');
          setVideoDevices(videoInputs);
          if (videoInputs.length > 0 && !selectedDeviceId) {
            const backCam = videoInputs.find(d =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('rear') ||
              d.label.toLowerCase().includes('environment')
            );
            setSelectedDeviceId(backCam ? backCam.deviceId : videoInputs[0].deviceId);
          }
        })
        .catch((err) => {
          console.warn("Could not enumerate devices:", err);
        });
    }
  }, []);

  // Frame processing loop with jsQR (60 FPS real-time scanning)
  const scanVideoFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      animationFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert"
    });

    if (code && code.data) {
      handleDecodedText(code.data);
    }

    animationFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
  }, []);

  // Start Camera Stream
  const startCamera = async (deviceId) => {
    setCameraError('');
    setIsCameraStarting(true);

    try {
      // Stop existing stream if any
      stopCameraStream();

      let stream = null;

      // 1. Try with specific deviceId if selected
      if (deviceId) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: deviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });
        } catch (e) {
          console.warn("Could not open specific deviceId, falling back:", e);
        }
      }

      // 2. Try rear environment camera for mobile
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });
        } catch (e) {
          console.warn("Could not open environment facing camera, falling back:", e);
        }
      }

      // 3. Fallback to any default video device
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true"); // Required for iOS Safari
        await videoRef.current.play();
      }

      setIsCameraActive(true);
      // Start 60 FPS scanning loop
      animationFrameIdRef.current = requestAnimationFrame(scanVideoFrame);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? "Camera permission was denied. Please allow camera access in your browser settings and refresh."
          : `Camera error: ${err.message || 'Unable to access camera.'}`
      );
      setIsCameraActive(false);
    } finally {
      setIsCameraStarting(false);
    }
  };

  // Stop Camera Stream
  const stopCameraStream = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
  };

  // Toggle Camera
  const handleToggleCamera = () => {
    if (isCameraActive) {
      stopCameraStream();
    } else {
      startCamera(selectedDeviceId);
    }
  };

  // Change Device
  const handleDeviceChange = (e) => {
    const newId = e.target.value;
    setSelectedDeviceId(newId);
    if (isCameraActive) {
      startCamera(newId);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Universal Decoded Text Processing
  const handleDecodedText = (text) => {
    if (!text) return;
    const now = Date.now();

    // Prevent repeat scan of exact same code within 1.6 seconds
    if (text === lastScannedCodeRef.current && now - lastScannedTimeRef.current < 1600) {
      return;
    }

    lastScannedCodeRef.current = text;
    lastScannedTimeRef.current = now;

    let codeToMatch = String(text).trim();

    // 1. JSON Payload from Admit Card
    if (codeToMatch.startsWith('{') && codeToMatch.endsWith('}')) {
      try {
        const parsed = JSON.parse(codeToMatch);
        if (parsed.uid || parsed.seatNo || parsed.phone || parsed.email) {
          verifyCandidateObject(parsed, text);
          return;
        }
      } catch (e) {}
    }

    // 2. URL Payload
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

  // Match against candidates
  const verifyCandidateCode = (code, rawOriginal = '') => {
    if (!code) return;
    const cleanCode = String(code).trim().toLowerCase();
    const digitsOnly = cleanCode.replace(/\D/g, '');
    const currentList = candidatesRef.current || [];

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
      const now = new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      const isAlreadyPresent = found.attendanceStatus === 'Present';
      setScanStatus(isAlreadyPresent ? 'ALREADY_PRESENT' : 'SUCCESS');

      // Update candidate with immediate timestamp
      const updatedCand = {
        ...found,
        attendanceStatus: 'Present',
        verifiedAt: isAlreadyPresent ? found.verifiedAt || timeStr : timeStr
      };
      setScannedResult(updatedCand);

      // Execute attendance mark callback
      if (onMarkAttendanceRef.current) {
        onMarkAttendanceRef.current(found.id, 'Present');
      }

      confetti({
        particleCount: 80,
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
  const handleImageFileScan = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = img.width;
        offscreenCanvas.height = img.height;
        const ctx = offscreenCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert"
        });

        if (code && code.data) {
          handleDecodedText(code.data);
        } else {
          setCameraError("Could not find a QR code in the uploaded image. Please ensure the QR code is clear and well lit.");
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
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
                    <Zap className="w-3 h-3 text-emerald-400" /> 60 FPS Real-Time
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time camera scanner with instant attendance record
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
              {isCameraStarting ? 'Opening...' : isCameraActive ? 'Stop Camera' : 'Start Camera Scanner'}
            </button>
          </div>

          {/* Camera Selection if multiple cameras found */}
          {videoDevices.length > 1 && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <Camera className="w-4 h-4 text-blue-400 shrink-0" />
              <label className="text-slate-400 text-[11px] whitespace-nowrap">Camera Device:</label>
              <select
                value={selectedDeviceId}
                onChange={handleDeviceChange}
                className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
              >
                {videoDevices.map((device, idx) => (
                  <option key={device.deviceId || idx} value={device.deviceId}>
                    {device.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Video & Scanner Viewport Container */}
          <div className="bg-slate-950 rounded-2xl border-2 border-slate-800 p-2 sm:p-3 overflow-hidden shadow-2xl relative min-h-[300px] flex items-center justify-center">
            {/* Native Video Element */}
            <video
              ref={videoRef}
              muted
              playsInline
              className={`w-full max-h-[380px] object-cover rounded-xl ${isCameraActive ? 'block' : 'hidden'}`}
            />
            {/* Hidden canvas used by jsQR */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning Guide Box when camera is active */}
            {isCameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className="w-64 h-64 border-2 border-dashed border-emerald-400/70 rounded-2xl relative animate-pulse shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                  {/* Laser line animation */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-bounce" />
                </div>
              </div>
            )}

            {/* Overlay when Camera is Idle */}
            {!isCameraActive && (
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
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
                    onClick={() => startCamera(selectedDeviceId)}
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
                LIVE 60 FPS
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
            Total candidates registered: <strong>{candidates.length}</strong>. Hold the QR code in front of the lens to automatically record attendance with a live timestamp.
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
