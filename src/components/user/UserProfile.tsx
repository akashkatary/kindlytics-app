import React from 'react';
import { useApp } from '../../context/AppContext';
import { User, ShieldCheck, Mail, Briefcase, Award, LogOut, CheckCircle2 } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { currentUser, assignments, assessments, logout } = useApp();

  if (!currentUser) return null;

  const userAssignments = assignments.filter(a => a.respondentUserId === currentUser.id);
  const selfAsg = userAssignments.find(a => a.respondentType === 'SELF');
  const peerAsgs = userAssignments.filter(a => a.respondentType === 'PEER');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 sm:p-8 text-white flex items-center space-x-5">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center font-serif text-2xl font-bold text-teal-300">
            {currentUser.firstName[0]}{currentUser.lastName[0]}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
              {currentUser.firstName} {currentUser.lastName}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">{currentUser.email}</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                System Role: {currentUser.systemRole}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Status: {currentUser.status}
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 sm:p-8 space-y-6 text-xs text-slate-700">
          <div>
            <h3 className="font-serif font-bold text-sm text-slate-900 uppercase tracking-wider mb-3">
              Contextual Participation Status
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-slate-500 font-medium">Self Diagnostic Track</div>
                <div className="font-semibold text-slate-900 text-sm">
                  {selfAsg ? (
                    <span className="text-teal-700">Active ({selfAsg.status})</span>
                  ) : (
                    <span className="text-slate-400">None assigned</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Full 150-question Version 3 leadership diagnostic
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-slate-500 font-medium">Peer Feedback Requests</div>
                <div className="font-semibold text-slate-900 text-sm">
                  <span className="text-indigo-700">{peerAsgs.length} Peer Invitations</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Third-party multi-rater contributions
                </p>
              </div>
            </div>
          </div>

          {/* Privacy & Governance Note */}
          <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 flex items-start space-x-3 text-teal-900">
            <ShieldCheck className="w-5 h-5 text-teal-700 mt-0.5 flex-shrink-0" />
            <div className="space-y-0.5">
              <div className="font-semibold">Confidentiality Standard:</div>
              <p className="text-[11px] leading-relaxed">
                All Kindlytics peer assessments are conducted under strict confidential multi-rater protocols. Responses are aggregated anonymously into dimensional indices. Individual answer sheets are never exposed to assessment subjects.
              </p>
            </div>
          </div>

          {/* Logout Action */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={logout}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out of Kindlytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
