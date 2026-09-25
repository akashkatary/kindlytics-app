import React from 'react';
import { useApp } from '../../context/AppContext';
import { FileCheck2, ArrowRight, BarChart3, Clock, CheckCircle2, Users } from 'lucide-react';

interface UserAssessmentsListProps {
  onStartAssessment: (assignmentId: string) => void;
  onViewReport: (assessmentId: string) => void;
  onOpenPeerModal: (assessmentId: string) => void;
}

export const UserAssessmentsList: React.FC<UserAssessmentsListProps> = ({
  onStartAssessment,
  onViewReport,
  onOpenPeerModal,
}) => {
  const { currentUser, assignments, assessments, responses, peerInvitations } = useApp();

  if (!currentUser) return null;

  const userAssignments = assignments.filter(a => a.respondentUserId === currentUser.id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
            Assessments Portfolio
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Section 40: Unified workspace displaying both SELF and PEER leadership assignments
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {userAssignments.map(asg => {
          const asm = assessments.find(a => a.assessmentId === asg.assessmentId);
          const isSelf = asg.respondentType === 'SELF';
          const subject = useApp().users.find(u => u.id === asm?.subjectUserId);

          const asgResponses = responses.filter(
            r => r.assignmentId === asg.assignmentId && r.responseValue !== 'UNANSWERED'
          );
          const answered = asgResponses.length;
          const percent = Math.round((answered / 150) * 100);
          const isCompleted = asg.status === 'COMPLETED' || percent === 100;

          return (
            <div
              key={asg.assignmentId}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-2.5 flex-1">
                {/* Title without truncation */}
                <h3 className="font-serif font-bold text-lg sm:text-xl text-slate-900 leading-snug">
                  {isSelf
                    ? 'Your CXO Leadership Assessment'
                    : `Leadership Feedback for ${subject?.firstName || 'Peer'} ${subject?.lastName || ''}`}
                </h3>

                {/* Tags and icons on another line */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                      isSelf
                        ? 'bg-teal-50 text-teal-800 border border-teal-200'
                        : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                    }`}
                  >
                    {isSelf ? 'SELF Diagnostic' : `PEER Feedback (${asg.relationship})`}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 font-mono">150 Questions</span>
                </div>

                <div className="space-y-1.5 max-w-md">
                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>{answered} of 150 answered</span>
                    <span className="font-bold text-slate-900">{percent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isSelf ? 'bg-teal-600' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {isSelf && (
                  <button
                    onClick={() => asm && onOpenPeerModal(asm.assessmentId)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium transition flex items-center space-x-1.5"
                  >
                    <Users className="w-3.5 h-3.5 text-teal-600" />
                    <span>Peer Roster</span>
                  </button>
                )}

                {isCompleted ? (
                  <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-semibold px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submitted (150/150)</span>
                  </div>
                ) : (
                  <button
                    onClick={() => onStartAssessment(asg.assignmentId)}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition flex items-center space-x-2 shadow-xs"
                  >
                    <span>{answered > 0 ? 'Continue Assessment' : 'Start Assessment'}</span>
                    <ArrowRight className="w-4 h-4 text-teal-400" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
