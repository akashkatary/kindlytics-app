import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RadarChart } from './RadarChart';
import { SelfVsPeerComparison } from './SelfVsPeerComparison';
import { DrilldownBehaviors } from './DrilldownBehaviors';
import {
  ShieldCheck,
  Download,
  Share2,
  BarChart3,
  Award,
  Layers,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Users,
  Compass,
} from 'lucide-react';

interface ExecutiveReportProps {
  assessmentId: string;
  onBack?: () => void;
}

export const ExecutiveReport: React.FC<ExecutiveReportProps> = ({ assessmentId, onBack }) => {
  const { getAssessmentReport } = useApp();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PROFILE' | 'PEER' | 'DETAILS'>('OVERVIEW');

  const reportData = getAssessmentReport(assessmentId);

  if (!reportData) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-slate-500">
        Report data not found or insufficient responses recorded.
      </div>
    );
  }

  const { subject, assessment, selfScores, peerScores, peerThresholdMet } = reportData;

  // Radar chart data based on 6 Summary Characteristics (Section 35)
  const radarData = selfScores.summaryCharacteristics.map(sc => {
    const peerSC = peerScores?.summaryCharacteristics.find(p => p.id === sc.id);
    return {
      label: sc.name,
      selfScore: sc.percentile,
      peerScore: peerSC?.percentile,
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Executive Report Header & Title (Section 33) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-teal-400 text-xs font-semibold uppercase tracking-widest">
              <Compass className="w-4 h-4" />
              <span>Kindlytics Executive Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight text-white">
              High Performing CXO Profile
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Comprehensive behavioural diagnostic for <strong className="text-white">{subject.firstName} {subject.lastName}</strong> ({subject.email})
            </p>
          </div>

          {/* Overall Percentile Pill */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 flex items-center space-x-4 self-start md:self-auto min-w-[220px]">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white font-mono font-bold text-2xl shadow-inner">
              {selfScores.overallPercentile}
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Composite Index
              </div>
              <div className="text-sm font-bold text-white">
                Top Decile Executive
              </div>
              <div className="text-[11px] text-teal-300 font-mono">
                Kindlytics v3 Norm
              </div>
            </div>
          </div>
        </div>

        {/* Report Sub-Tabs (Section 33) */}
        <div className="mt-8 pt-6 border-t border-slate-750 flex space-x-2 sm:space-x-4 overflow-x-auto no-scrollbar">
          {[
            { id: 'OVERVIEW', label: 'Overview' },
            { id: 'PROFILE', label: 'Leadership Profile' },
            { id: 'PEER', label: 'Peer Feedback' },
            { id: 'DETAILS', label: 'Assessment Details' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8">
          {/* Section 34: 3 Key Characteristics Reporting */}
          <div className="space-y-3">
            <h3 className="text-base font-serif font-bold text-slate-900 uppercase tracking-wide text-xs">
              Primary Leadership Pillars (Section 34)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selfScores.keyCharacteristics.map((kc, idx) => {
                const peerKC = peerScores?.keyCharacteristics.find(k => k.id === kc.id);
                return (
                  <div
                    key={kc.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-semibold text-slate-600 uppercase">
                        Key Characteristic {idx + 1}
                      </span>
                      <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {kc.percentile}th %ile
                      </span>
                    </div>

                    <h4 className="font-serif font-bold text-lg text-slate-900">
                      {kc.name}
                    </h4>

                    {/* Visual Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-teal-600 h-2 rounded-full transition-all"
                        style={{ width: `${kc.percentile}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                      <span>2 Summary Dimensions</span>
                      {peerKC ? (
                        <span className="font-mono text-indigo-700 font-semibold">
                          Peer Avg: {peerKC.percentile}
                        </span>
                      ) : (
                        <span className="text-slate-400">Self Only</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 35: 6 Summary Characteristics & Spider Radar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-md">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                    Dimensional Spider Analysis
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 mt-1">
                    6 Summary Characteristics
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Synthesizing directional vision, empirical analysis, active communication, interpersonal rapport, innovation agility, and disciplined execution.
                </p>

                {/* Score listing */}
                <div className="space-y-2 pt-2">
                  {selfScores.summaryCharacteristics.map(sc => (
                    <div
                      key={sc.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs"
                    >
                      <span className="font-medium text-slate-800">{sc.name}</span>
                      <span className="font-mono font-bold text-teal-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {sc.percentile}th
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spider/Radar Chart */}
              <div className="flex-1 flex justify-center">
                <RadarChart data={radarData} showPeers={peerThresholdMet} size={380} />
              </div>
            </div>
          </div>

          {/* Section 39: Report Placeholders (Executive Summary, Leadership Archetype, Strengths, Risks) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Leadership Archetype */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-teal-700 text-xs font-semibold uppercase">
                <Sparkles className="w-4 h-4" />
                <span>Leadership Archetype</span>
              </div>
              <h4 className="font-serif font-bold text-lg text-slate-900">
                Strategic Architect & Catalyst
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Characterized by strong north-star conviction, rapid pattern recognition under uncertainty, and decisive execution cadence across multi-departmental silos.
              </p>
            </div>

            {/* Leadership Strengths */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-emerald-700 text-xs font-semibold uppercase">
                <TrendingUp className="w-4 h-4" />
                <span>Primary Leadership Strengths</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-2">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Vision & Direction:</strong> Articulates lucid long-range priorities that align disparate units.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Execution Stamina:</strong> Maintains institutional velocity through end-game delivery.</span>
                </li>
              </ul>
            </div>

            {/* Development Opportunities */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-amber-700 text-xs font-semibold uppercase">
                <Lightbulb className="w-4 h-4" />
                <span>Development Opportunities</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-2">
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <span><strong>Active Listening Intervals:</strong> Increase structured listening rounds before asserting executive conclusions.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <span><strong>Grassroots Proximity:</strong> Institutionalize regular dialogues with frontline operational teams.</span>
                </li>
              </ul>
            </div>

            {/* Recommended Development Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-indigo-700 text-xs font-semibold uppercase">
                <ArrowUpRight className="w-4 h-4" />
                <span>Recommended Development Actions</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Establish monthly psychological safety check-ins with peer CXO colleagues to evaluate cross-functional perception and recalibrate operational friction.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LEADERSHIP PROFILE (18 Composite Behaviours) */}
      {activeTab === 'PROFILE' && (
        <DrilldownBehaviors
          cbScores={selfScores.compositeBehaviours}
          peerCBScores={peerScores?.compositeBehaviours}
        />
      )}

      {/* TAB 3: PEER FEEDBACK (Self vs Aggregated Peer Comparison) */}
      {activeTab === 'PEER' && <SelfVsPeerComparison reportData={reportData} />}

      {/* TAB 4: ASSESSMENT DETAILS */}
      {activeTab === 'DETAILS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900">
              Diagnostic Administration Metadata
            </h3>
            <p className="text-xs text-slate-500">
              Taxonomy configuration, versioning, and mathematical audit trail
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-slate-500">Taxonomy Version</div>
              <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">Version 3 (Authoritative)</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-slate-500">Total Statements</div>
              <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">150 Diagnostic Items</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-slate-500">Response Architecture</div>
              <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">Binary (Yes / No)</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-slate-500">Scoring Methodology</div>
              <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">Section 61 Matrix Engine</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-slate-500">Peer Reporting Threshold</div>
              <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">Min 2 Completed Reviews</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-slate-500">Anonymity Standard</div>
              <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">Aggregated Multi-Rater</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
