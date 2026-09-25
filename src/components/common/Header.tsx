import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  UserCheck,
  LogOut,
  RefreshCw,
  ChevronDown,
  Sparkles,
  Smartphone,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

interface HeaderProps {
  currentTab?: string;
  onTabChange?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onTabChange }) => {
  const { currentUser, users, switchUser, logout, isSyncing, resetAllToDefault } = useApp();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        {/* Brand & Tagline */}
        <div
          className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer"
          onClick={() => onTabChange?.(currentUser?.systemRole === 'ADMIN' ? 'admin-dashboard' : 'home')}
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center shadow-inner font-serif font-bold text-white tracking-wider text-sm sm:text-base shrink-0">
            K
          </div>
          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-serif font-bold text-base sm:text-lg tracking-tight text-white">Kindlytics</span>
              <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-slate-800 text-teal-400 border border-slate-700">
                v3 CXO
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400 font-sans tracking-wide">
              Leadership Intelligence. Made Visible.
            </p>
          </div>
        </div>

        {/* Sync Indicator & Quick User Switcher */}
        <div className="flex items-center space-x-1.5 sm:space-x-3">
          {/* Cloud Sync Status */}
          <div className="flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
            <span className="hidden md:inline text-[11px] font-medium text-slate-300">
              {isSyncing ? 'Syncing...' : 'Cloud Synced'}
            </span>
          </div>

          {/* Quick Context Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 transition text-left"
              title="Switch demo user to test contextual permissions"
            >
              <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[11px] sm:text-xs font-semibold text-teal-300 shrink-0">
                {currentUser ? `${currentUser.firstName[0]}${currentUser.lastName[0]}` : '?'}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-xs font-semibold text-white flex items-center space-x-1">
                  <span>{currentUser?.firstName} {currentUser?.lastName}</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${currentUser?.systemRole === 'ADMIN' ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50' : 'bg-blue-900/60 text-blue-300 border border-blue-700/50'}`}>
                    {currentUser?.systemRole}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-slate-700/80">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Contextual Persona Switcher
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Test dual SELF & PEER contexts and Admin roles
                  </p>
                </div>

                <div className="p-1.5 space-y-1">
                  {/* Sarah Ahmed */}
                  <button
                    onClick={() => {
                      switchUser('user-sarah');
                      setShowUserDropdown(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition flex items-center justify-between ${currentUser?.id === 'user-sarah' ? 'bg-teal-950/60 border border-teal-600/40 text-white' : 'text-slate-300 hover:bg-slate-700/60'}`}
                  >
                    <div>
                      <div className="font-semibold text-white flex items-center space-x-1.5">
                        <span>Sarah Ahmed</span>
                        <span className="text-[10px] px-1 bg-teal-900/80 text-teal-300 rounded font-mono">Dual Context</span>
                      </div>
                      <div className="text-[11px] text-slate-400">SELF in own assessment • PEER for Alex</div>
                    </div>
                    {currentUser?.id === 'user-sarah' && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
                  </button>

                  {/* Alex Morgan */}
                  <button
                    onClick={() => {
                      switchUser('user-alex');
                      setShowUserDropdown(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition flex items-center justify-between ${currentUser?.id === 'user-alex' ? 'bg-teal-950/60 border border-teal-600/40 text-white' : 'text-slate-300 hover:bg-slate-700/60'}`}
                  >
                    <div>
                      <div className="font-semibold text-white flex items-center space-x-1.5">
                        <span>Alex Morgan</span>
                        <span className="text-[10px] px-1 bg-blue-900/80 text-blue-300 rounded font-mono">Subject</span>
                      </div>
                      <div className="text-[11px] text-slate-400">SELF Assessment Subject (has 4 peer reviewers)</div>
                    </div>
                    {currentUser?.id === 'user-alex' && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
                  </button>

                  {/* Kindlytics Admin */}
                  <button
                    onClick={() => {
                      switchUser('user-admin');
                      setShowUserDropdown(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition flex items-center justify-between ${currentUser?.id === 'user-admin' ? 'bg-amber-950/60 border border-amber-600/40 text-white' : 'text-slate-300 hover:bg-slate-700/60'}`}
                  >
                    <div>
                      <div className="font-semibold text-white flex items-center space-x-1.5">
                        <span>Kindlytics Admin</span>
                        <span className="text-[10px] px-1 bg-amber-900/80 text-amber-300 rounded font-mono">ADMIN</span>
                      </div>
                      <div className="text-[11px] text-slate-400">Full system governance, questions, configurations</div>
                    </div>
                    {currentUser?.id === 'user-admin' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </button>
                </div>

                <div className="border-t border-slate-700/80 mt-1 pt-1 px-1.5">
                  <button
                    onClick={() => {
                      resetAllToDefault();
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-700/60 flex items-center space-x-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reset Prototype State to Default</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-950/30 flex items-center space-x-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
