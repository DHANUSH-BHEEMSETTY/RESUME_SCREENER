import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { JobDescriptionInput } from './components/JobDescriptionInput';
import { ResumeDropzone } from './components/ResumeDropzone';
import { ScreeningSummaryCards } from './components/ScreeningSummaryCards';
import { CandidateTable } from './components/CandidateTable';
import { CandidateDetails } from './components/CandidateDetails';
import { api } from './api/client';
import type { ScreeningResponse, ScoredCandidate } from './types/api';
import { Loader2, AlertCircle, FileWarning } from 'lucide-react';
import { SplineBackground } from './components/SplineBackground';

function App() {
  const [jobDescription, setJobDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  
  const [isScreening, setIsScreening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [results, setResults] = useState<ScreeningResponse | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<ScoredCandidate | null>(null);

  const handleScreening = async () => {
    if (!jobDescription || files.length === 0) return;
    
    setIsScreening(true);
    setError(null);
    setResults(null);
    setSelectedCandidate(null);

    try {
      const data = await api.screenResumes(jobDescription, files);
      setResults(data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Failed to run screening pipeline.');
    } finally {
      setIsScreening(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setSelectedCandidate(null);
    setFiles([]);
    setJobDescription('');
  };

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-cyan-500/30 flex flex-col relative overflow-hidden">
      
      {/* 3D Spline Background Layer */}
      <SplineBackground />

      {/* Top Navbar */}
      <div className="relative z-20">
        <Navbar />
      </div>

      {/* Main Content Area (Glassmorphism backdrop) */}
      <main className="flex-grow w-full bg-background/80 backdrop-blur-[32px] relative z-10 pt-12 pb-24 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8">
          
          {/* Detail View */}
          {selectedCandidate && results && (
            <CandidateDetails
              candidate={selectedCandidate}
              onBack={() => setSelectedCandidate(null)}
            />
          )}

          {/* Results View */}
          {!selectedCandidate && results && (
            <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
              
              <div className="flex flex-col gap-2">
                <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">/ Explainability Layer /</div>
                <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">
                  Make the shortlist<br/>legible.
                </h2>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-slate-400 text-sm max-w-md font-mono border-l-2 border-cyan-500/50 pl-4">
                    Every recommendation is a traceable combination of skill evidence, experience context, and semantic confidence against: <span className="text-cyan-400">{results.job.roleTitle}</span>.
                  </p>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 border border-slate-800 hover:border-cyan-500/50 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-widest bg-slate-900/50"
                  >
                    Reset System
                  </button>
                </div>
              </div>

              <div className="h-px w-full bg-slate-800/50" />

              <ScreeningSummaryCards
                summary={results.summary}
                topScore={results.candidates[0]?.scores?.overall}
              />

              {results.failed.length > 0 && (
                <div className="bg-magenta-900/20 border border-magenta-500/30 p-4 flex gap-3 font-mono text-sm">
                  <FileWarning className="w-5 h-5 text-magenta-400 shrink-0" />
                  <div>
                    <h3 className="text-magenta-400 uppercase tracking-wider text-xs font-bold mb-2">Parse Failures Detected</h3>
                    <ul className="text-magenta-300/80 space-y-1 list-none">
                      {results.failed.map((f, i) => (
                        <li key={i}><span className="opacity-50">[{i+1}]</span> {f.fileName} - {f.error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {results.candidates.length > 0 ? (
                <CandidateTable
                  candidates={results.candidates}
                  onSelect={setSelectedCandidate}
                />
              ) : (
                <div className="text-center py-12 border border-slate-800/50 bg-slate-900/20 font-mono text-slate-500 text-sm uppercase tracking-widest">
                  No successful candidates to display.
                </div>
              )}
            </div>
          )}

          {/* Input View */}
          {!selectedCandidate && !results && (
            <div className="flex flex-col gap-12">
              
              <div className="flex flex-col gap-2">
                <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">/ Data Ingestion /</div>
                <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight leading-tight">
                  Initialize<br/>screening parameters.
                </h2>
                <p className="text-slate-400 text-sm max-w-md font-mono border-l-2 border-magenta-500/50 pl-4 mt-4">
                  Define the role constraints and supply candidate dossiers. The engine will extract semantic fit and rank accordingly.
                </p>
              </div>

              <div className="h-px w-full bg-slate-800/50" />

              {error && (
                <div className="bg-rose-900/20 border border-rose-500/30 p-4 flex items-start gap-3 font-mono text-sm">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-rose-400">
                    <span className="font-bold uppercase tracking-wider text-xs block mb-1">System Error</span>
                    {error}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-20">
                <JobDescriptionInput
                  value={jobDescription}
                  onChange={setJobDescription}
                  disabled={isScreening}
                />
                <ResumeDropzone
                  files={files}
                  onFilesChange={setFiles}
                  disabled={isScreening}
                />
              </div>

              <div className="flex pt-6">
                <button
                  onClick={handleScreening}
                  disabled={isScreening || !jobDescription || files.length === 0}
                  className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-cyan-950/40 hover:bg-cyan-900/60 disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-800 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 font-mono text-xs uppercase tracking-widest transition-all overflow-hidden"
                >
                  <div className="absolute inset-0 w-0 bg-cyan-500/10 group-hover:w-full transition-all duration-500 ease-out"></div>
                  {isScreening ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>Extracting Semantic Fit...</span>
                    </>
                  ) : (
                    <>
                      <span className="relative z-10 text-cyan-300">Run Screening Pipeline</span>
                    </>
                  )}
                </button>
              </div>
              
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
