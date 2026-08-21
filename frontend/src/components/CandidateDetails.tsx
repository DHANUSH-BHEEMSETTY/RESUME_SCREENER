import type { ScoredCandidate } from '../types/api';
import { ArrowLeft, CheckCircle2, XCircle, Brain, Briefcase, GraduationCap, Zap } from 'lucide-react';

// ── Recommendation styles ──────────────────────────────────────
const REC_STYLES: Record<string, { label: string; cls: string }> = {
  STRONG_HIRE: { label: 'Strong Hire', cls: 'text-cyan-400 border-cyan-500/50 bg-cyan-500/[0.07]' },
  HIRE:        { label: 'Hire',        cls: 'text-emerald-400 border-emerald-500/50 bg-emerald-500/[0.07]' },
  MAYBE:       { label: 'Maybe',       cls: 'text-amber-400 border-amber-500/50 bg-amber-500/[0.07]' },
  REJECT:      { label: 'Reject',      cls: 'text-rose-400 border-rose-500/50 bg-rose-500/[0.07]' },
};

// ── Score helpers ──────────────────────────────────────────────
function scoreHex(score: number): string {
  if (score >= 75) return '#00f5d4';
  if (score >= 50) return '#fbbf24';
  return '#f87171';
}

// ── Score donut ────────────────────────────────────────────────
function ScoreDonut({ score }: { score: number }) {
  const r = 38, stroke = 4, nr = r - stroke;
  const circ = nr * 2 * Math.PI;
  const offset = circ - (score / 100) * circ;
  const color = scoreHex(score);
  return (
    <div className="relative flex items-center justify-center w-24 h-24 mx-auto">
      <svg width={r * 2} height={r * 2} className="-rotate-90">
        <circle cx={r} cy={r} r={nr} fill="transparent" stroke="#1a1e26" strokeWidth={stroke} />
        <circle
          cx={r} cy={r} r={nr} fill="transparent"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 6px ${color}90)`, transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="font-display text-xl font-bold" style={{ color }}>{Math.round(score)}</span>
        <span className="font-mono text-[9px] text-slate-600 mt-0.5">/100</span>
      </div>
    </div>
  );
}

// ── Score bar ──────────────────────────────────────────────────
function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = scoreHex(score);
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="font-mono text-[10px] font-bold" style={{ color }}>{Math.round(score)}</span>
      </div>
      <div className="h-[2px] w-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full transition-all duration-1000 ease-out"
          style={{ width: `${score}%`, background: color, boxShadow: `0 0 6px ${color}60` }}
        />
      </div>
    </div>
  );
}

// ── Skill pill ─────────────────────────────────────────────────
function SkillPill({ text, type }: { text: string; type: 'match' | 'preferred' | 'missing' }) {
  const styles = {
    match:    'border-cyan-500/40 text-cyan-400 bg-cyan-500/[0.06]',
    preferred:'border-slate-700 text-slate-400 bg-white/[0.02]',
    missing:  'border-rose-500/40 text-rose-400 bg-rose-500/[0.06]',
  };
  const prefix = { match: '+', preferred: '~', missing: '−' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 border font-mono text-[10px] rounded-none ${styles[type]}`}>
      <span className="opacity-50 text-[9px]">{prefix[type]}</span>
      {text}
    </span>
  );
}

// ── Panel wrapper ──────────────────────────────────────────────
function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border border-white/[0.05] bg-[#0c0e11] p-5 flex flex-col gap-4 ${className}`}>
      {children}
    </div>
  );
}

function PanelLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-slate-500 mb-1">
      <span className="text-slate-600">{icon}</span>
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
interface Props {
  candidate: ScoredCandidate;
  onBack: () => void;
}

