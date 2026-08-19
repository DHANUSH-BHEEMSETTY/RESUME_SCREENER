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
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-indigo-500/30">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Detail View */}
        {selectedCandidate && results && (
          <CandidateDetails
            candidate={selectedCandidate}
            onBack={() => setSelectedCandidate(null)}
          />
        )}

        {/* Results View */}
        {!selectedCandidate && results && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Screening Results</h1>
                <p className="text-slate-400 text-sm mt-1">
                  Analyzed against: <span className="font-medium text-slate-300">{results.job.roleTitle}</span>
                </p>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-200 rounded-lg transition-colors border border-slate-700 shadow-sm"
              >
                New Screening
              </button>
            </div>

            <ScreeningSummaryCards
              summary={results.summary}
              topScore={results.candidates[0]?.scores?.overall}
            />

            {results.failed.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                <FileWarning className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-amber-500">Some resumes failed to process</h3>
                  <ul className="mt-2 text-xs text-amber-400/80 space-y-1 list-disc list-inside">
                    {results.failed.map((f, i) => (
                      <li key={i}>{f.fileName}: {f.error}</li>
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
              <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
                <p className="text-slate-400">No successful candidates to display.</p>
              </div>
            )}
          </div>
        )}

        {/* Input View */}
        {!selectedCandidate && !results && (
          <div className="flex flex-col gap-8 max-w-4xl mx-auto">
            
            <div className="text-center space-y-4 py-8">
              <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">
                Candidate Screening
              </h1>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Upload candidate resumes and provide a job description. The system will evaluate, score, and rank each candidate objectively.
              </p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="text-sm text-rose-400">
                  <span className="font-semibold block mb-1">Screening Failed</span>
                  {error}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div className="flex justify-center pt-6">
              <button
                onClick={handleScreening}
                disabled={isScreening || !jobDescription || files.length === 0}
                className="relative flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-lg shadow-sm transition-all overflow-hidden"
              >
                {isScreening ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Candidates...</span>
                  </>
                ) : (
                  <>
                    <span>Run Screening Pipeline</span>
                  </>
                )}
              </button>
            </div>
            
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
