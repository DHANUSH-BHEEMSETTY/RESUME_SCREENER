import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeMatch } from '../services/matchingEngine.service';
import { LLMError } from '../middleware/errorHandler';
import { ParsedResume, AnalyzedJob } from '../types';

// ---- Mock the LLM client -----------------------------------

vi.mock('../llm/llmClient', () => ({
  llmClient: { complete: vi.fn() },
}));

import { llmClient } from '../llm/llmClient';
const mockComplete = vi.mocked(llmClient.complete);

// ---- Test fixtures -----------------------------------------

const STRONG_RESUME: ParsedResume = {
  fileName: 'alice_strong.pdf',
  candidateName: 'Alice Chen',
  email: 'alice@example.com',
  phone: null,
  skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'GraphQL'],
  education: [{ degree: 'B.Sc. Computer Science', institution: 'State University', year: '2017' }],
  workExperience: [
    {
      title: 'Senior Software Engineer',
      company: 'TechCorp',
      duration: 'Jan 2019 – Present',
      description: 'Led backend and frontend development for SaaS platform',
    },
  ],
  certifications: ['AWS Certified Developer'],
};

const AVERAGE_RESUME: ParsedResume = {
  fileName: 'bob_average.pdf',
  candidateName: 'Bob Martinez',
  email: 'bob@example.com',
  phone: null,
  skills: ['JavaScript', 'React', 'Node.js'],
  education: [{ degree: 'B.A. Business', institution: 'Community College', year: '2020' }],
  workExperience: [
    {
      title: 'Frontend Developer',
      company: 'SmallAgency',
      duration: 'Mar 2021 – Present',
      description: 'Built React UIs',
    },
  ],
  certifications: [],
};

const WEAK_RESUME: ParsedResume = {
  fileName: 'carol_weak.pdf',
  candidateName: 'Carol Jones',
  email: null,
  phone: null,
  skills: ['HTML', 'CSS'],
  education: [],
  workExperience: [],
  certifications: [],
};

const SAMPLE_JOB: AnalyzedJob = {
  roleTitle: 'Senior Software Engineer',
  requiredSkills: ['TypeScript', 'Node.js', 'PostgreSQL', 'REST API design'],
  preferredSkills: ['GraphQL', 'Docker'],
  requiredExperience: { years: 5, description: '5+ years of full-stack development' },
  educationRequirements: ["Bachelor's degree in Computer Science or related field"],
  certifications: ['AWS Certified Developer'],
  responsibilities: ['Build APIs', 'Mentor juniors'],
  keywords: ['microservices', 'CI/CD'],
};

function makeMatchResponse(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    skillsScore: 80,
    experienceScore: 75,
    educationScore: 85,
    certificationScore: 90,
    semanticScore: 80,
    matchedSkills: ['TypeScript', 'Node.js', 'PostgreSQL'],
    missingSkills: ['REST API design'],
    preferredSkillsMatched: ['GraphQL', 'Docker'],
    strengths: ['Strong TypeScript background', 'Meets experience requirement'],
    gaps: ['REST API design not explicitly listed'],
    experienceAnalysis: 'Candidate has 5+ years of relevant experience.',
    educationAnalysis: 'B.Sc. Computer Science satisfies the requirement.',
    recommendation: 'HIRE',
    justification: 'Candidate meets most requirements with minor gaps.',
    confidence: 85,
    ...overrides,
  });
}

// ---- Tests -------------------------------------------------

