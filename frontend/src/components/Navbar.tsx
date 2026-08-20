import { Activity } from 'lucide-react';

export function Navbar() {
  return (
    <header className="relative z-30 border-b border-white/[0.04] bg-[#07080a]/80 backdrop-blur-xl">
      <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-cyan-500">
            <Activity className="w-3.5 h-3.5" />
            <span className="font-mono text-[10px] tracking-[0.2em] text-slate-500 uppercase">
              Resume Screening System / 07
            </span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex flex-col leading-none">
            <span className="font-display text-sm font-bold text-white tracking-widest uppercase">
              Resume Screening
            </span>
            <span className="font-display text-xs font-bold text-cyan-500 tracking-widest uppercase">
              Protocol v2.4
            </span>
          </div>
        </div>

        {/* Right: Status */}
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse-dot" />
          <span className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">
            Live Parse
          </span>
          <span className="text-slate-700">|</span>
          <span className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">
            Scene Online
          </span>
        </div>
      </div>
    </header>
  );
}
