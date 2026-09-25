import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  User,
  Assessment,
  AssessmentAssignment,
  Question,
  ResponseRecord,
  PeerInvitation,
  MasterScoringConfig,
  PeerRelationship,
  BinaryResponse,
  PriorityLevel,
  AssessmentReportData,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_ASSESSMENTS,
  INITIAL_ASSIGNMENTS,
  INITIAL_PEER_INVITATIONS,
  generateInitialResponses,
} from '../data/initialState';
import { INITIAL_QUESTIONS } from '../data/questions';
import {
  DEFAULT_MASTER_SCORING_CONFIG,
  calculateAssessmentProfile,
  aggregatePeerProfiles,
} from '../services/scoringEngine';

const STORAGE_KEY = 'kindlytics_v5_state';
const BROADCAST_CHANNEL_NAME = 'kindlytics_sync_channel';

interface AppState {
  currentUserId: string | null;
  users: User[];
  assessments: Assessment[];
  assignments: AssessmentAssignment[];
  questions: Question[];
  responses: ResponseRecord[];
  peerInvitations: PeerInvitation[];
  scoringConfig: MasterScoringConfig;
}

interface AppContextValue {
  currentUser: User | null;
  users: User[];
  assessments: Assessment[];
  assignments: AssessmentAssignment[];
  questions: Question[];
  responses: ResponseRecord[];
  peerInvitations: PeerInvitation[];
  scoringConfig: MasterScoringConfig;
  isSyncing: boolean;
  lastSyncedAt: Date | null;

  // Authentication
  login: (email: string, name?: string) => { success: boolean; requiresOtp: boolean };
  verifyOtp: (code: string) => boolean;
  logout: () => void;
  switchUser: (userId: string) => void;

  // Permissions
  canInvitePeers: (assessmentId: string) => boolean;
  canManagePeerInvitations: (assessmentId: string) => boolean;
  canCompleteAssessment: (assignmentId: string) => boolean;
  canViewSubjectReport: (assessmentId: string) => boolean;
  canManageUsers: () => boolean;
  canManageQuestions: () => boolean;
  canEditWeights: () => boolean;

  // Assessment & Responses
  saveResponse: (
    assessmentId: string,
    assignmentId: string,
    questionId: string,
    responseValue: BinaryResponse
  ) => void;
  setAssignmentPage: (assignmentId: string, page: number) => void;
  completeAssignment: (assignmentId: string) => void;
  invitePeer: (
    assessmentId: string,
    name: string,
    email: string,
    relationship: PeerRelationship
  ) => { success: boolean; message: string };
  resendInvitation: (invitationId: string) => void;
  removePeerAssignment: (assignmentId: string) => void;

  // Quick helper for evaluation & testing
  simulateFillAssessment: (assignmentId: string, forcedValue?: 'YES' | 'NO') => void;
  simulatePeerCompletion: (assessmentId: string) => void;

  // Aliases & Weighting helpers
  completeAssessment: (assignmentId: string) => void;
  priorityWeights: Record<PriorityLevel, number>;
  updatePriorityWeights: (weights: Record<PriorityLevel, number>) => void;
  createUser: (data: {
    firstName: string;
    lastName: string;
    email: string;
    systemRole: 'USER' | 'ADMIN';
    status?: any;
    createSelfAssessment?: boolean;
  }) => User;

  // Admin Actions
  addUser: (
    userData: {
      firstName: string;
      lastName: string;
      email: string;
      systemRole: 'USER' | 'ADMIN';
    },
    createSelfAssessment?: boolean,
    assignAsPeerToAssessmentId?: string,
    peerRelationship?: PeerRelationship
  ) => User;
  updateUser: (userId: string, data: Partial<User>) => void;
  deactivateUser: (userId: string) => void;
  updateQuestion: (questionId: string, updates: Partial<Question>) => void;
  updatePriorityWeight: (priority: PriorityLevel, value: number) => void;
  saveScoringConfig: (newConfig: MasterScoringConfig) => void;
  createAssessment: (subjectUserId: string) => Assessment;
  resetAllToDefault: () => void;

  // Reporting
  getAssessmentReport: (assessmentId: string) => AssessmentReportData | null;
}

const AppContext = createContext<AppContextValue | null>(null);

