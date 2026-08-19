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
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          "relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all",
          isDragging ? "border-indigo-500 bg-indigo-500/10" : "border-slate-800 bg-slate-900/50",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-slate-800/50 hover:border-slate-700"
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
        <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
        <p className="text-sm font-medium text-slate-200">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-slate-500 mt-1">
          PDF resumes only. Upload multiple files at once.
        </p>
      </div>

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Ready to screen ({files.length})
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {files.map((file, i) => (
              <li key={`${file.name}-${i}`} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-slate-900 rounded-md">
                    <FileText className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="text-sm text-slate-300 truncate">{file.name}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  disabled={disabled}
                  className="p-1 hover:bg-slate-700 rounded-md text-slate-400 transition-colors"
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
