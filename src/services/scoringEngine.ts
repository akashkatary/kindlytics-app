import {
  Question,
  ResponseRecord,
  MasterScoringConfig,
  PriorityLevel,
  CompositeBehaviourScore,
  SummaryCharacteristicScore,
  KeyCharacteristicScore,
  CalculatedAssessmentProfile,
} from '../types';
import {
  KEY_CHARACTERISTICS,
  SUMMARY_CHARACTERISTICS,
  COMPOSITE_BEHAVIOURS,
} from '../data/taxonomy';

// Default Master Scoring Configuration per Section 42, 52, 60, 61
export const DEFAULT_MASTER_SCORING_CONFIG: MasterScoringConfig = {
  version: 3,
  effectiveStatus: true,
  priorityValues: {
    P5: 10,
    P4: 4,
    P3: 3,
    P2: 2,
    P1: 1,
  },
  // Default equal weighting (1.0) for CBs and SCs
  cbNormalizationWeights: COMPOSITE_BEHAVIOURS.reduce((acc, cb) => {
    acc[cb.id] = 1.0;
    return acc;
  }, {} as Record<string, number>),
  scNormalizationWeights: SUMMARY_CHARACTERISTICS.reduce((acc, sc) => {
    acc[sc.id] = 1.0;
    return acc;
  }, {} as Record<string, number>),
  // Positive & Negative lookup tables: priority -> count -> modifier score
  // Provides non-linear calibration for response clusters
  positiveLookupTable: {
    P5: { 0: 0, 1: 2, 2: 4, 3: 7, 4: 10, 5: 14, 6: 18, 7: 23, 8: 28, 9: 34, 10: 40 },
    P4: { 0: 0, 1: 1, 2: 2, 3: 4, 4: 6, 5: 8, 6: 11, 7: 14, 8: 17, 9: 20, 10: 24 },
    P3: { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 6, 6: 8, 7: 10, 8: 12, 9: 14, 10: 16 },
    P2: { 0: 0, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 8, 10: 9 },
    P1: { 0: 0, 1: 0, 2: 0, 3: 1, 4: 1, 5: 2, 6: 2, 7: 3, 8: 3, 9: 4, 10: 4 },
  },
  negativeLookupTable: {
    P5: { 0: 0, 1: -2, 2: -4, 3: -7, 4: -10, 5: -14, 6: -18, 7: -23, 8: -28, 9: -34, 10: -40 },
    P4: { 0: 0, 1: -1, 2: -2, 3: -4, 4: -6, 5: -8, 6: -11, 7: -14, 8: -17, 9: -20, 10: -24 },
    P3: { 0: 0, 1: -1, 2: -2, 3: -3, 4: -4, 5: -6, 6: -8, 7: -10, 8: -12, 9: -14, 10: -16 },
    P2: { 0: 0, 1: 0, 2: -1, 3: -2, 4: -3, 5: -4, 6: -5, 7: -6, 8: -7, 9: -8, 10: -9 },
    P1: { 0: 0, 1: 0, 2: 0, 3: -1, 4: -1, 5: -2, 6: -2, 7: -3, 8: -3, 9: -4, 10: -4 },
  },
  minimumPeerResponsesForReporting: 2,
};

/**
 * Calculates raw score bounds and model parameters for a single Composite Behaviour
 */
export function calculateCBModelBounds(
  cbId: string,
  allQuestions: Question[],
  config: MasterScoringConfig
) {
  const cbQuestions = allQuestions.filter(q => q.compositeBehaviourId === cbId && q.active);
  const priorities: PriorityLevel[] = ['P5', 'P4', 'P3', 'P2', 'P1'];

  let totalMaxRawScorePos = 0;
  let totalMaxLookupScorePos = 0;
  let totalMaxRawScoreNeg = 0;
  let totalMaxLookupScoreNeg = 0;

  for (const p of priorities) {
    const pVal = config.priorityValues[p] ?? 1;

    // Positively oriented questions
    const posCount = cbQuestions.filter(q => q.priority === p && q.orientation === 'POSITIVE').length;
    const maxRawPos = posCount * pVal;
    const lookupPos = config.positiveLookupTable[p]?.[posCount] ?? 0;
    totalMaxRawScorePos += maxRawPos;
    totalMaxLookupScorePos += lookupPos;

    // Negatively oriented questions
    const negCount = cbQuestions.filter(q => q.priority === p && q.orientation === 'NEGATIVE').length;
    const maxRawNeg = negCount * pVal;
    const lookupNeg = Math.abs(config.negativeLookupTable[p]?.[negCount] ?? 0);
    totalMaxRawScoreNeg += maxRawNeg;
    totalMaxLookupScoreNeg += lookupNeg;
  }

  const actualMaxRawScoreSubtotalPos = totalMaxRawScorePos + totalMaxLookupScorePos;
  const actualMaxRawScoreSubtotalNeg = totalMaxRawScoreNeg + totalMaxLookupScoreNeg;

  // Raw Max Score & Raw Min Score
  const rawMaxScore = Math.max(1, actualMaxRawScoreSubtotalPos + actualMaxRawScoreSubtotalNeg);
  const rawMinScore = -rawMaxScore;

  const absRawMinScore = Math.min(rawMinScore, rawMaxScore);
  const absRawMaxScore = Math.max(rawMinScore, rawMaxScore);

  return {
    cbQuestions,
    rawMaxScore,
    rawMinScore,
    absRawMinScore,
    absRawMaxScore,
  };
}

