export type SystemRole = 'USER' | 'ADMIN';
export type RespondentType = 'SELF' | 'PEER';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type AssessmentStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'AWAITING_PEER_FEEDBACK' | 'COMPLETED';
export type AssignmentStatus = 'INVITATION_SENT' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type BinaryResponse = 'YES' | 'NO' | 'UNANSWERED';
export type PriorityLevel = 'P5' | 'P4' | 'P3' | 'P2' | 'P1';
export type Orientation = 'POSITIVE' | 'NEGATIVE';

export type PeerRelationship = 'Manager' | 'Peer' | 'Direct Report' | 'Board Member' | 'Colleague' | 'Other';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  systemRole: SystemRole;
  status: UserStatus;
  createdAt: string;
  lastLogin: string;
}

export interface TaxonomyItem {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  sequence: number;
  version: number;
  active: boolean;
  description?: string;
}

export interface CbPriorities {
  visPrio: number;
  infPrio: number;
  decPrio: number;
  undPrio: number;
  pePrio: number;
  reasPrio: number;
  openPrio: number;
  listPrio: number;
  artPrio: number;
  saPrio: number;
  empPrio: number;
  collabPrio: number;
  psPrio: number;
  adaptPrio: number;
  creatPrio: number;
  initPrio: number;
  compPrio: number;
  qualPrio: number;
}

export interface Question {
  questionId: string;
  sequence: number;
  questionName?: string;
  selfQuestionText: string;
  peerQuestionText: string;
  keyCharacteristicId: string;
  keyCharacteristicName: string;
  summaryCharacteristicId: string;
  summaryCharacteristicName: string;
  compositeBehaviourId: string;
  compositeBehaviourName: string;
  behaviouralAntonym?: string;
  orientation: Orientation;
  positiveResponse: 'YES' | 'NO';
  priority: PriorityLevel;
  weight: number; // numeric value for priority
  active: boolean;
  responseType: 'BINARY';
  cbPriorities?: CbPriorities;
}

export interface Assessment {
  assessmentId: string;
  subjectUserId: string;
  title?: string;
  version?: number;
  assessmentType: 'CXO_360' | 'CXO_SELF';
  taxonomyVersion: number;
  status: AssessmentStatus;
  totalQuestions: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export type DiagnosticQuestion = Question;
export type QuestionPriority = PriorityLevel;
export type PriorityWeightConfig = Record<PriorityLevel, number>;


export interface AssessmentAssignment {
  assignmentId: string;
  assessmentId: string;
  respondentUserId: string;
  respondentType: RespondentType;
  relationship?: PeerRelationship;
  status: AssignmentStatus;
  invitedAt: string;
  startedAt?: string;
  completedAt?: string;
  currentPage: number;
}

export interface ResponseRecord {
  assessmentId: string;
  assignmentId: string;
  subjectUserId: string;
  respondentUserId: string;
  respondentType: RespondentType;
  questionId: string;
  responseValue: BinaryResponse;
  timestamp: string;
}

export interface PeerInvitation {
  invitationId: string;
  assessmentId: string;
  subjectUserId: string;
  respondentUserId: string;
  name: string;
  email: string;
  relationship: PeerRelationship;
  assignmentId: string;
  status: AssignmentStatus;
  invitedAt: string;
  completedAt?: string;
}

export interface MasterScoringConfig {
  version: number;
  effectiveStatus: boolean;
  priorityValues: Record<PriorityLevel, number>;
  cbNormalizationWeights: Record<string, number>;
  scNormalizationWeights: Record<string, number>;
  positiveLookupTable: Record<PriorityLevel, Record<number, number>>;
  negativeLookupTable: Record<PriorityLevel, Record<number, number>>;
  minimumPeerResponsesForReporting: number;
}

export interface CompositeBehaviourScore {
  id: string;
  name: string;
  rawProfileScore: number;
  absRawMaxScore: number;
  absScalarRatio: number;
  maxWeightedScore: number;
  absProfileScore: number;
  weightedProfileScore: number;
  percentile: number;
  yesCount: number;
  noCount: number;
  answeredCount: number;
  totalQuestions: number;
}

export interface SummaryCharacteristicScore {
  id: string;
  name: string;
  rawIndexScore: number;
  maxWeightedScore: number;
  percentile: number;
  cbScores: CompositeBehaviourScore[];
}

export interface KeyCharacteristicScore {
  id: string;
  name: string;
  rawIndexScore: number;
  maxWeightedScore: number;
  percentile: number;
  scScores: SummaryCharacteristicScore[];
}

export interface CalculatedAssessmentProfile {
  overallPercentile: number;
  keyCharacteristics: KeyCharacteristicScore[];
  summaryCharacteristics: SummaryCharacteristicScore[];
  compositeBehaviours: CompositeBehaviourScore[];
}

export interface AssessmentReportData {
  subject: User;
  assessment: Assessment;
  selfScores: CalculatedAssessmentProfile;
  peerScores: (CalculatedAssessmentProfile & { respondentCount: number }) | null;
  combinedScores?: CalculatedAssessmentProfile | null;
  peerThresholdMet: boolean;
  minimumRequiredPeers: number;
  peerInvitations: PeerInvitation[];
}
