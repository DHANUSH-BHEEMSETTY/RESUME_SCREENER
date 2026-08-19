import type { ScreeningSummary } from '../types/api';
import { Users, UserCheck, Activity, Award } from 'lucide-react';

export function ScreeningSummaryCards({ summary, topScore }: { summary: ScreeningSummary; topScore?: number }) {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        icon={<Users className="w-5 h-5 text-blue-400" />}
        label="Total Screened"
        value={summary.screened.toString()}
      />
      <Card
        icon={<UserCheck className="w-5 h-5 text-emerald-400" />}
        label="Shortlisted"
        value={summary.shortlisted.toString()}
      />
      <Card
        icon={<Award className="w-5 h-5 text-amber-400" />}
        label="Top Score"
        value={topScore ? topScore.toString() : '-'}
      />
      <Card
        icon={<Activity className="w-5 h-5 text-indigo-400" />}
        label="Processing Time"
        value={`${(summary.processingTimeMs / 1000).toFixed(1)}s`}
      />
    </div>
  );
}

function Card({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-xl backdrop-blur-sm flex items-center gap-4">
      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      </div>
    </div>
  );
}
