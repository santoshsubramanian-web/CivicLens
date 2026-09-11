import { useRef, useState, useCallback, useEffect } from 'react';
import {
  UploadCloud, FileImage, FileAudio, X, Loader2, CornerDownLeft, Eraser,
  ScanLine, FileText,
} from 'lucide-react';

interface ReportInputProps {
  onSubmit: (file: File | null, details: string) => void;
  loading: boolean;
}

type Mode = 'visual' | 'transcript';

export default function ReportInput({ onSubmit, loading }: ReportInputProps) {
  const [mode, setMode] = useState<Mode>('visual');
  const [file, setFile] = useState<File | null>(null);
  const [details, setDetails] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const acceptType = mode === 'visual' ? 'image/*' : 'audio/*';

  const handleFile = useCallback((f: File) => {
    setFile(f);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const clearText = () => setDetails('');

  const canSubmit = !loading && (file !== null || details.trim() !== '');

  const handleSubmit = useCallback(() => {
    if (canSubmit) onSubmit(file, details);
  }, [canSubmit, onSubmit, file, details]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSubmit]);

  const lineCount = details.split('\n').length;

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-[#0284c7] p-5">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-blue-500" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-200">Incident Intake Console</h2>
      </div>

      {/* Dual Mode Selector */}
      <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-[#090D16] p-1.5">
        <button
          onClick={() => { setMode('visual'); removeFile(); }}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all duration-200 ${
            mode === 'visual'
              ? 'bg-blue-500/15 text-blue-300 shadow-sm ring-1 ring-blue-500/30'
              : 'text-slate-500 hover:text-slate-400'
          }`}
        >
          <ScanLine className="h-3.5 w-3.5" />
          Multimodal Visual Analysis
        </button>
        <button
          onClick={() => { setMode('transcript'); removeFile(); }}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all duration-200 ${
            mode === 'transcript'
              ? 'bg-blue-500/15 text-blue-300 shadow-sm ring-1 ring-blue-500/30'
              : 'text-slate-500 hover:text-slate-400'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          Call Transcript / Text Log
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`group relative cursor-pointer rounded-xl border-2 border-dashed p-5 transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
            : 'border-slate-700 hover:border-slate-600 bg-[#090D16]/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptType}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {file ? (
          <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
            {preview ? (
              <img src={preview} alt="Evidence preview" className="h-16 w-16 rounded-lg object-cover ring-1 ring-white/10" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-800 ring-1 ring-white/10">
                <FileAudio className="h-7 w-7 text-blue-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                {mode === 'visual' ? <FileImage className="h-4 w-4 text-blue-400" /> : <FileAudio className="h-4 w-4 text-blue-400" />}
                <span className="truncate font-medium">{file.name}</span>
              </div>
              <p className="mt-0.5 font-mono text-xs text-slate-500">
                {(file.size / 1024).toFixed(1)} KB · {file.type || 'unknown'}
              </p>
            </div>
            <button
              onClick={removeFile}
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
              isDragging ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500 group-hover:text-slate-400'
            }`}>
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-200">
              {isDragging ? 'Drop file here' : 'Drag & drop or click to upload'}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {mode === 'visual'
                ? 'PNG, JPG, WEBP — road or infrastructure evidence'
                : 'MP3, WAV, M4A — citizen call recording'}
            </p>
          </div>
        )}
      </div>

      {/* Terminal-style text area */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            {mode === 'visual' ? 'Incident Description' : 'Transcript / Text Log'}
          </label>
          {details && (
            <button
              onClick={clearText}
              className="flex items-center gap-1 text-[10px] font-medium text-slate-600 transition-colors hover:text-slate-400"
            >
              <Eraser className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#090D16]/80 transition-colors focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/10">
          <div className="flex">
            <div className="select-none border-r border-white/5 bg-[#090D16] px-2.5 py-3 text-right font-mono text-xs leading-relaxed text-slate-700">
              {Array.from({ length: Math.max(lineCount, 4) }, (_, i) => (
                <div key={i} className="leading-relaxed">{String(i + 1).padStart(2, '0')}</div>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              spellCheck={false}
              placeholder={mode === 'visual'
                ? 'Describe the issue — e.g. "Large pothole near Main St and 5th Ave, causing vehicles to swerve into oncoming traffic..."'
                : 'Paste or type the citizen call transcript...'}
              className="flex-1 resize-none bg-transparent px-3 py-3 text-left font-mono text-sm leading-relaxed text-slate-200 placeholder-slate-600 outline-none scrollbar-thin"
            />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        disabled={!canSubmit}
        onClick={handleSubmit}
        className={`group relative flex w-full items-center justify-center gap-2.5 rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-200 ${
          canSubmit
            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white glow-blue glow-blue-hover hover:scale-[1.01] active:scale-[0.99]'
            : 'cursor-not-allowed bg-slate-800/50 text-slate-600'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing Evidence...
          </>
        ) : (
          <>
            <span>ANALYZE &amp; DISPATCH TICKET</span>
            <kbd className="ml-1 hidden items-center gap-0.5 rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-normal text-white/70 sm:flex">
              <span className="text-[10px]">⌘</span>
              <CornerDownLeft className="h-2.5 w-2.5" />
            </kbd>
          </>
        )}
      </button>
    </div>
  );
}
