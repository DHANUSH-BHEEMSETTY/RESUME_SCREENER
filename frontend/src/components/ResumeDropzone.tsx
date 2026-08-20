import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import { cn } from '../utils/cn';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function ResumeDropzone({
  files,
  onFilesChange,
  disabled
}: {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const pdfs = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
      const validPdfs = pdfs.filter(f => f.size <= MAX_FILE_SIZE);
      const newFiles = validPdfs.filter(f => !files.some(existing => existing.name === f.name && existing.size === f.size));
      if (newFiles.length > 0) {
        onFilesChange([...files, ...newFiles]);
      } else if (pdfs.length > validPdfs.length) {
        alert('Some files exceed the 5MB size limit.');
      } else if (validPdfs.length > 0) {
        alert('All dropped files have already been added.');
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;
    if (e.target.files && e.target.files.length > 0) {
      const pdfs = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
      const validPdfs = pdfs.filter(f => f.size <= MAX_FILE_SIZE);
      const newFiles = validPdfs.filter(f => !files.some(existing => existing.name === f.name && existing.size === f.size));
      if (newFiles.length > 0) {
        onFilesChange([...files, ...newFiles]);
      } else if (pdfs.length > validPdfs.length) {
        alert('Some files exceed the 5MB size limit.');
      } else if (validPdfs.length > 0) {
        alert('All selected files have already been added.');
      }
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest opacity-0 select-none">
        Upload Resumes
      </label>
      <div
        className={cn(
          "relative flex flex-col items-center justify-center h-48 border border-dashed transition-all bg-background/40 backdrop-blur-md shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]",
          isDragging ? "border-cyan-500 bg-cyan-950/20" : "border-slate-800/80 hover:bg-slate-900/40 hover:border-slate-700",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="application/pdf"
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />
        <UploadCloud className="w-8 h-8 text-slate-500 mb-4 transition-colors group-hover:text-cyan-400" />
        <p className="text-sm font-display text-slate-200">
          Click to upload or drag and drop
        </p>
        <p className="text-[10px] font-mono text-slate-500 mt-2 uppercase tracking-widest">
          PDF resumes only. Upload multiple files at once.
        </p>
      </div>

      {files.length > 0 && (
        <div className="flex flex-col gap-2 mt-4">
          <p className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
            Awaiting PDF batch - {files.length} ready
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {files.map((file, i) => (
              <li key={`${file.name}-${i}`} className="flex items-center justify-between p-3 bg-background/60 backdrop-blur-md border border-slate-800/80">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-1.5 bg-slate-900 rounded-none border border-slate-800">
                    <FileText className="w-4 h-4 text-cyan-500" />
                  </div>
                  <span className="text-xs font-mono text-slate-300 truncate">{file.name}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  disabled={disabled}
                  className="p-1 hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
