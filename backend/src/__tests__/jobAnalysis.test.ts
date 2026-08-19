import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeJobDescription } from '../services/jobAnalysis.service';
import { LLMError, ValidationError } from '../middleware/errorHandler';

// ---- Mock the LLM client -----------------------------------

vi.mock('../llm/llmClient', () => ({
  llmClient: { complete: vi.fn() },
}));

import { llmClient } from '../llm/llmClient';
const mockComplete = vi.mocked(llmClient.complete);

// ---- Test fixtures -----------------------------------------

const VALID_LLM_RESPONSE = JSON.stringify({
  roleTitle: 'Senior Software Engineer',
  requiredSkills: ['TypeScript', 'Node.js', 'PostgreSQL', 'REST API design'],
  preferredSkills: ['GraphQL', 'Docker', 'Kubernetes'],
  requiredExperience: {
    years: 5,
    description: '5+ years of full-stack development experience',
  },
  educationRequirements: ["Bachelor's degree in Computer Science or related field"],
  certifications: ['AWS Certified Developer'],
  responsibilities: [
    'Design and implement scalable web applications',
    'Mentor junior engineers',
    'Conduct code reviews',
  ],
  keywords: ['microservices', 'CI/CD', 'agile', 'SaaS'],
});

const NO_DISTINCTION_LLM_RESPONSE = JSON.stringify({
  roleTitle: 'Data Analyst',
  requiredSkills: ['Python', 'SQL', 'Tableau'],
  preferredSkills: [],
  requiredExperience: {
    years: null,
    description: 'Experience in data analysis and reporting',
  },
  educationRequirements: [],
  certifications: [],
  responsibilities: ['Analyze datasets', 'Build dashboards'],
  keywords: ['data visualization', 'reporting'],
});

const MARKDOWN_WRAPPED = `\`\`\`json\n${VALID_LLM_RESPONSE}\n\`\`\``;

const SAMPLE_JD = `
Senior Software Engineer

We are looking for a Senior Software Engineer with 5+ years of experience.

Required Skills: TypeScript, Node.js, PostgreSQL, REST API design
Preferred Skills: GraphQL, Docker, Kubernetes

Responsibilities:
- Design and implement scalable web applications
- Mentor junior engineers
- Conduct code reviews

Requirements:
- Bachelor's degree in Computer Science or related field
- 5+ years of full-stack development experience
- AWS Certified Developer certification
`.trim();

// ---- Tests -------------------------------------------------

