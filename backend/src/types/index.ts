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

export interface AnalyzedJob {
  roleTitle: string;
  requiredSkills: string[];
  preferredSkills: string[];
  requiredExperience: string;
  educationRequirements: string;
  certifications: string[];
  responsibilities: string[];
  keywords: string[];
}

// ---- Matching / scoring types ------------------------------

export type Recommendation = 'STRONG_HIRE' | 'HIRE' | 'MAYBE' | 'REJECT';
export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface MatchResult {
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  gaps: string[];
  experienceAnalysis: string;
  educationAnalysis: string;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  certificationScore: number;
  semanticFitScore: number;
  recommendation: Recommendation;
  justification: string;
  confidence: Confidence;
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
  processingTimeMs: number;
}

export interface ScreeningResponse {
  job: AnalyzedJob;
  candidates: ScoredCandidate[];
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
