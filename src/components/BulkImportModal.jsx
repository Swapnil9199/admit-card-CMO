import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Users,
  Building2,
  BookOpen,
  Hash,
  Sparkles,
  Sliders,
  Check,
  User,
  Phone,
  Mail,
  Plus
} from 'lucide-react';
import { parseAnyCsvFile, downloadSampleCsvTemplate } from '../utils/csvHelper';
import { DEFAULT_EXAM_CENTRES } from '../data/defaultData';

export default function BulkImportModal({
  isOpen,
  onClose,
  onImport,
  defaultExamTitle = "गट क - पूर्व परीक्षा 2026",
  examCentres = DEFAULT_EXAM_CENTRES,
  onAddExamCentre
}) {
  const [adminExamTitle, setAdminExamTitle] = useState(defaultExamTitle);
  const [selectedCentre, setSelectedCentre] = useState(examCentres[0] || "S.P. College (Sir Parashurambhau College), Tilak Road, Pune");
  const [isAddingNewCentre, setIsAddingNewCentre] = useState(false);
  const [newCentreInput, setNewCentreInput] = useState('');

  const [rawFile, setRawFile] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({
    nameColumn: '',
    phoneColumn: '',
    emailColumn: ''
  });

  const [parsedCandidates, setParsedCandidates] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showColumnMapper, setShowColumnMapper] = useState(false);

  if (!isOpen) return null;

  const currentExamCentre = selectedCentre;

  const handleAddNewCentreSubmit = (e) => {
    e.preventDefault();
    if (!newCentreInput.trim()) return;
    const cleanCentre = newCentreInput.trim();
    if (onAddExamCentre) {
      onAddExamCentre(cleanCentre);
    }
    setSelectedCentre(cleanCentre);
    setNewCentreInput('');
    setIsAddingNewCentre(false);
    handleUpdateAdminBatchSettings(adminExamTitle, cleanCentre);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setRawFile(file);
    setIsProcessing(true);
    setErrorMsg('');

    try {
      const result = await parseAnyCsvFile(file, {}, adminExamTitle, currentExamCentre);
      if (result.candidates.length === 0) {
        setErrorMsg('No candidate records found in the uploaded file.');
      } else {
        setCsvHeaders(result.headers || []);
        setColumnMapping({
          nameColumn: result.detectedMapping.nameColumn || result.headers[0] || '',
          phoneColumn: result.detectedMapping.phoneColumn || result.headers[1] || '',
          emailColumn: result.detectedMapping.emailColumn || result.headers[2] || ''
        });
        setParsedCandidates(result.candidates);
      }
    } catch (err) {
      setErrorMsg(`Failed to parse CSV file: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-parse if admin manually changes column mapping dropdowns
  const handleColumnMappingChange = async (field, newColName) => {
    const updatedMapping = { ...columnMapping, [field]: newColName };
    setColumnMapping(updatedMapping);

    if (rawFile) {
      setIsProcessing(true);
      try {
        const result = await parseAnyCsvFile(rawFile, updatedMapping, adminExamTitle, currentExamCentre);
        setParsedCandidates(result.candidates);
      } catch (err) {
        console.error("Mapping re-parse error:", err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Update admin title/centre across parsed candidates
  const handleUpdateAdminBatchSettings = (newExamTitle, newExamCentre) => {
    if (parsedCandidates.length > 0) {
      const updated = parsedCandidates.map(c => ({
        ...c,
        examTitle: newExamTitle,
        examCentre: newExamCentre
      }));
      setParsedCandidates(updated);
    }
  };

  const handleConfirmImport = () => {
    if (parsedCandidates.length > 0) {
      const finalized = parsedCandidates.map(c => ({
        ...c,
        examTitle: adminExamTitle,
        examCentre: currentExamCentre
      }));
      onImport(finalized);
      setParsedCandidates([]);
      setRawFile(null);
      setCsvHeaders([]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-blue-500/20 text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                Universal CSV Import (Any Format Supported)
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Upload student CSV in any format. Auto-fetches <strong>Name, Phone & Email</strong>.
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

        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1 text-xs">
          {/* Admin Batch Configuration Section */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Building2 className="w-4 h-4 text-blue-400" />
                Admin Batch Settings (Applied to All Candidates)
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                Default Centre: S.P. College Pune
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Exam Title */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  Examination Title (Given by Admin)
                </label>
                <input
                  type="text"
                  value={adminExamTitle}
                  onChange={(e) => {
                    setAdminExamTitle(e.target.value);
                    handleUpdateAdminBatchSettings(e.target.value, currentExamCentre);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                  placeholder="e.g. गट क - पूर्व परीक्षा 2026"
                />
              </div>

              {/* Exam Centre Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    Assigned Exam Centre (Default: S.P. College)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCentre(!isAddingNewCentre)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    {isAddingNewCentre ? 'Cancel' : '+ Add Centre'}
                  </button>
                </div>

                {!isAddingNewCentre ? (
                  <select
                    value={selectedCentre}
                    onChange={(e) => {
                      setSelectedCentre(e.target.value);
                      handleUpdateAdminBatchSettings(adminExamTitle, e.target.value);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-slate-900 font-medium"
                  >
                    {examCentres.map((centre, idx) => (
                      <option key={idx} value={centre}>
                        {centre}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCentreInput}
                      onChange={(e) => setNewCentreInput(e.target.value)}
                      placeholder="Enter new examination centre name & city..."
                      className="flex-1 px-3 py-2 rounded-xl glass-input text-xs border-emerald-500/50"
                    />
                    <button
                      type="button"
                      onClick={handleAddNewCentreSubmit}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0"
                    >
                      Add & Select
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Smart Seat No Rule Notification */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px]">
              <Hash className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                <strong>Automatic 7-Digit Seat No:</strong> Computed automatically from the <strong>last 7 digits of each student's phone number</strong>.
              </span>
            </div>
          </div>

          {/* Upload Dropzone */}
          {parsedCandidates.length === 0 ? (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 hover:border-slate-500 bg-slate-800/20'
                }`}
              >
                <input
                  type="file"
                  id="csv-file-input-smart"
                  accept=".csv,text/csv,application/vnd.ms-excel"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
                <label htmlFor="csv-file-input-smart" className="cursor-pointer flex flex-col items-center justify-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    Drop your candidate CSV here in ANY format
                  </h4>
                  <p className="text-slate-400 mt-1 max-w-md text-xs">
                    Auto-detects candidate <strong>Name</strong>, <strong>Mobile Number</strong>, and <strong>Email Address</strong>.
                  </p>
                  <span className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition">
                    Choose CSV File
                  </span>
                </label>
              </div>

              {/* Sample Template Download */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800">
                <span className="text-slate-400 text-xs">
                  Prefer a pre-formatted template?
                </span>
                <button
                  onClick={downloadSampleCsvTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Sample CSV
                </button>
              </div>
            </div>
          ) : (
            /* Parsed Preview Table & Column Mapper */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Successfully extracted {parsedCandidates.length} candidate records!
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowColumnMapper(!showColumnMapper)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    {showColumnMapper ? 'Hide Column Mapping' : 'Adjust Column Mapping'}
                  </button>

                  <button
                    onClick={() => {
                      setParsedCandidates([]);
                      setRawFile(null);
                      setCsvHeaders([]);
                    }}
                    className="text-xs text-slate-400 hover:text-rose-400 transition"
                  >
                    Re-upload
                  </button>
                </div>
              </div>

              {/* Optional Column Mapper Controls */}
              {showColumnMapper && csvHeaders.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 animate-fadeIn">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-400" />
                    Detected Column Headers in your CSV:
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                        <User className="w-3 h-3 text-blue-400" /> Candidate Name Column:
                      </label>
                      <select
                        value={columnMapping.nameColumn}
                        onChange={(e) => handleColumnMappingChange('nameColumn', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl glass-input text-xs bg-slate-900 font-medium"
                      >
                        {csvHeaders.map((header, idx) => (
                          <option key={idx} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-400" /> Mobile / Phone Column:
                      </label>
                      <select
                        value={columnMapping.phoneColumn}
                        onChange={(e) => handleColumnMappingChange('phoneColumn', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl glass-input text-xs bg-slate-900 font-medium"
                      >
                        {csvHeaders.map((header, idx) => (
                          <option key={idx} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-purple-400" /> Email / Gmail Column:
                      </label>
                      <select
                        value={columnMapping.emailColumn}
                        onChange={(e) => handleColumnMappingChange('emailColumn', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl glass-input text-xs bg-slate-900 font-medium"
                      >
                        {csvHeaders.map((header, idx) => (
                          <option key={idx} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Preview Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/90 text-slate-300 sticky top-0">
                    <tr>
                      <th className="p-2.5">Candidate Name</th>
                      <th className="p-2.5">Mobile Number</th>
                      <th className="p-2.5">Email ID</th>
                      <th className="p-2.5 text-blue-400">Seat No (Last 7 Digits)</th>
                      <th className="p-2.5">Exam Centre</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                    {parsedCandidates.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-2.5 font-medium text-white">{c.name}</td>
                        <td className="p-2.5 font-mono text-emerald-300 font-bold">{c.phone}</td>
                        <td className="p-2.5 text-slate-300 font-mono text-[11px]">{c.email}</td>
                        <td className="p-2.5 font-mono font-bold text-blue-400 bg-blue-500/5">
                          {c.seatNo}
                        </td>
                        <td className="p-2.5 text-slate-400 truncate max-w-[180px]">{c.examCentre}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-800 bg-slate-800/30">
          <div className="text-xs text-slate-400">
            {parsedCandidates.length > 0 ? (
              <span className="text-emerald-400 font-semibold">
                ✓ Ready to import {parsedCandidates.length} candidate(s) to {currentExamCentre}!
              </span>
            ) : (
              'Accepts CSV in any format'
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              disabled={parsedCandidates.length === 0}
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
            >
              <Users className="w-4 h-4" />
              Import {parsedCandidates.length > 0 ? `${parsedCandidates.length} Candidates` : 'Candidates'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
