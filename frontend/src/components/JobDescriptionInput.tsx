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
      <label htmlFor="jd" className="text-sm font-medium text-slate-300">
        Job Description
      </label>
      <textarea
        id="jd"
        className="w-full h-48 bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
        placeholder="Paste the job description here. Include responsibilities, required skills, and preferred qualifications for best results..."
        value={value}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        disabled={disabled}
      />
      <p className="text-xs text-slate-500">
        Must be at least 50 characters.
      </p>
    </div>
  );
}
