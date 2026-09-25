import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { User, SystemRole, UserStatus } from '../../types';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  UserCheck,
  UserX,
  Edit2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  Mail,
  ShieldAlert,
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { users, assessments, assignments, createUser, updateUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'ADMIN'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [participationFilter, setParticipationFilter] = useState<'ALL' | 'SELF' | 'PEER' | 'NONE'>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalMode, setModalMode] = useState<'VIEW' | 'EDIT' | null>(null);
  const [deactivateConfirmUser, setDeactivateConfirmUser] = useState<User | null>(null);

  // New user form state
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<SystemRole>('USER');
  const [createSelfAssessment, setCreateSelfAssessment] = useState(false);

  // Filtered Users list
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Search
      const matchesSearch =
        u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Role Filter
      if (roleFilter !== 'ALL' && u.systemRole !== roleFilter) return false;

      // Status Filter
      if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;

      // Participation Filter
      const userAsg = assignments.filter(a => a.respondentUserId === u.id);
      const hasSelf = userAsg.some(a => a.respondentType === 'SELF');
      const hasPeer = userAsg.some(a => a.respondentType === 'PEER');

      if (participationFilter === 'SELF' && !hasSelf) return false;
      if (participationFilter === 'PEER' && !hasPeer) return false;
      if (participationFilter === 'NONE' && (hasSelf || hasPeer)) return false;

      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter, participationFilter, assignments]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim() || !newEmail.trim()) return;

    createUser({
      firstName: newFirstName,
      lastName: newLastName,
      email: newEmail,
      systemRole: newRole,
      status: 'ACTIVE',
      createSelfAssessment,
    });

    // Reset & close
    setNewFirstName('');
    setNewLastName('');
    setNewEmail('');
    setNewRole('USER');
    setCreateSelfAssessment(false);
    setIsAddModalOpen(false);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    updateUser(selectedUser.id, selectedUser);
    setModalMode(null);
    setSelectedUser(null);
  };

  const handleDeactivate = (user: User) => {
    updateUser(user.id, { status: 'INACTIVE' });
    setDeactivateConfirmUser(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
            User Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Directory of executive assessment subjects, raters, and system administrators
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-xs"
        >
          <Plus className="w-4 h-4 text-teal-400" />
          <span>Add User</span>
        </button>
      </div>

      {/* Search and Filters Bar (Section 44) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Roles</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Participation Filter */}
          <div>
            <select
              value={participationFilter}
              onChange={e => setParticipationFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Participation</option>
              <option value="SELF">Has SELF Assessment</option>
              <option value="PEER">Has PEER Assignment</option>
              <option value="NONE">No Active Assessment</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table (Section 43) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3">Name & Email</th>
                <th className="px-5 py-3">System Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-center">SELF Assessments</th>
                <th className="px-5 py-3 text-center">PEER Assignments</th>
                <th className="px-5 py-3">Date Added</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(u => {
                const userAsg = assignments.filter(a => a.respondentUserId === u.id);
                const selfCount = userAsg.filter(a => a.respondentType === 'SELF').length;
                const peerCount = userAsg.filter(a => a.respondentType === 'PEER').length;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">
                        {u.firstName} {u.lastName}
                      </div>
                      <div className="text-slate-500 font-mono text-[11px]">{u.email}</div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          u.systemRole === 'ADMIN'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.systemRole}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center font-mono font-semibold text-slate-800">
                      {selfCount}
                    </td>

                    <td className="px-5 py-4 text-center font-mono font-semibold text-slate-800">
                      {peerCount}
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setModalMode('VIEW');
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser({ ...u });
                            setModalMode('EDIT');
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {u.status === 'ACTIVE' && (
                          <button
                            onClick={() => setDeactivateConfirmUser(u)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                            title="Deactivate User"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD USER (Section 45) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-lg text-slate-900">Add New User</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">First Name</label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={e => setNewFirstName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newLastName}
                    onChange={e => setNewLastName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">System Role</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as SystemRole)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Peer permissions are determined dynamically by assessment assignment, not system role.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createSelfAssessment}
                    onChange={e => setCreateSelfAssessment(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Automatically create SELF leadership assessment for this user</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: USER DETAILS (Section 46) */}
      {modalMode === 'VIEW' && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-lg text-slate-900">User Profile Details</h3>
              <button
                onClick={() => setModalMode(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl space-y-1.5">
                <div className="font-semibold text-slate-900 text-sm">
                  {selectedUser.firstName} {selectedUser.lastName}
                </div>
                <div className="text-slate-500 font-mono">{selectedUser.email}</div>
                <div className="flex items-center space-x-2 pt-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                    {selectedUser.systemRole}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                    {selectedUser.status}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 uppercase text-[11px] mb-1">
                  Assessments as Subject
                </h4>
                {assessments.filter(a => a.subjectUserId === selectedUser.id).map(a => (
                  <div key={a.assessmentId} className="p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
                    <span>{a.title || 'CXO Leadership Diagnostic v3'}</span>
                    <span className="font-semibold text-teal-700">{a.status}</span>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 uppercase text-[11px] mb-1">
                  Feedback Assignments
                </h4>
                {assignments.filter(a => a.respondentUserId === selectedUser.id).map(a => (
                  <div key={a.assignmentId} className="p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
                    <span>Role: {a.respondentType}</span>
                    <span className="font-semibold text-indigo-700">{a.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT USER (Section 47) */}
      {modalMode === 'EDIT' && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif font-bold text-lg text-slate-900">Edit User</h3>
              <button
                onClick={() => setModalMode(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">First Name</label>
                  <input
                    type="text"
                    required
                    value={selectedUser.firstName}
                    onChange={e =>
                      setSelectedUser({ ...selectedUser, firstName: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Last Name</label>
                  <input
                    type="text"
                    required
                    value={selectedUser.lastName}
                    onChange={e =>
                      setSelectedUser({ ...selectedUser, lastName: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                <input
                  type="email"
                  required
                  value={selectedUser.email}
                  onChange={e =>
                    setSelectedUser({ ...selectedUser, email: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">System Role</label>
                  <select
                    value={selectedUser.systemRole}
                    onChange={e =>
                      setSelectedUser({ ...selectedUser, systemRole: e.target.value as SystemRole })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Status</label>
                  <select
                    value={selectedUser.status}
                    onChange={e =>
                      setSelectedUser({ ...selectedUser, status: e.target.value as UserStatus })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: DEACTIVATE USER (Section 47) */}
      {deactivateConfirmUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-serif font-bold text-lg text-slate-900">
                Deactivate {deactivateConfirmUser.firstName} {deactivateConfirmUser.lastName}?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The user will no longer be able to sign in. Historical assessment and response data will be retained.
              </p>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setDeactivateConfirmUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeactivate(deactivateConfirmUser)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                Confirm Deactivation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
