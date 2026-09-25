import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sliders,
  Save,
  RotateCcw,
  CheckCircle2,
  Settings2,
  ShieldCheck,
  Scale,
  Database,
  Layers,
  Table,
  Calculator,
} from 'lucide-react';
import { PriorityWeightConfig } from '../../types';
import { QuestionBank } from './QuestionBank';
import { KeyWeightsSection } from './KeyWeightsSection';
import { LookupTableSection } from './LookupTableSection';
import { CalculatedValuesSection } from './CalculatedValuesSection';

export type ConfigTabId = 'questions' | 'weights' | 'hierarchy' | 'lookup' | 'calculated';

export interface WeightingsConfigProps {
  initialTab?: ConfigTabId;
}

interface TabDef {
  id: ConfigTabId;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CONFIG_TABS: TabDef[] = [
  {
    id: 'questions',
    label: 'Question Bank',
    shortLabel: 'Questions',
    description: '150 Diagnostic Items',
    icon: Database,
  },
  {
    id: 'weights',
    label: 'Weight & Config',
    shortLabel: 'Weights',
    description: 'P1–P5 Multipliers',
    icon: Scale,
  },
  {
    id: 'hierarchy',
    label: 'Hierarchy Table',
    shortLabel: 'Hierarchy',
    description: 'KC • SC • CB Calibration',
    icon: Layers,
  },
  {
    id: 'lookup',
    label: 'Lookup Tables',
    shortLabel: 'Lookup Matrix',
    description: 'Raw Score Conversion',
    icon: Table,
  },
  {
    id: 'calculated',
    label: 'Calculated Values',
    shortLabel: 'Calculated',
    description: '18 CB Model Bounds',
    icon: Calculator,
  },
];

export const WeightingsConfig: React.FC<WeightingsConfigProps> = ({ initialTab }) => {
  const { priorityWeights, updatePriorityWeights } = useApp();

  const [activeTab, setActiveTab] = useState<ConfigTabId>(initialTab || 'questions');
  const [weights, setWeights] = useState<PriorityWeightConfig>({ ...priorityWeights });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleWeightChange = (key: keyof PriorityWeightConfig, value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updatePriorityWeights(weights);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleReset = () => {
    const defaultWeights: PriorityWeightConfig = {
      P1: 1,
      P2: 2,
      P3: 3,
      P4: 4,
      P5: 10,
    };
    setWeights(defaultWeights);
    updatePriorityWeights(defaultWeights);
  };

  return (
    <div
      className={
        activeTab === 'calculated'
          ? 'w-full max-w-[1700px] mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-5'
          : 'max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5'
      }
    >
      {/* Configuration Section Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
        {CONFIG_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-start sm:items-center p-2.5 sm:p-3 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 mr-2.5 transition-colors ${
                  isActive ? 'bg-slate-800 text-teal-400' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm font-semibold truncate leading-tight">
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </div>
                <div
                  className={`text-[10px] sm:text-[11px] truncate mt-0.5 ${
                    isActive ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {tab.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Question Bank (First Tab) */}
      {activeTab === 'questions' && (
        <div className="animate-in fade-in duration-150">
          <QuestionBank embedded={true} />
        </div>
      )}

      {/* Tab 2: Weight & Config */}
      {activeTab === 'weights' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Priority Values Configuration Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
                    <Scale className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    Priority Weight Values (P5–P1)
                  </h3>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 bg-slate-100 rounded-md text-slate-700">
                    Priority Multipliers
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Define the multiplier or point value attributed to each question priority level across all 150 diagnostic questions.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium transition min-h-[36px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Changes</span>
                </button>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-xs transition min-h-[36px]"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Priority Weights</span>
                </button>
              </div>
            </div>

            {saveSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Priority weights updated successfully and re-calibrated across scoring engines.</span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
              {(['P5', 'P4', 'P3', 'P2', 'P1'] as const).map(p => (
                <div
                  key={p}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-slate-900">{p}</span>
                    <span className="text-[10px] uppercase font-semibold text-slate-500">
                      {p === 'P5'
                        ? 'Critical'
                        : p === 'P4'
                        ? 'High'
                        : p === 'P3'
                        ? 'Medium'
                        : p === 'P2'
                        ? 'Standard'
                        : 'Baseline'}
                    </span>
                  </div>
                  <div className="mt-3">
                    <label className="block text-[10px] text-slate-500 uppercase font-medium">
                      Multiplier
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={weights[p]}
                      onChange={e => handleWeightChange(p, parseInt(e.target.value) || 1)}
                      className="mt-1 w-full font-mono font-bold text-base text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Governance & Calibration Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2.5">
              <div className="flex items-center space-x-2 text-slate-900 font-semibold text-xs">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <span>Scoring Engine Normalization Rules</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                The weighted sum of questions answered in alignment with behavioral orientation is multiplied by the priority value (P1–P5). The resulting raw scores normalize across all Summary Characteristics to yield a calibrated 0–100 index.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2.5">
              <div className="flex items-center space-x-2 text-slate-900 font-semibold text-xs">
                <Settings2 className="w-4 h-4 text-teal-700" />
                <span>Multi-Rater Reliability Calibration</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Self and Peer observer assessments share the identical P1–P5 multiplier matrix. Gap analysis and perceptual blind spot indicators compute using uniform mathematical weights across all leadership tiers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Hierarchy Table */}
      {activeTab === 'hierarchy' && (
        <div className="animate-in fade-in duration-150">
          <KeyWeightsSection />
        </div>
      )}

      {/* Tab 4: Lookup Tables */}
      {activeTab === 'lookup' && (
        <div className="animate-in fade-in duration-150">
          <LookupTableSection />
        </div>
      )}

      {/* Tab 5: Calculated Values */}
      {activeTab === 'calculated' && (
        <div className="animate-in fade-in duration-150">
          <CalculatedValuesSection />
        </div>
      )}
    </div>
  );
};
