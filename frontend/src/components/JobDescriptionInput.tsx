import type { ChangeEvent } from 'react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export function JobDescriptionInput({ value, onChange, disabled }: Props) {
  return (
    <div className="flex flex-col gap-2 h-full">
      <label
        htmlFor="jd-input"
        className="font-mono text-[10px] tracking-[0.2em] uppercase text-slate-500"
      >
        Job Description
      </label>
      <textarea
        id="jd-input"
        value={value}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Paste the full job description here — responsibilities, required skills, experience, qualifications..."
        className="
          flex-1 w-full min-h-[240px]
          bg-[#0d0f12] border border-white/[0.06]
          text-slate-300 font-mono text-xs leading-relaxed
          placeholder:text-slate-600 placeholder:font-sans
          px-4 py-4 resize-none
          focus:outline-none focus:border-cyan-500/40
          transition-colors duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      />
      {value.length > 0 && value.length < 50 && (
        <p className="font-mono text-[10px] text-rose-500/70 tracking-widest uppercase">
          Must be at least 50 characters.
        </p>
      )}
    </div>
  );
}
