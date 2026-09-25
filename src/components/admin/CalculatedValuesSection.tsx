import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CB_PRIORITY_COLUMNS,
  getQuestionCbPriorities,
  SC_GROUPS,
} from '../../data/questions';
import { PriorityLevel } from '../../types';
import {
  generatePositiveLookupTable,
  generateNegativeLookupTable,
  LookupTableRow,
} from './LookupTableSection';
import { getHierarchyCbLabels } from './KeyWeightsSection';
import {
  Calculator,
  Download,
  Filter,
  FileSpreadsheet,
  Info,
  ChevronDown,
} from 'lucide-react';

export type MetricType =
  | 'MDL_COUNT'
  | 'MAX_RAW_SCORE'
  | 'MAX_RAW_LOOKUP_SCORE'
  | 'MIN_RAW_SCORE'
  | 'MIN_RAW_LOOKUP_SCORE';

interface MetricRowDef {
  type: MetricType;
  label: string;
  shortLabel: string;
  getFormulaText: (p: PriorityLevel, pWeight: number, cbName: string, isPos: boolean) => string;
}

const METRIC_ROWS: MetricRowDef[] = [
  {
    type: 'MDL_COUNT',
    label: 'MDL Count',
    shortLabel: 'MDL Count',
    getFormulaText: (p, _w, cbName, isPos) =>
      `Count the number of ${isPos ? '+ve' : '-ve'} questions that have the weight ${p.replace('P', '')} in their ${cbName.toLowerCase()} field`,
  },
  {
    type: 'MAX_RAW_SCORE',
    label: 'Max Raw Score',
    shortLabel: 'Max Raw',
    getFormulaText: (p, w) =>
      `Multiply MDL Count * the actual value of ${p.replace('P', '')} (${w}) from config table`,
  },
  {
    type: 'MAX_RAW_LOOKUP_SCORE',
    label: 'Max Raw Lookup Score',
    shortLabel: 'Max Lkp',
    getFormulaText: () =>
      `Use MDL Count to find corresponding priority specific score in the +ve lookup table`,
  },
  {
    type: 'MIN_RAW_SCORE',
    label: 'Min Raw Score',
    shortLabel: 'Min Raw',
    getFormulaText: () => `Negative value of "Max Raw Score"`,
  },
  {
    type: 'MIN_RAW_LOOKUP_SCORE',
    label: 'Min Raw Lookup Score',
    shortLabel: 'Min Lkp',
    getFormulaText: () =>
      `Use MDL Count to find corresponding priority specific score in the -ve lookup table`,
  },
];

const PRIORITIES: PriorityLevel[] = ['P5', 'P4', 'P3', 'P2', 'P1'];

// Short display names for compact 18-column grid fit
const CB_SHORT_NAMES: Record<string, string> = {
  'cb-1': 'Vision',
  'cb-2': 'Influ.',
  'cb-3': 'Decis.',
  'cb-4': 'Under.',
  'cb-5': 'Proc.',
  'cb-6': 'Reas.',
  'cb-7': 'Open.',
  'cb-8': 'Listen.',
  'cb-9': 'Artic.',
  'cb-10': 'Self-Aw.',
  'cb-11': 'Empathy',
  'cb-12': 'Collab.',
  'cb-13': 'Prob.Solv.',
  'cb-14': 'Adapt.',
  'cb-15': 'Creat.',
  'cb-16': 'Initiat.',
  'cb-17': 'Complet.',
  'cb-18': 'Quality',
};

