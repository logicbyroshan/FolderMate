export interface ScoreFactors {
  clientScore: number;
  projectScore: number;
  yearScore: number;
  versionScore: number;
}

export interface ScoreWeights {
  clientWeight: number;
  projectWeight: number;
  yearWeight: number;
  versionWeight: number;
}

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  clientWeight: 0.40,
  projectWeight: 0.35,
  yearWeight: 0.15,
  versionWeight: 0.10,
};

export interface ConfidenceEvaluation {
  compositeScore: number; // 0.0 to 1.0
  percentage: number;     // 0 to 100
  action: "AUTO_ORGANIZE" | "REVIEW_SUGGESTED" | "REVIEW_MANUAL";
  reasons: string[];
}

export function evaluateConfidence(
  factors: ScoreFactors,
  weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS,
  thresholds = { auto: 0.85, suggest: 0.60 }
): ConfidenceEvaluation {
  const compositeScore = Math.min(
    1.0,
    Math.max(
      0.0,
      factors.clientScore * weights.clientWeight +
      factors.projectScore * weights.projectWeight +
      factors.yearScore * weights.yearWeight +
      factors.versionScore * weights.versionWeight
    )
  );

  const percentage = Math.round(compositeScore * 100);
  const reasons: string[] = [];

  if (factors.clientScore >= 0.95) {
    reasons.push(`High confidence client match (${Math.round(factors.clientScore * 100)}%)`);
  } else if (factors.clientScore > 0) {
    reasons.push(`Partial / fuzzy client match (${Math.round(factors.clientScore * 100)}%)`);
  } else {
    reasons.push("No client matched in filename tokens");
  }

  if (factors.projectScore >= 0.95) {
    reasons.push(`Exact project match (${Math.round(factors.projectScore * 100)}%)`);
  } else if (factors.projectScore > 0) {
    reasons.push(`Project inferred from context (${Math.round(factors.projectScore * 100)}%)`);
  }

  if (factors.yearScore >= 0.95) {
    reasons.push("Explicit year token found in filename");
  }

  let action: ConfidenceEvaluation["action"] = "REVIEW_MANUAL";
  if (compositeScore >= thresholds.auto) {
    action = "AUTO_ORGANIZE";
  } else if (compositeScore >= thresholds.suggest) {
    action = "REVIEW_SUGGESTED";
  }

  return {
    compositeScore: Number(compositeScore.toFixed(4)),
    percentage,
    action,
    reasons,
  };
}
