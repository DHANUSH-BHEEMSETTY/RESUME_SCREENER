import type { ChangeEvent } from 'react';

export function JobDescriptionInput({
  value,
  onChange,
  disabled
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="jd" className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">
        Job Description
      </label>
      <textarea
        id="jd"
        className="w-full h-48 bg-background/40 backdrop-blur-md border border-slate-800/80 rounded-none p-6 text-slate-200 font-mono text-sm placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all resize-none shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
        placeholder="Paste the job description here. Include responsibilities, required skills, and preferred qualifications for best results..."
        value={value}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        disabled={disabled}
      />
      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
        Must be at least 50 characters.
      </p>
    </div>
  );
}
