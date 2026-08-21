import type { ScoredCandidate } from '../types/api';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

const REC_STYLES: Record<string, { label: string; color: string }> = {
  STRONG_HIRE: { label: 'Strong Hire', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/[0.07]' },
  HIRE:        { label: 'Hire',        color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/[0.07]' },
  MAYBE:       { label: 'Maybe',       color: 'text-amber-400 border-amber-500/40 bg-amber-500/[0.07]' },
  REJECT:      { label: 'Reject',      color: 'text-rose-400 border-rose-500/40 bg-rose-500/[0.07]' },
};

function scoreColor(score: number): string {
  if (score >= 75) return 'text-cyan-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-rose-400';
}

function ScoreMini({ score }: { score: number }) {
  const color = scoreColor(score);
  return (
    <div className="flex items-baseline gap-1">
      <span className={`font-display text-lg font-bold leading-none ${color}`}>
        {Math.round(score)}
      </span>
      <span className="font-mono text-[10px] text-slate-600">/100</span>
    </div>
  );
}

interface Props {
  candidates: ScoredCandidate[];
  onSelect: (c: ScoredCandidate) => void;
}

export function CandidateTable({ candidates, onSelect }: Props) {
  return (
    <div className="overflow-hidden border border-white/[0.05]">
      {/* Header */}
      <div className="grid grid-cols-[52px_1fr_110px_140px_110px_140px] items-center px-5 py-2.5 bg-white/[0.015] border-b border-white/[0.05]">
        {['Rank', 'Candidate', 'Score', 'Recommendation', 'Status', 'Action'].map((h, i) => (
          <div
            key={i}
            className={`font-mono text-[9px] tracking-[0.2em] uppercase text-slate-600 ${i === 5 ? 'text-right' : ''}`}
          >
            {h}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-white/[0.03]">
        {candidates.map((c) => {
          const rec = REC_STYLES[c.analysis.recommendation] ?? {
            label: c.analysis.recommendation,
            color: 'text-slate-400 border-slate-500/40 bg-slate-500/5',
          };

          return (
            <div
              key={c.resume.fileName}
              className="grid grid-cols-[52px_1fr_110px_140px_110px_140px] items-center px-5 py-4 transition-all duration-150 hover:bg-white/[0.02] border-l-2 border-transparent hover:border-cyan-500/40 group"
            >
              {/* Rank */}
              <div className="font-display text-sm font-bold text-slate-600 group-hover:text-slate-400 transition-colors">
                {String(c.rank).padStart(2, '0')}
              </div>

              {/* Candidate info */}
              <div className="flex flex-col min-w-0 pr-6">
                <span className="font-sans text-sm font-semibold text-slate-200 group-hover:text-white truncate transition-colors">
                  {c.resume.candidateName ?? 'Unknown Candidate'}
                </span>
                <span className="font-mono text-[10px] text-slate-600 truncate mt-0.5">
                  {c.resume.fileName}
                </span>
              </div>

              {/* Score */}
              <div>
                <ScoreMini score={c.scores.overall} />
              </div>

              {/* Recommendation badge */}
              <div>
                <span className={`inline-flex items-center px-2.5 py-1 border font-mono text-[9px] tracking-widest uppercase ${rec.color}`}>
                  {rec.label}
                </span>
              </div>

              {/* Shortlist status */}
              <div>
                {c.shortlisted ? (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-wider">Shortlisted</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                    <span className="font-mono text-[10px] text-slate-600 uppercase tracking-wider">Passed</span>
                  </div>
                )}
              </div>

              {/* Action button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onSelect(c)}
                  className="
                    flex items-center gap-2 px-3.5 py-2
                    border border-white/[0.08] hover:border-cyan-500/50
                    bg-white/[0.02] hover:bg-cyan-500/[0.06]
                    font-mono text-[9px] tracking-widest uppercase
                    text-slate-400 hover:text-cyan-400
                    transition-all duration-150
                  "
                >
                  View Analysis
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
