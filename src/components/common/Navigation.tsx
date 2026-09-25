import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Home,
  FileCheck2,
  BarChart3,
  User,
  LayoutDashboard,
  Users,
  Database,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

interface TabItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  const { currentUser } = useApp();

  if (!currentUser) return null;

  const isAdmin = currentUser.systemRole === 'ADMIN';

  // User Navigation Tabs (Report tab moved to Admin)
  const userTabs: TabItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'assessments', label: 'Assessments', icon: FileCheck2 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  // Admin Navigation Tabs (Includes Executive Reports, Configurations now houses Question Bank as first tab)
  const adminTabs: TabItem[] = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-reports', label: 'Reports', icon: BarChart3 },
    { id: 'admin-assessments', label: 'Assessments', icon: FileCheck2 },
    { id: 'admin-users', label: 'Users', icon: Users },
    { id: 'admin-weightings', label: 'Configurations', shortLabel: 'Config', icon: Sliders },
  ];

  const activeTabs = isAdmin ? adminTabs : userTabs;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-14 sm:top-16 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
        <div className="flex items-center justify-between py-1">
          {/* Navigation tabs with icon stacked above the name - no horizontal scroll needed */}
          <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-2 w-full sm:w-auto">
            {activeTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex flex-col items-center justify-center py-1.5 px-1.5 sm:px-3 rounded-lg transition-all text-center flex-1 sm:flex-initial sm:min-w-[74px] max-w-[120px] sm:max-w-none ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 sm:w-4.5 sm:h-4.5 mb-0.5 sm:mb-1 shrink-0 transition-colors ${
                      isActive ? 'text-teal-400' : 'text-slate-500'
                    }`}
                  />
                  <span className="text-[10px] sm:text-xs leading-tight whitespace-nowrap tracking-tight">
                    {tab.shortLabel ? (
                      <>
                        <span className="hidden md:inline">{tab.label}</span>
                        <span className="md:hidden">{tab.shortLabel}</span>
                      </>
                    ) : (
                      tab.label
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Compact Context Cue on wide screens only */}
          <div className="hidden xl:flex items-center text-xs text-slate-400 pl-4 py-0.5 shrink-0">
            {isAdmin ? (
              <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Admin Governance</span>
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                <span>Executive Diagnostic</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
