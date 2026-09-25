import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PeerRelationship } from '../../types';
import { X, Users, Mail, UserPlus, CheckCircle2, AlertCircle, RefreshCw, Send } from 'lucide-react';

interface InvitePeersModalProps {
  assessmentId: string;
  isOpen: boolean;
  onClose: () => void;
}

const RELATIONSHIP_OPTIONS: PeerRelationship[] = [
  'Manager',
  'Peer',
  'Direct Report',
  'Board Member',
  'Colleague',
  'Other',
];

export const InvitePeersModal: React.FC<InvitePeersModalProps> = ({
  assessmentId,
  isOpen,
  onClose,
}) => {
  const { peerInvitations, invitePeer, resendInvitation, assignments, simulatePeerCompletion } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState<PeerRelationship>('Peer');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const currentPeers = peerInvitations.filter(i => i.assessmentId === assessmentId);
  const maxPeers = 5;
  const isMaxReached = currentPeers.length >= maxPeers;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setFeedback({ type: 'error', message: 'Please enter both the assessor name and email.' });
      return;
    }

    const res = invitePeer(assessmentId, name, email, relationship);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setName('');
      setEmail('');
      setRelationship('Peer');
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Assessment Completed</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Assessment Started</span>;
      case 'NOT_STARTED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Not Started</span>;
      case 'INVITATION_SENT':
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">Invitation Sent</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header (Section 28) */}
        <div className="space-y-1.5 pr-8">
          <div className="flex items-center space-x-2 text-teal-700 text-xs font-semibold uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>360 Multi-Rater Network</span>
          </div>
          <h2 className="text-xl font-serif font-bold text-slate-900">
            Invite Peer Assessors
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Invite up to five people who know your leadership style well. Their feedback will provide an additional perspective on your leadership profile.
          </p>
        </div>

        {/* Counter Pill */}
        <div className="mt-4 flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
          <span className="text-xs font-medium text-slate-700">Invited Assessors</span>
          <span className="text-xs font-bold text-slate-900 font-mono">
            {currentPeers.length} / {maxPeers} Assessors Invited
          </span>
        </div>

        {/* Invitation Form */}
        {!isMaxReached ? (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. David Chen"
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. david@company.com"
                  className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                Professional Relationship
              </label>
              <select
                value={relationship}
                onChange={e => setRelationship(e.target.value as PeerRelationship)}
                className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                {RELATIONSHIP_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition flex items-center justify-center space-x-2 shadow-xs"
            >
              <Send className="w-3.5 h-3.5 text-teal-400" />
              <span>Send Invitation</span>
            </button>
          </form>
        ) : (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            Maximum limit of 5 peer assessors reached for this assessment cycle.
          </div>
        )}

        {/* Current Peer Assessors List (Section 30) */}
        <div className="mt-6 pt-5 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Assessor Roster ({currentPeers.length})
            </h4>

            {/* Quick Demo Helper */}
            {currentPeers.length > 0 && (
              <button
                onClick={() => simulatePeerCompletion(assessmentId)}
                className="text-[11px] text-teal-700 hover:text-teal-900 font-medium transition"
                title="Simulate all peers completing their reviews to test peer reports"
              >
                ⚡ Simulate Peer Completions
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {currentPeers.map(peer => (
              <div
                key={peer.invitationId}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 flex items-center space-x-2">
                    <span>{peer.name}</span>
                    <span className="text-[11px] font-medium text-slate-500">
                      ({peer.relationship})
                    </span>
                  </div>
                  <div className="text-slate-500 font-mono text-[11px]">{peer.email}</div>
                </div>

                <div className="flex items-center space-x-2">
                  {getStatusBadge(peer.status)}
                  {peer.status !== 'COMPLETED' && (
                    <button
                      onClick={() => resendInvitation(peer.invitationId)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
                      title="Resend invitation email"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
