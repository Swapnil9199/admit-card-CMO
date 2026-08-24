import React, { useState } from 'react';
import { X, UploadCloud, FileSpreadsheet, Download, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import { parseCandidateCsv, downloadSampleCsvTemplate } from '../utils/csvHelper';

export default function BulkImportModal({ isOpen, onClose, onImport }) {
  const [parsedData, setParsedData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (file) => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg('');

    try {
      const candidates = await parseCandidateCsv(file);
      if (candidates.length === 0) {
        setErrorMsg('No candidate records found in the uploaded file.');
      } else {
        setParsedData(candidates);
      }
    } catch (err) {
      setErrorMsg(`Failed to parse CSV file: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (parsedData.length > 0) {
      onImport(parsedData);
      setParsedData([]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                Bulk Import Candidates (CSV / Excel)
              </h3>
              <p className="text-xs text-slate-400">
                Upload student records with Name, Mobile, Email, Seat No, and Center
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

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Download Sample Template Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-950/50 to-indigo-950/50 border border-blue-800/40">
            <div>
              <h4 className="text-sm font-semibold text-blue-200">
                Need the standard import format?
              </h4>
              <p className="text-xs text-blue-300/80 mt-0.5">
                Download our pre-formatted CSV template with candidate columns.
              </p>
            </div>
            <button
              onClick={downloadSampleCsvTemplate}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-200 text-xs font-semibold transition shrink-0"
            >
              <Download className="w-4 h-4" />
              Download Sample CSV
            </button>
          </div>

          {/* Upload Dropzone */}
          {parsedData.length === 0 ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 hover:border-slate-500 bg-slate-800/20'
              }`}
            >
              <input
                type="file"
                id="csv-file-input"
                accept=".csv,text/csv,application/vnd.ms-excel"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              <label htmlFor="csv-file-input" className="cursor-pointer flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h4 className="text-base font-semibold text-white">
                  Click to upload or drag & drop CSV file
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Supports .CSV files exported from Google Sheets, Microsoft Excel, or your CRM.
                </p>
                <span className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition">
                  Select CSV File
                </span>
              </label>
            </div>
          ) : (
            /* Parsed Preview Table */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Successfully parsed {parsedData.length} candidate records
                </div>
                <button
                  onClick={() => setParsedData([])}
                  className="text-xs text-slate-400 hover:text-rose-400 transition"
                >
                  Clear & re-upload
                </button>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800 text-slate-300 sticky top-0">
                    <tr>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Mobile</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Seat No</th>
                      <th className="p-2.5">Exam Centre</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                    {parsedData.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-2.5 font-medium text-white">{c.name}</td>
                        <td className="p-2.5 font-mono text-slate-300">{c.phone}</td>
                        <td className="p-2.5 text-slate-300">{c.email}</td>
                        <td className="p-2.5 font-mono font-bold text-blue-400">{c.seatNo}</td>
                        <td className="p-2.5 text-slate-400 truncate max-w-[150px]">{c.examCentre}</td>
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-800/30">
          <div className="text-xs text-slate-400">
            {parsedData.length > 0 ? `Ready to import ${parsedData.length} students` : 'Supported columns: Name, Mobile, Email, Seat No, Centre'}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              disabled={parsedData.length === 0}
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
            >
              <Users className="w-4 h-4" />
              Import {parsedData.length > 0 ? `${parsedData.length} Candidates` : 'Candidates'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