export function CandidateDetails({ candidate, onBack }: Props) {
  const { resume, scores, analysis } = candidate;
  const rec = REC_STYLES[analysis.recommendation] ?? { label: analysis.recommendation, cls: 'text-slate-400 border-slate-700' };

  return (
    <div className="animate-fade-in flex flex-col gap-6 pb-16">

      {/* ── Top Bar ── */}
      <div className="flex items-start gap-5 justify-between flex-wrap">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 border border-white/[0.07] hover:border-cyan-500/40 font-mono text-[9px] tracking-widest uppercase text-slate-500 hover:text-cyan-400 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-white tracking-wide">
              {resume.candidateName ?? 'Unknown Candidate'}
            </h1>
            <p className="font-mono text-[10px] text-slate-600 mt-1 flex flex-wrap gap-2">
              <span>{resume.fileName}</span>
              <span className="text-slate-700">·</span>
              <span>Rank #{String(candidate.rank).padStart(2, '0')}</span>
              {resume.email && <><span className="text-slate-700">·</span><span>{resume.email}</span></>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {candidate.shortlisted ? (
            <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase text-cyan-400 border border-cyan-500/40 bg-cyan-500/[0.06] px-3 py-1.5">
              <CheckCircle2 className="w-3 h-3" /> Shortlisted
            </span>
          ) : (
            <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase text-slate-500 border border-white/[0.07] px-3 py-1.5">
              <XCircle className="w-3 h-3" /> Not Shortlisted
            </span>
          )}
          <span className={`font-mono text-[10px] tracking-widest uppercase border px-3 py-1.5 ${rec.cls}`}>
            {rec.label}
          </span>
        </div>
      </div>

      <div className="h-px bg-white/[0.04]" />

      {/* ── 3-Column Body ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Column 1: Why This Candidate & Scores ── */}
        <div className="flex flex-col gap-4">
          {/* Why This Candidate */}
          {analysis.strengths.length > 0 && (
            <Panel>
              <PanelLabel icon={<CheckCircle2 className="w-3 h-3 text-cyan-500" />}>Why This Candidate?</PanelLabel>
              <ul className="flex flex-col gap-2">
                {analysis.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-cyan-500/50 mt-0.5 shrink-0">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {/* Score Breakdown */}
          <Panel>
            <PanelLabel icon={<Zap className="w-3 h-3" />}>Score Breakdown</PanelLabel>
            <ScoreDonut score={scores.overall} />
            <p className="font-mono text-[9px] text-slate-600 text-center tracking-widest uppercase -mt-2">Overall Match</p>
            <div className="flex flex-col gap-3 pt-2 border-t border-white/[0.04]">
              <ScoreBar label="Skills Match (45%)" score={scores.skills} />
              <ScoreBar label="Experience Match (30%)" score={scores.experience} />
              <ScoreBar label="Education Match (10%)" score={scores.education} />
              <ScoreBar label="Semantic Fit (10%)" score={scores.semanticFit} />
              <ScoreBar label="Certs (5%)" score={scores.certification} />
            </div>
          </Panel>
        </div>

        {/* ── Column 2: Skills & Justification ── */}
        <div className="flex flex-col gap-4">
          {/* AI Justification */}
          <Panel>
            <PanelLabel icon={<Brain className="w-3 h-3" />}>AI Justification</PanelLabel>
            <blockquote className="font-sans text-sm text-slate-300 leading-relaxed border-l-2 border-cyan-500/30 pl-3">
              {analysis.justification}
            </blockquote>
          </Panel>

          {/* Skills */}
          <Panel className="flex-1">
            <PanelLabel icon={<CheckCircle2 className="w-3 h-3" />}>Skills</PanelLabel>

            {analysis.matchedSkills.length === 0 && analysis.preferredSkillsMatched.length === 0 ? (
              <p className="font-mono text-xs text-slate-600 italic">No required skill matches found.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {analysis.matchedSkills.map((m, i) => (
                  <div key={i}>
                    <div className="mb-1.5">
                      <SkillPill text={m.skill} type="match" />
                    </div>
                    <p className="font-mono text-[11px] text-slate-500 leading-relaxed pl-3 border-l border-cyan-500/20">
                      {m.evidence}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {analysis.preferredSkillsMatched.length > 0 && (
              <>
                <div className="h-px bg-white/[0.04] mt-2 mb-2" />
                <PanelLabel icon={null}>Preferred Skills Matched</PanelLabel>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.preferredSkillsMatched.map((m, i) => (
                    <SkillPill key={i} text={m.skill} type="preferred" />
                  ))}
                </div>
              </>
            )}
          </Panel>
        </div>

        {/* ── Column 3: Experience, Gaps, Missing ── */}
        <div className="flex flex-col gap-4">
          
          {/* Missing Skills */}
          {analysis.missingSkills.length > 0 && (
            <Panel>
              <PanelLabel icon={<XCircle className="w-3 h-3 text-rose-500" />}>
                <span className="text-rose-500/70">Missing Required Skills</span>
              </PanelLabel>
              <div className="flex flex-wrap gap-1.5">
                {analysis.missingSkills.map((m, i) => (
                  <SkillPill key={i} text={m.skill} type="missing" />
                ))}
              </div>
            </Panel>
          )}

          {/* Gaps */}
          {analysis.gaps.length > 0 && (
            <Panel>
              <PanelLabel icon={<XCircle className="w-3 h-3 text-amber-500" />}>Identified Gaps</PanelLabel>
              <ul className="flex flex-col gap-2">
                {analysis.gaps.map((g, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="text-amber-500/50 mt-0.5 shrink-0">⚠</span>
                    {g}
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {/* Experience context */}
          {analysis.experienceAnalysis && (
            <Panel>
              <PanelLabel icon={<Briefcase className="w-3 h-3" />}>Experience</PanelLabel>
              <p className="text-xs text-slate-300 leading-relaxed">{analysis.experienceAnalysis}</p>
            </Panel>
          )}

          {/* Education context */}
          {analysis.educationAnalysis && (
            <Panel>
              <PanelLabel icon={<GraduationCap className="w-3 h-3" />}>Education</PanelLabel>
              <p className="text-xs text-slate-400 leading-relaxed">{analysis.educationAnalysis}</p>
            </Panel>
          )}
          
          {/* Confidence */}
          <Panel>
            <PanelLabel icon={<CheckCircle2 className="w-3 h-3" />}>Analysis Confidence</PanelLabel>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Overall Confidence', value: `${analysis.confidence}%`, good: analysis.confidence >= 75 },
                { label: 'Required skills found', value: `${analysis.matchedSkills.length} matched` , good: true },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/[0.04] last:border-0">
                  <span className="font-mono text-[10px] text-slate-500">{row.label}</span>
                  <span className={`font-mono text-[10px] font-bold ${row.good ? 'text-cyan-400' : 'text-amber-400'}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

        </div>

      </div>
    </div>
  );
}
