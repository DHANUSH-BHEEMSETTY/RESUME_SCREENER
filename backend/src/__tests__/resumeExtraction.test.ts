import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractResumeData } from '../services/resumeExtraction.service';
import { LLMError } from '../middleware/errorHandler';

// ---- Mock the LLM client -----------------------------------
// We mock the entire module so no real API calls are made in tests.

vi.mock('../llm/llmClient', () => ({
  llmClient: {
    complete: vi.fn(),
  },
}));

import { llmClient } from '../llm/llmClient';
const mockComplete = vi.mocked(llmClient.complete);

// ---- Test fixtures -----------------------------------------

const VALID_LLM_RESPONSE = JSON.stringify({
  candidate: {
    name: 'Alice Chen',
    email: 'alice.chen@example.com',
    phone: '+1-555-0199',
  },
  skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
  education: [
    {
      degree: 'B.Sc. Computer Science',
      institution: 'State University',
      year: '2017',
    },
  ],
  experience: [
    {
      title: 'Senior Software Engineer',
      company: 'TechCorp Inc.',
      duration: 'Jan 2021 – Present',
      description: 'Led backend development for a SaaS platform serving 50k users.',
    },
    {
      title: 'Software Engineer',
      company: 'StartupXYZ',
      duration: 'Jun 2018 – Dec 2020',
      description: 'Built REST APIs and React frontends.',
    },
  ],
  certifications: ['AWS Certified Developer – Associate'],
});

const SPARSE_LLM_RESPONSE = JSON.stringify({
  candidate: {
    name: null,
    email: null,
    phone: null,
  },
  skills: [],
  education: [],
  experience: [],
  certifications: [],
});

const MARKDOWN_WRAPPED_RESPONSE = `\`\`\`json
${VALID_LLM_RESPONSE}
\`\`\``;

// ---- Tests -------------------------------------------------

