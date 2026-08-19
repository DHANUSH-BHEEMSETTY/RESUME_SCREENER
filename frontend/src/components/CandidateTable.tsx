import type { ScoredCandidate } from '../types/api';
import { Badge } from './Badge';
import { ChevronRight, CheckCircle2, XCircle } from 'lucide-react';

export function CandidateTable({
  candidates,
  onSelect
}: {
  candidates: ScoredCandidate[];
  onSelect: (candidate: ScoredCandidate) => void;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 text-xs uppercase tracking-wider text-slate-400 font-medium">
              <th className="p-4 pl-6 border-b border-slate-800">Rank</th>
              <th className="p-4 border-b border-slate-800">Candidate</th>
              <th className="p-4 border-b border-slate-800">Score</th>
              <th className="p-4 border-b border-slate-800">Recommendation</th>
              <th className="p-4 border-b border-slate-800">Status</th>
              <th className="p-4 pr-6 border-b border-slate-800 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {candidates.map((candidate) => (
              <tr
                key={candidate.resume.fileName}
                onClick={() => onSelect(candidate)}
                className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
              >
                <td className="p-4 pl-6">
                  <span className="font-mono text-lg font-bold text-slate-300 group-hover:text-white transition-colors">
                    #{candidate.rank}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-200">
                      {candidate.resume.candidateName || 'Unknown Candidate'}
                    </span>
                    <span className="text-xs text-slate-500 max-w-[200px] truncate">
                      {candidate.resume.fileName}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{Math.round(candidate.scores.overall)}</span>
                    <span className="text-xs text-slate-500">/ 100</span>
                  </div>
                </td>
                <td className="p-4">
                  <RecommendationBadge recommendation={candidate.analysis.recommendation} />
                </td>
                <td className="p-4">
                  {candidate.shortlisted ? (
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-medium">Shortlisted</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <XCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Passed</span>
                    </div>
                  )}
                </td>
                <td className="p-4 pr-6 text-right">
                  <button className="text-indigo-400 hover:text-indigo-300 transition-colors p-2 rounded-lg hover:bg-indigo-500/10">
                    <ChevronRight className="w-5 h-5" />
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
  switch (recommendation) {
    case 'STRONG_HIRE':
      return <Badge variant="success">Strong Hire</Badge>;
    case 'HIRE':
      return <Badge variant="success">Hire</Badge>;
    case 'MAYBE':
      return <Badge variant="warning">Maybe</Badge>;
    case 'REJECT':
      return <Badge variant="danger">Reject</Badge>;
    default:
      return <Badge variant="default">{recommendation}</Badge>;
  }
}
