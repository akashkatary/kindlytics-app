import React, { useState } from 'react';
import { CompositeBehaviourScore } from '../../types';
import { COMPOSITE_BEHAVIOURS, SUMMARY_CHARACTERISTICS, KEY_CHARACTERISTICS } from '../../data/taxonomy';
import { ChevronDown, ChevronRight, Check, X, Sparkles, Filter } from 'lucide-react';

interface DrilldownBehaviorsProps {
  cbScores: CompositeBehaviourScore[];
  peerCBScores?: CompositeBehaviourScore[];
}

export const DrilldownBehaviors: React.FC<DrilldownBehaviorsProps> = ({
  cbScores,
  peerCBScores,
}) => {
  const [filterKC, setFilterKC] = useState<string>('ALL');
  const [expandedCB, setExpandedCB] = useState<string | null>(null);

  const filteredCBs = cbScores.filter(cb => {
    if (filterKC === 'ALL') return true;
    const meta = COMPOSITE_BEHAVIOURS.find(c => c.id === cb.id);
    const sc = SUMMARY_CHARACTERISTICS.find(s => s.id === meta?.parentId);
    return sc?.parentId === filterKC;
  });

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-serif font-bold text-base text-slate-900">
            18 Composite Behaviour Dimensions
          </h3>
          <p className="text-xs text-slate-500">
            Granular behavioural indicators measured through 150 diagnostic statements
          </p>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setFilterKC('ALL')}
            className={`px-3 py-1 rounded-lg transition ${
              filterKC === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All 18
          </button>
          {KEY_CHARACTERISTICS.map(kc => (
            <button
              key={kc.id}
              onClick={() => setFilterKC(kc.id)}
              className={`px-3 py-1 rounded-lg transition ${
                filterKC === kc.id ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {kc.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of 18 Composite Behaviours */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredCBs.map(cb => {
          const meta = COMPOSITE_BEHAVIOURS.find(c => c.id === cb.id);
          const sc = SUMMARY_CHARACTERISTICS.find(s => s.id === meta?.parentId);
          const kc = KEY_CHARACTERISTICS.find(k => k.id === sc?.parentId);
          const peerCB = peerCBScores?.find(p => p.id === cb.id);
          const isExpanded = expandedCB === cb.id;

          return (
            <div
              key={cb.id}
              className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                {/* Header tags */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {sc?.name}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {cb.percentile}th %ile
                    </span>
                    {peerCB && (
                      <span className="text-xs font-bold font-mono text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {peerCB.percentile}th P
                      </span>
                    )}
                  </div>
                </div>

                {/* Name */}
                <h4 className="font-serif font-bold text-base text-slate-900">
                  {cb.name}
                </h4>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {meta?.description}
                </p>

                {/* Progress bar */}
                <div className="space-y-1 pt-1">
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-teal-600 h-1.5 rounded-full"
                      style={{ width: `${cb.percentile}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Details & Counts */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center space-x-2">
                  <span className="text-emerald-700 font-medium">{cb.yesCount} YES</span>
                  <span>•</span>
                  <span className="text-slate-500">{cb.noCount} NO</span>
                </div>
                <span className="font-mono text-slate-400">
                  {cb.answeredCount}/{cb.totalQuestions} items
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
