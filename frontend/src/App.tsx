import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { JobDescriptionInput } from './components/JobDescriptionInput';
import { ResumeDropzone } from './components/ResumeDropzone';
import { ScreeningSummaryCards } from './components/ScreeningSummaryCards';
import { CandidateTable } from './components/CandidateTable';
import { CandidateDetails } from './components/CandidateDetails';
import { SplineBackground } from './components/SplineBackground';
import { api } from './api/client';
import type { ScreeningResponse, ScoredCandidate } from './types/api';
import { Loader2, AlertTriangle, FileWarning, Upload } from 'lucide-react';

type View = 'input' | 'results' | 'detail';

export default function App() {
  const [jd, setJd] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ScreeningResponse | null>(null);
  const [selected, setSelected] = useState<ScoredCandidate | null>(null);

  const view: View = selected ? 'detail' : results ? 'results' : 'input';

  async function runScreening() {
    if (!jd || files.length === 0) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setSelected(null);
    try {
      const data = await api.screenResumes(jd, files);
      setResults(data);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err?.message ?? 'Screening pipeline failed.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResults(null);
    setSelected(null);
    setFiles([]);
    setJd('');
    setError(null);
  }

  const canSubmit = jd.length >= 50 && files.length > 0 && !loading;

  return (
    <div className="min-h-screen flex flex-col bg-base selection:bg-cyan-500/20 relative">

      {/* ── 3D Background (hero section only) ── */}
      {view === 'input' && (
        <div className="absolute inset-0 h-[100vh] pointer-events-none z-0">
          <SplineBackground />
        </div>
      )}

      {/* ── Navbar ── */}
      <div className="relative z-30 sticky top-0">
        <Navbar />
      </div>

      {/* ─────────────────────────────────────────────
          VIEW: INPUT
      ───────────────────────────────────────────── */}
      {view === 'input' && (
        <main className="relative z-10 flex-1 flex flex-col">

          {/* Hero */}
          <section className="flex-1 max-w-screen-xl mx-auto w-full px-6 pt-16 pb-8">
            <div className="max-w-lg">
              <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-slate-500 mb-5">
                / Smart Resume Screener /
              </p>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight mb-6">
                Upload Resumes.<br />
                <span className="text-cyan-500">Define the Role.</span><br />
                Get Ranked Results.
              </h1>
              <p className="font-sans text-sm text-slate-400 leading-relaxed border-l-2 border-white/[0.07] pl-4 max-w-sm">
                Paste a job description and upload candidate PDFs. The AI engine extracts skills, scores experience, and ranks every applicant — with clear written justification for each decision.
              </p>
            </div>
          </section>

          {/* Input section */}
          <section className="max-w-screen-xl mx-auto w-full px-6 pb-16">

            {/* Error */}
            {error && (
              <div className="mb-6 flex items-start gap-3 px-4 py-3 bg-rose-500/5 border border-rose-500/20">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-rose-500 mb-0.5">System Error</p>
                  <p className="text-xs text-rose-300 font-sans">{error}</p>
                </div>
              </div>
            )}

            {/* Two-column inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              <JobDescriptionInput value={jd} onChange={setJd} disabled={loading} />
              <ResumeDropzone files={files} onFilesChange={setFiles} disabled={loading} />
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={runScreening}
              disabled={!canSubmit}
              className={`
                relative flex items-center gap-3 px-8 py-3.5
                font-mono text-[11px] tracking-[0.2em] uppercase
                border transition-all duration-200 overflow-hidden
                ${canSubmit
                  ? 'border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/5 hover:border-cyan-500 cursor-pointer'
                  : 'border-white/[0.06] text-slate-600 cursor-not-allowed'}
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting semantic fit...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Run Screening Pipeline
                </>
              )}
            </button>
          </section>

          {/* Bottom stats bar */}
          <div className="border-t border-white/[0.04] bg-[#07080a]/95 backdrop-blur-xl relative z-20">
            <div className="max-w-screen-xl mx-auto px-6">
              <div className="flex items-center gap-6 h-14 divide-x divide-white/[0.05]">
                <div className="flex items-center gap-2.5 pr-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse-dot" />
                  <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">
                    Queue Status — Awaiting PDF batch
                  </span>
                </div>
                <StatItem label="Files Loaded" value={files.length.toString()} />
                <StatItem label="JD Length" value={jd.length > 0 ? `${jd.length} chars` : '—'} />
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ─────────────────────────────────────────────
          VIEW: RESULTS
      ───────────────────────────────────────────── */}
      {view === 'results' && results && (
        <main className="relative z-10 flex-1 max-w-screen-xl mx-auto w-full px-6 py-10 flex flex-col gap-8">

          {/* Section header */}
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-slate-500 mb-3">
                / Explainability Layer /
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight">
                Make the shortlist<br />
                <span className="text-cyan-500">legible.</span>
              </h2>
              <p className="font-sans text-sm text-slate-400 mt-3 max-w-md leading-relaxed">
                Every recommendation is a traceable combination of skill evidence, experience context,
                and semantic confidence against:{' '}
                <span className="text-cyan-400">{results.job.roleTitle}</span>.
              </p>
            </div>
            <button
              onClick={reset}
              className="font-mono text-[10px] tracking-widest uppercase text-slate-500 hover:text-cyan-400 border border-white/[0.06] hover:border-cyan-500/40 px-4 py-2 transition-colors shrink-0"
            >
              ← New Screening
            </button>
          </div>

          {/* Stats bar */}
          <ScreeningSummaryCards
            summary={results.summary}
            topScore={results.candidates[0]?.scores.overall}
            roleTitle={results.job.roleTitle}
          />

          {/* 3-column explainability feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ExplainCard
              tag="Score Integrity"
              title="Overall match"
              description="Weighted scoring keeps the signal grounded in the role brief instead of letting one keyword dominate the decision."
              metric={results.candidates[0] ? `${Math.round(results.candidates[0].scores.overall)} / 100` : '—'}
              metricSub="confidence-weighted"
              highlightTags={results.job.requiredSkills.slice(0, 3)}
            />
            <ExplainCard
              tag="Evidence Graph"
              title="Matched skills"
              description="The engine links extracted resume evidence back to the required and preferred skills in the job description."
              metric={`${results.candidates[0]?.analysis.matchedSkills.length ?? 0} skills`}
              metricSub="linked to JD"
              highlightTags={results.candidates[0]?.analysis.matchedSkills.slice(0, 3).map(m => m.skill) ?? []}
            />
            <ExplainCard
              tag="Confidence / Gaps"
              title="Know what is missing"
              description="Confidence and gaps stay visible beside the recommendation, so reviewers can decide where to follow up."
              metric={`${results.candidates[0]?.analysis.missingSkills.length ?? 0}`}
              metricSub="gaps detected"
              items={[
                { label: 'Resume completeness', value: `${results.candidates[0]?.analysis.confidence ?? 0}%` },
                { label: 'Required skills present', value: `${results.candidates[0]?.analysis.matchedSkills.length ?? 0} / ${results.job.requiredSkills.length}` },
              ]}
            />
          </div>

          {/* Failed files */}
          {results.failed.length > 0 && (
            <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/20">
              <FileWarning className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-amber-500 mb-1">Parse Failures</p>
                {results.failed.map((f, i) => (
                  <p key={i} className="text-xs text-amber-300/70 font-mono">{f.fileName} — {f.error}</p>
                ))}
              </div>
            </div>
          )}

          {/* Candidate Table */}
          {results.candidates.length > 0 ? (
            <div>
              <p className="font-mono text-[10px] tracking-widest uppercase text-slate-500 mb-3">
                {results.candidates.length} candidates ranked — click a row to view full analysis
              </p>
              <CandidateTable candidates={results.candidates} onSelect={setSelected} />
            </div>
          ) : (
            <div className="border border-white/[0.05] py-16 flex flex-col items-center gap-3 text-center">
              <p className="font-mono text-xs text-slate-600 uppercase tracking-widest">No candidates processed successfully.</p>
            </div>
          )}
        </main>
      )}

      {/* ─────────────────────────────────────────────
          VIEW: DETAIL
      ───────────────────────────────────────────── */}
      {view === 'detail' && selected && (
        <main className="relative z-10 flex-1 max-w-screen-xl mx-auto w-full px-6 py-10">
          <CandidateDetails candidate={selected} onBack={() => setSelected(null)} />
        </main>
      )}

    </div>
  );
}

/* ── Small helper components ── */

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 pl-6">
      <div className="flex flex-col">
        <span className="font-mono text-[9px] uppercase tracking-widest text-slate-600">{label}</span>
        <span className="font-display text-sm font-bold text-white">{value}</span>
      </div>
    </div>
  );
}

