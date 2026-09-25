import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Assessment, AssessmentStatus, PeerRelationship } from '../../types';
import {
  FileCheck2,
  Users,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  Send,
  X,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Play,
  RotateCcw,
  BarChart3,
} from 'lucide-react';

interface AssessmentManagementProps {
  onViewReport: (assessmentId: string) => void;
}

export const AssessmentManagement: React.FC<AssessmentManagementProps> = ({ onViewReport }) => {
  const {
    assessments,
    assignments,
    users,
    peerInvitations,
    createAssessment,
    invitePeer,
    resendInvitation,
    completeAssessment,
  } = useApp();

  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSubjectUserId, setNewSubjectUserId] = useState('');

  // Add peer within admin
  const [newPeerName, setNewPeerName] = useState('');
  const [newPeerEmail, setNewPeerEmail] = useState('');
  const [newPeerRel, setNewPeerRel] = useState<PeerRelationship>('Peer');

  const handleCreateAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectUserId) return;
    createAssessment(newSubjectUserId);
    setNewSubjectUserId('');
    setIsCreateModalOpen(false);
  };

  const handleAddPeerFromAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssessment || !newPeerName || !newPeerEmail) return;
    invitePeer(selectedAssessment.assessmentId, newPeerName, newPeerEmail, newPeerRel);
    setNewPeerName('');
    setNewPeerEmail('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
            Assessment Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global administrative supervision of executive cohorts and 360 peer feedback tracks
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-xs"
        >
          <Plus className="w-4 h-4 text-teal-400" />
          <span>Launch Assessment</span>
        </button>
      </div>

      {/* Assessments Master Table (Section 48) - Designed to prevent horizontal scrolling */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Desktop & Tablet View (md and above): Proportional full-width table without horizontal scroll */}
        <div className="hidden md:block w-full">
          <table className="w-full text-left text-xs table-fixed">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
              <tr>
                <th className="w-[27%] px-4 py-3">Subject Executive</th>
                <th className="w-[20%] px-3 py-3">Diagnostic Track</th>
                <th className="w-[14%] px-3 py-3">SELF Status</th>
                <th className="w-[12%] px-3 py-3 text-center">Peer Feedback</th>
                <th className="w-[13%] px-3 py-3">Overall Status</th>
                <th className="w-[14%] px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assessments.map(asm => {
                const subject = users.find(u => u.id === asm.subjectUserId);
                const asmAssignments = assignments.filter(a => a.assessmentId === asm.assessmentId);
                const selfAsg = asmAssignments.find(a => a.respondentType === 'SELF');
                const peers = asmAssignments.filter(a => a.respondentType === 'PEER');
                const peersCompleted = peers.filter(p => p.status === 'COMPLETED').length;

                return (
                  <tr key={asm.assessmentId} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 truncate">
                        {subject?.firstName} {subject?.lastName}
                      </div>
                      <div className="text-slate-500 font-mono text-[11px] truncate">{subject?.email}</div>
                      <div className="text-slate-400 text-[10px] mt-0.5">
                        Created {new Date(asm.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-3 py-3.5">
                      <div className="font-medium text-slate-800 truncate" title={asm.title || 'Kindlytics CXO Diagnostic'}>
                        {asm.title || 'Kindlytics CXO Diagnostic'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        v{asm.version || asm.taxonomyVersion || 3} • 150 Items
                      </div>
                    </td>

                    <td className="px-3 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                          selfAsg?.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {selfAsg?.status || 'NOT_STARTED'}
                      </span>
                    </td>

                    <td className="px-3 py-3.5 text-center">
                      <div className="font-mono font-bold text-slate-900 text-xs">
                        {peersCompleted} / {peers.length}
                      </div>
                      <div className="text-[10px] text-slate-500">Completed</div>
                    </td>

                    <td className="px-3 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                          asm.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : asm.status === 'AWAITING_PEER_FEEDBACK'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {asm.status === 'AWAITING_PEER_FEEDBACK' ? 'Awaiting Peers' : asm.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedAssessment(asm)}
                          className="px-2 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-[11px] transition whitespace-nowrap"
                          title="Manage peer invitations and status"
                        >
                          Peers
                        </button>
                        <button
                          onClick={() => onViewReport(asm.assessmentId)}
                          className="px-2 py-1 rounded-md bg-slate-900 text-white hover:bg-slate-800 font-medium text-[11px] transition shadow-2xs whitespace-nowrap"
                          title="View executive diagnostic report"
                        >
                          Report
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View (below md): Responsive card list that completely eliminates horizontal scrolling */}
        <div className="md:hidden divide-y divide-slate-100">
          {assessments.map(asm => {
            const subject = users.find(u => u.id === asm.subjectUserId);
            const asmAssignments = assignments.filter(a => a.assessmentId === asm.assessmentId);
            const selfAsg = asmAssignments.find(a => a.respondentType === 'SELF');
            const peers = asmAssignments.filter(a => a.respondentType === 'PEER');
            const peersCompleted = peers.filter(p => p.status === 'COMPLETED').length;

            return (
              <div key={asm.assessmentId} className="p-4 space-y-3">
                {/* Header: Subject & Overall Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 text-sm truncate">
                      {subject?.firstName} {subject?.lastName}
                    </div>
                    <div className="text-slate-500 font-mono text-[11px] truncate">
                      {subject?.email}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 border ${
                      asm.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : asm.status === 'AWAITING_PEER_FEEDBACK'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {asm.status === 'AWAITING_PEER_FEEDBACK' ? 'Awaiting Peers' : asm.status}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-[11px] border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Self Status</span>
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        selfAsg?.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selfAsg?.status || 'NOT_STARTED'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Peer Feedback</span>
                    <span className="font-mono font-bold text-slate-900 mt-0.5 inline-block">
                      {peersCompleted} / {peers.length} completed
                    </span>
                  </div>

                  <div className="col-span-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-slate-500 text-[10px]">
                    <span className="truncate max-w-[200px]">{asm.title || 'CXO Diagnostic'} (150 Items)</span>
                    <span className="shrink-0">{new Date(asm.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setSelectedAssessment(asm)}
                    className="flex-1 py-1.5 px-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-xs text-center transition"
                  >
                    Details & Peers
                  </button>
                  <button
                    onClick={() => onViewReport(asm.assessmentId)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-medium text-xs text-center transition shadow-2xs"
                  >
                    View Report
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: LAUNCH ASSESSMENT */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-lg text-slate-900">Launch New Assessment</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssessment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Select Subject Executive
                </label>
                <select
                  required
                  value={newSubjectUserId}
                  onChange={e => setNewSubjectUserId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                >
                  <option value="">-- Choose User --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800">Diagnostic Configuration</div>
                <div>• Taxonomy: Version 3 Hierarchy</div>
                <div>• Statements: 150 Behavioural Indicators</div>
                <div>• Contextual: Creates SELF assignment automatically</div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
                >
                  Launch Diagnostic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADMIN ASSESSMENT DETAILS (Section 49) */}
      {selectedAssessment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">
                  Assessment Oversight & Peer Roster
                </h3>
                <p className="text-xs text-slate-500">
                  Subject:{' '}
                  <strong>
                    {users.find(u => u.id === selectedAssessment.subjectUserId)?.firstName}{' '}
                    {users.find(u => u.id === selectedAssessment.subjectUserId)?.lastName}
                  </strong>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    onViewReport(selectedAssessment.assessmentId);
                    setSelectedAssessment(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold flex items-center space-x-1.5 transition shadow-2xs"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-teal-400" />
                  <span>View Report</span>
                </button>
                <button
                  onClick={() => setSelectedAssessment(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Confidentiality Warning (Section 49) */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs text-teal-900 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-teal-700 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold">Privacy Governance:</span> Confidential individual rater responses are strictly anonymized and aggregated into high-level composite indices.
              </div>
            </div>

            {/* Peer Assignments List */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                PEER Assignments
              </h4>

              <div className="space-y-2">
                {peerInvitations
                  .filter(p => p.assessmentId === selectedAssessment.assessmentId)
                  .map(peer => (
                    <div
                      key={peer.invitationId}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-900">{peer.name}</span>
                        <span className="text-slate-500 ml-2">({peer.relationship})</span>
                        <div className="text-slate-500 font-mono text-[11px]">{peer.email}</div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            peer.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {peer.status}
                        </span>

                        {peer.status !== 'COMPLETED' && (
                          <button
                            onClick={() => resendInvitation(peer.invitationId)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition"
                            title="Resend Invitation Email"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Admin Add Peer Form */}
            <form onSubmit={handleAddPeerFromAdmin} className="border-t border-slate-200 pt-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Direct Administrator Peer Addition
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Peer Name"
                  value={newPeerName}
                  onChange={e => setNewPeerName(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-900"
                />
                <input
                  type="email"
                  placeholder="Peer Email"
                  value={newPeerEmail}
                  onChange={e => setNewPeerEmail(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-900"
                />
                <select
                  value={newPeerRel}
                  onChange={e => setNewPeerRel(e.target.value as any)}
                  className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-900"
                >
                  <option value="Manager">Manager</option>
                  <option value="Peer">Peer</option>
                  <option value="Direct Report">Direct Report</option>
                  <option value="Board Member">Board Member</option>
                  <option value="Colleague">Colleague</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
              >
                Assign Peer Assessor
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
