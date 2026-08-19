import type { ScoredCandidate } from '../types/api';
import { ScoreRing } from './ScoreRing';
import { Badge } from './Badge';
import { ArrowLeft, Check, X, Sparkles, AlertTriangle, BookOpen, Briefcase, BrainCircuit } from 'lucide-react';

export function CandidateDetails({
  candidate,
  onBack
}: {
  candidate: ScoredCandidate;
  onBack: () => void;
}) {
  const { resume, scores, analysis } = candidate;

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors border border-slate-700 hover:border-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            {resume.candidateName || 'Unknown Candidate'}
            {candidate.shortlisted && <Badge variant="success">Shortlisted</Badge>}
          </h1>
          <p className="text-sm text-slate-400">
            {resume.fileName} • Rank #{candidate.rank}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Scores & AI Justification */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Main Score Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles className="w-24 h-24 text-indigo-500" />
            </div>
            
            <div className="flex flex-col items-center justify-center mb-6 relative z-10">
              <ScoreRing score={scores.overall} size="lg" />
              <p className="text-sm text-slate-400 font-medium uppercase tracking-widest mt-4">
                Overall Match
              </p>
            </div>

            <div className="space-y-4 relative z-10">
              <ScoreBar label="Skills (45%)" score={scores.skills} />
              <ScoreBar label="Experience (30%)" score={scores.experience} />
              <ScoreBar label="Education (10%)" score={scores.education} />
              <ScoreBar label="Semantic Fit (10%)" score={scores.semanticFit} />
              <ScoreBar label="Certifications (5%)" score={scores.certification} />
            </div>
          </div>

          {/* AI Justification */}
          <div className="bg-slate-800/40 border border-indigo-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3 text-indigo-300">
              <BrainCircuit className="w-5 h-5" />
              <h3 className="font-semibold">AI Justification</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed italic">
              "{analysis.justification}"
            </p>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>Recommendation: <strong>{analysis.recommendation}</strong></span>
              <span>Confidence: {analysis.confidence}%</span>
            </div>
          </div>
        </div>

        {/* Right Column - Deep Dive */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* "Why this candidate?" - Explainable AI */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-3">Why this candidate?</h3>
            
            <div className="space-y-6">
              
              {/* Matched Skills */}
              {analysis.matchedSkills.length > 0 && (
                <div className="space-y-4">
                  {analysis.matchedSkills.map((match, idx) => (
                    <div key={idx} className="bg-slate-800/50 rounded-lg p-4 border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="w-5 h-5 text-emerald-500" />
                        <span className="font-semibold text-slate-200">{match.skill}</span>
                        <Badge variant="success" className="ml-auto">Matched</Badge>
                      </div>
                      <div className="text-sm text-slate-400 pl-7 border-l-2 border-slate-700 ml-2 py-1">
                        <span className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Evidence</span>
                        {match.evidence}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Preferred Skills */}
              {analysis.preferredSkillsMatched.length > 0 && (
                <div className="space-y-4">
                  {analysis.preferredSkillsMatched.map((match, idx) => (
                    <div key={`pref-${idx}`} className="bg-slate-800/50 rounded-lg p-4 border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="w-5 h-5 text-emerald-500" />
                        <span className="font-semibold text-slate-200">{match.skill}</span>
                        <Badge variant="outline" className="ml-auto border-emerald-500/30 text-emerald-400">Preferred</Badge>
                      </div>
                      <div className="text-sm text-slate-400 pl-7 border-l-2 border-slate-700 ml-2 py-1">
                        <span className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Evidence</span>
                        {match.evidence}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Missing Skills */}
              {analysis.missingSkills.length > 0 && (
                <div className="space-y-4">
                  {analysis.missingSkills.map((match, idx) => (
                    <div key={`miss-${idx}`} className="bg-slate-800/30 rounded-lg p-4 border border-rose-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <X className="w-5 h-5 text-rose-500" />
                        <span className="font-semibold text-slate-200">{match.skill}</span>
                        <Badge variant="danger" className="ml-auto">Missing</Badge>
                      </div>
                      <div className="text-sm text-slate-400 pl-7 border-l-2 border-slate-700 ml-2 py-1">
                        <span className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Evidence</span>
                        {match.evidence}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

          {/* Strengths and Gaps */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Qualitative Analysis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Key Strengths
                </h4>
                <ul className="space-y-2">
                  {analysis.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Identified Gaps
                </h4>
                <ul className="space-y-2">
                  {analysis.gaps.map((g, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Detailed Context */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                Experience Context
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {analysis.experienceAnalysis}
              </p>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Education Context
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {analysis.educationAnalysis}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  let color = 'bg-emerald-500';
  if (score < 50) color = 'bg-rose-500';
  else if (score < 75) color = 'bg-amber-500';

  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-medium text-slate-300">{label}</span>
        <span className="text-slate-400">{Math.round(score)}/100</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div className={`${color} h-2 rounded-full transition-all duration-1000`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
