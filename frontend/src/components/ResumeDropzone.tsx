import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface Props {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}

export function ResumeDropzone({ files, onFilesChange, disabled }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(incoming: File[]) {
    const pdfs = incoming.filter(f => f.type === 'application/pdf' && f.size <= MAX_SIZE);
    const novel = pdfs.filter(f => !files.some(e => e.name === f.name && e.size === f.size));
    if (novel.length > 0) onFilesChange([...files, ...novel]);
  }

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragging(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (disabled || !e.dataTransfer.files.length) return;
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled || !e.target.files?.length) return;
    addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const remove = (i: number) => {
    const next = [...files];
    next.splice(i, 1);
    onFilesChange(next);
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-slate-500">
        Upload Resumes
      </label>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center
          min-h-[140px] border border-dashed
          transition-all duration-200 cursor-pointer select-none
          ${dragging
            ? 'border-cyan-500/60 bg-cyan-500/[0.04]'
            : 'border-white/10 bg-[#0d0f12] hover:border-white/20 hover:bg-white/[0.01]'}
          ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="application/pdf"
          className="hidden"
          onChange={handleChange}
          disabled={disabled}
        />
        <UploadCloud className={`w-7 h-7 mb-3 transition-colors ${dragging ? 'text-cyan-500' : 'text-slate-600'}`} />
        <p className="text-slate-400 text-xs font-mono">Click to upload or drag and drop</p>
        <p className="text-slate-600 text-[10px] font-mono mt-1 tracking-widest uppercase">
          PDF resumes only. Upload multiple files at once.
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-2">
          <p className="font-mono text-[10px] tracking-widest text-cyan-500 uppercase">
            Awaiting PDF batch — {files.length} ready
          </p>
          <ul className="flex flex-col gap-1">
            {files.map((file, i) => (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center justify-between px-3 py-2 bg-[#0d0f12] border border-white/[0.05] group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-3.5 h-3.5 text-cyan-500/70 shrink-0" />
                  <span className="font-mono text-[11px] text-slate-300 truncate">{file.name}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); remove(i); }}
                  disabled={disabled}
                  className="ml-2 p-1 text-slate-600 hover:text-rose-400 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
