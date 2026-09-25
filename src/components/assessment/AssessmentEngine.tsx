import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle2,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { BinaryResponse } from '../../types';

interface AssessmentEngineProps {
  assignmentId: string;
  onBack: () => void;
  onComplete: (assignmentId: string) => void;
  onOpenPeerInviteModal: (assessmentId: string) => void;
}

export const AssessmentEngine: React.FC<AssessmentEngineProps> = ({
  assignmentId,
  onBack,
  onComplete,
  onOpenPeerInviteModal,
}) => {
  const {
    currentUser,
    assignments,
    assessments,
    questions,
    responses,
    saveResponse,
    setAssignmentPage,
    canInvitePeers,
    simulateFillAssessment,
  } = useApp();

  const assignment = assignments.find(a => a.assignmentId === assignmentId);
  const assessment = assignment ? assessments.find(a => a.assessmentId === assignment.assessmentId) : null;
  const subjectUser = useApp().users.find(u => u.id === assessment?.subjectUserId);

  const [currentPage, setCurrentPage] = useState<number>(assignment?.currentPage || 1);
  const [saveToast, setSaveToast] = useState(false);

  useEffect(() => {
    if (assignment?.currentPage) {
      setCurrentPage(assignment.currentPage);
    }
  }, [assignment?.currentPage]);

  if (!assignment || !assessment || !currentUser) {
    return (
      <div className="p-8 text-center text-slate-600">
        Assessment assignment not found.
      </div>
    );
  }

  const isSelf = assignment.respondentType === 'SELF';
  const totalQuestions = 150;
  const questionsPerPage = 10;
  const totalPages = Math.ceil(totalQuestions / questionsPerPage); // 15 pages

  // Slice questions for current page (1-indexed)
  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = Math.min(startIndex + questionsPerPage, totalQuestions);
  const pageQuestions = questions.slice(startIndex, endIndex);

  // Response map for this specific assignment
  const responseMap = useMemo(() => {
    const map = new Map<string, BinaryResponse>();
    responses
      .filter(r => r.assignmentId === assignmentId)
      .forEach(r => map.set(r.questionId, r.responseValue));
    return map;
  }, [responses, assignmentId]);

  // Answered stats
  const answeredCount = questions.filter(q => {
    if (!q) return false;
    const val = responseMap.get(q.questionId);
    return val === 'YES' || val === 'NO';
  }).length;

  const percentComplete = Math.round((answeredCount / totalQuestions) * 100);
  const remainingCount = totalQuestions - answeredCount;

  // Handle immediate autosave on Yes/No click
  const handleSelectResponse = (questionId: string, value: 'YES' | 'NO') => {
    const currentVal = responseMap.get(questionId);
    // Allow toggle or change
    const nextVal = currentVal === value ? 'UNANSWERED' : value;
    saveResponse(assessment.assessmentId, assignmentId, questionId, nextVal);

    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 1200);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const next = currentPage + 1;
      setCurrentPage(next);
      setAssignmentPage(assignmentId, next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      setAssignmentPage(assignmentId, prev);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = () => {
    onComplete(assignmentId);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-5 space-y-3.5 sm:space-y-4">
      {/* Concise Top Header & Context - Title fits without truncation, tags & actions on another line */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 sm:p-4 space-y-2.5">
        <div className="flex items-start space-x-2.5">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition shrink-0 mt-0.5"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title - fits without truncation */}
            <h1 className="font-serif font-bold text-base sm:text-lg text-slate-900 leading-snug">
              {isSelf ? 'Leadership Assessment' : `Leadership Feedback for ${subjectUser?.firstName || 'Peer'} ${subjectUser?.lastName || ''}`}
            </h1>

            {/* Tags and Action Icons on another line */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <div className="flex items-center space-x-2">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                    isSelf
                      ? 'bg-teal-50 text-teal-800 border border-teal-200'
                      : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                  }`}
                >
                  {isSelf ? 'SELF DIAGNOSTIC' : `PEER FEEDBACK (${assignment.relationship || 'PEER'})`}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] text-slate-500 font-mono">150 Questions</span>
              </div>

              {/* Action Icons and Controls */}
              <div className="flex items-center space-x-1.5 shrink-0">
                {isSelf && canInvitePeers(assessment.assessmentId) && (
                  <button
                    onClick={() => onOpenPeerInviteModal(assessment.assessmentId)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium transition shadow-2xs"
                  >
                    <Users className="w-3.5 h-3.5 text-teal-600" />
                    <span>Invite Peers</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => simulateFillAssessment(assignmentId, 'YES')}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-semibold transition shadow-2xs"
                  title="Autofill all 150 answers to YES"
                >
                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                  <span>Autofill "Yes"</span>
                </button>

                <button
                  type="button"
                  onClick={() => simulateFillAssessment(assignmentId, 'NO')}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-semibold transition shadow-2xs"
                  title="Autofill all 150 answers to NO"
                >
                  <X className="w-3 h-3 text-slate-500 stroke-[3]" />
                  <span>Autofill "No"</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Concise Progress Summary & Bar */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <div className="font-medium text-slate-800 flex items-center space-x-1.5">
              <span>Questions {startIndex + 1}–{endIndex} of {totalQuestions}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 font-mono text-[11px]">Page {currentPage} of {totalPages}</span>
            </div>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="font-bold text-slate-900">{percentComplete}% Complete</span>
              <span className="text-slate-400">({answeredCount}/{totalQuestions})</span>
              <span className="inline-flex items-center space-x-1 text-slate-400 ml-1">
                <span className={`w-1.5 h-1.5 rounded-full ${saveToast ? 'bg-emerald-500 animate-ping' : 'bg-emerald-500'}`} />
                <span className="hidden sm:inline">{saveToast ? 'Saved' : 'Autosaved'}</span>
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-teal-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>
      </div>

      {/* Questions Section (10 per page) with light grey line just above buttons */}
      <div className="space-y-3">
        {pageQuestions.map((q, idx) => {
          if (!q) return null;
          const globalIndex = startIndex + idx + 1;
          const currentVal = responseMap.get(q.questionId);
          const isYes = currentVal === 'YES';
          const isNo = currentVal === 'NO';
          const isAnswered = isYes || isNo;
          const statementText = isSelf ? q.selfQuestionText : q.peerQuestionText;

          return (
            <div
              key={q.questionId}
              className={`bg-white rounded-xl border p-4 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6 ${
                isAnswered
                  ? 'border-slate-200/90 shadow-2xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Main Question */}
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base text-slate-900 font-medium leading-relaxed">
                  <span className="font-semibold text-slate-500 mr-2">{globalIndex}.</span>
                  {statementText || q.questionName || `Question ${globalIndex}`}
                </p>
              </div>

              {/* YES and NO Buttons */}
              <div className="flex items-center space-x-2 shrink-0 justify-end">
                <button
                  type="button"
                  onClick={() => handleSelectResponse(q.questionId, 'YES')}
                  className={`min-w-[76px] sm:min-w-[80px] py-2 px-4 rounded-lg text-xs font-bold tracking-wider transition-all flex items-center justify-center space-x-1.5 active:scale-95 ${
                    isYes
                      ? 'bg-slate-900 text-white shadow-xs ring-2 ring-slate-900 ring-offset-1'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {isYes && <Check className="w-3.5 h-3.5 text-teal-400 stroke-[3]" />}
                  <span>YES</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectResponse(q.questionId, 'NO')}
                  className={`min-w-[76px] sm:min-w-[80px] py-2 px-4 rounded-lg text-xs font-bold tracking-wider transition-all flex items-center justify-center space-x-1.5 active:scale-95 ${
                    isNo
                      ? 'bg-slate-900 text-white shadow-xs ring-2 ring-slate-900 ring-offset-1'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {isNo && <Check className="w-3.5 h-3.5 text-teal-400 stroke-[3]" />}
                  <span>NO</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination & Completion Bar (Section 24) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Previous Button */}
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        {/* Page Jump Selector */}
        <div className="flex items-center space-x-1 overflow-x-auto max-w-full px-2 py-1">
          {Array.from({ length: totalPages }).map((_, i) => {
            const pageNum = i + 1;
            const pStart = i * questionsPerPage;
            const pQuestions = questions.slice(pStart, pStart + questionsPerPage);
            const pAnswered = pQuestions.length > 0 && pQuestions.every(q => {
              if (!q) return false;
              const val = responseMap.get(q.questionId);
              return val === 'YES' || val === 'NO';
            });

            return (
              <button
                key={pageNum}
                onClick={() => {
                  setCurrentPage(pageNum);
                  setAssignmentPage(assignmentId, pageNum);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`w-7 h-7 rounded-lg text-xs font-mono font-medium transition ${
                  currentPage === pageNum
                    ? 'bg-slate-900 text-white font-bold'
                    : pAnswered
                    ? 'bg-teal-50 text-teal-800 border border-teal-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title={`Jump to Page ${pageNum}`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next / Submit Button */}
        {currentPage < totalPages ? (
          <button
            onClick={handleNextPage}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-xs"
          >
            <span>Save & Continue</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-md"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete Assessment</span>
          </button>
        )}
      </div>
    </div>
  );
};
