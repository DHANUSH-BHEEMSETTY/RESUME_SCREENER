// ============================================================
// Shared TypeScript types for the Smart Resume Screener API
// ============================================================

// ---- Resume types ------------------------------------------

export interface EducationEntry {
  degree: string;
  institution: string;
  year: string | null;
}

export interface WorkExperienceEntry {
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface ParsedResume {
  fileName: string;
  candidateName: string | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  education: EducationEntry[];
  workExperience: WorkExperienceEntry[];
  certifications: string[];
}

// ---- Job description types ---------------------------------

export interface RequiredExperience {
  years: number | null;
  description: string;
}

export interface AnalyzedJob {
  roleTitle: string;
  requiredSkills: string[];
  preferredSkills: string[];
  requiredExperience: RequiredExperience;
  educationRequirements: string[];
  certifications: string[];
  responsibilities: string[];
  keywords: string[];
}

// ---- Matching / scoring types ------------------------------

export type Recommendation = 'STRONG_HIRE' | 'HIRE' | 'MAYBE' | 'REJECT';

export interface SkillMatch {
  skill: string;
  evidence: string;
}

export interface MatchResult {
  // Component scores (0-100) — provided by LLM, clamped before use
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  certificationScore: number;
  semanticScore: number;

  // Skill matching
  matchedSkills: SkillMatch[];           // skills in BOTH resume and job (required)
  missingSkills: SkillMatch[];           // required/preferred skills NOT in resume
  preferredSkillsMatched: SkillMatch[];  // preferred skills present in resume

  // Qualitative analysis
  strengths: string[];
  gaps: string[];
  experienceAnalysis: string;
  educationAnalysis: string;

  // Decision
  recommendation: Recommendation;
  justification: string;
  confidence: number;  // 0-100: how complete/reliable is the resume data?
}

export interface CandidateScores {
  skills: number;
  experience: number;
  education: number;
  certification: number;
  semanticFit: number;
  overall: number;
}

export interface ScoredCandidate {
  rank: number;
  shortlisted: boolean;
  resume: ParsedResume;
  scores: CandidateScores;
  analysis: MatchResult;
}

// ---- API response types ------------------------------------

export interface ScreeningSummary {
  total: number;
  shortlisted: number;
  screened: number;
  failed: number;
  processingTimeMs: number;
}

export interface ScreeningError {
  fileName: string;
  error: string;
}

export interface ScreeningResponse {
  job: AnalyzedJob;
  candidates: ScoredCandidate[];
  failed: ScreeningError[];
  summary: ScreeningSummary;
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  llm: 'connected' | 'not_configured' | 'error';
  model: string;
  uptime: number;
  timestamp: string;
  version: string;
}

// ---- Error types -------------------------------------------

export interface ApiError {
  error: string;
  details?: string;
  requestId?: string;
}

// ---- Request body types ------------------------------------

export interface ScreeningOptions {
  shortlistThreshold?: number;
}
