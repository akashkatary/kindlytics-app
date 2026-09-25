import { User, Assessment, AssessmentAssignment, PeerInvitation, ResponseRecord } from '../types';
import { INITIAL_QUESTIONS } from './questions';
import { TAXONOMY_VERSION } from './taxonomy';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-alex',
    firstName: 'Alex',
    lastName: 'Morgan',
    email: 'alex@kindlytics.com',
    systemRole: 'USER',
    status: 'ACTIVE',
    createdAt: '2026-08-15T09:00:00Z',
    lastLogin: '2026-09-07T21:15:00Z',
  },
  {
    id: 'user-sarah',
    firstName: 'Sarah',
    lastName: 'Ahmed',
    email: 'sarah@kindlytics.com',
    systemRole: 'USER',
    status: 'ACTIVE',
    createdAt: '2026-08-16T10:30:00Z',
    lastLogin: '2026-09-07T20:45:00Z',
  },
  {
    id: 'user-admin',
    firstName: 'Kindlytics',
    lastName: 'Admin',
    email: 'admin@kindlytics.com',
    systemRole: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    lastLogin: '2026-09-07T22:00:00Z',
  },
  {
    id: 'user-david-chen',
    firstName: 'David',
    lastName: 'Chen',
    email: 'david@company.com',
    systemRole: 'USER',
    status: 'ACTIVE',
    createdAt: '2026-08-20T14:15:00Z',
    lastLogin: '2026-09-06T18:30:00Z',
  },
  {
    id: 'user-michelle-wong',
    firstName: 'Michelle',
    lastName: 'Wong',
    email: 'michelle@company.com',
    systemRole: 'USER',
    status: 'ACTIVE',
    createdAt: '2026-08-22T11:00:00Z',
    lastLogin: '2026-09-05T09:20:00Z',
  },
  {
    id: 'user-david-johnson',
    firstName: 'David',
    lastName: 'Johnson',
    email: 'd.johnson@kindlytics.com',
    systemRole: 'USER',
    status: 'ACTIVE',
    createdAt: '2026-08-10T08:00:00Z',
    lastLogin: '2026-09-04T12:00:00Z',
  },
];

export const INITIAL_ASSESSMENTS: Assessment[] = [
  // Alex's CXO 360 Assessment
  {
    assessmentId: 'asm-alex-cxo',
    subjectUserId: 'user-alex',
    assessmentType: 'CXO_360',
    taxonomyVersion: TAXONOMY_VERSION,
    status: 'IN_PROGRESS',
    totalQuestions: 150,
    createdAt: '2026-08-20T10:00:00Z',
    startedAt: '2026-08-21T11:15:00Z',
  },
  // Sarah's CXO 360 Assessment
  {
    assessmentId: 'asm-sarah-cxo',
    subjectUserId: 'user-sarah',
    assessmentType: 'CXO_360',
    taxonomyVersion: TAXONOMY_VERSION,
    status: 'IN_PROGRESS',
    totalQuestions: 150,
    createdAt: '2026-08-25T09:30:00Z',
    startedAt: '2026-08-26T14:00:00Z',
  },
  // David Johnson's CXO Assessment
  {
    assessmentId: 'asm-davidj-cxo',
    subjectUserId: 'user-david-johnson',
    assessmentType: 'CXO_360',
    taxonomyVersion: TAXONOMY_VERSION,
    status: 'IN_PROGRESS',
    totalQuestions: 150,
    createdAt: '2026-08-28T16:00:00Z',
  },
];

export const INITIAL_ASSIGNMENTS: AssessmentAssignment[] = [
  // Alex: SELF assignment for his own assessment
  {
    assignmentId: 'asg-alex-self',
    assessmentId: 'asm-alex-cxo',
    respondentUserId: 'user-alex',
    respondentType: 'SELF',
    status: 'IN_PROGRESS',
    invitedAt: '2026-08-20T10:00:00Z',
    startedAt: '2026-08-21T11:15:00Z',
    currentPage: 7, // on page 7 (questions 61-70)
  },
  // Sarah: PEER assignment evaluating Alex
  {
    assignmentId: 'asg-sarah-for-alex',
    assessmentId: 'asm-alex-cxo',
    respondentUserId: 'user-sarah',
    respondentType: 'PEER',
    relationship: 'Peer',
    status: 'IN_PROGRESS',
    invitedAt: '2026-08-22T09:00:00Z',
    startedAt: '2026-08-23T16:40:00Z',
    currentPage: 4, // 32 of 150 completed
  },
  // David Chen: PEER assignment evaluating Alex (completed)
  {
    assignmentId: 'asg-davidchen-for-alex',
    assessmentId: 'asm-alex-cxo',
    respondentUserId: 'user-david-chen',
    respondentType: 'PEER',
    relationship: 'Manager',
    status: 'COMPLETED',
    invitedAt: '2026-08-21T12:00:00Z',
    startedAt: '2026-08-22T10:00:00Z',
    completedAt: '2026-08-24T15:30:00Z',
    currentPage: 15,
  },
  // Michelle Wong: PEER assignment evaluating Alex (not started)
  {
    assignmentId: 'asg-michelle-for-alex',
    assessmentId: 'asm-alex-cxo',
    respondentUserId: 'user-michelle-wong',
    respondentType: 'PEER',
    relationship: 'Direct Report',
    status: 'NOT_STARTED',
    invitedAt: '2026-08-24T14:00:00Z',
    currentPage: 1,
  },
  // Sarah: SELF assignment for her own assessment
  {
    assignmentId: 'asg-sarah-self',
    assessmentId: 'asm-sarah-cxo',
    respondentUserId: 'user-sarah',
    respondentType: 'SELF',
    status: 'IN_PROGRESS',
    invitedAt: '2026-08-25T09:30:00Z',
    startedAt: '2026-08-26T14:00:00Z',
    currentPage: 3,
  },
  // Sarah: PEER assignment evaluating David Johnson (not started)
  {
    assignmentId: 'asg-sarah-for-davidj',
    assessmentId: 'asm-davidj-cxo',
    respondentUserId: 'user-sarah',
    respondentType: 'PEER',
    relationship: 'Peer',
    status: 'NOT_STARTED',
    invitedAt: '2026-08-29T10:00:00Z',
    currentPage: 1,
  },
];

