import type { ScoredCandidate } from '../types/api';
import { ChevronRight, CheckCircle2, XCircle } from 'lucide-react';

export function CandidateTable({
  candidates,
  onSelect
}: {
  candidates: ScoredCandidate[];
  onSelect: (candidate: ScoredCandidate) => void;
}) {
  return (
    <div className="bg-background/40 backdrop-blur-md border border-slate-800/80 rounded-none overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-cyan-950/20 text-[10px] font-mono tracking-widest uppercase text-cyan-500 font-bold border-b border-cyan-500/20">
              <th className="p-4 pl-6">Rank</th>
              <th className="p-4">Candidate</th>
              <th className="p-4">Score</th>
              <th className="p-4">Recommendation</th>
              <th className="p-4">Status</th>
              <th className="p-4 pr-6 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {candidates.map((candidate) => (
              <tr
                key={candidate.resume.fileName}
                onClick={() => onSelect(candidate)}
                className="hover:bg-cyan-950/20 hover:shadow-[inset_4px_0_0_rgba(94,234,212,1)] transition-all cursor-pointer group"
              >
                <td className="p-4 pl-6">
                  <span className="font-display text-lg font-bold text-slate-400 group-hover:text-cyan-400 transition-colors">
                    {candidate.rank.toString().padStart(2, '0')}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-bold text-slate-200 group-hover:text-white">
                      {candidate.resume.candidateName || 'UNKNOWN_ENTITY'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 max-w-[200px] truncate mt-1 tracking-widest uppercase">
                      {candidate.resume.fileName}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-end gap-1">
                    <span className="font-display font-bold text-lg text-white leading-none">{Math.round(candidate.scores.overall)}</span>
                    <span className="text-[10px] font-mono text-slate-500 mb-0.5">/100</span>
                  </div>
                </td>
                <td className="p-4">
                  <RecommendationBadge recommendation={candidate.analysis.recommendation} />
                </td>
                <td className="p-4">
                  {candidate.shortlisted ? (
                    <div className="flex items-center gap-1.5 text-cyan-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[10px] font-mono uppercase tracking-widest">Shortlisted</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <XCircle className="w-4 h-4" />
                      <span className="text-[10px] font-mono uppercase tracking-widest">Passed</span>
                    </div>
                  )}
                </td>
                <td className="p-4 pr-6 text-right">
                  <button className="text-cyan-500 group-hover:text-cyan-300 transition-colors p-1.5 rounded-none border border-transparent group-hover:border-cyan-500/30">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecommendationBadge({ recommendation }: { recommendation: string }) {
  let colorClass = 'border-slate-500/50 text-slate-400 bg-slate-500/10';
  let text = recommendation;

  if (recommendation === 'STRONG_HIRE') {
    colorClass = 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10 shadow-[0_0_10px_rgba(94,234,212,0.2)]';
    text = 'Strong Hire';
  } else if (recommendation === 'HIRE') {
    colorClass = 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10';
    text = 'Hire';
  } else if (recommendation === 'MAYBE') {
    colorClass = 'border-magenta-500/50 text-magenta-400 bg-magenta-500/10';
    text = 'Maybe';
  } else if (recommendation === 'REJECT') {
    colorClass = 'border-rose-500/50 text-rose-400 bg-rose-500/10';
    text = 'Reject';
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-widest border ${colorClass}`}>
      {text}
    </span>
  );
}
