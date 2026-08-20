import type { ScoredCandidate } from '../types/api';
import { ScoreRing } from './ScoreRing';
import { ArrowLeft, Check, X, Sparkles, BookOpen, Briefcase, BrainCircuit } from 'lucide-react';

export function CandidateDetails({
  candidate,
  onBack
}: {
  candidate: ScoredCandidate;
  onBack: () => void;
}) {
  const { resume, scores, analysis } = candidate;

  return (
    <div className="flex flex-col gap-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-3 bg-background/50 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 transition-colors backdrop-blur-md"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-widest uppercase flex items-center gap-4">
            {resume.candidateName || 'Unknown Entity'}
            {candidate.shortlisted && (
              <span className="text-[10px] font-mono text-cyan-400 border border-cyan-500/50 bg-cyan-950/30 px-2 py-1 tracking-widest shadow-[0_0_10px_rgba(94,234,212,0.2)]">
                SHORTLISTED
              </span>
            )}
          </h1>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">
            File: {resume.fileName} &nbsp;|&nbsp; Rank: {candidate.rank.toString().padStart(2, '0')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Scores & AI Justification */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Main Score Card */}
          <div className="bg-background/40 backdrop-blur-md border border-slate-800/80 p-6 relative overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles className="w-24 h-24 text-cyan-500" />
            </div>
            
            <div className="flex flex-col items-center justify-center mb-8 relative z-10">
              <ScoreRing score={scores.overall} size="lg" />
              <p className="text-[10px] font-mono text-cyan-500 font-bold uppercase tracking-widest mt-6">
                Score Integrity
              </p>
            </div>

            <div className="space-y-5 relative z-10">
              <ScoreBar label="Skills Evidence" score={scores.skills} />
              <ScoreBar label="Experience Match" score={scores.experience} />
              <ScoreBar label="Education Depth" score={scores.education} />
              <ScoreBar label="Semantic Fit" score={scores.semanticFit} />
              <ScoreBar label="Certifications" score={scores.certification} />
            </div>
          </div>

          {/* AI Justification */}
          <div className="bg-magenta-950/10 backdrop-blur-md border border-magenta-500/20 p-5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4 text-magenta-400">
              <BrainCircuit className="w-4 h-4" />
              <h3 className="font-mono text-xs uppercase tracking-widest font-bold">Neural Evaluation</h3>
            </div>
            <p className="text-xs font-mono text-slate-300 leading-relaxed border-l border-magenta-500/30 pl-3">
              {analysis.justification}
            </p>
            <div className="mt-5 pt-4 border-t border-magenta-500/20 flex flex-col gap-2 text-[10px] font-mono uppercase tracking-widest">
              <div className="flex justify-between text-slate-400">
                <span>Recommendation:</span>
                <span className="text-magenta-400 font-bold">{analysis.recommendation}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Confidence:</span>
                <span className="text-cyan-400 font-bold">{analysis.confidence}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Deep Dive */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Matched Skills */}
          <div className="bg-background/40 backdrop-blur-md border border-slate-800/80 p-6 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <h3 className="text-xs font-mono font-bold text-cyan-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Check className="w-4 h-4" /> Evidence Graph - Matches
            </h3>
            
            <div className="space-y-4">
              {analysis.matchedSkills.map((match, idx) => (
                <SkillMatchRow key={`m-${idx}`} match={match} type="match" />
              ))}
              {analysis.preferredSkillsMatched.map((match, idx) => (
                <SkillMatchRow key={`p-${idx}`} match={match} type="preferred" />
              ))}
              {analysis.matchedSkills.length === 0 && analysis.preferredSkillsMatched.length === 0 && (
                <div className="text-xs font-mono text-slate-500 italic uppercase">No explicit skill matches detected.</div>
              )}
            </div>
          </div>

          {/* Missing Skills */}
          <div className="bg-background/40 backdrop-blur-md border border-slate-800/80 p-6 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <h3 className="text-xs font-mono font-bold text-rose-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <X className="w-4 h-4" /> Confidence Gaps - Missing
            </h3>
            
            <div className="space-y-4">
              {analysis.missingSkills.map((match, idx) => (
                <SkillMatchRow key={`miss-${idx}`} match={match} type="missing" />
              ))}
              {analysis.missingSkills.length === 0 && (
                <div className="text-xs font-mono text-slate-500 italic uppercase">No missing critical skills detected.</div>
              )}
            </div>
          </div>

          {/* Detailed Context */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-background/40 backdrop-blur-md border border-slate-800/80 p-5">
              <h3 className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Briefcase className="w-3 h-3" /> Experience Context
              </h3>
              <p className="text-xs font-mono text-slate-400 leading-relaxed">
                {analysis.experienceAnalysis}
              </p>
            </div>
            
            <div className="bg-background/40 backdrop-blur-md border border-slate-800/80 p-5">
              <h3 className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <BookOpen className="w-3 h-3" /> Education Context
              </h3>
              <p className="text-xs font-mono text-slate-400 leading-relaxed">
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
  let color = 'bg-cyan-500 shadow-[0_0_10px_rgba(94,234,212,0.8)]';
  if (score < 50) color = 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]';
  else if (score < 75) color = 'bg-magenta-500 shadow-[0_0_10px_rgba(217,168,255,0.8)]';

  return (
    <div>
      <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest mb-2">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-bold">{Math.round(score)}/100</span>
      </div>
      <div className="w-full bg-slate-900 h-1 overflow-hidden">
        <div className={`${color} h-1 transition-all duration-1000`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function SkillMatchRow({ match, type }: { match: any, type: 'match' | 'preferred' | 'missing' }) {
  const styles = {
    match: {
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-950/10',
      text: 'text-cyan-400',
      badge: 'border border-cyan-500/50 bg-cyan-950/30 text-cyan-400',
      label: 'MATCHED'
    },
    preferred: {
      border: 'border-slate-700',
      bg: 'bg-slate-900/40',
      text: 'text-slate-300',
      badge: 'border border-slate-700 bg-slate-800 text-slate-400',
      label: 'PREFERRED'
    },
    missing: {
      border: 'border-rose-500/30',
      bg: 'bg-rose-950/10',
      text: 'text-rose-400',
      badge: 'border border-rose-500/50 bg-rose-950/30 text-rose-400',
      label: 'MISSING'
    }
  };

  const s = styles[type];

  return (
    <div className={`border ${s.border} ${s.bg} p-4`}>
      <div className="flex items-center gap-3 mb-3">
        <span className={`font-mono text-sm font-bold ${s.text}`}>{match.skill}</span>
        <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 ml-auto ${s.badge}`}>
          {s.label}
        </span>
      </div>
      <div className="text-[11px] font-mono text-slate-400 pl-3 border-l border-slate-700/50">
        <span className="block text-[9px] text-slate-600 mb-1 uppercase tracking-widest">Evidence</span>
        {match.evidence}
      </div>
    </div>
  );
}
