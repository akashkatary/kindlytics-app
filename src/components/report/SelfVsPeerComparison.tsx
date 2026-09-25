import React, { useState } from 'react';
import { AssessmentReportData } from '../../types';
import {
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SelfVsPeerComparisonProps {
  reportData: AssessmentReportData;
}

export const SelfVsPeerComparison: React.FC<SelfVsPeerComparisonProps> = ({ reportData }) => {
  const { simulatePeerCompletion } = useApp();
  const [expandedKCs, setExpandedKCs] = useState<Record<string, boolean>>({
    'kc-1': true,
    'kc-2': true,
    'kc-3': true,
  });

  const toggleKC = (id: string) => {
    setExpandedKCs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const { selfScores, peerScores, peerThresholdMet, minimumRequiredPeers, peerInvitations } = reportData;

  const completedPeerCount = peerInvitations.filter(p => p.status === 'COMPLETED').length;

  if (!peerThresholdMet || !peerScores) {
    return (
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="font-serif font-bold text-base text-slate-900">
            Peer Results Awaiting Multi-Rater Threshold
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Peer results will become available once sufficient feedback has been received.
          </p>
          <p className="text-[11px] text-slate-600 font-mono pt-1">
            ({completedPeerCount} of {minimumRequiredPeers} minimum completed peer assessments recorded)
          </p>
        </div>

        {/* Prototype Evaluation Helper */}
        <div className="pt-2">
          <button
            onClick={() => simulatePeerCompletion(reportData.assessment.assessmentId)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold shadow-xs transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Simulate Peer Responses to Unlock Comparison</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Confidentiality Affirmation Banner (Section 38) */}
      <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-4 flex items-start space-x-3 text-xs text-teal-900">
        <ShieldCheck className="w-4 h-4 text-teal-700 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-semibold">360 Multi-Rater Confidentiality Enforced: </span>
          <span>
            Aggregated across {peerScores.respondentCount} completed peer raters. Individual peer answers, rater identities, and individual peer scoring distributions are strictly masked to ensure authentic leadership insights.
          </span>
        </div>
      </div>

      {/* Comparison Table / Benchmarks (Section 37) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-slate-900">
              Key & Summary Characteristics Alignment
            </h3>
            <p className="text-xs text-slate-500">
              Comparative analysis between Self Perception and Multi-Rater Peer Aggregate
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-semibold">
            <span className="flex items-center space-x-1.5 text-teal-800">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
              <span>Self</span>
            </span>
            <span className="flex items-center space-x-1.5 text-indigo-800">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span>Peers</span>
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {selfScores.keyCharacteristics.map(kc => {
            const peerKC = peerScores.keyCharacteristics.find(k => k.id === kc.id);
            const selfVal = kc.percentile;
            const peerVal = peerKC?.percentile ?? 50;
            const delta = peerVal - selfVal;
            const isExpanded = expandedKCs[kc.id];

            return (
              <div key={kc.id} className="transition-colors">
                {/* Key Characteristic Row */}
                <div
                  onClick={() => toggleKC(kc.id)}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50"
                >
                  <div className="flex items-center space-x-3">
                    <button className="text-slate-400 hover:text-slate-700">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div>
                      <span className="text-xs font-mono font-medium text-slate-500 uppercase">
                        Key Characteristic
                      </span>
                      <h4 className="font-serif font-bold text-sm sm:text-base text-slate-900">
                        {kc.name}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 self-end sm:self-center">
                    {/* Score Badges */}
                    <div className="flex items-center space-x-3 font-mono text-sm">
                      <div className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 font-bold">
                        <span className="text-[10px] text-teal-600 block uppercase font-sans">Self</span>
                        {selfVal}
                      </div>
                      <div className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold">
                        <span className="text-[10px] text-indigo-600 block uppercase font-sans">Peers</span>
                        {peerVal}
                      </div>
                    </div>

                    {/* Delta Pill */}
                    <div className="min-w-[80px] text-right">
                      {delta > 2 ? (
                        <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +{delta} Peer
                        </span>
                      ) : delta < -2 ? (
                        <span className="inline-flex items-center text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          {delta} Gap
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          <Minus className="w-3 h-3 mr-1" />
                          Aligned
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary Characteristics Sub-Rows (Expandable) */}
                {isExpanded && (
                  <div className="bg-slate-50/60 px-4 sm:px-8 py-3 space-y-3 border-t border-slate-100">
                    {kc.scScores.map(sc => {
                      const peerSC = peerKC?.scScores.find(s => s.id === sc.id);
                      const scSelf = sc.percentile;
                      const scPeer = peerSC?.percentile ?? 50;

                      return (
                        <div
                          key={sc.id}
                          className="bg-white rounded-xl border border-slate-200/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <span className="font-semibold text-slate-900 text-sm">
                              {sc.name}
                            </span>
                            <div className="text-[11px] text-slate-500">
                              3 Composite Behaviours synthesized
                            </div>
                          </div>

                          <div className="flex items-center space-x-5">
                            {/* Horizontal dual visual bars */}
                            <div className="w-36 space-y-1">
                              <div className="flex items-center space-x-1.5">
                                <span className="w-8 text-[10px] text-slate-400 font-mono">Self</span>
                                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="bg-teal-600 h-2 rounded-full"
                                    style={{ width: `${scSelf}%` }}
                                  />
                                </div>
                                <span className="font-mono font-bold text-slate-800 text-[11px] w-6 text-right">
                                  {scSelf}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <span className="w-8 text-[10px] text-slate-400 font-mono">Peer</span>
                                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="bg-indigo-600 h-2 rounded-full"
                                    style={{ width: `${scPeer}%` }}
                                  />
                                </div>
                                <span className="font-mono font-bold text-slate-800 text-[11px] w-6 text-right">
                                  {scPeer}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
