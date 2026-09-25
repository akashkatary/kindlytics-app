import React, { useState } from 'react';
import {
  Table,
  Search,
  Check,
  Edit3,
  RotateCcw,
  ShieldCheck,
  RefreshCw,
  Info,
} from 'lucide-react';

export interface LookupTableRow {
  rawScore: number;
  p5: string;
  p4: string;
  p3: string;
  p2: string;
  p1: string;
}

export const generatePositiveLookupTable = (): LookupTableRow[] => {
  const rows: LookupTableRow[] = [];
  for (let r = 0; r <= 30; r++) {
    rows.push({
      rawScore: r,
      p5: (r * 1.0).toFixed(2),
      p4: (r * 0.5).toFixed(2),
      p3: (Math.round((r * 100) / 3) / 100).toFixed(2),
      p2: (r * 0.25).toFixed(2),
      p1: (r * 0.2).toFixed(2),
    });
  }
  return rows;
};

export const generateNegativeLookupTable = (): LookupTableRow[] => {
  const rows: LookupTableRow[] = [];
  for (let r = 0; r <= 30; r++) {
    if (r === 0) {
      rows.push({
        rawScore: 0,
        p5: '0',
        p4: '0',
        p3: '0',
        p2: '0',
        p1: '0',
      });
    } else {
      const p3Val = (Math.round((r * 100) / 3) / 100).toFixed(2);
      rows.push({
        rawScore: r,
        p5: `-${(r * 1.0).toFixed(2)}`,
        p4: `-${(r * 0.5).toFixed(2)}`,
        p3: `-${p3Val}`,
        p2: `-${(r * 0.25).toFixed(2)}`,
        p1: `-${(r * 0.2).toFixed(2)}`,
      });
    }
  }
  return rows;
};

