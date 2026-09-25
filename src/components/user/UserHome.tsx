import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  CheckCircle2,
  Users,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  Play,
  FileEdit,
  Sparkles,
  Info,
} from 'lucide-react';

interface UserHomeProps {
  onStartAssessment: (assignmentId: string) => void;
  onOpenPeerModal: (assessmentId: string) => void;
  onViewReport: (assessmentId: string) => void;
}

export const UserHome: React.FC<UserHomeProps> = ({
  onStartAssessment,
  onOpenPeerModal,
  onViewReport,
}) => {
  const { currentUser, assessments, assignments, responses, peerInvitations } = useApp();

  if (!currentUser) return null;

  // Time-of-day greeting
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // 1. My Assessment (SELF assignment for currentUser)
  const selfAssignment = assignments.find(
    a => a.respondentUserId === currentUser.id && a.respondentType === 'SELF'
  );
  const selfAssessment = selfAssignment
    ? assessments.find(a => a.assessmentId === selfAssignment.assessmentId)
    : null;

  const selfResponses = selfAssignment
    ? responses.filter(r => r.assignmentId === selfAssignment.assignmentId && r.responseValue !== 'UNANSWERED')
    : [];

  const selfAnsweredCount = selfResponses.length;
  const selfTotal = 150;
  const selfPercent = Math.round((selfAnsweredCount / selfTotal) * 100);
  const remainingQuestions = selfTotal - selfAnsweredCount;
  // Estimate ~20 seconds per question
  const estimatedRemainingMinutes = Math.max(1, Math.round((remainingQuestions * 18) / 60));

  // Peer feedback invited by currentUser for their own assessment
  const myInvitedPeers = selfAssessment
    ? peerInvitations.filter(i => i.assessmentId === selfAssessment.assessmentId)
    : [];
  const completedPeersCount = myInvitedPeers.filter(p => p.status === 'COMPLETED').length;

  // 2. Feedback Requests (Assessments where currentUser has respondentType = PEER)
  const peerAssignments = assignments.filter(
    a => a.respondentUserId === currentUser.id && a.respondentType === 'PEER'
  );

  // 3. Completed Assessments
  const completedSelfAssignments = assignments.filter(
    a => a.respondentUserId === currentUser.id && a.status === 'COMPLETED'
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Compact Executive Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold tracking-wider text-teal-700 uppercase">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Leadership Diagnostic</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
            {timeGreeting}, {currentUser.firstName}
          </h1>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 font-medium text-slate-700 border border-slate-200">
            {currentUser.firstName} {currentUser.lastName} • Executive Participant
          </span>
        </div>
      </div>

      {/* SECTION 1: MY ASSESSMENT (Section 13) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-serif font-bold text-slate-900 tracking-tight">
            My Assessment
          </h2>
          <span className="text-[11px] text-slate-500 font-medium font-mono">SELF</span>
        </div>

        {selfAssignment && selfAssessment ? (
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 sm:p-5 hover:border-slate-300 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Left: Info & Progress */}
              <div className="space-y-2.5 flex-1 min-w-0">
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900 leading-snug">
                    CXO Leadership Assessment
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                      Self Diagnostic
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      150 Items
                    </span>
                  </div>
                </div>

                {/* Compact Progress Bar */}
                <div className="space-y-1.5 max-w-md">
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span className="font-medium">
                      {selfAnsweredCount} of {selfTotal} completed
                    </span>
                    <span className="font-bold text-slate-900">{selfPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${selfPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>
                        {selfPercent === 100
                          ? 'Completed'
                          : `~${estimatedRemainingMinutes} mins remaining`}
                      </span>
                    </span>
                    <span>•</span>
                    <span>10 per page</span>
                  </div>
                </div>
              </div>

              {/* Right: Assessment Actions */}
              <div className="flex sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
                {selfPercent === 100 ? (
                  <div className="py-2 px-3.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center space-x-1.5 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Submitted (150/150)</span>
                  </div>
                ) : (
                  <button
                    onClick={() => onStartAssessment(selfAssignment.assignmentId)}
                    className="py-2.5 px-4 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition flex items-center justify-center space-x-2 shadow-xs"
                  >
                    {selfAnsweredCount > 0 ? (
                      <>
                        <FileEdit className="w-3.5 h-3.5 text-teal-400" />
                        <span>Continue Assessment</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-teal-400" />
                        <span>Start Assessment</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Slim Peer Feedback Bar */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2 text-slate-600">
                <Users className="w-3.5 h-3.5 text-teal-600" />
                <span className="font-medium text-slate-800">
                  Peer Feedback ({myInvitedPeers.length} of 5 invited)
                </span>
                <span className="text-slate-400">• {completedPeersCount} completed</span>
              </div>

              <button
                onClick={() => onOpenPeerModal(selfAssessment.assessmentId)}
                className="inline-flex items-center text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline transition"
              >
                <span>Manage Peer Assessors</span>
                <ArrowRight className="w-3 h-3 ml-1 text-teal-600" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-6 text-center space-y-2">
            <p className="text-xs text-slate-500">
              You do not currently have an active self-assessment assigned.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 2: FEEDBACK REQUESTS (Section 14) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-serif font-bold text-slate-900 tracking-tight">
              Feedback Requests
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Colleagues who have invited you to provide confidential 360 leadership observations
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
            {peerAssignments.length} Pending Requests
          </span>
        </div>

        {peerAssignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {peerAssignments.map(asg => {
              const targetAsm = assessments.find(a => a.assessmentId === asg.assessmentId);
              const subjectUser = useApp().users.find(u => u.id === targetAsm?.subjectUserId);
              const peerResp = responses.filter(
                r => r.assignmentId === asg.assignmentId && r.responseValue !== 'UNANSWERED'
              );
              const answered = peerResp.length;
              const percent = Math.round((answered / 150) * 100);
              const isCompleted = asg.status === 'COMPLETED';

              return (
                <div
                  key={asg.assignmentId}
                  className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-medium text-slate-500 uppercase tracking-wider">
                        Relationship: {asg.relationship || 'Peer'}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : answered > 0
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isCompleted ? 'Completed' : answered > 0 ? 'In Progress' : 'Not Started'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-serif font-bold text-base text-slate-900">
                        Leadership Feedback for {subjectUser?.firstName} {subjectUser?.lastName}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Your inputs are anonymized and aggregated into high-level dimensions.
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs text-slate-600 font-medium">
                        <span>{answered} / 150 completed</span>
                        <span>{percent}% Complete</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Observer Wording Mode
                    </span>

                    {isCompleted ? (
                      <div className="flex items-center space-x-1 text-xs text-emerald-600 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Feedback Submitted</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onStartAssessment(asg.assignmentId)}
                        className="py-2 px-3.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition flex items-center space-x-1.5"
                      >
                        <span>{answered > 0 ? 'Continue Feedback' : 'Begin Feedback'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-500">
            No pending peer feedback requests.
          </div>
        )}
      </div>

      {/* SECTION 3: COMPLETED ASSESSMENTS */}
      <div className="space-y-3">
        <h2 className="text-lg font-serif font-bold text-slate-900 tracking-tight">
          Assessment History
        </h2>
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <div>
              <span className="font-semibold text-slate-800">Kindlytics CXO Leadership Diagnostic v3</span>
              <span className="text-slate-400 ml-2">Active Cycle 2026</span>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Admin Review</span>
          </div>
        </div>
      </div>
    </div>
  );
};