export const INITIAL_PEER_INVITATIONS: PeerInvitation[] = [
  {
    invitationId: 'inv-1',
    assessmentId: 'asm-alex-cxo',
    subjectUserId: 'user-alex',
    respondentUserId: 'user-sarah',
    name: 'Sarah Ahmed',
    email: 'sarah@kindlytics.com',
    relationship: 'Peer',
    assignmentId: 'asg-sarah-for-alex',
    status: 'IN_PROGRESS',
    invitedAt: '2026-08-22T09:00:00Z',
  },
  {
    invitationId: 'inv-2',
    assessmentId: 'asm-alex-cxo',
    subjectUserId: 'user-alex',
    respondentUserId: 'user-david-chen',
    name: 'David Chen',
    email: 'david@company.com',
    relationship: 'Manager',
    assignmentId: 'asg-davidchen-for-alex',
    status: 'COMPLETED',
    invitedAt: '2026-08-21T12:00:00Z',
    completedAt: '2026-08-24T15:30:00Z',
  },
  {
    invitationId: 'inv-3',
    assessmentId: 'asm-alex-cxo',
    subjectUserId: 'user-alex',
    respondentUserId: 'user-michelle-wong',
    name: 'Michelle Wong',
    email: 'michelle@company.com',
    relationship: 'Direct Report',
    assignmentId: 'asg-michelle-for-alex',
    status: 'NOT_STARTED',
    invitedAt: '2026-08-24T14:00:00Z',
  },
  {
    invitationId: 'inv-4',
    assessmentId: 'asm-alex-cxo',
    subjectUserId: 'user-alex',
    respondentUserId: 'user-marcus',
    name: 'Marcus Vance',
    email: 'marcus@company.com',
    relationship: 'Peer',
    assignmentId: 'asg-marcus-pending',
    status: 'INVITATION_SENT',
    invitedAt: '2026-08-25T11:00:00Z',
  },
];

// Helper to generate seed answers
export function generateInitialResponses(): ResponseRecord[] {
  const responses: ResponseRecord[] = [];

  // 1. Alex's SELF responses: 64 answered questions (matching page 10: "64 of 150 completed, 43% complete")
  for (let i = 0; i < Math.min(64, INITIAL_QUESTIONS.length); i++) {
    const q = INITIAL_QUESTIONS[i];
    if (!q) continue;
    // Realistic executive answers: mostly YES for positive competencies, occasional NO
    const val = (i % 7 === 0 || i % 11 === 0) ? 'NO' : 'YES';
    responses.push({
      assessmentId: 'asm-alex-cxo',
      assignmentId: 'asg-alex-self',
      subjectUserId: 'user-alex',
      respondentUserId: 'user-alex',
      respondentType: 'SELF',
      questionId: q.questionId,
      responseValue: val,
      timestamp: '2026-08-22T14:00:00Z',
    });
  }

  // 2. Sarah's PEER responses for Alex: 32 completed (matching page 12: "32 of 150 completed, 21% complete")
  for (let i = 0; i < Math.min(32, INITIAL_QUESTIONS.length); i++) {
    const q = INITIAL_QUESTIONS[i];
    if (!q) continue;
    const val = (i % 5 === 0) ? 'NO' : 'YES';
    responses.push({
      assessmentId: 'asm-alex-cxo',
      assignmentId: 'asg-sarah-for-alex',
      subjectUserId: 'user-alex',
      respondentUserId: 'user-sarah',
      respondentType: 'PEER',
      questionId: q.questionId,
      responseValue: val,
      timestamp: '2026-08-24T16:00:00Z',
    });
  }

  // 3. David Chen's PEER responses for Alex: 150 completed!
  for (let i = 0; i < Math.min(150, INITIAL_QUESTIONS.length); i++) {
    const q = INITIAL_QUESTIONS[i];
    if (!q) continue;
    // David rates Alex very highly, with thoughtful minor variances
    const val = (i % 6 === 0) ? 'NO' : 'YES';
    responses.push({
      assessmentId: 'asm-alex-cxo',
      assignmentId: 'asg-davidchen-for-alex',
      subjectUserId: 'user-alex',
      respondentUserId: 'user-david-chen',
      respondentType: 'PEER',
      questionId: q.questionId,
      responseValue: val,
      timestamp: '2026-08-24T15:30:00Z',
    });
  }

  // 4. Sarah's own SELF responses: 25 completed
  for (let i = 0; i < Math.min(25, INITIAL_QUESTIONS.length); i++) {
    const q = INITIAL_QUESTIONS[i];
    if (!q) continue;
    const val = (i % 4 === 0) ? 'NO' : 'YES';
    responses.push({
      assessmentId: 'asm-sarah-cxo',
      assignmentId: 'asg-sarah-self',
      subjectUserId: 'user-sarah',
      respondentUserId: 'user-sarah',
      respondentType: 'SELF',
      questionId: q.questionId,
      responseValue: val,
      timestamp: '2026-08-27T10:00:00Z',
    });
  }

  return responses;
}
