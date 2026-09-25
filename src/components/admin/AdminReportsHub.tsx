import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ExecutiveReport } from '../report/ExecutiveReport';
import {
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ArrowRight,
  Search,
  Sparkles,
  Award,
  Compass,
  Download,
  ShieldCheck,
  ChevronDown,
  UserCheck,
  Filter,
} from 'lucide-react';

interface AdminReportsHubProps {
  selectedAssessmentId: string | null;
  onSelectAssessment: (assessmentId: string | null) => void;
  onNavigateToAssessments?: () => void;
}

export const AdminReportsHub: React.FC<AdminReportsHubProps> = ({
  selectedAssessmentId,
  onSelectAssessment,
  onNavigateToAssessments,
}) => {
  const {
    users,
    assessments,
    assignments,
    responses,
    getAssessmentReport,
    simulateFillAssessment,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'IN_PROGRESS'>('ALL');

  // Build structured roster of all Self Assessment users
  const selfAssessmentLeaders = useMemo(() => {
    return assessments.map(asm => {
      const subject = users.find(u => u.id === asm.subjectUserId) || {
        id: asm.subjectUserId,
        firstName: 'Unknown',
        lastName: 'Leader',
        email: 'unknown@organization.com',
        systemRole: 'USER',
        status: 'ACTIVE',
        createdAt: '',
      };

      const selfAsg = assignments.find(
        a => a.assessmentId === asm.assessmentId && a.respondentType === 'SELF'
      );

      const selfResponses = selfAsg
        ? responses.filter(r => r.assignmentId === selfAsg.assignmentId)
        : [];
      const selfAnsweredCount = selfResponses.length;
      const selfPercent = Math.round((selfAnsweredCount / 150) * 100);

      const peerAsgs = assignments.filter(
        a => a.assessmentId === asm.assessmentId && a.respondentType === 'PEER'
      );
      const peerCompletedCount = peerAsgs.filter(p => p.status === 'COMPLETED').length;

      // Report scores preview if calculated
      const report = getAssessmentReport(asm.assessmentId);
      const overallPercentile = report?.selfScores.overallPercentile ?? null;

      const isCompleted = selfPercent === 100 || asm.status === 'COMPLETED';

      return {
        assessment: asm,
        subject,
        selfAssignment: selfAsg,
        selfAnsweredCount,
        selfPercent,
        peerTotal: peerAsgs.length,
        peerCompleted: peerCompletedCount,
        overallPercentile,
        isCompleted,
        report,
      };
    });
  }, [assessments, users, assignments, responses, getAssessmentReport]);

  // Filter leaders by search and status
  const filteredLeaders = useMemo(() => {
    return selfAssessmentLeaders.filter(leader => {
      const name = `${leader.subject.firstName} ${leader.subject.lastName}`.toLowerCase();
      const email = leader.subject.email.toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch = !query || name.includes(query) || email.includes(query);
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'COMPLETED' && leader.isCompleted) ||
        (statusFilter === 'IN_PROGRESS' && !leader.isCompleted);

      return matchesSearch && matchesStatus;
    });
  }, [selfAssessmentLeaders, searchQuery, statusFilter]);

  // Global metrics across all self assessments
  const totalLeaders = selfAssessmentLeaders.length;
  const completedCount = selfAssessmentLeaders.filter(l => l.isCompleted).length;
  const inProgressCount = totalLeaders - completedCount;
  const totalPeers = selfAssessmentLeaders.reduce((acc, l) => acc + l.peerCompleted, 0);

  // If a specific assessment is selected, find its leader item
  const currentLeader = selectedAssessmentId
    ? selfAssessmentLeaders.find(l => l.assessment.assessmentId === selectedAssessmentId)
    : null;

  // Handler for Auto-filling responses for quick preview
  const handleAutoFill = (assignmentId?: string) => {
    if (assignmentId) {
      simulateFillAssessment(assignmentId);
    }
  };

  // ==========================================
  // VIEW 1: SINGLE LEADER REPORT (WITH SWITCHER)
  // ==========================================
  if (selectedAssessmentId && currentLeader) {
    return (
      <div className="space-y-4">
        {/* Top Sticky Admin Leader Switcher Bar */}
        <div className="bg-white border-b border-slate-200 sticky top-14 sm:top-16 z-20 shadow-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Back to Roster & Leader Picker */}
              <div className="flex items-center space-x-3 min-w-0">
                <button
                  onClick={() => onSelectAssessment(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition shrink-0"
                  title="Back to All Leaders Roster"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center space-x-2 min-w-0">
                  <span className="text-xs font-semibold text-slate-500 hidden sm:inline uppercase tracking-wider font-mono">
                    Report:
                  </span>
                  {/* Dropdown to switch immediately between any evaluated leader */}
                  <div className="relative">
                    <select
                      value={selectedAssessmentId}
                      onChange={e => onSelectAssessment(e.target.value)}
                      className="text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 pr-8 appearance-none cursor-pointer transition truncate max-w-[240px] sm:max-w-[320px]"
                    >
                      {selfAssessmentLeaders.map(leader => (
                        <option key={leader.assessment.assessmentId} value={leader.assessment.assessmentId}>
                          {leader.subject.firstName} {leader.subject.lastName} ({leader.selfPercent}%)
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Progress / Status Tag */}
                <span
                  className={`hidden md:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    currentLeader.isCompleted
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {currentLeader.isCompleted ? '100% Answered' : `${currentLeader.selfAnsweredCount}/150 Answered`}
                </span>
              </div>

              {/* Action shortcuts */}
              <div className="flex items-center space-x-2 shrink-0">
                {!currentLeader.isCompleted && currentLeader.selfAssignment && (
                  <button
                    onClick={() => handleAutoFill(currentLeader.selfAssignment?.assignmentId)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 text-xs font-medium transition"
                    title="Simulate all 150 answers for this user to inspect full report calculations"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Auto-fill 150</span>
                  </button>
                )}

                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-medium transition shadow-2xs"
                  title="Print or Export PDF"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Export PDF</span>
                </button>

                <button
                  onClick={() => onSelectAssessment(null)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-medium transition shadow-2xs"
                >
                  All Leaders Roster
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* The Executive Report Container */}
        <div className="pt-2">
          <ExecutiveReport
            assessmentId={selectedAssessmentId}
            onBack={() => onSelectAssessment(null)}
          />
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ALL SELF ASSESSMENT LEADERS ROSTER
  // ==========================================
  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold uppercase tracking-wider text-teal-800 font-mono">
            <Compass className="w-3.5 h-3.5 text-teal-600" />
            <span>Administrative Governance</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
            Executive Leadership Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Diagnostic analyses and 360 multi-rater reports for each evaluated self-assessment leader.
          </p>
        </div>

        {onNavigateToAssessments && (
          <button
            onClick={onNavigateToAssessments}
            className="self-start sm:self-auto px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition shadow-2xs flex items-center space-x-1.5"
          >
            <span>Manage Cycles & Peers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 4 Summary Metric Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Evaluated Leaders
            </span>
            <Users className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
              {totalLeaders}
            </span>
            <span className="text-[10px] text-teal-800 font-semibold bg-teal-50 border border-teal-200/60 px-1.5 py-0.5 rounded">
              Self Assessments
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Individual Diagnostic Profiles</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Fully Completed
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-700 tracking-tight">
              {completedCount}
            </span>
            <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded">
              {totalLeaders > 0 ? `${Math.round((completedCount / totalLeaders) * 100)}%` : '0%'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">150 / 150 Questions Answered</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              In Progress
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
              {inProgressCount}
            </span>
            <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded">
              Awaiting Input
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Partial Self Responses</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Peer Submissions
            </span>
            <Award className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
              {totalPeers}
            </span>
            <span className="text-[10px] text-indigo-800 font-semibold bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.5 rounded">
              Multi-Rater
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Aggregated Observer Data</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leader name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-teal-500 focus:bg-white transition"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center space-x-1.5 self-start sm:self-auto overflow-x-auto no-scrollbar w-full sm:w-auto">
          <span className="text-[11px] text-slate-400 mr-1 font-medium hidden sm:inline">Filter:</span>
          {(['ALL', 'COMPLETED', 'IN_PROGRESS'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition shrink-0 ${
                statusFilter === filter
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {filter === 'ALL' ? 'All Leaders' : filter === 'COMPLETED' ? 'Completed (150)' : 'In Progress'}
            </button>
          ))}
        </div>
      </div>

      {/* Leader Assessment Reports Grid / Cards */}
      <div className="space-y-3">
        {filteredLeaders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredLeaders.map(leader => {
              const {
                assessment,
                subject,
                selfAnsweredCount,
                selfPercent,
                peerTotal,
                peerCompleted,
                overallPercentile,
                isCompleted,
                selfAssignment,
              } = leader;

              return (
                <div
                  key={assessment.assessmentId}
                  className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-4 shadow-2xs transition flex flex-col justify-between space-y-3.5 hover:shadow-xs"
                >
                  {/* Top: Leader Identity & Status Badge */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-teal-400 font-serif font-bold text-xs flex items-center justify-center shrink-0">
                          {subject.firstName[0]}{subject.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-serif font-bold text-base text-slate-900 leading-snug truncate">
                            {subject.firstName} {subject.lastName}
                          </h3>
                          <p className="text-[11px] text-slate-500 truncate">{subject.email}</p>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 border ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {isCompleted ? 'COMPLETED' : 'IN PROGRESS'}
                    </span>
                  </div>

                  {/* Middle: Diagnostic Progress Details */}
                  <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100 space-y-2 text-xs">
                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-medium text-slate-600">
                        <span>Self Diagnostic Progress</span>
                        <span className="font-mono font-semibold text-slate-900">
                          {selfAnsweredCount} / 150 items ({selfPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCompleted ? 'bg-emerald-600' : 'bg-teal-600'
                          }`}
                          style={{ width: `${Math.max(selfPercent, 4)}%` }}
                        />
                      </div>
                    </div>

                    {/* Metadata chips */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>Peers: <strong className="text-slate-700">{peerCompleted} of {peerTotal}</strong> submitted</span>
                      </div>
                      {overallPercentile !== null && (
                        <div className="flex items-center space-x-1">
                          <Award className="w-3 h-3 text-teal-600" />
                          <span>Composite Index: <strong className="text-teal-700 font-mono">{overallPercentile}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Action Buttons */}
                  <div className="flex items-center justify-between pt-1 gap-2">
                    <div className="text-[11px] text-slate-400 font-mono">
                      Cycle: {new Date(assessment.createdAt).toLocaleDateString()}
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {!isCompleted && selfAssignment && (
                        <button
                          onClick={() => handleAutoFill(selfAssignment.assignmentId)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition flex items-center space-x-1"
                          title="Simulate all 150 answers for rapid testing of this user's report"
                        >
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>Auto-fill</span>
                        </button>
                      )}

                      <button
                        onClick={() => onSelectAssessment(assessment.assessmentId)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition flex items-center space-x-1.5 shadow-2xs"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-teal-400" />
                        <span>View Report</span>
                        <ArrowRight className="w-3 h-3 text-slate-300" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2 text-slate-500 text-xs">
            <p className="font-semibold text-sm text-slate-700">No Self Assessment reports found matching criteria.</p>
            <p>Try resetting filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
};