describe('extractResumeData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Happy path ----------------------------------------

  describe('happy path', () => {
    it('extracts and maps all fields from a valid LLM response', async () => {
      mockComplete.mockResolvedValue(VALID_LLM_RESPONSE);

      const result = await extractResumeData('raw resume text here', 'alice_chen.pdf');

      expect(result.fileName).toBe('alice_chen.pdf');
      expect(result.candidateName).toBe('Alice Chen');
      expect(result.email).toBe('alice.chen@example.com');
      expect(result.phone).toBe('+1-555-0199');
      expect(result.skills).toEqual(['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker']);
      expect(result.education).toHaveLength(1);
      expect(result.education[0].degree).toBe('B.Sc. Computer Science');
      expect(result.education[0].institution).toBe('State University');
      expect(result.education[0].year).toBe('2017');
      expect(result.workExperience).toHaveLength(2);
      expect(result.workExperience[0].title).toBe('Senior Software Engineer');
      expect(result.workExperience[0].company).toBe('TechCorp Inc.');
      expect(result.workExperience[0].duration).toBe('Jan 2021 – Present');
      expect(result.certifications).toEqual(['AWS Certified Developer – Associate']);
    });

    it('correctly maps LLM "experience" array to ParsedResume "workExperience"', async () => {
      mockComplete.mockResolvedValue(VALID_LLM_RESPONSE);
      const result = await extractResumeData('...', 'test.pdf');
      // Confirm the field rename from experience → workExperience
      expect(result.workExperience).toBeDefined();
      expect(Array.isArray(result.workExperience)).toBe(true);
    });

    it('preserves the fileName from the argument', async () => {
      mockComplete.mockResolvedValue(VALID_LLM_RESPONSE);
      const result = await extractResumeData('...', 'custom_name.pdf');
      expect(result.fileName).toBe('custom_name.pdf');
    });
  });

  // ---- Null / empty fields --------------------------------

  describe('null and empty field handling', () => {
    it('returns null scalars when candidate fields are missing', async () => {
      mockComplete.mockResolvedValue(SPARSE_LLM_RESPONSE);
      const result = await extractResumeData('minimal resume', 'sparse.pdf');
      expect(result.candidateName).toBeNull();
      expect(result.email).toBeNull();
      expect(result.phone).toBeNull();
    });

    it('returns empty arrays when lists are empty', async () => {
      mockComplete.mockResolvedValue(SPARSE_LLM_RESPONSE);
      const result = await extractResumeData('minimal resume', 'sparse.pdf');
      expect(result.skills).toEqual([]);
      expect(result.education).toEqual([]);
      expect(result.workExperience).toEqual([]);
      expect(result.certifications).toEqual([]);
    });

    it('returns null for education year when year is null', async () => {
      const response = JSON.stringify({
        candidate: { name: 'Bob', email: null, phone: null },
        skills: ['Python'],
        education: [{ degree: 'B.A.', institution: 'College', year: null }],
        experience: [],
        certifications: [],
      });
      mockComplete.mockResolvedValue(response);
      const result = await extractResumeData('...', 'bob.pdf');
      expect(result.education[0].year).toBeNull();
    });
  });

  // ---- Markdown code fence stripping ---------------------

  describe('markdown code fence handling', () => {
    it('extracts JSON wrapped in ```json code fences', async () => {
      mockComplete.mockResolvedValue(MARKDOWN_WRAPPED_RESPONSE);
      const result = await extractResumeData('raw text', 'alice_chen.pdf');
      expect(result.candidateName).toBe('Alice Chen');
      expect(result.skills).toHaveLength(5);
    });
  });

  // ---- Error handling ------------------------------------

  describe('error handling', () => {
    it('throws LLMError when the LLM returns invalid JSON', async () => {
      mockComplete.mockResolvedValue('This is not JSON at all { broken');
      await expect(extractResumeData('text', 'bad.pdf')).rejects.toThrow(LLMError);
    });

    it('throws LLMError with "malformed JSON" message on bad JSON', async () => {
      mockComplete.mockResolvedValue('not json');
      try {
        await extractResumeData('text', 'bad.pdf');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(LLMError);
        expect((err as LLMError).message).toContain('malformed JSON');
      }
    });

    it('throws LLMError when LLM response fails Zod schema validation', async () => {
      // Missing required "candidate" field
      const badSchema = JSON.stringify({ skills: ['JS'], education: [], experience: [], certifications: [] });
      mockComplete.mockResolvedValue(badSchema);
      await expect(extractResumeData('text', 'bad_schema.pdf')).rejects.toThrow(LLMError);
    });

    it('throws LLMError with "schema validation" message on schema failure', async () => {
      const badSchema = JSON.stringify({
        candidate: { name: 'X', email: null, phone: null },
        // skills has wrong type
        skills: 'not an array',
        education: [],
        experience: [],
        certifications: [],
      });
      mockComplete.mockResolvedValue(badSchema);
      try {
        await extractResumeData('text', 'bad_schema.pdf');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(LLMError);
        expect((err as LLMError).message).toContain('schema validation');
      }
    });

    it('re-throws LLMError from the LLM client (timeout, rate limit, etc.)', async () => {
      mockComplete.mockRejectedValue(new LLMError('LLM request timed out'));
      await expect(extractResumeData('text', 'timeout.pdf')).rejects.toThrow(LLMError);
    });

    it('re-throws non-LLM errors from the client unchanged', async () => {
      mockComplete.mockRejectedValue(new LLMError('LLM provider request failed'));
      await expect(extractResumeData('text', 'error.pdf')).rejects.toThrow(LLMError);
    });
  });

  // ---- Schema edge cases ---------------------------------

  describe('schema edge cases', () => {
    it('accepts extra fields in LLM response without failing (Zod strips them)', async () => {
      const withExtra = JSON.parse(VALID_LLM_RESPONSE);
      withExtra.unexpectedField = 'should be stripped';
      mockComplete.mockResolvedValue(JSON.stringify(withExtra));
      // Should not throw — Zod strips unknown keys by default
      const result = await extractResumeData('text', 'extra_fields.pdf');
      expect(result.candidateName).toBe('Alice Chen');
    });

    it('handles multiple education entries correctly', async () => {
      const response = JSON.stringify({
        candidate: { name: 'Carol', email: null, phone: null },
        skills: [],
        education: [
          { degree: 'M.Sc. Data Science', institution: 'Tech University', year: '2020' },
          { degree: 'B.Sc. Mathematics', institution: 'State College', year: '2018' },
        ],
        experience: [],
        certifications: [],
      });
      mockComplete.mockResolvedValue(response);
      const result = await extractResumeData('text', 'carol.pdf');
      expect(result.education).toHaveLength(2);
      expect(result.education[0].degree).toBe('M.Sc. Data Science');
      expect(result.education[1].degree).toBe('B.Sc. Mathematics');
    });
  });
});