function ExplainCard({
  tag, title, description, metric, metricSub, highlightTags, items,
}: {
  tag: string;
  title: string;
  description: string;
  metric: string;
  metricSub: string;
  highlightTags?: string[];
  items?: { label: string; value: string }[];
}) {
  return (
    <div className="border border-white/[0.05] bg-[#07080a]/60 backdrop-blur-xl p-5 flex flex-col gap-4">
      <div>
        <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-cyan-500/70 mb-2">{tag}</p>
        <h3 className="font-display text-base font-bold text-white mb-2">{title}</h3>
        <p className="font-sans text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>

      <div className="mt-auto">
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="font-display text-2xl font-bold text-cyan-400">{metric}</span>
        </div>
        <p className="font-mono text-[9px] uppercase tracking-widest text-slate-600">{metricSub}</p>

        {highlightTags && highlightTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {highlightTags.map((t, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 border border-cyan-500/30 font-mono text-[10px] text-cyan-400/80 bg-cyan-500/5">
                + {t}
              </span>
            ))}
          </div>
        )}

        {items && (
          <div className="flex flex-col gap-2 mt-3">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="font-mono text-[10px] text-slate-500">{item.label}</span>
                <span className="font-mono text-[10px] font-bold text-cyan-400">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-3 h-px w-full bg-white/[0.06] overflow-hidden">
          <div className="score-bar-fill h-full bg-cyan-500" style={{ width: '70%' }} />
        </div>
      </div>
    </div>
  );
}
