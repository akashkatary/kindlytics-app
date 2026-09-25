import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  FileCheck2,
  Share2,
  Database,
  ArrowRight,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { users, assessments, assignments, questions, peerInvitations } = useApp();

  // Metrics (Section 42: seeded with benchmark numbers)
  const activeUsersCount = 247 + users.length - 6;
  const createdAssessmentsCount = 128 + assessments.length - 3;
  const inProgressAssessmentsCount = 92;
  const completedAssessmentsCount = 74;
  const peerAssignmentsCount = 284 + peerInvitations.length - 4;
  const completedPeersCount = 198;
  const activeQuestionsCount = questions.filter(q => q.active).length;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
      {/* Compact Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200/80 pb-3">
        <div>
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-800 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Governance & Diagnostics</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
            Executive Leadership Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('admin-reports')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition shadow-2xs flex items-center space-x-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5 text-teal-400" />
            <span>Reports</span>
          </button>
          <button
            onClick={() => onNavigate('admin-users')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition"
          >
            Manage Users
          </button>
          <button
            onClick={() => onNavigate('admin-assessments')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition"
          >
            Assessments
          </button>
        </div>
      </div>

      {/* 4 Primary Metrics - Concise 4-col on desktop, 2x2 on mobile for immediate 1st fold visibility */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Metric 1: Users */}
        <div
          onClick={() => onNavigate('admin-users')}
          className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs hover:border-slate-300 hover:shadow-xs cursor-pointer transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Users</span>
            <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-500">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
              {activeUsersCount}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded">
              +14 mo
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 truncate">Active in Directory</p>
        </div>

        {/* Metric 2: Assessments */}
        <div
          onClick={() => onNavigate('admin-assessments')}
          className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs hover:border-slate-300 hover:shadow-xs cursor-pointer transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Assessments</span>
            <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-500">
              <FileCheck2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
              {createdAssessmentsCount}
            </span>
            <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 border border-blue-200/60 px-1.5 py-0.5 rounded">
              {inProgressAssessmentsCount} Active
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 truncate">{completedAssessmentsCount} Completed</p>
        </div>

        {/* Metric 3: Peer Feedback */}
        <div
          onClick={() => onNavigate('admin-assessments')}
          className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs hover:border-slate-300 hover:shadow-xs cursor-pointer transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Peer Feedback</span>
            <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-500">
              <Share2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
              {peerAssignmentsCount}
            </span>
            <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 border border-teal-200/60 px-1.5 py-0.5 rounded">
              360 Rater
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 truncate">{completedPeersCount} Responses Done</p>
        </div>

        {/* Metric 4: Question Bank */}
        <div
          onClick={() => onNavigate('admin-questions')}
          className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs hover:border-slate-300 hover:shadow-xs cursor-pointer transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Question Bank</span>
            <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-500">
              <Database className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
              {activeQuestionsCount}
            </span>
            <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded font-mono">
              18 CBs
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 truncate">Version 3 Diagnostic</p>
        </div>
      </div>

      {/* Cohort Health & Realtime Diagnostic Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-sm sm:text-base text-slate-900">
              Active Assessment Pipeline
            </h3>
            <span className="text-[11px] font-medium text-slate-400 font-mono">Live Sync</span>
          </div>

          <div className="space-y-2">
            {assessments.map(asm => {
              const subject = users.find(u => u.id === asm.subjectUserId);
              const asmAssignments = assignments.filter(a => a.assessmentId === asm.assessmentId);
              const selfAsg = asmAssignments.find(a => a.respondentType === 'SELF');
              const peers = asmAssignments.filter(a => a.respondentType === 'PEER');
              const peersCompleted = peers.filter(p => p.status === 'COMPLETED').length;

              return (
                <div
                  key={asm.assessmentId}
                  className="bg-slate-50/80 rounded-lg p-2 sm:p-2.5 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-slate-50 transition"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                      {subject?.firstName} {subject?.lastName}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      SELF: <span className="font-medium text-slate-700">{selfAsg?.status || 'PENDING'}</span> • Peers: {peersCompleted} / {peers.length} completed
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        asm.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : asm.status === 'AWAITING_PEER_FEEDBACK'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {asm.status === 'AWAITING_PEER_FEEDBACK' ? 'Awaiting Peers' : asm.status}
                    </span>
                    <button
                      onClick={() => onNavigate('admin-assessments')}
                      className="p-1 text-slate-400 hover:text-slate-700"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Nav Shortcut Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-3.5 sm:p-4 text-white shadow-2xs flex flex-col justify-between space-y-3 border border-slate-700/60">
          <div className="space-y-1">
            <div className="text-teal-400 text-[10px] font-semibold uppercase tracking-wider font-mono">
              Kindlytics Engine
            </div>
            <h3 className="font-serif font-bold text-sm sm:text-base text-white">
              Weighting & Calibration
            </h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Adjust priority values (P1 through P5) and configure normalization matrices across the Version 3 hierarchy.
            </p>
          </div>

          <button
            onClick={() => onNavigate('admin-weightings')}
            className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 transition flex items-center justify-center space-x-1.5 font-medium shadow-2xs"
          >
            <span>Weights & Configurations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
