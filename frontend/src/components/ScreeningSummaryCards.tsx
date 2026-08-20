import type { ScreeningSummary } from '../types/api';
import { Activity, CheckCircle2, Clock, Users } from 'lucide-react';

interface Props {
  summary: ScreeningSummary;
  topScore?: number;
  roleTitle?: string;
}

export function ScreeningSummaryCards({ summary, topScore, roleTitle }: Props) {
  const items = [
    {
      icon: <Users className="w-3.5 h-3.5" />,
      label: 'Total Parsed',
      value: summary.screened.toLocaleString(),
    },
    {
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      label: 'Shortlisted',
      value: summary.shortlisted.toString(),
    },
    {
      icon: <Activity className="w-3.5 h-3.5" />,
      label: 'Top Score',
      value: topScore !== undefined ? `${topScore}/100` : '—',
    },
    {
      icon: <Clock className="w-3.5 h-3.5" />,
      label: 'Time',
      value: `${(summary.processingTimeMs / 1000).toFixed(1)}s`,
    },
  ];

  return (
    <div className="border border-white/[0.05] bg-[#07080a]/90 backdrop-blur-xl overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Status block */}
        <div className="flex items-center gap-3 px-5 py-4 border-b md:border-b-0 md:border-r border-white/[0.05] min-w-[220px]">
          <div className="w-8 h-8 flex items-center justify-center bg-cyan-500/10 border border-cyan-500/20 shrink-0">
            <Activity className="w-4 h-4 text-cyan-500" />
          </div>
          <div>
            <p className="font-mono text-[9px] tracking-widest text-slate-500 uppercase">Queue Status</p>
            <p className="font-mono text-xs text-slate-300 mt-0.5">
              {roleTitle
                ? <span>Role: <span className="text-cyan-400">{roleTitle}</span></span>
                : 'Screening Complete'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-1 divide-x divide-white/[0.05]">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col justify-center px-5 py-4 gap-1"
            >
              <div className="flex items-center gap-1.5 text-slate-500">
                {item.icon}
                <span className="font-mono text-[9px] tracking-widest uppercase">{item.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-xl font-bold text-white">{item.value}</span>
                {i === 0 && (
                  <span className="w-1.5 h-4 ml-1 bg-cyan-500/70" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
