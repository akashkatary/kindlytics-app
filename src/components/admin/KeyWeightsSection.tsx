import React, { useState, useMemo } from 'react';
import { Layers, RotateCcw, Check, Edit3, Eye, ShieldCheck, Save } from 'lucide-react';

export interface CompositeWeightItem {
  id: string;
  key: string;
  name: string;
  weight: number;
}

export interface SummaryWeightGroup {
  id: string;
  key: string;
  name: string;
  weight: number;
  compositeBehaviours: CompositeWeightItem[];
}

export interface KeyCharacteristicGroup {
  id: string;
  key: string;
  name: string;
  summaryCharacteristics: SummaryWeightGroup[];
}

export const INITIAL_KEY_WEIGHTS: KeyCharacteristicGroup[] = [
  {
    id: 'kc-1',
    key: 'KC1',
    name: 'Strategic Alignment',
    summaryCharacteristics: [
      {
        id: 'sc-1',
        key: 'SC1',
        name: 'Direction & Drive',
        weight: 0.6,
        compositeBehaviours: [
          { id: 'cb-1', key: 'CB1', name: 'Vision', weight: 0.4 },
          { id: 'cb-2', key: 'CB2', name: 'Influence', weight: 0.3 },
          { id: 'cb-3', key: 'CB3', name: 'Decisiveness', weight: 0.3 },
        ],
      },
      {
        id: 'sc-2',
        key: 'SC2',
        name: 'Analysis & Judgment',
        weight: 0.4,
        compositeBehaviours: [
          { id: 'cb-4', key: 'CB4', name: 'Understanding', weight: 0.4 },
          { id: 'cb-5', key: 'CB5', name: 'Process & Evidence', weight: 0.2 },
          { id: 'cb-6', key: 'CB6', name: 'Reasoning', weight: 0.4 },
        ],
      },
    ],
  },
  {
    id: 'kc-2',
    key: 'KC2',
    name: 'People Intelligence',
    summaryCharacteristics: [
      {
        id: 'sc-3',
        key: 'SC3',
        name: 'Communication & Relationship',
        weight: 0.5,
        compositeBehaviours: [
          { id: 'cb-7', key: 'CB7', name: 'Openness', weight: 0.2 },
          { id: 'cb-8', key: 'CB8', name: 'Listening', weight: 0.4 },
          { id: 'cb-9', key: 'CB9', name: 'Articulation', weight: 0.4 },
        ],
      },
      {
        id: 'sc-4',
        key: 'SC4',
        name: 'Rapport & Collaboration',
        weight: 0.5,
        compositeBehaviours: [
          { id: 'cb-10', key: 'CB10', name: 'Self-Awareness', weight: 0.33 },
          { id: 'cb-11', key: 'CB11', name: 'Empathy', weight: 0.33 },
          { id: 'cb-12', key: 'CB12', name: 'Collaborative Trust', weight: 0.33 },
        ],
      },
    ],
  },
  {
    id: 'kc-3',
    key: 'KC3',
    name: 'Solutions Delivery',
    summaryCharacteristics: [
      {
        id: 'sc-5',
        key: 'SC5',
        name: 'Innovation & Agility',
        weight: 0.4,
        compositeBehaviours: [
          { id: 'cb-13', key: 'CB13', name: 'Problem-solving', weight: 0.5 },
          { id: 'cb-14', key: 'CB14', name: 'Adaptability', weight: 0.25 },
          { id: 'cb-15', key: 'CB15', name: 'Creativity', weight: 0.25 },
        ],
      },
      {
        id: 'sc-6',
        key: 'SC6',
        name: 'Diligence & Execution',
        weight: 0.6,
        compositeBehaviours: [
          { id: 'cb-16', key: 'CB16', name: 'Initiative', weight: 0.3 },
          { id: 'cb-17', key: 'CB17', name: 'Completion', weight: 0.5 },
          { id: 'cb-18', key: 'CB18', name: 'Quality', weight: 0.2 },
        ],
      },
    ],
  },
];

const DEFAULT_KEYS_MAP: Record<string, string> = {
  'kc-1': 'KC1',
  'kc-2': 'KC2',
  'kc-3': 'KC3',
  'sc-1': 'SC1',
  'sc-2': 'SC2',
  'sc-3': 'SC3',
  'sc-4': 'SC4',
  'sc-5': 'SC5',
  'sc-6': 'SC6',
  'cb-1': 'CB1',
  'cb-2': 'CB2',
  'cb-3': 'CB3',
  'cb-4': 'CB4',
  'cb-5': 'CB5',
  'cb-6': 'CB6',
  'cb-7': 'CB7',
  'cb-8': 'CB8',
  'cb-9': 'CB9',
  'cb-10': 'CB10',
  'cb-11': 'CB11',
  'cb-12': 'CB12',
  'cb-13': 'CB13',
  'cb-14': 'CB14',
  'cb-15': 'CB15',
  'cb-16': 'CB16',
  'cb-17': 'CB17',
  'cb-18': 'CB18',
};