export const CalculatedValuesSection: React.FC = () => {
  const { questions, priorityWeights } = useApp();
  const [activeOnly, setActiveOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'NUMERIC' | 'FORMULA'>('NUMERIC');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [formulaSelectedCb, setFormulaSelectedCb] = useState<string>('cb-1');

  // Hierarchy CB custom labels
  const hierarchyLabels = useMemo(() => getHierarchyCbLabels(), []);

  // Positive & Negative Lookup Tables (from localStorage or defaults)
  const { positiveLookup, negativeLookup } = useMemo(() => {
    let pos: LookupTableRow[] = [];
    let neg: LookupTableRow[] = [];

    try {
      const savedPos = localStorage.getItem('kindlytics_positive_lookup');
      if (savedPos) pos = JSON.parse(savedPos);
    } catch {
      // fallback
    }
    if (!pos || pos.length === 0) {
      pos = generatePositiveLookupTable();
    }

    try {
      const savedNeg = localStorage.getItem('kindlytics_negative_lookup');
      if (savedNeg) neg = JSON.parse(savedNeg);
    } catch {
      // fallback
    }
    if (!neg || neg.length === 0) {
      neg = generateNegativeLookupTable();
    }

    return { positiveLookup: pos, negativeLookup: neg };
  }, []);

  // Helper to get score from lookup table
  const getLookupScore = (
    rawCount: number,
    priority: PriorityLevel,
    isPositiveTable: boolean
  ): number => {
    if (rawCount <= 0) return 0;
    const table = isPositiveTable ? positiveLookup : negativeLookup;
    const pKey = priority.toLowerCase() as keyof Omit<LookupTableRow, 'rawScore'>;
    const found = table.find(r => r.rawScore === rawCount);
    if (found) {
      const parsed = parseFloat(found[pKey]);
      return isNaN(parsed) ? 0 : parsed;
    }
    // Formulaic extrapolation if rawCount exceeds table
    if (isPositiveTable) {
      if (priority === 'P5') return rawCount * 1.0;
      if (priority === 'P4') return rawCount * 0.5;
      if (priority === 'P3') return Math.round((rawCount * 100) / 3) / 100;
      if (priority === 'P2') return rawCount * 0.25;
      return rawCount * 0.2;
    } else {
      if (priority === 'P5') return -(rawCount * 1.0);
      if (priority === 'P4') return -(rawCount * 0.5);
      if (priority === 'P3') return -(Math.round((rawCount * 100) / 3) / 100);
      if (priority === 'P2') return -(rawCount * 0.25);
      return -(rawCount * 0.2);
    }
  };

  // Question filtering
  const targetQuestions = useMemo(() => {
    return questions.filter(q => (activeOnly ? q.active : true));
  }, [questions, activeOnly]);

  // Filter columns based on SC group selection
  const visibleColumns = useMemo(() => {
    return CB_PRIORITY_COLUMNS.filter(col => {
      if (selectedGroup !== 'ALL') {
        const parentGroup = SC_GROUPS.find(g =>
          g.columns.some(c => c.cbId === col.cbId)
        );
        if (!parentGroup || parentGroup.id !== selectedGroup) return false;
      }
      return true;
    });
  }, [selectedGroup]);

  // Compute all data matrix
  const matrixData = useMemo(() => {
    const data: Record<
      string,
      {
        pos: Record<PriorityLevel, Record<MetricType, number>>;
        neg: Record<PriorityLevel, Record<MetricType, number>>;
        totals: {
          totalPosMax: number;
          totalPosMin: number;
          totalNegMax: number;
          totalNegMin: number;
        };
      }
    > = {};

    CB_PRIORITY_COLUMNS.forEach(col => {
      const colKey = col.key;
      const posData: Record<PriorityLevel, Record<MetricType, number>> = {} as any;
      const negData: Record<PriorityLevel, Record<MetricType, number>> = {} as any;

      let sumPosMaxScore = 0;
      let sumPosMaxLookup = 0;
      let sumPosMinScore = 0;
      let sumPosMinLookup = 0;

      let sumNegMaxScore = 0;
      let sumNegMaxLookup = 0;
      let sumNegMinScore = 0;
      let sumNegMinLookup = 0;

      PRIORITIES.forEach(p => {
        const weightNum = parseInt(p.replace('P', ''), 10);
        const actualPWeight = priorityWeights[p] ?? weightNum;

        // POSITIVE QUESTIONS
        const posCount = targetQuestions.filter(q => {
          if (q.orientation !== 'POSITIVE') return false;
          const prio =
            q.cbPriorities ||
            getQuestionCbPriorities(q.sequence, q.priority, q.compositeBehaviourId);
          return (prio as any)[colKey] === weightNum;
        }).length;

        const posMaxRaw = posCount * actualPWeight;
        const posMaxLookup = getLookupScore(posCount, p, true);
        const posMinRaw = -posMaxRaw;
        const posMinLookup = getLookupScore(posCount, p, false);

        posData[p] = {
          MDL_COUNT: posCount,
          MAX_RAW_SCORE: posMaxRaw,
          MAX_RAW_LOOKUP_SCORE: posMaxLookup,
          MIN_RAW_SCORE: posMinRaw,
          MIN_RAW_LOOKUP_SCORE: posMinLookup,
        };

        sumPosMaxScore += posMaxRaw;
        sumPosMaxLookup += posMaxLookup;
        sumPosMinScore += posMinRaw;
        sumPosMinLookup += posMinLookup;

        // NEGATIVE QUESTIONS
        const negCount = targetQuestions.filter(q => {
          if (q.orientation !== 'NEGATIVE') return false;
          const prio =
            q.cbPriorities ||
            getQuestionCbPriorities(q.sequence, q.priority, q.compositeBehaviourId);
          return (prio as any)[colKey] === weightNum;
        }).length;

        const negMaxRaw = negCount * actualPWeight;
        const negMaxLookup = getLookupScore(negCount, p, true);
        const negMinRaw = -negMaxRaw;
        const negMinLookup = getLookupScore(negCount, p, false);

        negData[p] = {
          MDL_COUNT: negCount,
          MAX_RAW_SCORE: negMaxRaw,
          MAX_RAW_LOOKUP_SCORE: negMaxLookup,
          MIN_RAW_SCORE: negMinRaw,
          MIN_RAW_LOOKUP_SCORE: negMinLookup,
        };

        sumNegMaxScore += negMaxRaw;
        sumNegMaxLookup += negMaxLookup;
        sumNegMinScore += negMinRaw;
        sumNegMinLookup += negMinLookup;
      });

      data[colKey] = {
        pos: posData,
        neg: negData,
        totals: {
          totalPosMax: sumPosMaxScore + sumPosMaxLookup,
          totalPosMin: sumPosMinScore + sumPosMinLookup,
          totalNegMax: sumNegMaxScore + sumNegMaxLookup,
          totalNegMin: sumNegMinScore + sumNegMinLookup,
        },
      };
    });

    return data;
  }, [targetQuestions, priorityWeights, positiveLookup, negativeLookup]);

  // Format numeric cells
  const formatVal = (num: number): string => {
    if (Number.isInteger(num)) return num.toString();
    return num.toFixed(2);
  };

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = [
      'Orientation',
      'Priority',
      'Metric',
      'Formula / Description',
      ...CB_PRIORITY_COLUMNS.map(c => hierarchyLabels[c.cbId] || c.name),
    ];

    const rows: string[][] = [];

    // Positive Section
    PRIORITIES.forEach(p => {
      METRIC_ROWS.forEach(m => {
        const pWeight = priorityWeights[p];
        const row = [
          'Positive Question',
          p,
          m.label,
          `"${m.getFormulaText(p, pWeight, 'Vision', true).replace(/"/g, '""')}"`,
          ...CB_PRIORITY_COLUMNS.map(col => {
            const val = matrixData[col.key]?.pos[p][m.type] ?? 0;
            return formatVal(val);
          }),
        ];
        rows.push(row);
      });
    });

    // Negative Section
    PRIORITIES.forEach(p => {
      METRIC_ROWS.forEach(m => {
        const pWeight = priorityWeights[p];
        const row = [
          'Negative Question',
          p,
          m.label,
          `"${m.getFormulaText(p, pWeight, 'Vision', false).replace(/"/g, '""')}"`,
          ...CB_PRIORITY_COLUMNS.map(col => {
            const val = matrixData[col.key]?.neg[p][m.type] ?? 0;
            return formatVal(val);
          }),
        ];
        rows.push(row);
      });
    });

    // Divider
    rows.push(['', '', '', '', ...CB_PRIORITY_COLUMNS.map(() => '')]);

    // Totals
    rows.push([
      'Total Pos Max Score',
      '',
      'Total Pos Max Score',
      '"Sum of Max Raw Score of each priority added to the sum of Max Raw Lookup Score of each priority for all positive questions"',
      ...CB_PRIORITY_COLUMNS.map(col => formatVal(matrixData[col.key]?.totals.totalPosMax ?? 0)),
    ]);
    rows.push([
      'Total Pos Min Score',
      '',
      'Total Pos Min Score',
      '"Sum of Min Raw Score of each priority added to the sum of Min Raw Lookup Score of each priority for all positive questions"',
      ...CB_PRIORITY_COLUMNS.map(col => formatVal(matrixData[col.key]?.totals.totalPosMin ?? 0)),
    ]);
    rows.push(['', '', '', '', ...CB_PRIORITY_COLUMNS.map(() => '')]);
    rows.push([
      'Total Neg Max Score',
      '',
      'Total Neg Max Score',
      '"Sum of Max Raw Score of each priority added to the sum of Max Raw Lookup Score of each priority for all negative questions"',
      ...CB_PRIORITY_COLUMNS.map(col => formatVal(matrixData[col.key]?.totals.totalNegMax ?? 0)),
    ]);
    rows.push([
      'Total Neg Min Score',
      '',
      'Total Neg Min Score',
      '"Sum of Min Raw Score of each priority added to the sum of Min Raw Lookup Score of each priority for all negative questions"',
      ...CB_PRIORITY_COLUMNS.map(col => formatVal(matrixData[col.key]?.totals.totalNegMin ?? 0)),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Kindlytics_Calculated_Values_Matrix.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group columns for top SC domain header
  const isAllGroups = selectedGroup === 'ALL';

  return (
    <div className="space-y-3.5 w-full">
      {/* Control & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            <button
              onClick={() => setViewMode('NUMERIC')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                viewMode === 'NUMERIC'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-teal-600" />
              <span>Calculated Values</span>
            </button>
            <button
              onClick={() => setViewMode('FORMULA')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                viewMode === 'FORMULA'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
              <span>Formula / Logic View</span>
            </button>
          </div>

          {/* Active Questions Filter */}
          <button
            onClick={() => setActiveOnly(prev => !prev)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition flex items-center space-x-1.5 min-h-[32px] ${
              activeOnly
                ? 'bg-teal-50 border-teal-300 text-teal-800 font-semibold'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>
              {activeOnly
                ? `Active Only (${targetQuestions.length})`
                : `All Questions (${targetQuestions.length})`}
            </span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Priority multiplier pill reminders */}
          <div className="hidden xl:flex items-center space-x-2 text-[10px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-700">Weights:</span>
            <span>P5={priorityWeights.P5}x</span>
            <span>P4={priorityWeights.P4}x</span>
            <span>P3={priorityWeights.P3}x</span>
            <span>P2={priorityWeights.P2}x</span>
            <span>P1={priorityWeights.P1}x</span>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition min-h-[32px] shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Domain Quick Tabs - Allows 1-click focus on any of the 6 SCs or full 18 CB view */}
      <div className="flex items-center overflow-x-auto no-scrollbar gap-1.5 pb-0.5">
        <button
          onClick={() => setSelectedGroup('ALL')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
            selectedGroup === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs font-semibold'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All 18 Behaviours (100% Fit)
        </button>
        {SC_GROUPS.map((g, idx) => (
          <button
            key={g.id}
            onClick={() => setSelectedGroup(g.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center space-x-1 ${
              selectedGroup === g.id
                ? 'bg-teal-700 text-white shadow-xs font-semibold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor:
                  idx === 0
                    ? '#0ea5e9'
                    : idx === 1
                    ? '#8b5cf6'
                    : idx === 2
                    ? '#10b981'
                    : idx === 3
                    ? '#f59e0b'
                    : idx === 4
                    ? '#ec4899'
                    : '#6366f1',
              }}
            />
            <span>{g.name}</span>
          </button>
        ))}
      </div>

      {/* VIEW MODE 1: NUMERIC TABLE (Fits 100% without horizontal scroll) */}
      {viewMode === 'NUMERIC' && (
        <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden w-full">
          {/* Table Container - no horizontal scroll */}
          <div className="w-full">
            <table className="w-full table-fixed border-collapse text-left">
              {/* Column Width Allocation */}
              <colgroup>
                {/* Orientation */}
                <col style={{ width: isAllGroups ? '5%' : '10%' }} />
                {/* Priority */}
                <col style={{ width: isAllGroups ? '3.5%' : '8%' }} />
                {/* Metric */}
                <col style={{ width: isAllGroups ? '8%' : '16%' }} />
                {/* CB Columns */}
                {visibleColumns.map(c => (
                  <col
                    key={c.cbId}
                    style={{
                      width: `${(isAllGroups ? 83.5 : 66) / visibleColumns.length}%`,
                    }}
                  />
                ))}
              </colgroup>

              {/* Header */}
              <thead className="bg-slate-900 text-white select-none">
                {/* Optional SC Group Domain Span Row when displaying All 18 */}
                {isAllGroups && (
                  <tr className="border-b border-slate-800 text-[9px] font-semibold tracking-wider uppercase text-slate-400">
                    <th colSpan={3} className="px-2 py-1 bg-slate-950 text-left">
                      Hierarchy Bounds
                    </th>
                    <th colSpan={3} className="px-1 py-1 text-center bg-slate-900 text-sky-400 border-l border-slate-800">
                      1.1 Direction
                    </th>
                    <th colSpan={3} className="px-1 py-1 text-center bg-slate-900 text-purple-400 border-l border-slate-800">
                      1.2 Analysis
                    </th>
                    <th colSpan={3} className="px-1 py-1 text-center bg-slate-900 text-emerald-400 border-l border-slate-800">
                      2.1 Comm
                    </th>
                    <th colSpan={3} className="px-1 py-1 text-center bg-slate-900 text-amber-400 border-l border-slate-800">
                      2.2 Rapport
                    </th>
                    <th colSpan={3} className="px-1 py-1 text-center bg-slate-900 text-pink-400 border-l border-slate-800">
                      3.1 Innovation
                    </th>
                    <th colSpan={3} className="px-1 py-1 text-center bg-slate-900 text-indigo-400 border-l border-slate-800">
                      3.2 Diligence
                    </th>
                  </tr>
                )}

                {/* Main Column Header Row */}
                <tr className="border-b border-slate-700 divide-x divide-slate-800">
                  <th className="px-1 sm:px-1.5 py-1.5 font-bold uppercase tracking-wider text-[10px] text-center">
                    Type
                  </th>
                  <th className="px-0.5 py-1.5 font-bold text-center uppercase tracking-wider text-[10px]">
                    Prio
                  </th>
                  <th className="px-1 sm:px-1.5 py-1.5 font-bold uppercase tracking-wider text-[10px]">
                    Metric
                  </th>
                  {visibleColumns.map(col => {
                    const activeName = hierarchyLabels[col.cbId] || col.name;
                    const shortName = CB_SHORT_NAMES[col.cbId] || activeName;
                    return (
                      <th
                        key={col.cbId}
                        className="px-0.5 py-1.5 font-bold text-center overflow-hidden"
                        title={`${col.label}: ${activeName}`}
                      >
                        <div className="text-[9px] text-teal-400 font-mono leading-none">
                          {col.label}
                        </div>
                        <div className="text-[10px] sm:text-[11px] font-bold text-white truncate px-0.5 leading-tight mt-0.5">
                          {isAllGroups ? shortName : activeName}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {/* SECTION 1: POSITIVE QUESTIONS */}
                {PRIORITIES.map((priority, pIdx) => {
                  const pWeight = priorityWeights[priority];
                  return METRIC_ROWS.map((metric, mIdx) => {
                    const isFirstRowOfPriority = mIdx === 0;
                    const isFirstRowOfSection = pIdx === 0 && mIdx === 0;
                    const isLastRowOfPriority = mIdx === METRIC_ROWS.length - 1;

                    return (
                      <tr
                        key={`pos-${priority}-${metric.type}`}
                        className={`hover:bg-teal-50/30 transition-colors ${
                          pIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                        } ${isLastRowOfPriority ? 'border-b border-slate-300' : 'border-b border-slate-100'}`}
                      >
                        {/* Section Span Column (25 rows) */}
                        {isFirstRowOfSection && (
                          <td
                            rowSpan={PRIORITIES.length * METRIC_ROWS.length}
                            className="px-1 py-2 font-bold text-slate-900 bg-slate-100 border-r border-slate-300 align-middle text-center overflow-hidden"
                          >
                            <div className="flex flex-col items-center justify-center">
                              <span className="font-bold text-[10px] sm:text-xs text-teal-900 leading-tight">
                                POS
                              </span>
                              <span className="text-[8px] text-slate-500 font-sans mt-0.5">
                                (+ve)
                              </span>
                            </div>
                          </td>
                        )}

                        {/* Priority Span Column (5 rows) */}
                        {isFirstRowOfPriority && (
                          <td
                            rowSpan={METRIC_ROWS.length}
                            className="px-0.5 py-1 font-mono font-bold text-slate-900 bg-slate-50 border-r border-slate-300 align-middle text-center overflow-hidden"
                          >
                            <div className="text-[10px] sm:text-[11px] font-bold text-slate-800">
                              {priority}
                            </div>
                            <div className="text-[8px] text-slate-400 font-sans">
                              {pWeight}x
                            </div>
                          </td>
                        )}

                        {/* Metric Name */}
                        <td
                          className="px-1 sm:px-1.5 py-1 text-slate-700 border-r border-slate-300 overflow-hidden truncate"
                          title={metric.label}
                        >
                          <span
                            className={`text-[10px] sm:text-[11px] truncate block leading-tight ${
                              metric.type === 'MDL_COUNT'
                                ? 'font-semibold text-teal-800'
                                : metric.type.includes('LOOKUP')
                                ? 'text-indigo-800 font-medium'
                                : 'text-slate-700'
                            }`}
                          >
                            {metric.shortLabel}
                          </span>
                        </td>

                        {/* CB Columns */}
                        {visibleColumns.map(col => {
                          const cellVal = matrixData[col.key]?.pos[priority][metric.type] ?? 0;
                          const colName = hierarchyLabels[col.cbId] || col.name;
                          const formulaText = metric.getFormulaText(priority, pWeight, colName, true);

                          return (
                            <td
                              key={col.cbId}
                              className={`px-0.5 py-1 text-center font-mono border-r border-slate-100 text-[10px] sm:text-[11px] overflow-hidden truncate ${
                                cellVal < 0
                                  ? 'text-rose-600 font-semibold'
                                  : cellVal > 0
                                  ? 'text-slate-800 font-medium'
                                  : 'text-slate-300'
                              }`}
                              title={`${colName} (${metric.label}): ${formatVal(cellVal)}\n${formulaText}`}
                            >
                              {formatVal(cellVal)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  });
                })}

                {/* SECTION 2: NEGATIVE QUESTIONS */}
                {PRIORITIES.map((priority, pIdx) => {
                  const pWeight = priorityWeights[priority];
                  return METRIC_ROWS.map((metric, mIdx) => {
                    const isFirstRowOfPriority = mIdx === 0;
                    const isFirstRowOfSection = pIdx === 0 && mIdx === 0;
                    const isLastRowOfPriority = mIdx === METRIC_ROWS.length - 1;

                    return (
                      <tr
                        key={`neg-${priority}-${metric.type}`}
                        className={`hover:bg-rose-50/30 transition-colors ${
                          pIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                        } ${isLastRowOfPriority ? 'border-b border-slate-300' : 'border-b border-slate-100'}`}
                      >
                        {/* Section Span Column (25 rows) */}
                        {isFirstRowOfSection && (
                          <td
                            rowSpan={PRIORITIES.length * METRIC_ROWS.length}
                            className="px-1 py-2 font-bold text-slate-900 bg-rose-50/70 border-r border-slate-300 align-middle text-center overflow-hidden"
                          >
                            <div className="flex flex-col items-center justify-center">
                              <span className="font-bold text-[10px] sm:text-xs text-rose-900 leading-tight">
                                NEG
                              </span>
                              <span className="text-[8px] text-rose-600 font-sans mt-0.5">
                                (-ve)
                              </span>
                            </div>
                          </td>
                        )}

                        {/* Priority Span Column (5 rows) */}
                        {isFirstRowOfPriority && (
                          <td
                            rowSpan={METRIC_ROWS.length}
                            className="px-0.5 py-1 font-mono font-bold text-slate-900 bg-slate-50 border-r border-slate-300 align-middle text-center overflow-hidden"
                          >
                            <div className="text-[10px] sm:text-[11px] font-bold text-slate-800">
                              {priority}
                            </div>
                            <div className="text-[8px] text-slate-400 font-sans">
                              {pWeight}x
                            </div>
                          </td>
                        )}

                        {/* Metric Name */}
                        <td
                          className="px-1 sm:px-1.5 py-1 text-slate-700 border-r border-slate-300 overflow-hidden truncate"
                          title={metric.label}
                        >
                          <span
                            className={`text-[10px] sm:text-[11px] truncate block leading-tight ${
                              metric.type === 'MDL_COUNT'
                                ? 'font-semibold text-rose-800'
                                : metric.type.includes('LOOKUP')
                                ? 'text-indigo-800 font-medium'
                                : 'text-slate-700'
                            }`}
                          >
                            {metric.shortLabel}
                          </span>
                        </td>

                        {/* CB Columns */}
                        {visibleColumns.map(col => {
                          const cellVal = matrixData[col.key]?.neg[priority][metric.type] ?? 0;
                          const colName = hierarchyLabels[col.cbId] || col.name;
                          const formulaText = metric.getFormulaText(priority, pWeight, colName, false);

                          return (
                            <td
                              key={col.cbId}
                              className={`px-0.5 py-1 text-center font-mono border-r border-slate-100 text-[10px] sm:text-[11px] overflow-hidden truncate ${
                                cellVal < 0
                                  ? 'text-rose-600 font-semibold'
                                  : cellVal > 0
                                  ? 'text-slate-800 font-medium'
                                  : 'text-slate-300'
                              }`}
                              title={`${colName} (${metric.label}): ${formatVal(cellVal)}\n${formulaText}`}
                            >
                              {formatVal(cellVal)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  });
                })}

                {/* SEPARATOR GAP ROW */}
                <tr className="bg-slate-200 border-y border-slate-300 h-2">
                  <td colSpan={3 + visibleColumns.length} className="p-0"></td>
                </tr>

                {/* SECTION 3: SUMMARY TOTAL ROWS */}
                {/* 1. Total Pos Max Score */}
                <tr className="bg-emerald-50 hover:bg-emerald-100/60 font-bold border-b border-slate-200">
                  <td
                    colSpan={2}
                    className="px-1.5 py-1.5 font-bold text-slate-900 border-r border-slate-300 text-[10px] sm:text-[11px] truncate text-center"
                    title="Total Positive Maximum Score"
                  >
                    Tot Pos Max
                  </td>
                  <td
                    className="px-1 sm:px-1.5 py-1.5 text-[9px] sm:text-[10px] text-slate-600 border-r border-slate-300 truncate"
                    title="Sum of Max Raw Score of each priority added to the sum of Max Raw Lookup Score of each priority for all positive questions"
                  >
                    Max Raw + Lkp (+ve)
                  </td>
                  {visibleColumns.map(col => {
                    const val = matrixData[col.key]?.totals.totalPosMax ?? 0;
                    return (
                      <td
                        key={col.cbId}
                        className="px-0.5 py-1.5 text-center font-mono text-emerald-900 font-bold border-r border-emerald-100 text-[10px] sm:text-[11px] truncate"
                        title={`Total Pos Max: ${formatVal(val)}`}
                      >
                        {formatVal(val)}
                      </td>
                    );
                  })}
                </tr>

                {/* 2. Total Pos Min Score */}
                <tr className="bg-slate-50 hover:bg-slate-100/80 font-bold border-b border-slate-300">
                  <td
                    colSpan={2}
                    className="px-1.5 py-1.5 font-bold text-slate-900 border-r border-slate-300 text-[10px] sm:text-[11px] truncate text-center"
                    title="Total Positive Minimum Score"
                  >
                    Tot Pos Min
                  </td>
                  <td
                    className="px-1 sm:px-1.5 py-1.5 text-[9px] sm:text-[10px] text-slate-600 border-r border-slate-300 truncate"
                    title="Sum of Min Raw Score of each priority added to the sum of Min Raw Lookup Score of each priority for all positive questions"
                  >
                    Min Raw + Lkp (+ve)
                  </td>
                  {visibleColumns.map(col => {
                    const val = matrixData[col.key]?.totals.totalPosMin ?? 0;
                    return (
                      <td
                        key={col.cbId}
                        className="px-0.5 py-1.5 text-center font-mono text-rose-700 font-bold border-r border-slate-200 text-[10px] sm:text-[11px] truncate"
                        title={`Total Pos Min: ${formatVal(val)}`}
                      >
                        {formatVal(val)}
                      </td>
                    );
                  })}
                </tr>

                {/* Divider */}
                <tr className="bg-slate-200 border-y border-slate-300 h-1.5">
                  <td colSpan={3 + visibleColumns.length} className="p-0"></td>
                </tr>

                {/* 3. Total Neg Max Score */}
                <tr className="bg-emerald-50 hover:bg-emerald-100/60 font-bold border-b border-slate-200">
                  <td
                    colSpan={2}
                    className="px-1.5 py-1.5 font-bold text-slate-900 border-r border-slate-300 text-[10px] sm:text-[11px] truncate text-center"
                    title="Total Negative Maximum Score"
                  >
                    Tot Neg Max
                  </td>
                  <td
                    className="px-1 sm:px-1.5 py-1.5 text-[9px] sm:text-[10px] text-slate-600 border-r border-slate-300 truncate"
                    title="Sum of Max Raw Score of each priority added to the sum of Max Raw Lookup Score of each priority for all negative questions"
                  >
                    Max Raw + Lkp (-ve)
                  </td>
                  {visibleColumns.map(col => {
                    const val = matrixData[col.key]?.totals.totalNegMax ?? 0;
                    return (
                      <td
                        key={col.cbId}
                        className="px-0.5 py-1.5 text-center font-mono text-emerald-900 font-bold border-r border-emerald-100 text-[10px] sm:text-[11px] truncate"
                        title={`Total Neg Max: ${formatVal(val)}`}
                      >
                        {formatVal(val)}
                      </td>
                    );
                  })}
                </tr>

                {/* 4. Total Neg Min Score */}
                <tr className="bg-slate-50 hover:bg-slate-100/80 font-bold border-b border-slate-300">
                  <td
                    colSpan={2}
                    className="px-1.5 py-1.5 font-bold text-slate-900 border-r border-slate-300 text-[10px] sm:text-[11px] truncate text-center"
                    title="Total Negative Minimum Score"
                  >
                    Tot Neg Min
                  </td>
                  <td
                    className="px-1 sm:px-1.5 py-1.5 text-[9px] sm:text-[10px] text-slate-600 border-r border-slate-300 truncate"
                    title="Sum of Min Raw Score of each priority added to the sum of Min Raw Lookup Score of each priority for all negative questions"
                  >
                    Min Raw + Lkp (-ve)
                  </td>
                  {visibleColumns.map(col => {
                    const val = matrixData[col.key]?.totals.totalNegMin ?? 0;
                    return (
                      <td
                        key={col.cbId}
                        className="px-0.5 py-1.5 text-center font-mono text-rose-700 font-bold border-r border-slate-200 text-[10px] sm:text-[11px] truncate"
                        title={`Total Neg Min: ${formatVal(val)}`}
                      >
                        {formatVal(val)}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: FORMULA / LOGIC SPECIFICATION VIEW */}
      {viewMode === 'FORMULA' && (
        <div className="bg-white rounded-xl border border-slate-300 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-serif font-bold text-base text-slate-900">
                Formula & Logic Specification
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed mathematical definitions as illustrated in your specification spreadsheet. Select any Composite Behaviour to inspect its live evaluated steps.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-xs font-medium text-slate-600">Inspect CB:</label>
              <div className="relative">
                <select
                  value={formulaSelectedCb}
                  onChange={e => setFormulaSelectedCb(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 pr-8 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500"
                >
                  {CB_PRIORITY_COLUMNS.map(col => (
                    <option key={col.cbId} value={col.cbId}>
                      {col.label}: {hierarchyLabels[col.cbId] || col.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Clean 2-column or 3-column table showing exact formulas and evaluated numbers */}
          {(() => {
            const currentCb =
              CB_PRIORITY_COLUMNS.find(c => c.cbId === formulaSelectedCb) ||
              CB_PRIORITY_COLUMNS[0];
            const currentCbName = hierarchyLabels[currentCb.cbId] || currentCb.name;
            const currentCbData = matrixData[currentCb.key];

            return (
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full border-collapse text-xs">
                  <thead className="bg-slate-900 text-white">
                    <tr className="border-b border-slate-700 divide-x divide-slate-800 text-[11px]">
                      <th className="px-3 py-2 w-28 text-left font-bold">Orientation</th>
                      <th className="px-2 py-2 w-16 text-center font-bold">Priority</th>
                      <th className="px-3 py-2 w-44 text-left font-bold">Metric</th>
                      <th className="px-4 py-2 text-left font-bold">
                        Formula / Logic Specification ({currentCbName})
                      </th>
                      <th className="px-3 py-2 w-28 text-right font-bold font-mono">
                        Computed Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {/* POSITIVE QUESTIONS */}
                    {PRIORITIES.map((priority, pIdx) => {
                      const pWeight = priorityWeights[priority];
                      return METRIC_ROWS.map((metric, mIdx) => {
                        const isFirstOfSection = pIdx === 0 && mIdx === 0;
                        const isFirstOfPrio = mIdx === 0;
                        const val = currentCbData?.pos[priority][metric.type] ?? 0;
                        const formula = metric.getFormulaText(
                          priority,
                          pWeight,
                          currentCbName,
                          true
                        );

                        return (
                          <tr
                            key={`form-pos-${priority}-${metric.type}`}
                            className={pIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                          >
                            {isFirstOfSection && (
                              <td
                                rowSpan={25}
                                className="px-3 py-3 font-bold text-teal-900 bg-slate-100 border-r border-slate-300 align-top text-center"
                              >
                                Positive Question
                              </td>
                            )}
                            {isFirstOfPrio && (
                              <td
                                rowSpan={5}
                                className="px-2 py-2 font-mono font-bold text-slate-800 bg-slate-50 border-r border-slate-300 align-top text-center"
                              >
                                {priority} ({pWeight}x)
                              </td>
                            )}
                            <td className="px-3 py-2 font-medium text-slate-700 border-r border-slate-300">
                              {metric.label}
                            </td>
                            <td className="px-4 py-2 text-slate-600 border-r border-slate-300">
                              {formula}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                              {formatVal(val)}
                            </td>
                          </tr>
                        );
                      });
                    })}

                    {/* NEGATIVE QUESTIONS */}
                    {PRIORITIES.map((priority, pIdx) => {
                      const pWeight = priorityWeights[priority];
                      return METRIC_ROWS.map((metric, mIdx) => {
                        const isFirstOfSection = pIdx === 0 && mIdx === 0;
                        const isFirstOfPrio = mIdx === 0;
                        const val = currentCbData?.neg[priority][metric.type] ?? 0;
                        const formula = metric.getFormulaText(
                          priority,
                          pWeight,
                          currentCbName,
                          false
                        );

                        return (
                          <tr
                            key={`form-neg-${priority}-${metric.type}`}
                            className={pIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                          >
                            {isFirstOfSection && (
                              <td
                                rowSpan={25}
                                className="px-3 py-3 font-bold text-rose-900 bg-rose-50/70 border-r border-slate-300 align-top text-center"
                              >
                                Negative Question
                              </td>
                            )}
                            {isFirstOfPrio && (
                              <td
                                rowSpan={5}
                                className="px-2 py-2 font-mono font-bold text-slate-800 bg-slate-50 border-r border-slate-300 align-top text-center"
                              >
                                {priority} ({pWeight}x)
                              </td>
                            )}
                            <td className="px-3 py-2 font-medium text-slate-700 border-r border-slate-300">
                              {metric.label}
                            </td>
                            <td className="px-4 py-2 text-slate-600 border-r border-slate-300">
                              {formula}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                              {formatVal(val)}
                            </td>
                          </tr>
                        );
                      });
                    })}

                    {/* Totals */}
                    <tr className="bg-emerald-50 font-bold border-t-2 border-slate-300">
                      <td colSpan={3} className="px-3 py-2.5 text-slate-900 border-r border-slate-300">
                        Total Pos Max Score
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 font-normal border-r border-slate-300 text-[11px]">
                        Sum of "Max Raw Score" of each priority added to the sum of "Max Raw Lookup Score" of each priority for all positive questions
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-emerald-900 text-sm">
                        {formatVal(currentCbData?.totals.totalPosMax ?? 0)}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 font-bold border-b border-slate-300">
                      <td colSpan={3} className="px-3 py-2.5 text-slate-900 border-r border-slate-300">
                        Total Pos Min Score
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 font-normal border-r border-slate-300 text-[11px]">
                        Sum of "Min Raw Score" of each priority added to the sum of "Min Raw Lookup Score" of each priority for all positive questions
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-rose-700 text-sm">
                        {formatVal(currentCbData?.totals.totalPosMin ?? 0)}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50 font-bold border-b border-slate-300">
                      <td colSpan={3} className="px-3 py-2.5 text-slate-900 border-r border-slate-300">
                        Total Neg Max Score
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 font-normal border-r border-slate-300 text-[11px]">
                        Sum of "Max Raw Score" of each priority added to the sum of "Max Raw Lookup Score" of each priority for all negative questions
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-emerald-900 text-sm">
                        {formatVal(currentCbData?.totals.totalNegMax ?? 0)}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={3} className="px-3 py-2.5 text-slate-900 border-r border-slate-300">
                        Total Neg Min Score
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 font-normal border-r border-slate-300 text-[11px]">
                        Sum of "Min Raw Score" of each priority added to the sum of "Min Raw Lookup Score" of each priority for all negative questions
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-rose-700 text-sm">
                        {formatVal(currentCbData?.totals.totalNegMin ?? 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