/**
 * Calculate full assessment profile from a given list of responses
 */
export function calculateAssessmentProfile(
  responses: ResponseRecord[],
  allQuestions: Question[],
  config: MasterScoringConfig = DEFAULT_MASTER_SCORING_CONFIG
): CalculatedAssessmentProfile {
  const responseMap = new Map<string, ResponseRecord>();
  responses.forEach(r => {
    if (r && r.questionId) {
      responseMap.set(r.questionId, r);
    }
  });

  // Step 1: Compute bounds for all CBs
  const cbBoundsMap = new Map<string, ReturnType<typeof calculateCBModelBounds>>();
  for (const cb of COMPOSITE_BEHAVIOURS) {
    cbBoundsMap.set(cb.id, calculateCBModelBounds(cb.id, allQuestions, config));
  }

  // Step 2: Compute Scalar Ratios per Summary Characteristic (highest Abs Raw Max Score among the 3 CBs / this CB's Abs Raw Max Score)
  const scalarRatios = new Map<string, number>();
  for (const sc of SUMMARY_CHARACTERISTICS) {
    const scCBs = COMPOSITE_BEHAVIOURS.filter(cb => cb.parentId === sc.id);
    let maxAbsInSC = 0;
    for (const cb of scCBs) {
      const bounds = cbBoundsMap.get(cb.id)!;
      if (bounds.absRawMaxScore > maxAbsInSC) {
        maxAbsInSC = bounds.absRawMaxScore;
      }
    }
    for (const cb of scCBs) {
      const bounds = cbBoundsMap.get(cb.id)!;
      const ratio = bounds.absRawMaxScore > 0 ? maxAbsInSC / bounds.absRawMaxScore : 1.0;
      scalarRatios.set(cb.id, ratio);
    }
  }

  // Step 3: Compute individual CB scores
  const cbScores: CompositeBehaviourScore[] = [];

  for (const cb of COMPOSITE_BEHAVIOURS) {
    const bounds = cbBoundsMap.get(cb.id)!;
    const questions = bounds.cbQuestions;
    const scalarRatio = scalarRatios.get(cb.id) ?? 1.0;
    const cbNormWeight = config.cbNormalizationWeights[cb.id] ?? 1.0;

    let yesCount = 0;
    let noCount = 0;
    let answeredCount = 0;

    const priorities: PriorityLevel[] = ['P5', 'P4', 'P3', 'P2', 'P1'];

    let actualYScorePos = 0;
    let actualYScoreNeg = 0;
    let actualNScorePos = 0;
    let actualNScoreNeg = 0;

    const actualYCountPos: Record<PriorityLevel, number> = { P5: 0, P4: 0, P3: 0, P2: 0, P1: 0 };
    const actualYCountNeg: Record<PriorityLevel, number> = { P5: 0, P4: 0, P3: 0, P2: 0, P1: 0 };
    const actualNCountPos: Record<PriorityLevel, number> = { P5: 0, P4: 0, P3: 0, P2: 0, P1: 0 };
    const actualNCountNeg: Record<PriorityLevel, number> = { P5: 0, P4: 0, P3: 0, P2: 0, P1: 0 };

    for (const q of questions) {
      const resp = responseMap.get(q.questionId);
      if (resp && resp.responseValue !== 'UNANSWERED') {
        answeredCount++;
        const pVal = config.priorityValues[q.priority] ?? 1;

        if (resp.responseValue === 'YES') {
          yesCount++;
          if (q.orientation === 'POSITIVE') {
            actualYCountPos[q.priority]++;
            actualYScorePos += pVal;
          } else {
            actualYCountNeg[q.priority]++;
            actualYScoreNeg -= pVal; // negative orientation YES reduces score
          }
        } else if (resp.responseValue === 'NO') {
          noCount++;
          if (q.orientation === 'POSITIVE') {
            actualNCountPos[q.priority]++;
            actualNScorePos -= pVal; // positive orientation NO reduces score
          } else {
            actualNCountNeg[q.priority]++;
            actualNScoreNeg += pVal; // negative orientation NO increases score
          }
        }
      }
    }

    // Lookup adjustments
    let actualYLookupScorePos = 0;
    let actualYLookupScoreNeg = 0;
    let actualNLookupScorePos = 0;
    let actualNLookupScoreNeg = 0;

    for (const p of priorities) {
      actualYLookupScorePos += config.positiveLookupTable[p]?.[actualYCountPos[p]] ?? 0;
      actualYLookupScoreNeg += config.negativeLookupTable[p]?.[actualYCountNeg[p]] ?? 0;
      actualNLookupScorePos += config.negativeLookupTable[p]?.[actualNCountPos[p]] ?? 0;
      actualNLookupScoreNeg += config.positiveLookupTable[p]?.[actualNCountNeg[p]] ?? 0;
    }

    const rawProfileScore =
      actualYScorePos +
      actualYScoreNeg +
      actualNScorePos +
      actualNScoreNeg +
      actualYLookupScorePos +
      actualYLookupScoreNeg +
      actualNLookupScorePos +
      actualNLookupScoreNeg;

    // Per Section 61:
    // Abs Profile Score = Raw Max Score + Raw Profile Score for the CB.
    // Max Weighted Score = Abs Raw Max Score * Abs Scalar Ratio.
    // Weighted Profile Score = Abs Profile Score * Abs Scalar Ratio * CB Normalization Weight.
    // CB Percentile = Abs Profile Score * 100 / (2 * Abs Raw Max Score) normalized from 0 to 100
    const absProfileScore = bounds.rawMaxScore + rawProfileScore;
    const maxWeightedScore = (bounds.absRawMaxScore * 2) * scalarRatio;
    const weightedProfileScore = absProfileScore * scalarRatio * cbNormWeight;
    
    // Percentile bounded safely between 5 and 99 for executive realism
    const rawPercentile = bounds.absRawMaxScore > 0
      ? (absProfileScore / (bounds.absRawMaxScore * 2)) * 100
      : 50;
    const cbPercentile = Math.min(99, Math.max(1, Math.round(rawPercentile)));

    cbScores.push({
      id: cb.id,
      name: cb.name,
      rawProfileScore,
      absRawMaxScore: bounds.absRawMaxScore,
      absScalarRatio: scalarRatio,
      maxWeightedScore,
      absProfileScore,
      weightedProfileScore,
      percentile: cbPercentile,
      yesCount,
      noCount,
      answeredCount,
      totalQuestions: questions.length,
    });
  }

  // Step 4: Summary Characteristic Calculations
  const scScores: SummaryCharacteristicScore[] = [];

  for (const sc of SUMMARY_CHARACTERISTICS) {
    const scCBs = cbScores.filter(cb => {
      const parent = COMPOSITE_BEHAVIOURS.find(c => c.id === cb.id)?.parentId;
      return parent === sc.id;
    });

    const scRawIndexScore = scCBs.reduce((sum, cb) => sum + cb.weightedProfileScore, 0);
    const scMaxWeightedScore = scCBs.reduce((sum, cb) => sum + cb.maxWeightedScore, 0);

    const scPercentile = scMaxWeightedScore > 0
      ? Math.min(99, Math.max(1, Math.round((scRawIndexScore * 100) / scMaxWeightedScore)))
      : 50;

    scScores.push({
      id: sc.id,
      name: sc.name,
      rawIndexScore: scRawIndexScore,
      maxWeightedScore: scMaxWeightedScore,
      percentile: scPercentile,
      cbScores: scCBs,
    });
  }

  // Step 5: Key Characteristic Calculations
  const kcScores: KeyCharacteristicScore[] = [];

  for (const kc of KEY_CHARACTERISTICS) {
    const kcSCs = scScores.filter(sc => {
      const parent = SUMMARY_CHARACTERISTICS.find(s => s.id === sc.id)?.parentId;
      return parent === kc.id;
    });

    let kcRawIndexScore = 0;
    let kcMaximumWeightedScore = 0;

    for (const sc of kcSCs) {
      const scNormWeight = config.scNormalizationWeights[sc.id] ?? 1.0;
      kcRawIndexScore += sc.rawIndexScore * scNormWeight;
      kcMaximumWeightedScore += sc.maxWeightedScore * scNormWeight;
    }

    const kcPercentile = kcMaximumWeightedScore > 0
      ? Math.min(99, Math.max(1, Math.round((kcRawIndexScore * 100) / kcMaximumWeightedScore)))
      : 50;

    kcScores.push({
      id: kc.id,
      name: kc.name,
      rawIndexScore: kcRawIndexScore,
      maxWeightedScore: kcMaximumWeightedScore,
      percentile: kcPercentile,
      scScores: kcSCs,
    });
  }

  // Overall Percentile
  const overallPercentile = kcScores.length > 0
    ? Math.round(kcScores.reduce((sum, kc) => sum + kc.percentile, 0) / kcScores.length)
    : 50;

  return {
    overallPercentile,
    keyCharacteristics: kcScores,
    summaryCharacteristics: scScores,
    compositeBehaviours: cbScores,
  };
}