describe('analyzeMatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Strong candidate -----------------------------------

  describe('strong candidate', () => {
    it('returns high scores for a strong candidate', async () => {
      mockComplete.mockResolvedValue(
        makeMatchResponse({
          skillsScore: 92,
          experienceScore: 88,
          educationScore: 90,
          certificationScore: 95,
          semanticScore: 88,
          recommendation: 'STRONG_HIRE',
        })
      );

      const result = await analyzeMatch(STRONG_RESUME, SAMPLE_JOB);
      expect(result.skillsScore).toBe(92);
      expect(result.experienceScore).toBe(88);
      expect(result.recommendation).toBe('STRONG_HIRE');
    });

    it('populates matchedSkills and preferredSkillsMatched', async () => {
      mockComplete.mockResolvedValue(
        makeMatchResponse({
          matchedSkills: ['TypeScript', 'Node.js', 'PostgreSQL'],
          preferredSkillsMatched: ['GraphQL', 'Docker'],
        })
      );

      const result = await analyzeMatch(STRONG_RESUME, SAMPLE_JOB);
      expect(result.matchedSkills).toContain('TypeScript');
      expect(result.preferredSkillsMatched).toContain('GraphQL');
    });
  });

  // ---- Average candidate ----------------------------------

  describe('average candidate', () => {
    it('returns moderate scores for an average candidate', async () => {
      mockComplete.mockResolvedValue(
        makeMatchResponse({
          skillsScore: 60,
          experienceScore: 55,
          educationScore: 60,
          certificationScore: 30,
          semanticScore: 58,
          recommendation: 'MAYBE',
        })
      );

      const result = await analyzeMatch(AVERAGE_RESUME, SAMPLE_JOB);
      expect(result.skillsScore).toBe(60);
      expect(result.recommendation).toBe('MAYBE');
    });
  });

  // ---- Weak candidate -------------------------------------

  describe('weak candidate', () => {
    it('returns low scores for a weak candidate', async () => {
      mockComplete.mockResolvedValue(
        makeMatchResponse({
          skillsScore: 10,
          experienceScore: 5,
          educationScore: 20,
          certificationScore: 0,
          semanticScore: 15,
          matchedSkills: [],
          missingSkills: ['TypeScript', 'Node.js', 'PostgreSQL', 'REST API design'],
          recommendation: 'REJECT',
          confidence: 40,
        })
      );

      const result = await analyzeMatch(WEAK_RESUME, SAMPLE_JOB);
      expect(result.skillsScore).toBe(10);
      expect(result.recommendation).toBe('REJECT');
      expect(result.matchedSkills).toHaveLength(0);
      expect(result.missingSkills).toContain('TypeScript');
    });
  });

  // ---- Missing skills -------------------------------------

  describe('missing skills scenario', () => {
    it('lists missing required skills correctly', async () => {
      mockComplete.mockResolvedValue(
        makeMatchResponse({
          matchedSkills: ['Node.js'],
          missingSkills: ['TypeScript', 'PostgreSQL', 'REST API design'],
          preferredSkillsMatched: [],
        })
      );

      const result = await analyzeMatch(AVERAGE_RESUME, SAMPLE_JOB);
      expect(result.missingSkills).toContain('TypeScript');
      expect(result.missingSkills).toContain('PostgreSQL');
      expect(result.preferredSkillsMatched).toHaveLength(0);
    });
  });

  // ---- Missing experience ---------------------------------

  describe('missing experience scenario', () => {
    it('returns low experienceScore when candidate lacks experience', async () => {
      mockComplete.mockResolvedValue(
        makeMatchResponse({
          experienceScore: 20,
          experienceAnalysis:
            'Candidate has 2 years of experience; role requires 5+ years.',
          recommendation: 'REJECT',
        })
      );

      const result = await analyzeMatch(WEAK_RESUME, SAMPLE_JOB);
      expect(result.experienceScore).toBe(20);
      expect(result.experienceAnalysis).toContain('5+');
    });
  });

  // ---- Structural mapping ---------------------------------

  describe('field mapping', () => {
    it('maps all LLM response fields to MatchResult correctly', async () => {
      mockComplete.mockResolvedValue(makeMatchResponse());
      const result = await analyzeMatch(STRONG_RESUME, SAMPLE_JOB);

      expect(result.skillsScore).toBe(80);
      expect(result.experienceScore).toBe(75);
      expect(result.educationScore).toBe(85);
      expect(result.certificationScore).toBe(90);
      expect(result.semanticScore).toBe(80);
      expect(result.strengths).toHaveLength(2);
      expect(result.gaps).toHaveLength(1);
      expect(result.experienceAnalysis).toBeTruthy();
      expect(result.educationAnalysis).toBeTruthy();
      expect(result.justification).toBeTruthy();
      expect(result.confidence).toBe(85);
    });

    it('accepts all valid recommendation values', async () => {
      for (const rec of ['STRONG_HIRE', 'HIRE', 'MAYBE', 'REJECT'] as const) {
        mockComplete.mockResolvedValue(makeMatchResponse({ recommendation: rec }));
        const result = await analyzeMatch(STRONG_RESUME, SAMPLE_JOB);
        expect(result.recommendation).toBe(rec);
      }
    });
  });

  // ---- Markdown stripping ---------------------------------

  describe('markdown code fence handling', () => {
    it('strips ```json code fences from LLM response', async () => {
      mockComplete.mockResolvedValue(`\`\`\`json\n${makeMatchResponse()}\n\`\`\``);
      const result = await analyzeMatch(STRONG_RESUME, SAMPLE_JOB);
      expect(result.skillsScore).toBe(80);
    });
  });

  // ---- Error handling ------------------------------------

  describe('error handling', () => {
    it('throws LLMError on malformed JSON', async () => {
      mockComplete.mockResolvedValue('not valid json {{{');
      await expect(analyzeMatch(STRONG_RESUME, SAMPLE_JOB)).rejects.toThrow(LLMError);
    });

    it('includes "malformed JSON" in message for bad JSON', async () => {
      mockComplete.mockResolvedValue('garbage');
      try {
        await analyzeMatch(STRONG_RESUME, SAMPLE_JOB);
        expect.fail('Should have thrown');
      } catch (err) {
        expect((err as LLMError).message).toContain('malformed JSON');
      }
    });

    it('throws LLMError when schema validation fails (invalid recommendation)', async () => {
      mockComplete.mockResolvedValue(makeMatchResponse({ recommendation: 'EXCELLENT' }));
      await expect(analyzeMatch(STRONG_RESUME, SAMPLE_JOB)).rejects.toThrow(LLMError);
    });

    it('throws LLMError when a score is out of Zod integer range (schema uses int)', async () => {
      mockComplete.mockResolvedValue(makeMatchResponse({ skillsScore: 105 }));
      await expect(analyzeMatch(STRONG_RESUME, SAMPLE_JOB)).rejects.toThrow(LLMError);
    });

    it('re-throws LLMError from client (timeout, rate limit)', async () => {
      mockComplete.mockRejectedValue(new LLMError('LLM request timed out'));
      await expect(analyzeMatch(STRONG_RESUME, SAMPLE_JOB)).rejects.toThrow(LLMError);
    });
  });
});
