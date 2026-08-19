import { Briefcase } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2 rounded-lg">
              <Briefcase className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="font-semibold text-xl tracking-tight text-white">
              Smart Resume Screener
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
