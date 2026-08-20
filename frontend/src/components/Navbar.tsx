import { Activity } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="w-full border-b border-white/5 bg-background/50 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                / Resume Screening System / 07
              </div>
              <div className="text-xl font-display font-bold text-white tracking-widest uppercase flex flex-col leading-none mt-1">
                <span>Resume Screening</span>
                <span className="text-cyan-400 text-sm">Protocol v2.4</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></div>
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
              Live Parse | Scene Online
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
