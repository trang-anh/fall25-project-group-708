import computeMatchScore from '../../services/matchMath.service';

describe('computeMatchScore', () => {
  test('computes weighted score for full 6-feature vector', () => {
    const features = [1, 1, 1, 1, 1, 1]; // maximum values
    const result = computeMatchScore(features);

    // total weight = 1.0 -> normalized score = rawScore / 1 = rawScore
    expect(result).toBeCloseTo(1); // because max score is 1
  });

  test('computes score with mixed values', () => {
    const features = [1, 0.5, 0, 0.2, 0.2, 0.2];

    // Manual expected value:
    const expected = (1 * 0.35 + 0.5 * 0.2 + 0 * 0.15 + 0.2 * 0.1 + 0.2 * 0.1 + 0.2 * 0.1) / 1.0;

    const result = computeMatchScore(features);
    expect(result).toBeCloseTo(expected);
  });

  test('returns 0 when all features are zero', () => {
    const result = computeMatchScore([0, 0, 0, 0, 0, 0]);
    expect(result).toBe(0);
  });

  test('ignores extra features beyond index 5 (weights only for first 6)', () => {
    const features = [1, 1, 1, 1, 1, 1, 999, 9999]; // extras ignored
    const result = computeMatchScore(features);

    expect(result).toBeCloseTo(1); // still max score
  });

  test('handles feature array shorter than weight array (weights[idx] ?? 0)', () => {
    const result = computeMatchScore([1, 1, 1]); // missing last 3 values -> treated as 0
    const expected = (1 * 0.35 + 1 * 0.2 + 1 * 0.15) / 1.0;
    expect(result).toBeCloseTo(expected);
  });

  test('returns correct value when all input feature values are 0.5', () => {
    const features = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    const expected =
      (0.5 * 0.35 + 0.5 * 0.2 + 0.5 * 0.15 + 0.5 * 0.1 + 0.5 * 0.1 + 0.5 * 0.1) / 1.0;

    const result = computeMatchScore(features);
    expect(result).toBeCloseTo(expected);
  });
});
