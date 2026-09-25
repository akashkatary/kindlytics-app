import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Question, CbPriorities, Orientation } from '../../types';
import {
  Search,
  RotateCcw,
  Edit2,
  X,
  AlertCircle,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Table as TableIcon,
  CheckCircle2,
  XCircle,
  Filter,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  SC_GROUPS,
  CB_PRIORITY_COLUMNS,
  getQuestionCbPriorities,
} from '../../data/questions';
import { getHierarchyCbLabels } from './KeyWeightsSection';

export interface QuestionBankProps {
  embedded?: boolean;
}

export const QuestionBank: React.FC<QuestionBankProps> = ({ embedded = false }) => {
  const { questions, updateQuestion } = useApp();

  // Synchronize composite behaviour labels with Configuration Page Hierarchy Table
  const [cbLabels, setCbLabels] = useState<Record<string, string>>(getHierarchyCbLabels);

  useEffect(() => {
    const refreshLabels = () => {
      setCbLabels(getHierarchyCbLabels());
    };
    window.addEventListener('storage', refreshLabels);
    window.addEventListener('kindlytics_hierarchy_updated', refreshLabels);
    return () => {
      window.removeEventListener('storage', refreshLabels);
      window.removeEventListener('kindlytics_hierarchy_updated', refreshLabels);
    };
  }, []);

  const getCbLabel = (col: { cbId: string; name: string; label?: string }) => {
    return cbLabels[col.cbId] || cbLabels[col.label || ''] || col.name;
  };

  // Responsive View Mode: Default to 'cards' (Mobile-centric zero-horizontal-scroll layout)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    try {
      const saved = localStorage.getItem('kindlytics_qb_view_mode');
      if (saved === 'cards' || saved === 'table') return saved;
    } catch (e) {
      // Ignore
    }
    return 'cards';
  });

  // Persist viewMode changes
  const handleViewModeChange = (mode: 'cards' | 'table') => {
    setViewMode(mode);
    try {
      localStorage.setItem('kindlytics_qb_view_mode', mode);
    } catch (e) {
      // Ignore
    }
  };


  // Mobile card expansion state for 18 priorities (Default false so priorities start in a collapsed state)
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [expandAllMobile, setExpandAllMobile] = useState<boolean>(false);

  // Mobile filter drawer / accordion state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filters aligned with the table fields
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOrientation, setFilterOrientation] = useState<'ALL' | 'POSITIVE' | 'NEGATIVE'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [filterScGroup, setFilterScGroup] = useState<string>('ALL');
  const [filterDimension, setFilterDimension] = useState<string>('ALL');
  const [filterPriorityValue, setFilterPriorityValue] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

  // Edit Modal State
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Listen to screen resize to adjust default view mode if needed
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && viewMode === 'table') {
        setViewMode('cards');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // Helper to determine display orientation
  const getQuestionOrientation = (q: Question): 'Positive' | 'Negative' => {
    if (q.orientation === 'NEGATIVE' || q.positiveResponse === 'NO') {
      return 'Negative';
    }
    return 'Positive';
  };

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (!q) return false;

      const qName = q.questionName || `Ques${q.sequence}`;
      const orientation = getQuestionOrientation(q);

      // 1. Search Query (Matches Question name like Ques1, ID like Q001, or text)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = qName.toLowerCase().includes(query);
        const matchesId = q.questionId.toLowerCase().includes(query);
        const matchesSeq = `ques${q.sequence}`.includes(query);
        const matchesSelf = q.selfQuestionText?.toLowerCase().includes(query) ?? false;
        const matchesPeer = q.peerQuestionText?.toLowerCase().includes(query) ?? false;
        if (!matchesName && !matchesId && !matchesSeq && !matchesSelf && !matchesPeer) {
          return false;
        }
      }

      // 2. Orientation Filter (Positive / Negative)
      if (filterOrientation === 'POSITIVE' && orientation !== 'Positive') return false;
      if (filterOrientation === 'NEGATIVE' && orientation !== 'Negative') return false;

      // 3. Status Filter (Active / Inactive)
      if (filterStatus === 'ACTIVE' && !q.active) return false;
      if (filterStatus === 'INACTIVE' && q.active) return false;

      // 4. Summary Characteristic (Group) Filter
      if (filterScGroup !== 'ALL') {
        const group = SC_GROUPS.find(g => g.id === filterScGroup || g.name === filterScGroup);
        if (group && q.summaryCharacteristicId !== group.id && q.summaryCharacteristicName !== group.name) {
          return false;
        }
      }

      // 5. Priority Dimension and Value Filter
      const qPriorities = q.cbPriorities || getQuestionCbPriorities(q.sequence, q.priority, q.compositeBehaviourId);
      if (filterPriorityValue !== 'ALL') {
        const targetVal = parseInt(filterPriorityValue, 10);
        if (filterDimension !== 'ALL') {
          const colDef = CB_PRIORITY_COLUMNS.find(c => c.key === filterDimension);
          if (colDef) {
            const val = qPriorities[colDef.key];
            if (val !== targetVal) return false;
          }
        } else {
          // Check if targetVal is present in any dimension
          const hasVal = Object.values(qPriorities).some(v => v === targetVal);
          if (!hasVal) return false;
        }
      } else if (filterDimension !== 'ALL') {
        // Dimension filter without specific value check is a pass-through
      }

      return true;
    });
  }, [
    questions,
    searchQuery,
    filterOrientation,
    filterStatus,
    filterScGroup,
    filterDimension,
    filterPriorityValue,
  ]);

  // Pagination calculation
  const totalPages = itemsPerPage === -1 ? 1 : Math.max(1, Math.ceil(filteredQuestions.length / itemsPerPage));
  const displayedQuestions = useMemo(() => {
    if (itemsPerPage === -1) return filteredQuestions;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredQuestions.slice(start, start + itemsPerPage);
  }, [filteredQuestions, currentPage, itemsPerPage]);

  // Counts for summary metrics
  const totalCount = questions.length;
  const positiveCount = useMemo(
    () => questions.filter(q => q && getQuestionOrientation(q) === 'Positive').length,
    [questions]
  );
  const negativeCount = useMemo(
    () => questions.filter(q => q && getQuestionOrientation(q) === 'Negative').length,
    [questions]
  );
  const activeCount = useMemo(() => questions.filter(q => q && q.active).length, [questions]);
  const inactiveCount = useMemo(() => questions.filter(q => q && !q.active).length, [questions]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterOrientation('ALL');
    setFilterStatus('ALL');
    setFilterScGroup('ALL');
    setFilterDimension('ALL');
    setFilterPriorityValue('ALL');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    filterOrientation !== 'ALL' ||
    filterStatus !== 'ALL' ||
    filterScGroup !== 'ALL' ||
    filterDimension !== 'ALL' ||
    filterPriorityValue !== 'ALL';

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (filterOrientation !== 'ALL') count++;
    if (filterStatus !== 'ALL') count++;
    if (filterScGroup !== 'ALL') count++;
    if (filterDimension !== 'ALL') count++;
    if (filterPriorityValue !== 'ALL') count++;
    return count;
  }, [searchQuery, filterOrientation, filterStatus, filterScGroup, filterDimension, filterPriorityValue]);

  // Toggle single card expanded state
  const toggleCardExpanded = (id: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Toggle all cards expanded state on mobile
  const toggleExpandAll = () => {
    const nextState = !expandAllMobile;
    setExpandAllMobile(nextState);
    const updated: Record<string, boolean> = {};
    displayedQuestions.forEach(q => {
      updated[q.questionId] = nextState;
    });
    setExpandedCards(updated);
  };

  // Save question handler
  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    updateQuestion(editingQuestion.questionId, {
      questionName: editingQuestion.questionName,
      orientation: editingQuestion.orientation,
      positiveResponse: editingQuestion.orientation === 'POSITIVE' ? 'YES' : 'NO',
      active: editingQuestion.active,
      selfQuestionText: editingQuestion.selfQuestionText,
      peerQuestionText: editingQuestion.peerQuestionText,
      cbPriorities: editingQuestion.cbPriorities,
    });
    setEditingQuestion(null);
  };

  const handlePriorityChange = (key: keyof CbPriorities, value: number) => {
    if (!editingQuestion) return;
    const currentPriorities =
      editingQuestion.cbPriorities ||
      getQuestionCbPriorities(
        editingQuestion.sequence,
        editingQuestion.priority,
        editingQuestion.compositeBehaviourId
      );

    setEditingQuestion({
      ...editingQuestion,
      cbPriorities: {
        ...currentPriorities,
        [key]: Math.max(1, Math.min(5, value)),
      },
    });
  };

  return (
    <div
      className={
        embedded
          ? 'w-full space-y-4 sm:space-y-6 overflow-x-hidden'
          : 'w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6 overflow-x-hidden'
      }
    >
      {/* Top Header & Mobile/Desktop View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-teal-700 font-mono">
            Diagnostic Taxonomy Core
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
            Question Bank Master Repository
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Diagnostic matrix mapping question statements, orientation, status, and 18 composite priorities.
          </p>
        </div>

        {/* View Mode Toggle Button */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => handleViewModeChange('cards')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition min-h-[38px] ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Mobile-optimized card layout with zero horizontal scrolling"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-teal-700" />
              <span>Mobile Cards</span>
            </button>
            <button
              onClick={() => handleViewModeChange('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition min-h-[38px] ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Full spreadsheet matrix table (horizontally scrollable on small screens)"
            >
              <TableIcon className="w-3.5 h-3.5 text-teal-700" />
              <span>Full Matrix Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Metrics Bar - Responsive wrap with zero horizontal overflow */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
        <div className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-800 text-center sm:text-left">
          Total: <strong>{totalCount}</strong>
        </div>
        <div className="bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-lg text-sky-900 text-center sm:text-left">
          Positive: <strong>{positiveCount}</strong>
        </div>
        <div className="bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg text-rose-900 text-center sm:text-left">
          Negative: <strong>{negativeCount}</strong>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-900 text-center sm:text-left">
          Active: <strong>{activeCount}</strong>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-amber-900 text-center sm:text-left">
          Inactive: <strong>{inactiveCount}</strong>
        </div>
      </div>

      {/* MOBILE-CENTRIC FILTER SYSTEM (100% width, No horizontal overflow) */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3">
        {/* Search Bar + Mobile Filter Trigger */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search question (e.g. Ques1, Q001), statement text..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 min-h-[44px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mobile Filter Toggle Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition min-h-[44px] ${
                mobileFiltersOpen || activeFiltersCount > 0
                  ? 'bg-teal-50 border-teal-300 text-teal-800'
                  : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-teal-700" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-teal-700 text-white font-bold">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${mobileFiltersOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center justify-center space-x-1 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition min-h-[44px]"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Tap Filter Chips (Essential Filters) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-[11px] text-slate-400 font-medium mr-1 hidden sm:inline">Quick Filters:</span>
          <button
            onClick={() => {
              setFilterOrientation('ALL');
              setFilterStatus('ALL');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-full text-xs transition border min-h-[30px] ${
              filterOrientation === 'ALL' && filterStatus === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 font-medium'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            All Questions ({questions.length})
          </button>
          <button
            onClick={() => {
              setFilterOrientation(filterOrientation === 'POSITIVE' ? 'ALL' : 'POSITIVE');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-full text-xs transition border min-h-[30px] ${
              filterOrientation === 'POSITIVE'
                ? 'bg-sky-700 text-white border-sky-700 font-medium'
                : 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
            }`}
          >
            ✓ Positive ({positiveCount})
          </button>
          <button
            onClick={() => {
              setFilterOrientation(filterOrientation === 'NEGATIVE' ? 'ALL' : 'NEGATIVE');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-full text-xs transition border min-h-[30px] ${
              filterOrientation === 'NEGATIVE'
                ? 'bg-rose-700 text-white border-rose-700 font-medium'
                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
            }`}
          >
            ✕ Negative ({negativeCount})
          </button>
          <button
            onClick={() => {
              setFilterStatus(filterStatus === 'ACTIVE' ? 'ALL' : 'ACTIVE');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-full text-xs transition border min-h-[30px] ${
              filterStatus === 'ACTIVE'
                ? 'bg-emerald-700 text-white border-emerald-700 font-medium'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            ● Active ({activeCount})
          </button>
          <button
            onClick={() => {
              setFilterStatus(filterStatus === 'INACTIVE' ? 'ALL' : 'INACTIVE');
              setCurrentPage(1);
            }}
            className={`px-2.5 py-1 rounded-full text-xs transition border min-h-[30px] ${
              filterStatus === 'INACTIVE'
                ? 'bg-amber-700 text-white border-amber-700 font-medium'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            ○ Inactive ({inactiveCount})
          </button>
        </div>

        {/* Detailed Dropdowns (Collapsible on Mobile or always visible on desktop if toggled) */}
        {(mobileFiltersOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs animate-in fade-in duration-200">
            {/* 1. Summary Characteristic (Group) Filter */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Domain / Characteristic
              </label>
              <select
                value={filterScGroup}
                onChange={e => {
                  setFilterScGroup(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-teal-600 min-h-[40px] bg-white"
              >
                <option value="ALL">All 6 Domains</option>
                {SC_GROUPS.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Priority Dimension Filter */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Priority Dimension
              </label>
              <select
                value={filterDimension}
                onChange={e => {
                  setFilterDimension(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-teal-600 min-h-[40px] bg-white"
              >
                <option value="ALL">All 18 Dimensions</option>
                {CB_PRIORITY_COLUMNS.map(col => {
                  const label = getCbLabel(col);
                  return (
                    <option key={col.key} value={col.key}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 3. Priority Value Filter */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Priority Weight
              </label>
              <select
                value={filterPriorityValue}
                onChange={e => {
                  setFilterPriorityValue(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-teal-600 min-h-[40px] bg-white"
              >
                <option value="ALL">All Priority Weights (1–5)</option>
                <option value="5">Weight = 5 (Highest)</option>
                <option value="4">Weight = 4</option>
                <option value="3">Weight = 3</option>
                <option value="2">Weight = 2</option>
                <option value="1">Weight = 1</option>
              </select>
            </div>

            {/* 4. Rows per Page */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Rows per Page
              </label>
              <select
                value={itemsPerPage}
                onChange={e => {
                  setItemsPerPage(parseInt(e.target.value, 10));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-teal-600 min-h-[40px] bg-white"
              >
                <option value={15}>15 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
                <option value={-1}>All (150)</option>
              </select>
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Showing <strong>{filteredQuestions.length}</strong> questions
            {hasActiveFilters && <span className="text-teal-700 font-medium ml-1">(filtered)</span>}
          </div>

          {viewMode === 'cards' && (
            <button
              onClick={toggleExpandAll}
              className="text-[11px] font-medium text-teal-700 hover:text-teal-900 flex items-center space-x-1"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{expandAllMobile ? 'Collapse All Weights' : 'Expand All 18 Weights'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* VIEW 1: MOBILE-CENTRIC CARD LIST (ZERO HORIZONTAL SCROLL)           */}
      {/* ==================================================================== */}
      {viewMode === 'cards' && (
        <div className="w-full space-y-3.5">
          {displayedQuestions.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3 shadow-xs">
              <AlertCircle className="w-7 h-7 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-800 text-sm">No matching questions found</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                No questions match your current search and filter selections.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition min-h-[44px]"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            displayedQuestions.map(q => {
              const qName = q.questionName || `Ques${q.sequence}`;
              const orientation = getQuestionOrientation(q);
              const priorities =
                q.cbPriorities ||
                getQuestionCbPriorities(q.sequence, q.priority, q.compositeBehaviourId);
              const isExpanded = expandedCards[q.questionId] ?? expandAllMobile;

              // 1.1 Direction & Drive is the standard first set of SC's across all questions
              const directionDriveGroup = SC_GROUPS.find(g => g.id === 'sc-1') || SC_GROUPS[0];
              const isAssignedDirectionDrive =
                q.summaryCharacteristicId === directionDriveGroup.id ||
                q.summaryCharacteristicName === directionDriveGroup.name;

              return (
                <div
                  key={q.questionId}
                  className="w-full bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden transition hover:border-slate-400"
                >
                  {/* Card Header (Full Width, Zero Scroll) */}
                  <div className="p-3 sm:p-4 border-b border-slate-200 bg-slate-50/70">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Question Name */}
                        <span className="font-mono font-bold text-sm bg-slate-900 text-white px-2.5 py-1 rounded-md">
                          {qName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md">
                          {q.questionId} • Ques{q.sequence}
                        </span>

                        {/* Orientation Pill */}
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold border ${
                            orientation === 'Positive'
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {orientation === 'Positive' ? '✓ Positive' : '✕ Negative'}
                        </span>

                        {/* Status Pill */}
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold border ${
                            q.active
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {q.active ? '● Active' : '○ Inactive'}
                        </span>
                      </div>

                      {/* Edit Button with Touch Target */}
                      <button
                        onClick={() => setEditingQuestion({ ...q, cbPriorities: priorities })}
                        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-teal-700 hover:bg-slate-50 transition min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0"
                        title={`Edit ${qName}`}
                        aria-label={`Edit ${qName}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Card Body: 18 Priority Grid (100% width, No Horizontal Scroll) */}
                  <div className="p-3 sm:p-4 space-y-3">
                    {/* 18 PRIORITY MATRIX (Responsive Micro-Grids, Zero Horizontal Scroll) */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-slate-900">
                            18 Composite Priorities
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            (1–5 Weights)
                          </span>
                        </div>
                        <button
                          onClick={() => toggleCardExpanded(q.questionId)}
                          className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center space-x-1 py-1 px-2 rounded-md hover:bg-teal-50 transition min-h-[36px]"
                        >
                          <span>{isExpanded ? 'Collapse' : 'Expand All 18 Weights'}</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                      </div>

                      {/* Display Mode A: When collapsed, show 1.1 Direction & Drive as the standard first set across all questions */}
                      {!isExpanded && (
                        <div className="border border-black rounded-lg overflow-hidden bg-white shadow-2xs">
                          <div
                            style={{ backgroundColor: directionDriveGroup.bgColor }}
                            className="px-3 py-1.5 font-bold text-black text-xs flex items-center justify-between border-b border-black"
                          >
                            <span>{directionDriveGroup.name}</span>
                            {isAssignedDirectionDrive && (
                              <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded">
                                Assigned
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-3 divide-x divide-black text-center">
                            {directionDriveGroup.columns.map(col => {
                              const val = priorities[col.key] ?? 1;
                              const cbLabel = getCbLabel(col);
                              return (
                                <div key={col.key} className="p-2 bg-white flex flex-col items-center justify-between">
                                  <div className="text-[11px] font-bold text-slate-800 text-center leading-tight truncate w-full px-1" title={cbLabel}>
                                    {cbLabel}
                                  </div>
                                  <div className="text-base font-black text-slate-900 my-0.5">
                                    {val}
                                  </div>
                                  <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                                    Weight
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Display Mode B: When expanded, show all 6 Summary Characteristic domains */}
                      {isExpanded && (
                        <div className="space-y-2.5 pt-1">
                          {SC_GROUPS.map(group => {
                            const isParent = group.id === q.summaryCharacteristicId;
                            return (
                              <div
                                key={group.id}
                                className={`border rounded-lg overflow-hidden bg-white ${
                                  isParent ? 'border-black ring-1 ring-black/20' : 'border-slate-300'
                                }`}
                              >
                                <div
                                  style={{ backgroundColor: group.bgColor }}
                                  className="px-3 py-1.5 font-bold text-black text-xs flex items-center justify-between border-b border-black/80"
                                >
                                  <span>{group.name}</span>
                                  {isParent && (
                                    <span className="text-[9px] bg-black text-white px-1.5 py-0.2 rounded uppercase tracking-wider font-mono">
                                      Primary
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-3 divide-x divide-slate-300 text-center">
                                  {group.columns.map(col => {
                                    const val = priorities[col.key] ?? 1;
                                    const cbLabel = getCbLabel(col);
                                    return (
                                      <div
                                        key={col.key}
                                        className={`p-2 flex flex-col items-center justify-between ${
                                          isParent || (group.id === 'sc-1' && q.sequence <= 2)
                                            ? 'bg-slate-50/60'
                                            : 'bg-white'
                                        }`}
                                      >
                                        <div className="text-[11px] font-bold text-slate-800 text-center leading-tight truncate w-full px-1" title={cbLabel}>
                                          {cbLabel}
                                        </div>
                                        <div className="text-base font-black text-slate-900 my-0.5">
                                          {val}
                                        </div>
                                        <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                                          Weight
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 2: FULL MASTER SPREADSHEET TABLE (DESKTOP / EXPLICIT TOGGLE)     */}
      {/* ==================================================================== */}
      {viewMode === 'table' && (
        <div className="border border-black overflow-hidden shadow-xs bg-white">
          <div className="p-2 bg-slate-100 border-b border-black flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Master Diagnostic Grid</span>
            <span className="font-mono text-[11px] text-slate-500">⇄ Horizontally scrollable (21 columns)</span>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-label="Authoritative Diagnostic Question Bank Table"
            className="overflow-x-auto overflow-y-visible scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100 focus:outline-none"
          >
            <table className="min-w-[1520px] w-full border-collapse border border-black text-xs select-none">
              <thead>
                {/* Header Tier 1: Question, Orientation, Status, and 6 Characteristic Groups */}
                <tr className="border-b border-black">
                  <th
                    rowSpan={2}
                    className="sticky left-0 bg-white z-30 border border-black px-4 py-2 text-center font-bold text-black shadow-[2px_0_0_0_#000] whitespace-nowrap min-w-[110px]"
                  >
                    Question
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-black px-3 py-2 text-center font-bold text-black bg-white whitespace-nowrap min-w-[95px]"
                  >
                    Orientation
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-black px-3 py-2 text-center font-bold text-black bg-white whitespace-nowrap min-w-[85px]"
                  >
                    Status
                  </th>
                  {SC_GROUPS.map(group => (
                    <th
                      key={group.id}
                      colSpan={3}
                      style={{ backgroundColor: group.bgColor }}
                      className="border border-black px-3 py-2 text-center font-bold text-black whitespace-nowrap"
                    >
                      {group.name}
                    </th>
                  ))}
                </tr>

                {/* Header Tier 2: Sub-headers for the 18 Composite Priority Columns */}
                <tr className="border-b border-black">
                  {SC_GROUPS.map(group =>
                    group.columns.map(col => {
                      const isDirectionAndDrive = group.id === 'sc-1';
                      const cbLabel = getCbLabel(col);
                      return (
                        <th
                          key={col.key}
                          style={isDirectionAndDrive ? { backgroundColor: group.bgColor } : undefined}
                          className={`border border-black px-2.5 py-1.5 text-center font-bold text-black whitespace-nowrap min-w-[85px] ${
                            isDirectionAndDrive ? '' : 'bg-white'
                          }`}
                          title={`${cbLabel} (${group.name})`}
                        >
                          {cbLabel}
                        </th>
                      );
                    })
                  )}
                </tr>
              </thead>

              <tbody>
                {displayedQuestions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={21}
                      className="text-center py-12 text-slate-500 border border-black bg-slate-50"
                    >
                      <div className="max-w-sm mx-auto space-y-2">
                        <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="font-bold text-slate-800">No matching questions found</p>
                        <button
                          onClick={handleResetFilters}
                          className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium transition"
                        >
                          Reset All Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedQuestions.map(q => {
                    const qName = q.questionName || `Ques${q.sequence}`;
                    const orientation = getQuestionOrientation(q);
                    const priorities =
                      q.cbPriorities ||
                      getQuestionCbPriorities(q.sequence, q.priority, q.compositeBehaviourId);

                    return (
                      <tr
                        key={q.questionId}
                        onClick={() => setEditingQuestion({ ...q, cbPriorities: priorities })}
                        className="hover:bg-slate-100/70 cursor-pointer transition"
                      >
                        <td
                          className="sticky left-0 bg-white hover:bg-slate-50 z-20 border border-black px-4 py-2 text-center font-normal text-black shadow-[2px_0_0_0_#000] whitespace-nowrap"
                          title={`Click to edit ${qName} (${q.questionId})`}
                        >
                          <div className="flex items-center justify-center space-x-1.5">
                            <span className="font-normal text-black">{qName}</span>
                            <Edit2 className="w-3 h-3 text-slate-300 hover:text-teal-700" />
                          </div>
                        </td>

                        <td className="border border-black px-3 py-2 text-center text-black font-normal whitespace-nowrap bg-white">
                          {orientation}
                        </td>

                        <td className="border border-black px-3 py-2 text-center text-black font-normal whitespace-nowrap bg-white">
                          {q.active ? 'Active' : 'Inactive'}
                        </td>

                        {SC_GROUPS.map(group =>
                          group.columns.map(col => {
                            const val = priorities[col.key] ?? 1;
                            const isHighlightedGroup =
                              q.summaryCharacteristicId === group.id ||
                              (group.id === 'sc-1' && q.sequence <= 2);

                            return (
                              <td
                                key={col.key}
                                style={isHighlightedGroup ? { backgroundColor: group.bgColor } : undefined}
                                className={`border border-black px-2 py-2 text-center text-black font-normal text-xs whitespace-nowrap ${
                                  isHighlightedGroup ? '' : 'bg-white'
                                }`}
                              >
                                {val}
                              </td>
                            );
                          })
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* RESPONSIVE PAGINATION CONTROLS (Zero Overflow)                       */}
      {/* ==================================================================== */}
      {itemsPerPage !== -1 && totalPages > 1 && (
        <div className="p-3 bg-white border border-slate-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-700 shadow-2xs">
          <div className="text-center sm:text-left">
            Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong>–
            <strong>{Math.min(currentPage * itemsPerPage, filteredQuestions.length)}</strong> of{' '}
            <strong>{filteredQuestions.length}</strong> questions
          </div>

          <div className="flex items-center space-x-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 min-h-[38px]"
            >
              Previous
            </button>

            <div className="px-2 font-mono font-semibold text-slate-800">
              Page {currentPage} of {totalPages}
            </div>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 min-h-[38px]"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* EDIT MODAL: MOBILE OPTIMIZED (Responsive, Touch-Friendly)            */}
      {/* ==================================================================== */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold text-sm bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                  {editingQuestion.questionName || `Ques${editingQuestion.sequence}`}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ({editingQuestion.questionId})
                </span>
                <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900 ml-1">
                  Edit Question & Weights
                </h3>
              </div>
              <button
                onClick={() => setEditingQuestion(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-200/50 min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <form onSubmit={handleSaveQuestion} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              {/* Question Identifier, Orientation, and Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Question Identifier
                  </label>
                  <input
                    type="text"
                    required
                    value={editingQuestion.questionName || `Ques${editingQuestion.sequence}`}
                    onChange={e =>
                      setEditingQuestion({ ...editingQuestion, questionName: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-teal-600 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Orientation
                  </label>
                  <select
                    value={editingQuestion.orientation}
                    onChange={e =>
                      setEditingQuestion({
                        ...editingQuestion,
                        orientation: e.target.value as Orientation,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-600 min-h-[44px] bg-white"
                  >
                    <option value="POSITIVE">Positive</option>
                    <option value="NEGATIVE">Negative</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editingQuestion.active ? 'ACTIVE' : 'INACTIVE'}
                    onChange={e =>
                      setEditingQuestion({
                        ...editingQuestion,
                        active: e.target.value === 'ACTIVE',
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-teal-600 min-h-[44px] bg-white"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Statement Text */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  SELF Question Text (First Person)
                </label>
                <textarea
                  required
                  rows={2}
                  value={editingQuestion.selfQuestionText}
                  onChange={e =>
                    setEditingQuestion({ ...editingQuestion, selfQuestionText: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-600 leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  PEER Question Text (Observer View)
                </label>
                <textarea
                  required
                  rows={2}
                  value={editingQuestion.peerQuestionText}
                  onChange={e =>
                    setEditingQuestion({ ...editingQuestion, peerQuestionText: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-600 leading-relaxed"
                />
              </div>

              {/* 18 Composite Behaviour Priorities Editor by Group */}
              <div className="border border-slate-200 rounded-xl p-3 sm:p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-xs">
                    Multi-Dimensional Priority Weights (1–5 Scale)
                  </span>
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    Organized by 6 Summary Characteristics
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {SC_GROUPS.map(group => (
                    <div
                      key={group.id}
                      className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs"
                    >
                      <div
                        style={{ backgroundColor: group.bgColor }}
                        className="px-2.5 py-1.5 text-center font-bold text-black text-[11px] border-b border-slate-300"
                      >
                        {group.name}
                      </div>

                      <div className="p-2.5 grid grid-cols-3 gap-2">
                        {group.columns.map(col => {
                          const currentPriorities =
                            editingQuestion.cbPriorities ||
                            getQuestionCbPriorities(
                              editingQuestion.sequence,
                              editingQuestion.priority,
                              editingQuestion.compositeBehaviourId
                            );
                          const val = currentPriorities[col.key] ?? 1;
                          const cbLabel = getCbLabel(col);

                          return (
                            <div key={col.key} className="text-center">
                              <label
                                htmlFor={`prio-edit-${col.key}`}
                                className="block text-[10px] font-bold text-slate-700 truncate mb-0.5"
                                title={cbLabel}
                              >
                                {cbLabel}
                              </label>
                              <select
                                id={`prio-edit-${col.key}`}
                                value={val}
                                onChange={e =>
                                  handlePriorityChange(col.key, parseInt(e.target.value, 10))
                                }
                                className="w-full text-center font-mono font-bold text-xs border border-slate-300 rounded-lg p-1.5 text-slate-900 focus:outline-none focus:border-teal-600 min-h-[38px] bg-white"
                              >
                                <option value={1}>1</option>
                                <option value={2}>2</option>
                                <option value={3}>3</option>
                                <option value={4}>4</option>
                                <option value={5}>5</option>
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition min-h-[44px]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
