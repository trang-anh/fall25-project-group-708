/**
 * Simple weighted scoring model for match features.
 *
 * Feature order (from extractFeatures):
 * 0: skillOverlap
 * 1: levelSimilarity
 * 2: preferredLanguageMatch
 * 3: goalSimilarity
 * 4: personalitySimilarity
 * 5: projectTypeSimilarity
 */
export default function computeMatchScore(features: number[]): number {
  const weights = [
    0.35, // skill overlap
    0.2, // level similarity
    0.15, // preferred language match
    0.1, // goal similarity
    0.1, // personality similarity
    0.1, // project similarity
  ];

  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const rawScore = features.reduce(
    (sum, featureValue, idx) => sum + featureValue * (weights[idx] ?? 0),
    0,
  );

  // normalize to [0, 1]
  return rawScore / totalWeight;
}
