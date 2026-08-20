import type { ScreeningSummary } from '../types/api';
import { Activity } from 'lucide-react';

export function ScreeningSummaryCards({ summary, topScore }: { summary: ScreeningSummary; topScore?: number }) {

  return (
    <div className="flex flex-col md:flex-row items-center justify-between border border-slate-800/80 bg-background/40 backdrop-blur-md overflow-hidden relative shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
      
      {/* Left Block */}
      <div className="flex-1 w-full p-4 md:p-6 border-b md:border-b-0 md:border-r border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-950/30 text-cyan-400 border border-cyan-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">System Status</div>
            <div className="text-xs font-mono text-slate-300 mt-1">Screening Complete &middot; <span className="text-cyan-400">Engine Ready</span></div>
          </div>
        </div>
      </div>

      <Divider />

      {/* Stat 1 */}
      <StatBlock label="Total Screened" value={summary.screened.toString()} />
      <Divider />

      {/* Stat 2 */}
      <StatBlock label="Shortlisted" value={summary.shortlisted.toString()} />
      <Divider />

      {/* Stat 3 */}
      <StatBlock label="Top Score" value={topScore ? topScore.toString() : '-'} />
      <Divider />

      {/* Stat 4 */}
      <StatBlock label="Processing Time" value={`${(summary.processingTimeMs / 1000).toFixed(1)}s`} />
      
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 w-full p-4 md:p-6 flex flex-col justify-center">
      <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-2">{label}</div>
      <div className="text-2xl font-display font-bold text-slate-200 tracking-tight">{value}</div>
    </div>
  );
}

function Divider() {
  return (
    <div className="hidden md:block h-12 w-1 bg-cyan-500 shadow-[0_0_10px_rgba(94,234,212,0.8)] mx-4" />
  );
}