const DEFAULT_KC_NAMES: Record<string, string> = {
  'kc-1': 'Strategic Alignment',
  'kc-2': 'People Intelligence',
  'kc-3': 'Solutions Delivery',
};

const DEFAULT_SC_NAMES: Record<string, string> = {
  'sc-1': 'Direction & Drive',
  'sc-2': 'Analysis & Judgment',
  'sc-3': 'Communication & Relationship',
  'sc-4': 'Rapport & Collaboration',
  'sc-5': 'Innovation & Agility',
  'sc-6': 'Diligence & Execution',
};

export const DEFAULT_CB_NAMES: Record<string, string> = {
  'cb-1': 'Vision',
  'cb-2': 'Influence',
  'cb-3': 'Decisiveness',
  'cb-4': 'Understanding',
  'cb-5': 'Process & Evidence',
  'cb-6': 'Reasoning',
  'cb-7': 'Openness',
  'cb-8': 'Listening',
  'cb-9': 'Articulation',
  'cb-10': 'Self-Awareness',
  'cb-11': 'Empathy',
  'cb-12': 'Collaborative Trust',
  'cb-13': 'Problem-solving',
  'cb-14': 'Adaptability',
  'cb-15': 'Creativity',
  'cb-16': 'Initiative',
  'cb-17': 'Completion',
  'cb-18': 'Quality',
};

export const getHierarchyCbLabels = (): Record<string, string> => {
  const result: Record<string, string> = { ...DEFAULT_CB_NAMES };
  try {
    const saved = localStorage.getItem('kindlytics_key_weights');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach((kc: any) => {
          (kc.summaryCharacteristics || []).forEach((sc: any) => {
            (sc.compositeBehaviours || []).forEach((cb: any) => {
              if (cb.id && cb.name) {
                result[cb.id] = cb.name;
              }
              if (cb.key && cb.name) {
                result[cb.key] = cb.name;
              }
            });
          });
        });
      }
    }
  } catch {
    // ignore
  }
  return result;
};

const getInitialKeyWeights = (): KeyCharacteristicGroup[] => {
  const saved = localStorage.getItem('kindlytics_key_weights');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Upgrade saved configuration with default keys and canonical names if missing
        return parsed.map((kc: KeyCharacteristicGroup, kcIdx: number) => ({
          ...kc,
          key: DEFAULT_KEYS_MAP[kc.id] || `KC${kcIdx + 1}`,
          name: kc.name || DEFAULT_KC_NAMES[kc.id] || `Key Characteristic ${kcIdx + 1}`,
          summaryCharacteristics: (kc.summaryCharacteristics || []).map((sc, scIdx) => ({
            ...sc,
            key: DEFAULT_KEYS_MAP[sc.id] || `SC${scIdx + 1}`,
            name: sc.name || DEFAULT_SC_NAMES[sc.id] || `Summary Characteristic ${scIdx + 1}`,
            compositeBehaviours: (sc.compositeBehaviours || []).map((cb, cbIdx) => ({
              ...cb,
              key: DEFAULT_KEYS_MAP[cb.id] || `CB${cbIdx + 1}`,
              name: cb.name || DEFAULT_CB_NAMES[cb.id] || `Composite Behaviour ${cbIdx + 1}`,
            })),
          })),
        }));
      }
    } catch {
      return INITIAL_KEY_WEIGHTS;
    }
  }
  return INITIAL_KEY_WEIGHTS;
};