/**
 * Aggregate peer responses anonymously across all completed peer assessors.
 * Returns an aggregated profile, guaranteeing NO individual peer answers are exposed.
 */
export function aggregatePeerProfiles(
  peerProfiles: CalculatedAssessmentProfile[]
): (CalculatedAssessmentProfile & { respondentCount: number }) | null {
  if (peerProfiles.length === 0) {
    return null;
  }

  const count = peerProfiles.length;

  const cbScores: CompositeBehaviourScore[] = COMPOSITE_BEHAVIOURS.map(cb => {
    const matchingCBs = peerProfiles.map(p => p.compositeBehaviours.find(c => c.id === cb.id)!).filter(Boolean);
    const avgPercentile = Math.round(matchingCBs.reduce((sum, c) => sum + c.percentile, 0) / count);
    const avgRaw = Math.round(matchingCBs.reduce((sum, c) => sum + c.rawProfileScore, 0) / count);
    const avgWeighted = Math.round(matchingCBs.reduce((sum, c) => sum + c.weightedProfileScore, 0) / count);

    return {
      id: cb.id,
      name: cb.name,
      rawProfileScore: avgRaw,
      absRawMaxScore: matchingCBs[0]?.absRawMaxScore ?? 100,
      absScalarRatio: matchingCBs[0]?.absScalarRatio ?? 1,
      maxWeightedScore: matchingCBs[0]?.maxWeightedScore ?? 100,
      absProfileScore: Math.round(matchingCBs.reduce((sum, c) => sum + c.absProfileScore, 0) / count),
      weightedProfileScore: avgWeighted,
      percentile: avgPercentile,
      yesCount: Math.round(matchingCBs.reduce((sum, c) => sum + c.yesCount, 0) / count),
      noCount: Math.round(matchingCBs.reduce((sum, c) => sum + c.noCount, 0) / count),
      answeredCount: Math.round(matchingCBs.reduce((sum, c) => sum + c.answeredCount, 0) / count),
      totalQuestions: matchingCBs[0]?.totalQuestions ?? 8,
    };
  });

  const scScores: SummaryCharacteristicScore[] = SUMMARY_CHARACTERISTICS.map(sc => {
    const matchingSCs = peerProfiles.map(p => p.summaryCharacteristics.find(s => s.id === sc.id)!).filter(Boolean);
    const avgPercentile = Math.round(matchingSCs.reduce((sum, s) => sum + s.percentile, 0) / count);
    const scCBs = cbScores.filter(cb => {
      const parent = COMPOSITE_BEHAVIOURS.find(c => c.id === cb.id)?.parentId;
      return parent === sc.id;
    });

    return {
      id: sc.id,
      name: sc.name,
      rawIndexScore: Math.round(matchingSCs.reduce((sum, s) => sum + s.rawIndexScore, 0) / count),
      maxWeightedScore: matchingSCs[0]?.maxWeightedScore ?? 300,
      percentile: avgPercentile,
      cbScores: scCBs,
    };
  });

  const kcScores: KeyCharacteristicScore[] = KEY_CHARACTERISTICS.map(kc => {
    const matchingKCs = peerProfiles.map(p => p.keyCharacteristics.find(k => k.id === kc.id)!).filter(Boolean);
    const avgPercentile = Math.round(matchingKCs.reduce((sum, k) => sum + k.percentile, 0) / count);
    const kcSCs = scScores.filter(sc => {
      const parent = SUMMARY_CHARACTERISTICS.find(s => s.id === sc.id)?.parentId;
      return parent === kc.id;
    });

    return {
      id: kc.id,
      name: kc.name,
      rawIndexScore: Math.round(matchingKCs.reduce((sum, k) => sum + k.rawIndexScore, 0) / count),
      maxWeightedScore: matchingKCs[0]?.maxWeightedScore ?? 600,
      percentile: avgPercentile,
      scScores: kcSCs,
    };
  });

  const overallPercentile = Math.round(kcScores.reduce((sum, k) => sum + k.percentile, 0) / kcScores.length);

  return {
    respondentCount: count,
    overallPercentile,
    keyCharacteristics: kcScores,
    summaryCharacteristics: scScores,
    compositeBehaviours: cbScores,
  };
}
