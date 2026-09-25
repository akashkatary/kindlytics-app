import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Navigation } from './components/common/Navigation';
import { LoginView } from './components/auth/LoginView';
import { UserHome } from './components/user/UserHome';
import { UserAssessmentsList } from './components/user/UserAssessmentsList';
import { UserProfile } from './components/user/UserProfile';
import { AssessmentEngine } from './components/assessment/AssessmentEngine';
import { InvitePeersModal } from './components/assessment/InvitePeersModal';
import { CompletionView } from './components/assessment/CompletionView';
import { ExecutiveReport } from './components/report/ExecutiveReport';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminReportsHub } from './components/admin/AdminReportsHub';
import { UserManagement } from './components/admin/UserManagement';
import { AssessmentManagement } from './components/admin/AssessmentManagement';
import { QuestionBank } from './components/admin/QuestionBank';
import { WeightingsConfig } from './components/admin/WeightingsConfig';

const AppContent: React.FC = () => {
  const { currentUser, assignments, assessments, completeAssessment } = useApp();

  // Navigation tab state
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [activeReportAssessmentId, setActiveReportAssessmentId] = useState<string | null>(null);
  const [peerModalAssessmentId, setPeerModalAssessmentId] = useState<string | null>(null);

  // Sync default tab when user switches between USER and ADMIN
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.systemRole === 'ADMIN') {
      if (!currentTab.startsWith('admin-')) {
        setCurrentTab('admin-dashboard');
      }
    } else {
      if (currentTab.startsWith('admin-') || currentTab === 'report') {
        setCurrentTab('home');
      }
    }
  }, [currentUser?.systemRole]);

  // If unauthenticated, show executive login & OTP screen
  if (!currentUser) {
    return <LoginView onLoginSuccess={() => setCurrentTab('home')} />;
  }

  // Helper to open assessment taking engine
  const handleStartAssessment = (assignmentId: string) => {
    setActiveAssignmentId(assignmentId);
    setCurrentTab('taking-assessment');
  };

  // Helper to complete assessment and navigate to completion screen
  const handleCompleteAssessment = (assignmentId: string) => {
    completeAssessment(assignmentId);
    setActiveAssignmentId(assignmentId);
    setCurrentTab('completion');
  };

  // Helper to view report (Admin only)
  const handleViewReport = (assessmentId: string) => {
    setActiveReportAssessmentId(assessmentId);
    if (currentUser?.systemRole === 'ADMIN') {
      setCurrentTab('admin-reports');
    } else {
      setCurrentTab('home');
    }
  };

  // Determine fallback assessment ID for report if none specifically selected
  const defaultReportAssessmentId = () => {
    if (activeReportAssessmentId) return activeReportAssessmentId;
    const selfAsg = assignments.find(
      a => a.respondentUserId === currentUser.id && a.respondentType === 'SELF'
    );
    if (selfAsg) return selfAsg.assessmentId;
    return assessments[0]?.assessmentId || 'asm-001';
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-teal-500 selection:text-white">
      {/* Top Header */}
      <Header currentTab={currentTab} onTabChange={tab => setCurrentTab(tab)} />

      {/* Navigation (Sticky beneath header) */}
      {currentTab !== 'taking-assessment' && currentTab !== 'completion' && (
        <Navigation
          currentTab={currentTab}
          onTabChange={tab => {
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* Taking Assessment View */}
        {currentTab === 'taking-assessment' && activeAssignmentId && (
          <AssessmentEngine
            assignmentId={activeAssignmentId}
            onBack={() => setCurrentTab(currentUser.systemRole === 'ADMIN' ? 'admin-assessments' : 'home')}
            onComplete={handleCompleteAssessment}
            onOpenPeerInviteModal={asmId => setPeerModalAssessmentId(asmId)}
          />
        )}

        {/* Completion View */}
        {currentTab === 'completion' && activeAssignmentId && (
          <CompletionView
            assignmentId={activeAssignmentId}
            onViewReport={asmId => handleViewReport(asmId)}
            onManagePeers={asmId => setPeerModalAssessmentId(asmId)}
            onReturnHome={() => setCurrentTab('home')}
          />
        )}

        {/* Admin Reports Hub (Accessible to Admin) */}
        {(currentTab === 'admin-reports' || (currentTab === 'report' && currentUser.systemRole === 'ADMIN')) && (
          <AdminReportsHub
            selectedAssessmentId={activeReportAssessmentId}
            onSelectAssessment={asmId => setActiveReportAssessmentId(asmId)}
            onNavigateToAssessments={() => setCurrentTab('admin-assessments')}
          />
        )}

        {/* User Tabs */}
        {currentTab === 'home' && (
          <UserHome
            onStartAssessment={handleStartAssessment}
            onOpenPeerModal={asmId => setPeerModalAssessmentId(asmId)}
            onViewReport={handleViewReport}
          />
        )}

        {currentTab === 'assessments' && (
          <UserAssessmentsList
            onStartAssessment={handleStartAssessment}
            onViewReport={handleViewReport}
            onOpenPeerModal={asmId => setPeerModalAssessmentId(asmId)}
          />
        )}

        {currentTab === 'profile' && <UserProfile />}

        {/* Admin Tabs */}
        {currentTab === 'admin-dashboard' && (
          <AdminDashboard onNavigate={tab => setCurrentTab(tab)} />
        )}

        {currentTab === 'admin-users' && <UserManagement />}

        {currentTab === 'admin-assessments' && (
          <AssessmentManagement onViewReport={handleViewReport} />
        )}

        {currentTab === 'admin-questions' && (
          <WeightingsConfig initialTab="questions" />
        )}

        {currentTab === 'admin-weightings' && <WeightingsConfig />}
      </main>

      {/* Peer Invitation & Roster Modal */}
      {peerModalAssessmentId && (
        <InvitePeersModal
          assessmentId={peerModalAssessmentId}
          isOpen={!!peerModalAssessmentId}
          onClose={() => setPeerModalAssessmentId(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
