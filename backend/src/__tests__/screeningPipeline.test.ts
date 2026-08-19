import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runScreeningPipeline, ResumeUpload } from '../services/screeningPipeline.service';
import { analyzeJobDescription } from '../services/jobAnalysis.service';
import { extractTextFromPdf } from '../services/pdfExtractor';
import { extractResumeData } from '../services/resumeExtraction.service';
import { analyzeMatch } from '../services/matchingEngine.service';
import { calculateOverallScore } from '../services/scoreCalculator';

// ---- Mocks -------------------------------------------------

vi.mock('../services/jobAnalysis.service');
vi.mock('../services/pdfExtractor');
vi.mock('../services/resumeExtraction.service');
vi.mock('../services/matchingEngine.service');
vi.mock('../services/scoreCalculator');

const mockAnalyzeJob = vi.mocked(analyzeJobDescription);
const mockExtractText = vi.mocked(extractTextFromPdf);
const mockExtractResume = vi.mocked(extractResumeData);
const mockAnalyzeMatch = vi.mocked(analyzeMatch);
const mockCalculateScore = vi.mocked(calculateOverallScore);

// ---- Test Data ---------------------------------------------

const SAMPLE_JOB = {
  roleTitle: 'Engineer',
  requiredSkills: [],
  preferredSkills: [],
  requiredExperience: { years: null, description: '' },
  educationRequirements: [],
  certifications: [],
  responsibilities: [],
  keywords: [],
};

const makeParsedResume = (name: string) => ({
  fileName: `${name}.pdf`,
  candidateName: name,
  email: null,
  phone: null,
  skills: [],
  education: [],
  workExperience: [],
  certifications: [],
});

const makeMatch = () => ({
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
  experienceAnalysis: '',
  educationAnalysis: '',
  recommendation: 'MAYBE' as const,
  justification: '',
  confidence: 80,
});

// ---- Tests -------------------------------------------------

describe('runScreeningPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fails completely if job description analysis fails', async () => {
    mockAnalyzeJob.mockRejectedValue(new Error('Job analysis failed'));
    
    await expect(
      runScreeningPipeline('jd text', [])
    ).rejects.toThrow('Job analysis failed');
    
    expect(mockExtractText).not.toHaveBeenCalled();
  });

  it('processes resumes, ranks them, and applies shortlist threshold', async () => {
    const resumes: ResumeUpload[] = [
      { fileName: 'alice.pdf', buffer: Buffer.from('alice') },
      { fileName: 'bob.pdf', buffer: Buffer.from('bob') },
      { fileName: 'charlie.pdf', buffer: Buffer.from('charlie') },
    ];

    mockAnalyzeJob.mockResolvedValue(SAMPLE_JOB);
    mockExtractText.mockResolvedValue('dummy text');
    
    // Alice = 90, Bob = 60, Charlie = 80
    mockExtractResume
      .mockResolvedValueOnce(makeParsedResume('Alice'))
      .mockResolvedValueOnce(makeParsedResume('Bob'))
      .mockResolvedValueOnce(makeParsedResume('Charlie'));
      
    mockAnalyzeMatch.mockResolvedValue(makeMatch());
    
    mockCalculateScore
      .mockReturnValueOnce(90) // Alice
      .mockReturnValueOnce(60) // Bob
      .mockReturnValueOnce(80); // Charlie

    const result = await runScreeningPipeline('jd text', resumes, { shortlistThreshold: 75 });

    expect(result.job).toEqual(SAMPLE_JOB);
    expect(result.summary.total).toBe(3);
    expect(result.summary.screened).toBe(3);
    expect(result.summary.failed).toBe(0);
    expect(result.summary.shortlisted).toBe(2);

    // Should be sorted by score descending: Alice (90), Charlie (80), Bob (60)
    expect(result.candidates).toHaveLength(3);
    
    expect(result.candidates[0].resume.candidateName).toBe('Alice');
    expect(result.candidates[0].scores.overall).toBe(90);
    expect(result.candidates[0].rank).toBe(1);
    expect(result.candidates[0].shortlisted).toBe(true);
    
    expect(result.candidates[1].resume.candidateName).toBe('Charlie');
    expect(result.candidates[1].scores.overall).toBe(80);
    expect(result.candidates[1].rank).toBe(2);
    expect(result.candidates[1].shortlisted).toBe(true);
    
    expect(result.candidates[2].resume.candidateName).toBe('Bob');
    expect(result.candidates[2].scores.overall).toBe(60);
    expect(result.candidates[2].rank).toBe(3);
    expect(result.candidates[2].shortlisted).toBe(false); // 60 < 75
  });

  it('preserves individual failures without crashing the batch', async () => {
    const resumes: ResumeUpload[] = [
      { fileName: 'good.pdf', buffer: Buffer.from('good') },
      { fileName: 'bad.pdf', buffer: Buffer.from('bad') },
    ];

    mockAnalyzeJob.mockResolvedValue(SAMPLE_JOB);
    
    // good.pdf succeeds
    mockExtractText.mockImplementation(async (buf) => {
      if (buf.toString() === 'bad') throw new Error('PDF Corrupted');
      return 'good text';
    });
    
    mockExtractResume.mockResolvedValue(makeParsedResume('Good'));
    mockAnalyzeMatch.mockResolvedValue(makeMatch());
    mockCalculateScore.mockReturnValue(80);

    const result = await runScreeningPipeline('jd text', resumes);

    expect(result.summary.total).toBe(2);
    expect(result.summary.screened).toBe(1);
    expect(result.summary.failed).toBe(1);
    
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].resume.candidateName).toBe('Good');
    
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].fileName).toBe('bad.pdf');
    expect(result.failed[0].error).toContain('PDF Corrupted');
  });

  it('uses default threshold of 75 if not provided', async () => {
    const resumes: ResumeUpload[] = [
      { fileName: 'bob.pdf', buffer: Buffer.from('bob') },
    ];
    mockAnalyzeJob.mockResolvedValue(SAMPLE_JOB);
    mockExtractText.mockResolvedValue('dummy');
    mockExtractResume.mockResolvedValue(makeParsedResume('Bob'));
    mockAnalyzeMatch.mockResolvedValue(makeMatch());
    mockCalculateScore.mockReturnValue(74); // Just under default 75

    const result = await runScreeningPipeline('jd text', resumes); // no options
    expect(result.candidates[0].shortlisted).toBe(false);
  });
});