describe('analyzeJobDescription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Happy path ----------------------------------------

  describe('happy path', () => {
    it('extracts all fields from a valid LLM response', async () => {
      mockComplete.mockResolvedValue(VALID_LLM_RESPONSE);
      const result = await analyzeJobDescription(SAMPLE_JD);

      expect(result.roleTitle).toBe('Senior Software Engineer');
      expect(result.requiredSkills).toEqual(['TypeScript', 'Node.js', 'PostgreSQL', 'REST API design']);
      expect(result.preferredSkills).toEqual(['GraphQL', 'Docker', 'Kubernetes']);
      expect(result.requiredExperience.years).toBe(5);
      expect(result.requiredExperience.description).toBe('5+ years of full-stack development experience');
      expect(result.educationRequirements).toEqual(["Bachelor's degree in Computer Science or related field"]);
      expect(result.certifications).toEqual(['AWS Certified Developer']);
      expect(result.responsibilities).toHaveLength(3);
      expect(result.keywords).toEqual(['microservices', 'CI/CD', 'agile', 'SaaS']);
    });

    it('returns structured requiredExperience object', async () => {
      mockComplete.mockResolvedValue(VALID_LLM_RESPONSE);
      const result = await analyzeJobDescription(SAMPLE_JD);
      expect(result.requiredExperience).toMatchObject({
        years: expect.any(Number),
        description: expect.any(String),
      });
    });

    it('handles JD with no preferred/required distinction (preferredSkills is [])', async () => {
      mockComplete.mockResolvedValue(NO_DISTINCTION_LLM_RESPONSE);
      const result = await analyzeJobDescription(SAMPLE_JD);
      expect(result.preferredSkills).toEqual([]);
      expect(result.requiredSkills).toEqual(['Python', 'SQL', 'Tableau']);
    });

    it('handles null experience years when not stated in JD', async () => {
      mockComplete.mockResolvedValue(NO_DISTINCTION_LLM_RESPONSE);
      const result = await analyzeJobDescription(SAMPLE_JD);
      expect(result.requiredExperience.years).toBeNull();
      expect(result.requiredExperience.description).toBeTruthy();
    });

    it('handles empty education, certifications when not mentioned', async () => {
      mockComplete.mockResolvedValue(NO_DISTINCTION_LLM_RESPONSE);
      const result = await analyzeJobDescription(SAMPLE_JD);
      expect(result.educationRequirements).toEqual([]);
      expect(result.certifications).toEqual([]);
    });
  });

  // ---- Markdown code fence stripping ---------------------

  describe('markdown code fence handling', () => {
    it('extracts JSON from ```json code fences', async () => {
      mockComplete.mockResolvedValue(MARKDOWN_WRAPPED);
      const result = await analyzeJobDescription(SAMPLE_JD);
      expect(result.roleTitle).toBe('Senior Software Engineer');
      expect(result.requiredSkills).toHaveLength(4);
    });
  });

  // ---- Input validation ----------------------------------

  describe('input validation', () => {
    it('throws ValidationError when JD text is too short', async () => {
      await expect(analyzeJobDescription('Too short')).rejects.toThrow(ValidationError);
    });

    it('includes "too short" in the ValidationError message', async () => {
      try {
        await analyzeJobDescription('Short');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        expect((err as ValidationError).message).toContain('too short');
      }
    });

    it('throws ValidationError when JD text exceeds maximum length', async () => {
      const tooLong = 'A'.repeat(15_001);
      await expect(analyzeJobDescription(tooLong)).rejects.toThrow(ValidationError);
    });

    it('does NOT call LLM when input validation fails', async () => {
      try {
        await analyzeJobDescription('Short');
      } catch {
        // expected
      }
      expect(mockComplete).not.toHaveBeenCalled();
    });
  });

  // ---- Error handling ------------------------------------

  describe('error handling', () => {
    it('throws LLMError when LLM returns invalid JSON', async () => {
      mockComplete.mockResolvedValue('not json at all {{{');
      await expect(analyzeJobDescription(SAMPLE_JD)).rejects.toThrow(LLMError);
    });

    it('includes "malformed JSON" in message on bad JSON', async () => {
      mockComplete.mockResolvedValue('garbage');
      try {
        await analyzeJobDescription(SAMPLE_JD);
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(LLMError);
        expect((err as LLMError).message).toContain('malformed JSON');
      }
    });

    it('throws LLMError when LLM response fails Zod validation', async () => {
      // Missing required roleTitle
      const bad = JSON.stringify({
        requiredSkills: ['TypeScript'],
        preferredSkills: [],
        requiredExperience: { years: 3, description: 'test' },
        educationRequirements: [],
        certifications: [],
        responsibilities: [],
        keywords: [],
      });
      mockComplete.mockResolvedValue(bad);
      await expect(analyzeJobDescription(SAMPLE_JD)).rejects.toThrow(LLMError);
    });

    it('includes "schema validation" in message on validation failure', async () => {
      const bad = JSON.stringify({
        roleTitle: 'Engineer',
        requiredSkills: 'not an array', // wrong type
        preferredSkills: [],
        requiredExperience: { years: null, description: '' },
        educationRequirements: [],
        certifications: [],
        responsibilities: [],
        keywords: [],
      });
      mockComplete.mockResolvedValue(bad);
      try {
        await analyzeJobDescription(SAMPLE_JD);
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(LLMError);
        expect((err as LLMError).message).toContain('schema validation');
      }
    });

    it('re-throws LLMError from the client (timeout, rate limit)', async () => {
      mockComplete.mockRejectedValue(new LLMError('LLM request timed out'));
      await expect(analyzeJobDescription(SAMPLE_JD)).rejects.toThrow(LLMError);
    });
  });

  // ---- Schema edge cases ---------------------------------

  describe('schema edge cases', () => {
    it('strips extra fields from LLM response', async () => {
      const withExtra = JSON.parse(VALID_LLM_RESPONSE);
      withExtra.unknownField = 'should be stripped';
      mockComplete.mockResolvedValue(JSON.stringify(withExtra));
      const result = await analyzeJobDescription(SAMPLE_JD);
      expect((result as Record<string, unknown>).unknownField).toBeUndefined();
    });

    it('accepts empty arrays for all list fields', async () => {
      const minimal = JSON.stringify({
        roleTitle: 'Generic Role',
        requiredSkills: [],
        preferredSkills: [],
        requiredExperience: { years: null, description: 'Some experience required' },
        educationRequirements: [],
        certifications: [],
        responsibilities: [],
        keywords: [],
      });
      mockComplete.mockResolvedValue(minimal);
      const result = await analyzeJobDescription(SAMPLE_JD);
      expect(result.roleTitle).toBe('Generic Role');
      expect(result.requiredSkills).toEqual([]);
    });
  });
});
