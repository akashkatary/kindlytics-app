import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, BarChart3, Users, Home, ArrowRight, ShieldCheck } from 'lucide-react';

interface CompletionViewProps {
  assignmentId: string;
  onViewReport: (assessmentId: string) => void;
  onManagePeers: (assessmentId: string) => void;
  onReturnHome: () => void;
}

export const CompletionView: React.FC<CompletionViewProps> = ({
  assignmentId,
  onViewReport,
  onManagePeers,
  onReturnHome,
}) => {
  const { assignments, assessments, responses } = useApp();

  const assignment = assignments.find(a => a.assignmentId === assignmentId);
  const assessment = assignment ? assessments.find(a => a.assessmentId === assignment.assessmentId) : null;

  if (!assignment || !assessment) {
    return (
      <div className="p-8 text-center text-slate-600">
        Assignment record not found.
      </div>
    );
  }

  const isSelf = assignment.respondentType === 'SELF';
  const answeredCount = responses.filter(
    r => r.assignmentId === assignmentId && r.responseValue !== 'UNANSWERED'
  ).length;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-lg p-8 sm:p-10 text-center space-y-6">
        {/* Success Icon */}
        <div className="inline-flex w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 items-center justify-center text-teal-600 shadow-xs">
          <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
        </div>

        {/* Title & Copy (Sections 31 & 32) */}
        {isSelf ? (
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
              Assessment Complete
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              You've completed all 150 questions in your Kindlytics Leadership Assessment. Your responses have been securely submitted to the diagnostic administration.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
              Feedback Submitted
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Thank you. Your leadership feedback has been successfully submitted and encrypted. To maintain confidentiality, individual responses remain private.
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-center">
          <div>
            <div className="text-xl font-bold font-mono text-slate-900">150</div>
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Questions
            </div>
          </div>
          <div className="border-x border-slate-200">
            <div className="text-xl font-bold font-mono text-teal-700">{answeredCount}</div>
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Answered
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-slate-900">100%</div>
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Complete
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="space-y-3 pt-2">
          {isSelf ? (
            <>
              <button
                onClick={onReturnHome}
                className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-white bg-slate-900 hover:bg-slate-800 transition flex items-center justify-center space-x-2 shadow-sm"
              >
                <Home className="w-4 h-4 text-teal-400" />
                <span>Return to Dashboard</span>
              </button>

              <button
                onClick={() => onManagePeers(assessment.assessmentId)}
                className="w-full py-3 px-6 rounded-xl font-medium text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center space-x-2"
              >
                <Users className="w-4 h-4 text-slate-500" />
                <span>Manage Peer Assessors</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onReturnHome}
                className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-white bg-slate-900 hover:bg-slate-800 transition flex items-center justify-center space-x-2 shadow-sm"
              >
                <Home className="w-4 h-4 text-teal-400" />
                <span>Return Home</span>
              </button>
              <div className="text-[11px] text-slate-600 flex items-center justify-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                <span>Observer confidentiality strictly protected</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
