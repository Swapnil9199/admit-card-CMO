import React, { useState } from 'react';
import { X, Printer, Download, Users, CheckCircle2, Loader2 } from 'lucide-react';
import AdmitCard from './AdmitCard';
import { generateBatchAdmitCardsPdf } from '../utils/pdfGenerator';

export default function BatchPrintModal({
  isOpen,
  onClose,
  candidates,
  instituteInfo,
  timetable,
  rules,
  prohibitedItems
}) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const handlePrintAll = () => {
    window.print();
  };

  const handleDownloadAllPdf = async () => {
    setIsGeneratingPdf(true);
    setProgress(0);
    try {
      await generateBatchAdmitCardsPdf('batch-print-all-container', (p) => setProgress(p));
    } catch (err) {
      alert(`Error generating batch PDF: ${err.message || 'Unknown error'}`);
    } finally {
      setIsGeneratingPdf(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl h-[92vh] shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                Batch Print & Export All Admit Cards
              </h3>
              <p className="text-xs text-slate-400">
                Ready to print {candidates.length} Hall Tickets (A4 2-Page layout per student)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrintAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition"
            >
              <Printer className="w-4 h-4" />
              Print All ({candidates.length} Cards)
            </button>

            <button
              disabled={isGeneratingPdf}
              onClick={handleDownloadAllPdf}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating ({progress}%)
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Merged PDF
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Preview of All Admit Cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950">
          <div id="batch-print-all-container" className="space-y-12 max-w-[820px] mx-auto print-container">
            {candidates.map((candidate, idx) => (
              <div key={candidate.id || idx} className="space-y-4">
                <div className="no-print flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400 font-mono">
                  <span>Candidate #{idx + 1} of {candidates.length}</span>
                  <span className="font-bold text-white">{candidate.name} ({candidate.seatNo})</span>
                </div>
                <AdmitCard
                  id={`batch-card-${candidate.id}`}
                  candidate={candidate}
                  instituteInfo={instituteInfo}
                  timetable={timetable}
                  rules={rules}
                  prohibitedItems={prohibitedItems}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
