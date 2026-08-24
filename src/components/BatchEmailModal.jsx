import React, { useState } from 'react';
import { X, Send, Mail, CheckCircle2, AlertCircle, Loader2, Users, Sparkles, ShieldCheck } from 'lucide-react';
import { generateAdmitCardPdfBase64 } from '../utils/pdfGenerator';
import { sendAdmitCardEmail } from '../services/emailService';
import confetti from 'canvas-confetti';

export default function BatchEmailModal({
  isOpen,
  onClose,
  candidates,
  instituteInfo,
  onSetCurrentCandidateForRender,
  adminSmtpInfo
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState({}); // { [candidateId]: { status: 'sent' | 'error', message: '' } }
  const [isCompleted, setIsCompleted] = useState(false);

  if (!isOpen) return null;

  const validCandidates = candidates.filter(c => c && c.email);
  const total = candidates.length;
  const progressPercent = total > 0 ? Math.round((currentIndex / total) * 100) : 0;

  const handleStartBatchEmail = async () => {
    setIsProcessing(true);
    setIsCompleted(false);
    setResults({});
    setCurrentIndex(0);

    const newResults = {};

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      setCurrentIndex(i + 1);

      if (!candidate.email) {
        newResults[candidate.id] = {
          status: 'error',
          message: 'No email address registered for candidate.'
        };
        setResults({ ...newResults });
        continue;
      }

      try {
        // Set the offscreen candidate to render
        if (onSetCurrentCandidateForRender) {
          onSetCurrentCandidateForRender(candidate);
        }

        // Allow DOM to update
        await new Promise(r => setTimeout(r, 250));

        // Generate base64 PDF
        const { pdfBase64, filename } = await generateAdmitCardPdfBase64(
          'admit-card-email-render',
          candidate.name
        );

        // Dispatch via API
        const response = await sendAdmitCardEmail({
          recipientEmail: candidate.email,
          recipientName: candidate.name,
          seatNo: candidate.seatNo,
          examTitle: candidate.examTitle || instituteInfo?.examTitle,
          examCentre: candidate.examCentre,
          pdfBase64,
          filename
        });

        if (response.success) {
          newResults[candidate.id] = {
            status: 'sent',
            message: 'Email delivered successfully.'
          };
        } else {
          newResults[candidate.id] = {
            status: 'error',
            message: response.error || 'Failed to deliver email.'
          };
        }
      } catch (err) {
        console.error(`Error dispatching email to ${candidate.name}:`, err);
        newResults[candidate.id] = {
          status: 'error',
          message: err.message || 'Error creating PDF or dispatching email.'
        };
      }

      setResults({ ...newResults });
      // Small throttle between emails
      await new Promise(r => setTimeout(r, 100));
    }

    setIsProcessing(false);
    setIsCompleted(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const sentCount = Object.values(results).filter(r => r.status === 'sent').length;
  const failedCount = Object.values(results).filter(r => r.status === 'error').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                1-Tap Send All Admit Cards via Email
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-500/30">
                  {candidates.length} Students
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Dispatches individual 2-page PDF hall tickets directly from Admin to each candidate's registered email
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Admin Sender Info Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-blue-300 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Active Admin Sender Email
              </div>
              <div className="text-sm font-bold text-white mt-0.5 font-mono">
                {adminSmtpInfo?.adminEmail || 'admin@combinementor.in'}
              </div>
              <div className="text-slate-400 text-[11px]">
                Sender Display Name: <span className="text-slate-200 font-semibold">{adminSmtpInfo?.adminName || 'Combine Mentor Official'}</span>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-blue-800/40 sm:pl-4">
              <div className="text-slate-400">Total Recipients:</div>
              <div className="text-lg font-black text-white font-mono">{candidates.length} Candidates</div>
            </div>
          </div>

          {/* Progress Bar (when active or finished) */}
          {(isProcessing || isCompleted) && (
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-white flex items-center gap-2">
                  {isProcessing && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
                  {isCompleted ? '✓ Bulk Dispatch Completed!' : `Sending Admit Cards (${currentIndex} / ${total})...`}
                </span>
                <span className="font-mono text-blue-400 font-bold">{progressPercent}%</span>
              </div>

              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {isCompleted && (
                <div className="flex items-center gap-4 pt-2 text-xs">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {sentCount} Successfully Sent
                  </span>
                  {failedCount > 0 && (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {failedCount} Failed
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Candidates Dispatch List */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center justify-between">
              <span>Candidate Dispatch Queue</span>
              <span>Status</span>
            </h4>

            <div className="border border-slate-800 rounded-2xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-800/60 bg-slate-950/40">
              {candidates.map((c, idx) => {
                const result = results[c.id];
                const isCurrent = isProcessing && currentIndex === idx + 1;

                return (
                  <div
                    key={c.id}
                    className={`p-3 flex items-center justify-between transition-colors ${
                      isCurrent
                        ? 'bg-blue-600/15 border-l-4 border-l-blue-500'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center font-mono text-slate-500 font-bold text-[10px]">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-white text-xs flex items-center gap-2">
                          {c.name}
                          <span className="font-mono text-[10px] text-blue-400">({c.seatNo})</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {c.email || <span className="text-rose-400 italic">No email provided</span>}
                        </div>
                      </div>
                    </div>

                    <div>
                      {result?.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[10px] border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Sent
                        </span>
                      ) : result?.status === 'error' ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-semibold text-[10px] border border-rose-500/30"
                          title={result.message}
                        >
                          <AlertCircle className="w-3 h-3" /> Failed
                        </span>
                      ) : isCurrent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 font-semibold text-[10px] animate-pulse border border-blue-500/30">
                          <Loader2 className="w-3 h-3 animate-spin" /> Dispatching...
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Queued</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-800/30 shrink-0">
          <div className="text-xs text-slate-400">
            {isCompleted
              ? `Done: ${sentCount} sent, ${failedCount} failed.`
              : `Ready to dispatch ${candidates.length} emails.`}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition disabled:opacity-30"
            >
              {isCompleted ? 'Close' : 'Cancel'}
            </button>

            <button
              disabled={isProcessing || candidates.length === 0}
              onClick={handleStartBatchEmail}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending ({progressPercent}%)
                </>
              ) : isCompleted ? (
                <>
                  <Send className="w-4 h-4" />
                  Send Again (1-Tap)
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send All ({candidates.length} Emails in 1-Tap)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