function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.questions)) {
        // Ensure questions array is populated with the complete 150 actual items from Kindlytics
        if (
          parsed.questions.length < 150 ||
          parsed.questions.some((q: any) => !q || !q.questionId || !q.cbPriorities) ||
          parsed.questions[0]?.questionName !== 'Ambitious' ||
          parsed.questions[1]?.questionName !== 'Peculiar'
        ) {
          parsed.questions = INITIAL_QUESTIONS;
        }
        // Filter out any corrupt responses with missing questionId
        if (Array.isArray(parsed.responses)) {
          parsed.responses = parsed.responses.filter((r: any) => r && r.questionId);
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load state from localStorage:', e);
  }

  return {
    currentUserId: 'user-sarah', // Start with Sarah Ahmed to prove contextual permissions immediately!
    users: INITIAL_USERS,
    assessments: INITIAL_ASSESSMENTS,
    assignments: INITIAL_ASSIGNMENTS,
    questions: INITIAL_QUESTIONS,
    responses: generateInitialResponses(),
    peerInvitations: INITIAL_PEER_INVITATIONS,
    scoringConfig: DEFAULT_MASTER_SCORING_CONFIG,
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(loadInitialState);
  const [pendingLoginUser, setPendingLoginUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());

  // Broadcast channel for multi-tab real-time synchronization
  const broadcastChannel = useMemo(() => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        return new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported');
    }
    return null;
  }, []);

  // Sync state to LocalStorage and notify other tabs
  const persistState = useCallback(
    (newState: AppState) => {
      setState(newState);
      setIsSyncing(true);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        broadcastChannel?.postMessage({ type: 'STATE_UPDATED', timestamp: Date.now() });
      } catch (e) {
        console.error('Failed to persist state:', e);
      }
      setTimeout(() => {
        setIsSyncing(false);
        setLastSyncedAt(new Date());
      }, 250);
    },
    [broadcastChannel]
  );

  // Listen for broadcast messages from other tabs
  useEffect(() => {
    if (!broadcastChannel) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'STATE_UPDATED') {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            setState(parsed);
            setLastSyncedAt(new Date());
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    broadcastChannel.addEventListener('message', handleMessage);
    return () => {
      broadcastChannel.removeEventListener('message', handleMessage);
    };
  }, [broadcastChannel]);

  const currentUser = useMemo(() => {
    return state.users.find(u => u.id === state.currentUserId) || null;
  }, [state.users, state.currentUserId]);

  // Auth methods
  const login = useCallback(
    (email: string, name?: string) => {
      const cleanEmail = email.trim().toLowerCase();
      let user = state.users.find(u => u.email.toLowerCase() === cleanEmail);

      if (!user) {
        // Create new demo user dynamically if not found
        const nameParts = (name || 'Executive User').split(' ');
        const newUser: User = {
          id: `user-${Date.now()}`,
          firstName: nameParts[0] || 'Executive',
          lastName: nameParts.slice(1).join(' ') || 'User',
          email: cleanEmail,
          systemRole: 'USER',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        const newUsers = [...state.users, newUser];
        persistState({
          ...state,
          users: newUsers,
        });
        user = newUser;
      }

      setPendingLoginUser(user);
      return { success: true, requiresOtp: true };
    },
    [state, persistState]
  );

  const verifyOtp = useCallback(
    (_code: string) => {
      // Prototype rule (Section 9): any 6-digit OTP authenticates
      if (pendingLoginUser) {
        persistState({
          ...state,
          currentUserId: pendingLoginUser.id,
        });
        setPendingLoginUser(null);
        return true;
      }
      return false;
    },
    [pendingLoginUser, state, persistState]
  );

  const logout = useCallback(() => {
    persistState({
      ...state,
      currentUserId: null,
    });
    setPendingLoginUser(null);
  }, [state, persistState]);

  const switchUser = useCallback(
    (userId: string) => {
      const user = state.users.find(u => u.id === userId);
      if (user) {
        persistState({
          ...state,
          currentUserId: userId,
        });
      }
    },
    [state, persistState]
  );

  // Contextual Permissions (Section 15, 16, 17)
  const canInvitePeers = useCallback(
    (assessmentId: string) => {
      if (!currentUser) return false;
      const assessment = state.assessments.find(a => a.assessmentId === assessmentId);
      if (!assessment) return false;

      // Only Subject can invite peers, and only when participating as SELF
      const isSubject = assessment.subjectUserId === currentUser.id;
      const selfAssignment = state.assignments.find(
        asg => asg.assessmentId === assessmentId && asg.respondentUserId === currentUser.id && asg.respondentType === 'SELF'
      );
      return isSubject && !!selfAssignment;
    },
    [currentUser, state.assessments, state.assignments]
  );

  const canManagePeerInvitations = useCallback(
    (assessmentId: string) => {
      return canInvitePeers(assessmentId);
    },
    [canInvitePeers]
  );

  const canCompleteAssessment = useCallback(
    (assignmentId: string) => {
      if (!currentUser) return false;
      const asg = state.assignments.find(a => a.assignmentId === assignmentId);
      return asg?.respondentUserId === currentUser.id;
    },
    [currentUser, state.assignments]
  );

  const canViewSubjectReport = useCallback(
    (assessmentId: string) => {
      if (!currentUser) return false;
      if (currentUser.systemRole === 'ADMIN') return true;
      const assessment = state.assessments.find(a => a.assessmentId === assessmentId);
      // Strictly only Subject can view private report! Peers CANNOT.
      return assessment?.subjectUserId === currentUser.id;
    },
    [currentUser, state.assessments]
  );

  const canManageUsers = useCallback(() => currentUser?.systemRole === 'ADMIN', [currentUser]);
  const canManageQuestions = useCallback(() => currentUser?.systemRole === 'ADMIN', [currentUser]);
  const canEditWeights = useCallback(() => currentUser?.systemRole === 'ADMIN', [currentUser]);

  // Assessment & Responses
  const saveResponse = useCallback(
    (
      assessmentId: string,
      assignmentId: string,
      questionId: string,
      responseValue: BinaryResponse
    ) => {
      if (!currentUser) return;

      const existingIndex = state.responses.findIndex(
        r => r.assessmentId === assessmentId && r.assignmentId === assignmentId && r.questionId === questionId
      );

      let newResponses: ResponseRecord[];
      if (existingIndex >= 0) {
        newResponses = [...state.responses];
        newResponses[existingIndex] = {
          ...newResponses[existingIndex],
          responseValue,
          timestamp: new Date().toISOString(),
        };
      } else {
        const asg = state.assignments.find(a => a.assignmentId === assignmentId);
        const newRecord: ResponseRecord = {
          assessmentId,
          assignmentId,
          subjectUserId: asg?.respondentType === 'SELF' ? currentUser.id : (state.assessments.find(a => a.assessmentId === assessmentId)?.subjectUserId || currentUser.id),
          respondentUserId: currentUser.id,
          respondentType: asg?.respondentType || 'SELF',
          questionId,
          responseValue,
          timestamp: new Date().toISOString(),
        };
        newResponses = [...state.responses, newRecord];
      }

      // Update assignment status to IN_PROGRESS if NOT_STARTED or INVITATION_SENT
      const newAssignments = state.assignments.map(asg => {
        if (asg.assignmentId === assignmentId && (asg.status === 'NOT_STARTED' || asg.status === 'INVITATION_SENT')) {
          return {
            ...asg,
            status: 'IN_PROGRESS' as const,
            startedAt: asg.startedAt || new Date().toISOString(),
          };
        }
        return asg;
      });

      persistState({
        ...state,
        responses: newResponses,
        assignments: newAssignments,
      });
    },
    [currentUser, state, persistState]
  );

  const setAssignmentPage = useCallback(
    (assignmentId: string, page: number) => {
      const newAssignments = state.assignments.map(a =>
        a.assignmentId === assignmentId ? { ...a, currentPage: page } : a
      );
      persistState({
        ...state,
        assignments: newAssignments,
      });
    },
    [state, persistState]
  );

  const completeAssignment = useCallback(
    (assignmentId: string) => {
      const asg = state.assignments.find(a => a.assignmentId === assignmentId);
      if (!asg) return;

      const now = new Date().toISOString();
      const newAssignments = state.assignments.map(a =>
        a.assignmentId === assignmentId
          ? { ...a, status: 'COMPLETED' as const, completedAt: now }
          : a
      );

      // Also update peer invitation status if applicable
      const newInvitations = state.peerInvitations.map(inv =>
        inv.assignmentId === assignmentId
          ? { ...inv, status: 'COMPLETED' as const, completedAt: now }
          : inv
      );

      // Check assessment status
      const assessment = state.assessments.find(a => a.assessmentId === asg.assessmentId);
      let newAssessments = state.assessments;
      if (assessment) {
        const selfAsg = newAssignments.find(
          a => a.assessmentId === asg.assessmentId && a.respondentType === 'SELF'
        );
        const peers = newAssignments.filter(
          a => a.assessmentId === asg.assessmentId && a.respondentType === 'PEER'
        );
        const allPeersDone = peers.length > 0 && peers.every(p => p.status === 'COMPLETED');

        let newStatus = assessment.status;
        if (selfAsg?.status === 'COMPLETED') {
          newStatus = allPeersDone ? 'COMPLETED' : 'AWAITING_PEER_FEEDBACK';
        }

        newAssessments = state.assessments.map(a =>
          a.assessmentId === asg.assessmentId
            ? { ...a, status: newStatus, completedAt: newStatus === 'COMPLETED' ? now : a.completedAt }
            : a
        );
      }

      persistState({
        ...state,
        assignments: newAssignments,
        peerInvitations: newInvitations,
        assessments: newAssessments,
      });
    },
    [state, persistState]
  );

  // Invite Peer (Section 27-30)
  const invitePeer = useCallback(
    (assessmentId: string, name: string, email: string, relationship: PeerRelationship) => {
      if (!canInvitePeers(assessmentId)) {
        return { success: false, message: 'Only the assessment Subject can invite peer assessors.' };
      }

      const existingPeers = state.peerInvitations.filter(i => i.assessmentId === assessmentId);
      if (existingPeers.length >= 5) {
        return { success: false, message: 'Maximum limit of 5 peer assessors reached.' };
      }

      const cleanEmail = email.trim().toLowerCase();
      if (existingPeers.some(p => p.email.toLowerCase() === cleanEmail)) {
        return { success: false, message: 'This peer assessor has already been invited.' };
      }

      // Check whether user exists, or create pending user
      let peerUser = state.users.find(u => u.email.toLowerCase() === cleanEmail);
      let newUsers = [...state.users];

      if (!peerUser) {
        const nameParts = name.trim().split(' ');
        peerUser = {
          id: `user-${Date.now()}`,
          firstName: nameParts[0] || 'Colleague',
          lastName: nameParts.slice(1).join(' ') || '',
          email: cleanEmail,
          systemRole: 'USER',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        newUsers.push(peerUser);
      }

      const newAssignmentId = `asg-peer-${Date.now()}`;
      const newAssignment: AssessmentAssignment = {
        assignmentId: newAssignmentId,
        assessmentId,
        respondentUserId: peerUser.id,
        respondentType: 'PEER',
        relationship,
        status: 'INVITATION_SENT',
        invitedAt: new Date().toISOString(),
        currentPage: 1,
      };

      const newInvitation: PeerInvitation = {
        invitationId: `inv-${Date.now()}`,
        assessmentId,
        subjectUserId: currentUser!.id,
        respondentUserId: peerUser.id,
        name: name.trim(),
        email: cleanEmail,
        relationship,
        assignmentId: newAssignmentId,
        status: 'INVITATION_SENT',
        invitedAt: new Date().toISOString(),
      };

      persistState({
        ...state,
        users: newUsers,
        assignments: [...state.assignments, newAssignment],
        peerInvitations: [...state.peerInvitations, newInvitation],
      });

      return { success: true, message: `Invitation successfully sent to ${cleanEmail}.` };
    },
    [canInvitePeers, state, currentUser, persistState]
  );

  const resendInvitation = useCallback(
    (invitationId: string) => {
      const newInvitations = state.peerInvitations.map(inv =>
        inv.invitationId === invitationId
          ? { ...inv, invitedAt: new Date().toISOString() }
          : inv
      );
      persistState({
        ...state,
        peerInvitations: newInvitations,
      });
    },
    [state, persistState]
  );

  const removePeerAssignment = useCallback(
    (assignmentId: string) => {
      const newAssignments = state.assignments.filter(a => a.assignmentId !== assignmentId);
      const newInvitations = state.peerInvitations.filter(i => i.assignmentId !== assignmentId);
      const newResponses = state.responses.filter(r => r.assignmentId !== assignmentId);

      persistState({
        ...state,
        assignments: newAssignments,
        peerInvitations: newInvitations,
        responses: newResponses,
      });
    },
    [state, persistState]
  );

  // Evaluation & Demo accelerators
  const simulateFillAssessment = useCallback(
    (assignmentId: string, forcedValue?: 'YES' | 'NO') => {
      const asg = state.assignments.find(a => a.assignmentId === assignmentId);
      if (!asg) return;

      const assessment = state.assessments.find(a => a.assessmentId === asg.assessmentId);
      const newResponses = state.responses.filter(r => r.assignmentId !== assignmentId);

      for (let i = 0; i < state.questions.length; i++) {
        const q = state.questions[i];
        if (!q) continue;
        // Forced value if provided, otherwise high performing profile with realistic diversity
        const val: BinaryResponse = forcedValue ?? ((i % 8 === 0 || i % 13 === 0) ? 'NO' : 'YES');
        newResponses.push({
          assessmentId: asg.assessmentId,
          assignmentId: asg.assignmentId,
          subjectUserId: assessment?.subjectUserId || asg.respondentUserId,
          respondentUserId: asg.respondentUserId,
          respondentType: asg.respondentType,
          questionId: q.questionId,
          responseValue: val,
          timestamp: new Date().toISOString(),
        });
      }

      const now = new Date().toISOString();
      const newAssignments = state.assignments.map(a =>
        a.assignmentId === assignmentId
          ? { ...a, status: 'COMPLETED' as const, completedAt: now, currentPage: a.currentPage || 1 }
          : a
      );

      const newInvitations = state.peerInvitations.map(inv =>
        inv.assignmentId === assignmentId
          ? { ...inv, status: 'COMPLETED' as const, completedAt: now }
          : inv
      );

      let newAssessments = state.assessments;
      if (asg.respondentType === 'SELF') {
        newAssessments = state.assessments.map(a =>
          a.assessmentId === asg.assessmentId
            ? { ...a, status: 'AWAITING_PEER_FEEDBACK' as const }
            : a
        );
      }

      persistState({
        ...state,
        responses: newResponses,
        assignments: newAssignments,
        peerInvitations: newInvitations,
        assessments: newAssessments,
      });
    },
    [state, persistState]
  );

  const simulatePeerCompletion = useCallback(
    (assessmentId: string) => {
      // Completes pending/in-progress peer reviews for this assessment so peer comparison is unlocked!
      const peers = state.assignments.filter(
        a => a.assessmentId === assessmentId && a.respondentType === 'PEER'
      );

      let newResponses = [...state.responses];
      const now = new Date().toISOString();

      peers.forEach(peerAsg => {
        newResponses = newResponses.filter(r => r.assignmentId !== peerAsg.assignmentId);
        for (let i = 0; i < state.questions.length; i++) {
          const q = state.questions[i];
          if (!q) continue;
          const val: BinaryResponse = (i % 6 === 0) ? 'NO' : 'YES';
          newResponses.push({
            assessmentId,
            assignmentId: peerAsg.assignmentId,
            subjectUserId: state.assessments.find(a => a.assessmentId === assessmentId)?.subjectUserId || '',
            respondentUserId: peerAsg.respondentUserId,
            respondentType: 'PEER',
            questionId: q.questionId,
            responseValue: val,
            timestamp: now,
          });
        }
      });

      const newAssignments = state.assignments.map(a =>
        a.assessmentId === assessmentId && a.respondentType === 'PEER'
          ? { ...a, status: 'COMPLETED' as const, completedAt: now, currentPage: 15 }
          : a
      );

      const newInvitations = state.peerInvitations.map(i =>
        i.assessmentId === assessmentId
          ? { ...i, status: 'COMPLETED' as const, completedAt: now }
          : i
      );

      const newAssessments = state.assessments.map(a =>
        a.assessmentId === assessmentId
          ? { ...a, status: 'COMPLETED' as const, completedAt: now }
          : a
      );

      persistState({
        ...state,
        responses: newResponses,
        assignments: newAssignments,
        peerInvitations: newInvitations,
        assessments: newAssessments,
      });
    },
    [state, persistState]
  );

  // Admin User Actions
  const addUser = useCallback(
    (
      userData: {
        firstName: string;
        lastName: string;
        email: string;
        systemRole: 'USER' | 'ADMIN';
      },
      createSelfAssessment = false,
      assignAsPeerToAssessmentId?: string,
      peerRelationship: PeerRelationship = 'Peer'
    ) => {
      const newUser: User = {
        id: `user-${Date.now()}`,
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        email: userData.email.trim().toLowerCase(),
        systemRole: userData.systemRole,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      const newUsers = [newUser, ...state.users];
      let newAssessments = [...state.assessments];
      let newAssignments = [...state.assignments];
      let newInvitations = [...state.peerInvitations];

      if (createSelfAssessment) {
        const asmId = `asm-${newUser.id}`;
        newAssessments.push({
          assessmentId: asmId,
          subjectUserId: newUser.id,
          assessmentType: 'CXO_360',
          taxonomyVersion: 3,
          status: 'NOT_STARTED',
          totalQuestions: 150,
          createdAt: new Date().toISOString(),
        });

        newAssignments.push({
          assignmentId: `asg-${newUser.id}-self`,
          assessmentId: asmId,
          respondentUserId: newUser.id,
          respondentType: 'SELF',
          status: 'NOT_STARTED',
          invitedAt: new Date().toISOString(),
          currentPage: 1,
        });
      }

      if (assignAsPeerToAssessmentId) {
        const targetAsm = state.assessments.find(a => a.assessmentId === assignAsPeerToAssessmentId);
        if (targetAsm) {
          const asgId = `asg-peer-${Date.now()}`;
          newAssignments.push({
            assignmentId: asgId,
            assessmentId: targetAsm.assessmentId,
            respondentUserId: newUser.id,
            respondentType: 'PEER',
            relationship: peerRelationship,
            status: 'INVITATION_SENT',
            invitedAt: new Date().toISOString(),
            currentPage: 1,
          });

          newInvitations.push({
            invitationId: `inv-${Date.now()}`,
            assessmentId: targetAsm.assessmentId,
            subjectUserId: targetAsm.subjectUserId,
            respondentUserId: newUser.id,
            name: `${newUser.firstName} ${newUser.lastName}`,
            email: newUser.email,
            relationship: peerRelationship,
            assignmentId: asgId,
            status: 'INVITATION_SENT',
            invitedAt: new Date().toISOString(),
          });
        }
      }

      persistState({
        ...state,
        users: newUsers,
        assessments: newAssessments,
        assignments: newAssignments,
        peerInvitations: newInvitations,
      });

      return newUser;
    },
    [state, persistState]
  );

  const updateUser = useCallback(
    (userId: string, data: Partial<User>) => {
      const newUsers = state.users.map(u => (u.id === userId ? { ...u, ...data } : u));
      persistState({
        ...state,
        users: newUsers,
      });
    },
    [state, persistState]
  );

  const deactivateUser = useCallback(
    (userId: string) => {
      // Historical responses and records retained per Section 47
      const newUsers = state.users.map(u =>
        u.id === userId ? { ...u, status: 'INACTIVE' as const } : u
      );
      persistState({
        ...state,
        users: newUsers,
      });
    },
    [state, persistState]
  );

  const updateQuestion = useCallback(
    (questionId: string, updates: Partial<Question>) => {
      const newQuestions = state.questions.map(q =>
        q.questionId === questionId ? { ...q, ...updates } : q
      );
      persistState({
        ...state,
        questions: newQuestions,
      });
    },
    [state, persistState]
  );

  const updatePriorityWeight = useCallback(
    (priority: PriorityLevel, value: number) => {
      const newConfig = {
        ...state.scoringConfig,
        priorityValues: {
          ...state.scoringConfig.priorityValues,
          [priority]: value,
        },
      };

      // Also update weights on all questions matching this priority
      const newQuestions = state.questions.map(q =>
        q.priority === priority ? { ...q, weight: value } : q
      );

      persistState({
        ...state,
        scoringConfig: newConfig,
        questions: newQuestions,
      });
    },
    [state, persistState]
  );

  const saveScoringConfig = useCallback(
    (newConfig: MasterScoringConfig) => {
      persistState({
        ...state,
        scoringConfig: newConfig,
      });
    },
    [state, persistState]
  );

  const createAssessment = useCallback(
    (subjectUserId: string) => {
      const subject = state.users.find(u => u.id === subjectUserId);
      const asmId = `asm-${Date.now()}`;
      const newAssessment: Assessment = {
        assessmentId: asmId,
        subjectUserId,
        assessmentType: 'CXO_360',
        taxonomyVersion: 3,
        status: 'NOT_STARTED',
        totalQuestions: 150,
        createdAt: new Date().toISOString(),
      };

      const selfAsg: AssessmentAssignment = {
        assignmentId: `asg-${Date.now()}-self`,
        assessmentId: asmId,
        respondentUserId: subjectUserId,
        respondentType: 'SELF',
        status: 'NOT_STARTED',
        invitedAt: new Date().toISOString(),
        currentPage: 1,
      };

      persistState({
        ...state,
        assessments: [newAssessment, ...state.assessments],
        assignments: [selfAsg, ...state.assignments],
      });

      return newAssessment;
    },
    [state, persistState]
  );

  const resetAllToDefault = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    const fresh: AppState = {
      currentUserId: 'user-sarah',
      users: INITIAL_USERS,
      assessments: INITIAL_ASSESSMENTS,
      assignments: INITIAL_ASSIGNMENTS,
      questions: INITIAL_QUESTIONS,
      responses: generateInitialResponses(),
      peerInvitations: INITIAL_PEER_INVITATIONS,
      scoringConfig: DEFAULT_MASTER_SCORING_CONFIG,
    };
    persistState(fresh);
  }, [persistState]);

  // Report generation with confidentiality guardrails (Section 33-38)
  const getAssessmentReport = useCallback(
    (assessmentId: string): AssessmentReportData | null => {
      const assessment = state.assessments.find(a => a.assessmentId === assessmentId);
      if (!assessment) return null;

      const subject = state.users.find(u => u.id === assessment.subjectUserId);
      if (!subject) return null;

      // 1. Calculate Self Scores
      const selfAssignment = state.assignments.find(
        a => a.assessmentId === assessmentId && a.respondentType === 'SELF'
      );
      const selfResponses = selfAssignment
        ? state.responses.filter(r => r.assignmentId === selfAssignment.assignmentId)
        : [];
      const selfScores = calculateAssessmentProfile(selfResponses, state.questions, state.scoringConfig);

      // 2. Peer Completed Profiles
      const peerAssignments = state.assignments.filter(
        a => a.assessmentId === assessmentId && a.respondentType === 'PEER'
      );
      const completedPeers = peerAssignments.filter(a => a.status === 'COMPLETED');
      const peerInvitations = state.peerInvitations.filter(i => i.assessmentId === assessmentId);

      const peerProfiles = completedPeers.map(p => {
        const pResponses = state.responses.filter(r => r.assignmentId === p.assignmentId);
        return calculateAssessmentProfile(pResponses, state.questions, state.scoringConfig);
      });

      const peerThresholdMet = completedPeers.length >= state.scoringConfig.minimumPeerResponsesForReporting;
      const aggregatedPeers = peerThresholdMet ? aggregatePeerProfiles(peerProfiles) : null;

      return {
        subject,
        assessment,
        selfScores,
        peerScores: aggregatedPeers,
        peerThresholdMet,
        minimumRequiredPeers: state.scoringConfig.minimumPeerResponsesForReporting,
        peerInvitations,
      };
    },
    [state]
  );

  const value: AppContextValue = {
    currentUser,
    users: state.users,
    assessments: state.assessments,
    assignments: state.assignments,
    questions: state.questions,
    responses: state.responses,
    peerInvitations: state.peerInvitations,
    scoringConfig: state.scoringConfig,
    isSyncing,
    lastSyncedAt,

    login,
    verifyOtp,
    logout,
    switchUser,

    canInvitePeers,
    canManagePeerInvitations,
    canCompleteAssessment,
    canViewSubjectReport,
    canManageUsers,
    canManageQuestions,
    canEditWeights,

    saveResponse,
    setAssignmentPage,
    completeAssignment,
    invitePeer,
    resendInvitation,
    removePeerAssignment,

    simulateFillAssessment,
    simulatePeerCompletion,

    completeAssessment: completeAssignment,
    priorityWeights: state.scoringConfig.priorityValues,
    updatePriorityWeights: (newWeights: Record<PriorityLevel, number>) => {
      saveScoringConfig({
        ...state.scoringConfig,
        priorityValues: newWeights,
      });
    },
    createUser: (data) => addUser(data, data.createSelfAssessment),

    addUser,
    updateUser,
    deactivateUser,
    updateQuestion,
    updatePriorityWeight,
    saveScoringConfig,
    createAssessment,
    resetAllToDefault,

    getAssessmentReport,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