export const LookupTableSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BOTH' | 'POSITIVE' | 'NEGATIVE'>('BOTH');
  const [highlightScore, setHighlightScore] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Editable Positive Table State
  const [positiveRows, setPositiveRows] = useState<LookupTableRow[]>(() => {
    try {
      const saved = localStorage.getItem('kindlytics_positive_lookup');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return generatePositiveLookupTable();
  });

  // Editable Negative Table State
  const [negativeRows, setNegativeRows] = useState<LookupTableRow[]>(() => {
    try {
      const saved = localStorage.getItem('kindlytics_negative_lookup');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return generateNegativeLookupTable();
  });

  const handlePositiveCellChange = (
    rawScore: number,
    field: keyof Omit<LookupTableRow, 'rawScore'>,
    value: string
  ) => {
    setPositiveRows(prev =>
      prev.map(row => (row.rawScore === rawScore ? { ...row, [field]: value } : row))
    );
  };

  const handleNegativeCellChange = (
    rawScore: number,
    field: keyof Omit<LookupTableRow, 'rawScore'>,
    value: string
  ) => {
    setNegativeRows(prev =>
      prev.map(row => (row.rawScore === rawScore ? { ...row, [field]: value } : row))
    );
  };

  const handleSave = () => {
    try {
      localStorage.setItem('kindlytics_positive_lookup', JSON.stringify(positiveRows));
      localStorage.setItem('kindlytics_negative_lookup', JSON.stringify(negativeRows));
    } catch {
      // ignore
    }
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    const defaultPos = generatePositiveLookupTable();
    const defaultNeg = generateNegativeLookupTable();
    setPositiveRows(defaultPos);
    setNegativeRows(defaultNeg);
    try {
      localStorage.removeItem('kindlytics_positive_lookup');
      localStorage.removeItem('kindlytics_negative_lookup');
    } catch {
      // ignore
    }
    setIsEditing(false);
  };

  const handleSyncNegativeFromPositive = () => {
    const syncedNeg = positiveRows.map(pRow => {
      if (pRow.rawScore === 0) {
        return { rawScore: 0, p5: '0', p4: '0', p3: '0', p2: '0', p1: '0' };
      }
      const negate = (v: string) => {
        const trimmed = v.trim();
        if (!trimmed || trimmed === '0') return '0';
        if (trimmed.startsWith('-')) return trimmed;
        return `-${trimmed}`;
      };
      return {
        rawScore: pRow.rawScore,
        p5: negate(pRow.p5),
        p4: negate(pRow.p4),
        p3: negate(pRow.p3),
        p2: negate(pRow.p2),
        p1: negate(pRow.p1),
      };
    });
    setNegativeRows(syncedNeg);
  };

  const filteredPositiveRows = searchTerm
    ? positiveRows.filter(r => r.rawScore.toString().includes(searchTerm))
    : positiveRows;

  const filteredNegativeRows = searchTerm
    ? negativeRows.filter(r => r.rawScore.toString().includes(searchTerm))
    : negativeRows;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
              <Table className="w-4 h-4" />
            </div>
            <h2 className="font-serif font-bold text-lg text-slate-900">
              Lookup Table
            </h2>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
              Score Scaling (0–30)
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Raw score to scale factor conversion matrix across Priority 1 to Priority 5 for positive and negative scoring.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSyncNegativeFromPositive}
                title="Automatically calculate negative scale factors by inverting positive scale factors"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium transition min-h-[36px]"
              >
                <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                <span className="hidden sm:inline">Sync Negative from Positive</span>
                <span className="sm:hidden">Sync -</span>
              </button>
              <button
                onClick={handleResetDefaults}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition min-h-[36px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-xs transition min-h-[36px]"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Values</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium transition min-h-[36px]"
            >
              <Edit3 className="w-3.5 h-3.5 text-teal-600" />
              <span>Edit Values</span>
            </button>
          )}

          {/* Search/Filter by score */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Find score..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value.trim())}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg w-32 focus:outline-none focus:border-teal-500 font-mono min-h-[36px]"
            />
          </div>

          {/* View Tab Filter */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium text-slate-600 min-h-[36px]">
            <button
              onClick={() => setActiveTab('BOTH')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === 'BOTH'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Side by Side
            </button>
            <button
              onClick={() => setActiveTab('POSITIVE')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === 'POSITIVE'
                  ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Positive
            </button>
            <button
              onClick={() => setActiveTab('NEGATIVE')}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === 'NEGATIVE'
                  ? 'bg-white text-rose-800 shadow-2xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Negative
            </button>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in duration-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Lookup table values have been successfully updated and saved.</span>
        </div>
      )}

      {isEditing && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-2 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Edit Mode Active:</strong> You can directly modify any scale factor across Priority 1–5 for raw scores 0 to 30. Click <strong>"Save Values"</strong> to persist changes.
            </span>
          </div>
          <button
            onClick={() => setIsEditing(false)}
            className="text-xs text-amber-800 hover:text-amber-950 font-medium underline shrink-0 ml-3"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Grid for Lookup Tables */}
      <div
        className={`grid gap-6 ${
          activeTab === 'BOTH' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {/* Positive Scoring Lookup Table */}
        {(activeTab === 'BOTH' || activeTab === 'POSITIVE') && (
          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs bg-white flex flex-col">
            <div className="bg-emerald-50/80 border-b border-slate-300 px-4 py-2 flex items-center justify-between">
              <div className="font-bold text-xs text-slate-900 font-serif">
                Positive Scoring Lookup
              </div>
              <span className="text-[10px] font-mono text-emerald-700 font-semibold px-2 py-0.5 bg-emerald-100/60 rounded">
                + Scale Factor {isEditing && '(Editable)'}
              </span>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-center text-xs border-collapse font-mono">
                <thead className="sticky top-0 z-10 bg-slate-100 text-slate-900 shadow-2xs">
                  <tr className="border-b border-slate-300 font-bold">
                    <th className="py-2 px-2.5 border-r border-slate-300 text-left font-sans text-slate-900 w-16">
                      Raw Score
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300 font-sans">
                      Priority 5
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300 font-sans">
                      Priority 4
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300 font-sans">
                      Priority 3
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300 font-sans">
                      Priority 2
                    </th>
                    <th className="py-2 px-2 font-sans">Priority 1</th>
                  </tr>
                  <tr className="border-b border-slate-300 text-[10px] text-slate-600 bg-slate-50 font-normal">
                    <th className="py-1 px-2.5 border-r border-slate-300"></th>
                    <th className="py-1 px-2 border-r border-slate-300">
                      Scale factor
                    </th>
                    <th className="py-1 px-2 border-r border-slate-300">
                      Scale factor
                    </th>
                    <th className="py-1 px-2 border-r border-slate-300">
                      Scale factor
                    </th>
                    <th className="py-1 px-2 border-r border-slate-300">
                      Scale factor
                    </th>
                    <th className="py-1 px-2">Scale factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPositiveRows.map(row => {
                    const isHighlighted = highlightScore === row.rawScore;
                    return (
                      <tr
                        key={row.rawScore}
                        onMouseEnter={() => !isEditing && setHighlightScore(row.rawScore)}
                        onMouseLeave={() => !isEditing && setHighlightScore(null)}
                        className={`transition-colors ${
                          isHighlighted
                            ? 'bg-emerald-50 text-emerald-950 font-bold'
                            : row.rawScore % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50/50'
                        } hover:bg-emerald-50/70`}
                      >
                        <td className="py-1.5 px-3 border-r border-slate-300 text-left font-bold text-slate-800">
                          {row.rawScore}
                        </td>
                        {(['p5', 'p4', 'p3', 'p2', 'p1'] as const).map(pKey => (
                          <td
                            key={pKey}
                            className={`py-1 px-1.5 text-slate-800 ${
                              pKey !== 'p1' ? 'border-r border-slate-300' : ''
                            }`}
                          >
                            {isEditing ? (
                              <input
                                type="text"
                                value={row[pKey]}
                                onChange={e =>
                                  handlePositiveCellChange(row.rawScore, pKey, e.target.value)
                                }
                                className="w-full text-center font-mono text-xs bg-white border border-slate-300 rounded px-1 py-0.5 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                              />
                            ) : (
                              row[pKey]
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Negative Scoring Lookup Table */}
        {(activeTab === 'BOTH' || activeTab === 'NEGATIVE') && (
          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs bg-white flex flex-col">
            <div className="bg-rose-50/80 border-b border-slate-300 px-4 py-2 flex items-center justify-between">
              <div className="font-bold text-xs text-slate-900 font-serif">
                Negative Scoring Lookup
              </div>
              <span className="text-[10px] font-mono text-rose-700 font-semibold px-2 py-0.5 bg-rose-100/60 rounded">
                - Scale Factor {isEditing && '(Editable)'}
              </span>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-center text-xs border-collapse font-mono">
                <thead className="sticky top-0 z-10 bg-slate-100 text-slate-900 shadow-2xs">
                  <tr className="border-b border-slate-300 font-bold">
                    <th className="py-2 px-2.5 border-r border-slate-300 text-left font-sans text-slate-900 w-16">
                      Raw Score
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300 font-sans">
                      Priority 5
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300 font-sans">
                      Priority 4
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300 font-sans">
                      Priority 3
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300 font-sans">
                      Priority 2
                    </th>
                    <th className="py-2 px-2 font-sans">Priority 1</th>
                  </tr>
                  <tr className="border-b border-slate-300 text-[10px] text-slate-600 bg-slate-50 font-normal">
                    <th className="py-1 px-2.5 border-r border-slate-300"></th>
                    <th className="py-1 px-2 border-r border-slate-300">
                      Scale factor
                    </th>
                    <th className="py-1 px-2 border-r border-slate-300">
                      Scale factor
                    </th>
                    <th className="py-1 px-2 border-r border-slate-300">
                      Scale factor
                    </th>
                    <th className="py-1 px-2 border-r border-slate-300">
                      Scale factor
                    </th>
                    <th className="py-1 px-2">Scale factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredNegativeRows.map(row => {
                    const isHighlighted = highlightScore === row.rawScore;
                    return (
                      <tr
                        key={row.rawScore}
                        onMouseEnter={() => !isEditing && setHighlightScore(row.rawScore)}
                        onMouseLeave={() => !isEditing && setHighlightScore(null)}
                        className={`transition-colors ${
                          isHighlighted
                            ? 'bg-rose-50 text-rose-950 font-bold'
                            : row.rawScore % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50/50'
                        } hover:bg-rose-50/70`}
                      >
                        <td className="py-1.5 px-3 border-r border-slate-300 text-left font-bold text-slate-800">
                          {row.rawScore}
                        </td>
                        {(['p5', 'p4', 'p3', 'p2', 'p1'] as const).map(pKey => (
                          <td
                            key={pKey}
                            className={`py-1 px-1.5 text-slate-800 ${
                              pKey !== 'p1' ? 'border-r border-slate-300' : ''
                            }`}
                          >
                            {isEditing ? (
                              <input
                                type="text"
                                value={row[pKey]}
                                onChange={e =>
                                  handleNegativeCellChange(row.rawScore, pKey, e.target.value)
                                }
                                className="w-full text-center font-mono text-xs bg-white border border-slate-300 rounded px-1 py-0.5 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                              />
                            ) : (
                              row[pKey]
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 pt-1">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Editable lookup table across 31 raw score levels (0 through 30) for Priority 1 to Priority 5.</span>
        </div>
        <div className="font-mono text-[10px] text-slate-400">
          Persistent Storage Enabled
        </div>
      </div>
    </div>
  );
};
