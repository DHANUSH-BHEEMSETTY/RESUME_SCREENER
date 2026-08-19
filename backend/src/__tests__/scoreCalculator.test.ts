import { describe, it, expect } from 'vitest';
import { calculateOverallScore, clamp, getWeights } from '../services/scoreCalculator';
import { MatchResult } from '../types';

// ---- Fixtures ----------------------------------------------

function makeMatch(overrides: Partial<MatchResult> = {}): MatchResult {
  return {
    skillsScore: 50,
    experienceScore: 50,
    educationScore: 50,
    certificationScore: 50,
    semanticScore: 50,
    matchedSkills: [],
    missingSkills: [],
    preferredSkillsMatched: [],
    strengths: [],
    gaps: [],
    experienceAnalysis: 'test',
    educationAnalysis: 'test',
    recommendation: 'MAYBE',
    justification: 'test',
    confidence: 70,
    ...overrides,
  };
}

// ---- Deterministic formula tests ---------------------------

describe('calculateOverallScore', () => {
  describe('formula correctness', () => {
    it('computes correct score for a strong candidate', () => {
      // skills=90, exp=85, edu=90, cert=80, semantic=88
      // 90*0.45 + 85*0.30 + 90*0.10 + 80*0.05 + 88*0.10
      // = 40.5 + 25.5 + 9.0 + 4.0 + 8.8 = 87.8 → 88
      const match = makeMatch({
        skillsScore: 90,
        experienceScore: 85,
        educationScore: 90,
        certificationScore: 80,
        semanticScore: 88,
      });
      expect(calculateOverallScore(match)).toBe(88);
    });

    it('computes correct score for an average candidate', () => {
      // skills=65, exp=60, edu=70, cert=50, semantic=60
      // 65*0.45 + 60*0.30 + 70*0.10 + 50*0.05 + 60*0.10
      // = 29.25 + 18.0 + 7.0 + 2.5 + 6.0 = 62.75 → 63
      const match = makeMatch({
        skillsScore: 65,
        experienceScore: 60,
        educationScore: 70,
        certificationScore: 50,
        semanticScore: 60,
      });
      expect(calculateOverallScore(match)).toBe(63);
    });

    it('computes correct score for a weak candidate', () => {
      // skills=25, exp=20, edu=40, cert=0, semantic=25
      // 25*0.45 + 20*0.30 + 40*0.10 + 0*0.05 + 25*0.10
      // = 11.25 + 6.0 + 4.0 + 0 + 2.5 = 23.75 → 24
      const match = makeMatch({
        skillsScore: 25,
        experienceScore: 20,
        educationScore: 40,
        certificationScore: 0,
        semanticScore: 25,
      });
      expect(calculateOverallScore(match)).toBe(24);
    });

    it('returns 100 when all components are 100', () => {
      const match = makeMatch({
        skillsScore: 100,
        experienceScore: 100,
        educationScore: 100,
        certificationScore: 100,
        semanticScore: 100,
      });
      expect(calculateOverallScore(match)).toBe(100);
    });

    it('returns 0 when all components are 0', () => {
      const match = makeMatch({
        skillsScore: 0,
        experienceScore: 0,
        educationScore: 0,
        certificationScore: 0,
        semanticScore: 0,
      });
      expect(calculateOverallScore(match)).toBe(0);
    });

    it('reflects skills as the most influential component (45% weight)', () => {
      // Only skills changes by 100 points → should change overall by ~45 points
      const lowSkills = makeMatch({ skillsScore: 0, experienceScore: 0, educationScore: 0, certificationScore: 0, semanticScore: 0 });
      const highSkills = makeMatch({ skillsScore: 100, experienceScore: 0, educationScore: 0, certificationScore: 0, semanticScore: 0 });
      expect(calculateOverallScore(highSkills) - calculateOverallScore(lowSkills)).toBe(45);
    });

    it('reflects experience as the second most influential component (30% weight)', () => {
      const lowExp = makeMatch({ skillsScore: 0, experienceScore: 0, educationScore: 0, certificationScore: 0, semanticScore: 0 });
      const highExp = makeMatch({ skillsScore: 0, experienceScore: 100, educationScore: 0, certificationScore: 0, semanticScore: 0 });
      expect(calculateOverallScore(highExp) - calculateOverallScore(lowExp)).toBe(30);
    });
  });

  describe('rounding', () => {
    it('rounds 74.5 up to 75', () => {
      // Need raw = 74.5
      // skills*0.45 + exp*0.30 + edu*0.10 + cert*0.05 + sem*0.10 = 74.5
      // All equal: x * (0.45+0.30+0.10+0.05+0.10) = x * 1.0 = x → x = 74.5
      // skills=85, exp=65, rest=70: 85*0.45 + 65*0.30 + 70*0.10 + 70*0.05 + 70*0.10
      // = 38.25 + 19.5 + 7.0 + 3.5 + 7.0 = 75.25 → not exactly
      // Direct: all=74.5 → 74.5 * 1.0 = 74.5 → rounds to 75 (Math.round behavior)
      // Use a combination: skills=74, exp=75, edu=75, cert=75, sem=75
      // 74*0.45 + 75*0.30 + 75*0.10 + 75*0.05 + 75*0.10 = 33.3+22.5+7.5+3.75+7.5 = 74.55 → 75
      const match = makeMatch({ skillsScore: 74, experienceScore: 75, educationScore: 75, certificationScore: 75, semanticScore: 75 });
      const score = calculateOverallScore(match);
      expect(score).toBe(75); // Math.round(74.55) = 75
    });

    it('rounds 74.4 down to 74', () => {
      // skills=73, exp=75, edu=75, cert=75, sem=75
      // 73*0.45 + 75*0.30 + 75*0.10 + 75*0.05 + 75*0.10
      // = 32.85 + 22.5 + 7.5 + 3.75 + 7.5 = 74.1 → 74
      const match = makeMatch({ skillsScore: 73, experienceScore: 75, educationScore: 75, certificationScore: 75, semanticScore: 75 });
      const score = calculateOverallScore(match);
      expect(score).toBe(74);
    });
  });

  describe('clamping', () => {
    it('clamps scores above 100 to 100 before formula', () => {
      const match = makeMatch({
        skillsScore: 150,  // out of range
        experienceScore: 100,
        educationScore: 100,
        certificationScore: 100,
        semanticScore: 100,
      });
      // Should behave as if skillsScore = 100
      expect(calculateOverallScore(match)).toBe(100);
    });

    it('clamps negative scores to 0 before formula', () => {
      const match = makeMatch({
        skillsScore: -50,  // out of range
        experienceScore: 0,
        educationScore: 0,
        certificationScore: 0,
        semanticScore: 0,
      });
      // Should behave as if skillsScore = 0
      expect(calculateOverallScore(match)).toBe(0);
    });

    it('clamps multiple out-of-range scores independently', () => {
      const match = makeMatch({
        skillsScore: 200,
        experienceScore: -100,
        educationScore: 100,
        certificationScore: 100,
        semanticScore: 100,
      });
      // Clamped: skills=100, exp=0, edu=100, cert=100, sem=100
      // 100*0.45 + 0*0.30 + 100*0.10 + 100*0.05 + 100*0.10
      // = 45 + 0 + 10 + 5 + 10 = 70
      expect(calculateOverallScore(match)).toBe(70);
    });
  });

  describe('shortlisting threshold', () => {
    it('score >= 75 should be shortlisted (boundary check)', () => {
      const match = makeMatch({ skillsScore: 75, experienceScore: 75, educationScore: 75, certificationScore: 75, semanticScore: 75 });
      const score = calculateOverallScore(match);
      expect(score).toBeGreaterThanOrEqual(75);
    });

    it('score < 75 should NOT be shortlisted (boundary check)', () => {
      // All 74: raw=74.0 → 74
      const match = makeMatch({ skillsScore: 74, experienceScore: 74, educationScore: 74, certificationScore: 74, semanticScore: 74 });
      const score = calculateOverallScore(match);
      expect(score).toBeLessThan(75);
    });
  });
});

// ---- clamp() helper tests ----------------------------------

describe('clamp', () => {
  it('returns the value unchanged when in range', () => {
    expect(clamp(50)).toBe(50);
    expect(clamp(0)).toBe(0);
    expect(clamp(100)).toBe(100);
  });

  it('clamps values below 0 to 0', () => {
    expect(clamp(-1)).toBe(0);
    expect(clamp(-100)).toBe(0);
  });

  it('clamps values above 100 to 100', () => {
    expect(clamp(101)).toBe(100);
    expect(clamp(999)).toBe(100);
  });
});

// ---- getWeights() tests ------------------------------------

describe('getWeights', () => {
  it('returns weights that sum to 1.0', () => {
    const weights = getWeights();
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1.0, 10);
  });

  it('has skills as the largest weight', () => {
    const weights = getWeights();
    expect(weights.skills).toBe(0.45);
    expect(weights.skills).toBeGreaterThan(weights.experience);
    expect(weights.skills).toBeGreaterThan(weights.education);
    expect(weights.skills).toBeGreaterThan(weights.certification);
    expect(weights.skills).toBeGreaterThan(weights.semantic);
  });
});