export const KeyWeightsSection: React.FC = () => {
  const [data, setData] = useState<KeyCharacteristicGroup[]>(getInitialKeyWeights);
  const [lastSavedData, setLastSavedData] = useState<KeyCharacteristicGroup[]>(getInitialKeyWeights);

  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const isDirty = useMemo(() => {
    return JSON.stringify(data) !== JSON.stringify(lastSavedData);
  }, [data, lastSavedData]);

  // Handlers for editing Level 1 (Key Characteristic)
  const handleKcNameChange = (kcId: string, newName: string) => {
    setData(prev =>
      prev.map(kc => (kc.id === kcId ? { ...kc, name: newName } : kc))
    );
  };

  // Handlers for editing Level 2 (Summary Characteristic)
  const handleScNameChange = (kcId: string, scId: string, newName: string) => {
    setData(prev =>
      prev.map(kc => {
        if (kc.id !== kcId) return kc;
        return {
          ...kc,
          summaryCharacteristics: kc.summaryCharacteristics.map(sc =>
            sc.id === scId ? { ...sc, name: newName } : sc
          ),
        };
      })
    );
  };

  const handleSummaryWeightChange = (
    kcId: string,
    scId: string,
    newWeight: number
  ) => {
    setData(prev =>
      prev.map(kc => {
        if (kc.id !== kcId) return kc;
        return {
          ...kc,
          summaryCharacteristics: kc.summaryCharacteristics.map(sc => {
            if (sc.id !== scId) return sc;
            return { ...sc, weight: newWeight };
          }),
        };
      })
    );
  };

  // Handlers for editing Level 3 (Composite Behaviour)
  const handleCbNameChange = (
    kcId: string,
    scId: string,
    cbId: string,
    newName: string
  ) => {
    setData(prev =>
      prev.map(kc => {
        if (kc.id !== kcId) return kc;
        return {
          ...kc,
          summaryCharacteristics: kc.summaryCharacteristics.map(sc => {
            if (sc.id !== scId) return sc;
            return {
              ...sc,
              compositeBehaviours: sc.compositeBehaviours.map(cb =>
                cb.id === cbId ? { ...cb, name: newName } : cb
              ),
            };
          }),
        };
      })
    );
  };

  const handleCompositeWeightChange = (
    kcId: string,
    scId: string,
    cbId: string,
    newWeight: number
  ) => {
    setData(prev =>
      prev.map(kc => {
        if (kc.id !== kcId) return kc;
        return {
          ...kc,
          summaryCharacteristics: kc.summaryCharacteristics.map(sc => {
            if (sc.id !== scId) return sc;
            return {
              ...sc,
              compositeBehaviours: sc.compositeBehaviours.map(cb => {
                if (cb.id !== cbId) return cb;
                return { ...cb, weight: newWeight };
              }),
            };
          }),
        };
      })
    );
  };

  const handleSave = () => {
    localStorage.setItem('kindlytics_key_weights', JSON.stringify(data));
    setLastSavedData(data);
    setIsEditing(false);
    setSavedSuccess(true);
    window.dispatchEvent(new Event('kindlytics_hierarchy_updated'));
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleReset = () => {
    setData(INITIAL_KEY_WEIGHTS);
    setLastSavedData(INITIAL_KEY_WEIGHTS);
    localStorage.removeItem('kindlytics_key_weights');
    setIsEditing(false);
    window.dispatchEvent(new Event('kindlytics_hierarchy_updated'));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="font-serif font-bold text-lg text-slate-900">
              Kindlytics Hierarchy Table
            </h2>
            <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-md border ${
              isEditing
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-teal-50 text-teal-800 border-teal-200'
            }`}>
              {isEditing ? 'Editing Mode' : 'Formatted View'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Hierarchical mapping and weight calibration across Level 1 (KC = Key Characteristic), Level 2 (SC = Summary Characteristic), and Level 3 (CB = Composite Behaviour).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
              isEditing
                ? 'border-slate-300 text-slate-700 hover:bg-slate-50'
                : 'border-teal-300 text-teal-800 bg-teal-50 hover:bg-teal-100 font-semibold'
            }`}
          >
            {isEditing ? (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Formatted View</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                <span>Edit Table</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition"
            title="Reset to default taxonomy keys, names, and weights"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          {isEditing && isDirty && (
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-xs transition animate-in fade-in duration-150"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Edits</span>
            </button>
          )}
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in duration-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Hierarchy table edits saved to local configuration successfully.</span>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-900 border-b border-slate-300 font-semibold">
              <th className="py-2.5 px-4 border-r border-slate-300 w-1/4 font-serif">
                Level 1: Key Characteristic (KC)
              </th>
              <th className="py-2.5 px-4 border-r border-slate-300 w-1/3 font-serif">
                Level 2: Summary Characteristic (SC)
              </th>
              <th className="py-2.5 px-4 border-r border-slate-300 w-1/3 font-serif">
                Level 3: Composite Behaviour (CB)
              </th>
              <th className="py-2.5 px-4 text-right w-28 font-serif">
                Weight
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map(kc => {
              return (
                <React.Fragment key={kc.id}>
                  {kc.summaryCharacteristics.map((sc, scIdx) => (
                    <React.Fragment key={sc.id}>
                      {/* Summary Characteristic Header Row */}
                      <tr className="bg-slate-50/80 hover:bg-slate-100/60 transition-colors border-t border-slate-300">
                        {scIdx === 0 && (
                          <td
                            rowSpan={
                              kc.summaryCharacteristics.reduce(
                                (acc, s) => acc + 1 + s.compositeBehaviours.length,
                                0
                              )
                            }
                            className="py-3 px-4 font-bold text-slate-900 align-top border-r border-slate-300 bg-white"
                          >
                            <div className="sticky top-20 space-y-2">
                              {isEditing ? (
                                <div className="space-y-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-mono font-bold text-xs bg-teal-100 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
                                      {kc.key}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">(Key)</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-0.5">Label:</span>
                                    <input
                                      type="text"
                                      value={kc.name}
                                      onChange={e => handleKcNameChange(kc.id, e.target.value)}
                                      className="w-full font-serif font-bold text-xs bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                      placeholder={DEFAULT_KC_NAMES[kc.id] || "Strategic Alignment"}
                                      title="Key Characteristic Label"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-mono font-bold text-xs bg-teal-100 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
                                      {kc.key}
                                    </span>
                                    <span className="text-slate-400 font-bold">=</span>
                                  </div>
                                  <div className="font-serif font-bold text-sm text-slate-900">
                                    “{kc.name}”
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        )}
                        <td
                          colSpan={2}
                          className="py-2.5 px-4 border-r border-slate-300"
                        >
                          {isEditing ? (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <div className="flex items-center space-x-1.5 shrink-0">
                                <span className="font-mono font-bold text-xs bg-indigo-50 border border-indigo-200 text-indigo-800 px-2 py-0.5 rounded">
                                  {sc.key}
                                </span>
                              </div>
                              <div className="flex-1 flex items-center space-x-1.5 min-w-0">
                                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase shrink-0">Label:</span>
                                <input
                                  type="text"
                                  value={sc.name}
                                  onChange={e => handleScNameChange(kc.id, sc.id, e.target.value)}
                                  className="w-full font-bold text-xs bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 focus:outline-none focus:border-teal-500"
                                  placeholder={DEFAULT_SC_NAMES[sc.id] || "Direction & Drive"}
                                  title="Summary Characteristic Label"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-xs bg-indigo-50 border border-indigo-200 text-indigo-800 px-2 py-0.5 rounded">
                                {sc.key}
                              </span>
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                = “{sc.name}”
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="1"
                              value={sc.weight}
                              onChange={e =>
                                handleSummaryWeightChange(
                                  kc.id,
                                  sc.id,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-20 text-right font-mono font-bold text-xs bg-white border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-teal-500"
                              title="Summary Characteristic Weight"
                            />
                          ) : (
                            sc.weight.toFixed(2)
                          )}
                        </td>
                      </tr>

                      {/* Composite Behaviour Rows under this Summary Characteristic */}
                      {sc.compositeBehaviours.map(cb => (
                        <tr
                          key={cb.id}
                          className="hover:bg-teal-50/20 transition-colors"
                        >
                          <td className="py-2 px-4 border-r border-slate-300"></td>
                          <td className="py-2 px-4 border-r border-slate-300">
                            {isEditing ? (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 pl-2">
                                <div className="flex items-center space-x-1.5 shrink-0">
                                  <span className="font-mono text-xs bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">
                                    {cb.key}
                                  </span>
                                </div>
                                <div className="flex-1 flex items-center space-x-1.5 min-w-0">
                                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase shrink-0">Label:</span>
                                  <input
                                    type="text"
                                    value={cb.name || DEFAULT_CB_NAMES[cb.id] || ''}
                                    onChange={e => handleCbNameChange(kc.id, sc.id, cb.id, e.target.value)}
                                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                    placeholder={DEFAULT_CB_NAMES[cb.id] || "Composite Behaviour"}
                                    title="Composite Behaviour Label"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2 pl-2">
                                <span className="font-mono text-xs bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                                  {cb.key}
                                </span>
                                <span className="text-slate-800 text-xs">
                                  = “{cb.name || DEFAULT_CB_NAMES[cb.id]}”
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-4 text-right font-mono text-slate-700">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                value={cb.weight}
                                onChange={e =>
                                  handleCompositeWeightChange(
                                    kc.id,
                                    sc.id,
                                    cb.id,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-20 text-right font-mono text-xs bg-white border border-slate-300 rounded px-2 py-1 focus:outline-none focus:border-teal-500"
                                title="Composite Behaviour Weight"
                              />
                            ) : (
                              cb.weight.toFixed(2)
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 pt-1">
        <div className="flex items-center space-x-4">
          <span className="font-medium text-slate-700">• Key Conventions: KC = Key Characteristic, SC = Summary Characteristic, CB = Composite Behaviour</span>
          <span>• Level 2 weights sum to 1.00 per Key Characteristic</span>
          <span>• Level 3 weights sum to 1.00 per Summary Characteristic</span>
        </div>
        <div className="font-mono text-[10px] text-slate-400">
          Kindlytics Leadership Taxonomy Hierarchy
        </div>
      </div>
    </div>
  );
};

