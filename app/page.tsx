'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { validateWordLimit } from '@/utils/fileParser';
import { parseFile } from '@/utils/fileParser';
import {
  Upload,
  Download,
  FileText,
  Quote,
  AlignLeft,
  Copy,
  Check,
  Info,
  Settings,
  Sparkles,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

const MAX_WORDS = 20000;
const AI_PROMPT = `When providing citations in your response, format them using {{fn: citation}} markers. For example: "This principle is well established.{{fn: Smith v. Jones, 123 F.3d 456 (2020)}}" - This allows for easy conversion to proper legal footnotes.`;

export default function Home() {
  // State
  const [inputText, setInputText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Configuration
  const [useCitations, setUseCitations] = useState(true);
  const [useFormatting, setUseFormatting] = useState(false);
  const [showAiPrompt, setShowAiPrompt] = useState(true);

  // Advanced Settings
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [font, setFont] = useState('Times New Roman');
  const [fontSize, setFontSize] = useState(12);
  const [lineSpacing, setLineSpacing] = useState(1.5);

  // Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Preview State
  const [showPreview, setShowPreview] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handlers
  const handleTextChange = (text: string) => {
    setInputText(text);
    const validation = validateWordLimit(text, MAX_WORDS);
    setWordCount(validation.wordCount);
    setErrorMessage(validation.message || '');
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      setErrorMessage('');
      const text = await parseFile(file);
      handleTextChange(text);
      setIsSidebarOpen(false); // Close sidebar on mobile after upload
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to parse file');
    } finally {
      setIsProcessing(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadDocx = async () => {
    if (!useCitations && !useFormatting) {
      setErrorMessage('Please select at least one option (Citations or Formatting)');
      return;
    }
    setIsDownloading(true);
    setErrorMessage('');
    try {
      const startTime = Date.now();
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          formatting: useFormatting,
          convert_citations: useCitations,
          // Send advanced settings if enabled
          font: isAdvanced ? font : 'Times New Roman',
          font_size: isAdvanced ? fontSize : 12,
          line_spacing: isAdvanced ? lineSpacing : 1.5
        }),
      });

      const processingTime = Date.now() - startTime;
      // Fire-and-forget logging
      fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordCount,
          processingTimeMs: processingTime,
          features: { citations: useCitations, formatting: useFormatting },
          status: response.ok ? 'success' : 'error',
          errorType: response.ok ? undefined : 'api_error'
        })
      }).catch(console.error);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate file');
      }

      const blob = await response.blob();
      if (blob.size === 0) throw new Error('Generated file is empty');

      let filename = 'CitationFix';
      if (useCitations) filename += '-Converted';
      if (useFormatting) filename += '-Formatted';
      filename += '.docx';

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to download');
    } finally {
      setIsDownloading(false);
    }
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[var(--app-bg)] overflow-hidden font-sans text-[var(--ink)]">

      {/* Mobile Header (Visible only on small screens) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[var(--sidebar-bg)] flex items-center justify-between px-4 z-30 shadow-md">
        <span className="text-lg font-bold text-[var(--sidebar-text)] tracking-tight">CitationFix</span>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white p-2">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* 1. SIDEBAR (Fixed Left Panel) */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 w-72 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] 
        flex flex-col flex-shrink-0 z-40 shadow-xl transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>

        {/* Brand Header (Desktop) */}
        <div className="hidden md:flex h-16 items-center px-6 border-b border-[var(--sidebar-border)]">
          <div className="flex items-center gap-2.5">
            <div className="bg-[var(--accent)] p-1.5 rounded-lg shadow-lg shadow-blue-900/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-[var(--sidebar-text)] tracking-tight">CitationFix</span>
          </div>
        </div>

        {/* Mobile Close Button */}
        <div className="md:hidden h-14 flex items-center justify-end px-4 border-b border-[var(--sidebar-border)]">
          <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 text-sm">Close Menu</button>
        </div>

        {/* Scrollable Controls Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

          {/* Primary Action: Upload */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--sidebar-text-muted)]">Input</h3>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[var(--sidebar-hover)] hover:bg-[var(--sidebar-border)] text-[var(--sidebar-text)] rounded-lg border border-[var(--sidebar-border)] transition-all group"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-[var(--sidebar-text)] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4 text-[var(--sidebar-text-muted)] group-hover:text-white transition-colors" />
              )}
              <span className="font-medium">Upload Document</span>
            </button>
            <input ref={fileInputRef} type="file" className="hidden" accept=".txt,.docx" onChange={handleFileUpload} />
            <p className="text-[10px] text-[var(--sidebar-text-muted)] text-center">Supports .docx and .txt (Max 20k words)</p>
          </div>

          {/* Settings / Toggles */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--sidebar-text-muted)]">Configuration</h3>

            {/* Toggle: Citations */}
            <label className="flex items-center justify-between p-3 rounded-lg bg-[var(--sidebar-hover)]/50 border border-[var(--sidebar-border)] cursor-pointer hover:border-[var(--sidebar-text-muted)] transition-colors">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded ${useCitations ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-slate-800 text-slate-500'}`}>
                  <Quote className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[var(--sidebar-text)]">Convert Citations</span>
                  <span className="text-[10px] text-[var(--sidebar-text-muted)]">{"{{fn: ...}}"} → Footnotes</span>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${useCitations ? 'bg-[var(--accent)]' : 'bg-slate-700'}`}>
                <input type="checkbox" className="hidden" checked={useCitations} onChange={(e) => setUseCitations(e.target.checked)} />
                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${useCitations ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </label>

            {/* Toggle: Formatting */}
            <label className="flex items-center justify-between p-3 rounded-lg bg-[var(--sidebar-hover)]/50 border border-[var(--sidebar-border)] cursor-pointer hover:border-[var(--sidebar-text-muted)] transition-colors">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded ${useFormatting ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-slate-800 text-slate-500'}`}>
                  <AlignLeft className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[var(--sidebar-text)]">Legal Formatting</span>
                  <span className="text-[10px] text-[var(--sidebar-text-muted)]">Standard Layout</span>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${useFormatting ? 'bg-[var(--accent)]' : 'bg-slate-700'}`}>
                <input type="checkbox" className="hidden" checked={useFormatting} onChange={(e) => setUseFormatting(e.target.checked)} />
                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${useFormatting ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </label>
          </div>

          {/* Advanced Settings Toggle */}
          <div className="space-y-3">
            <button
              onClick={() => setIsAdvanced(!isAdvanced)}
              className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--sidebar-text-muted)] hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2"><Settings className="w-3 h-3" /> Advanced Settings</span>
              <ChevronRight className={`w-3 h-3 transition-transform ${isAdvanced ? 'rotate-90' : ''}`} />
            </button>

            {isAdvanced && (
              <div className="p-3 bg-[var(--sidebar-hover)] rounded-lg border border-[var(--sidebar-border)] space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Font Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--sidebar-text-muted)] uppercase font-bold">Font Family</label>
                  <select
                    value={font}
                    onChange={(e) => setFont(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded p-2 focus:ring-1 focus:ring-[var(--accent)] outline-none"
                  >
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Arial">Arial</option>
                    <option value="Calibri">Calibri</option>
                    <option value="Garamond">Garamond</option>
                  </select>
                </div>

                {/* Font Size */}
                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--sidebar-text-muted)] uppercase font-bold">Font Size (pt)</label>
                  <div className="flex gap-2">
                    {[10, 11, 12, 14].map(size => (
                      <button
                        key={size}
                        onClick={() => setFontSize(size)}
                        className={`flex-1 py-1.5 text-xs rounded border ${fontSize === size ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Line Spacing */}
                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--sidebar-text-muted)] uppercase font-bold">Line Spacing</label>
                  <select
                    value={lineSpacing}
                    onChange={(e) => setLineSpacing(parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded p-2 focus:ring-1 focus:ring-[var(--accent)] outline-none"
                  >
                    <option value={1.0}>Single (1.0)</option>
                    <option value={1.15}>1.15</option>
                    <option value={1.5}>1.5</option>
                    <option value={2.0}>Double (2.0)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* AI Helper */}
          <div className="space-y-3">
            <button
              onClick={() => setShowAiPrompt(!showAiPrompt)}
              className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--sidebar-text-muted)] hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2"><Sparkles className="w-3 h-3" /> AI Assistant</span>
              <ChevronRight className={`w-3 h-3 transition-transform ${showAiPrompt ? 'rotate-90' : ''}`} />
            </button>

            {showAiPrompt && (
              <div className="p-3 bg-[var(--sidebar-hover)] rounded-lg border border-[var(--sidebar-border)] space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <p className="text-[11px] text-[var(--sidebar-text-muted)] leading-relaxed">
                  Paste this into ChatGPT to generate citations correctly:
                </p>
                <div className="relative group">
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[10px] font-mono text-slate-400 leading-relaxed break-words">
                    {AI_PROMPT.substring(0, 80)}...
                  </div>
                  <button
                    onClick={copyPrompt}
                    className="absolute top-1 right-1 p-1 bg-slate-800 hover:bg-[var(--accent)] text-slate-300 hover:text-white rounded transition-colors"
                    title="Copy Full Prompt"
                  >
                    {copiedPrompt ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] space-y-3">
          <button
            onClick={() => { setShowPreview(true); setIsSidebarOpen(false); }}
            disabled={!inputText.trim()}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold border border-slate-700 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" /> Preview
          </button>
          <button
            onClick={handleDownloadDocx}
            disabled={!inputText.trim() || isDownloading}
            className="w-full py-3 px-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg font-semibold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
          >
            {isDownloading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download DOCX
          </button>
        </div>
      </aside>

      {/* Overlay for Mobile Sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 2. MAIN WORKSPACE (Right Panel) */}
      <main className="flex-1 flex flex-col relative min-w-0 pt-14 md:pt-0">

        {/* Status Bar (Moved to Top) */}
        <div className="h-10 border-b border-slate-200 bg-white flex items-center justify-between px-6 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><FileText className="w-3 h-3" /> {wordCount.toLocaleString()} words</span>
            {wordCount > MAX_WORDS && <span className="text-red-500 font-bold">Limit Exceeded</span>}
          </div>
          <div className="flex gap-4">
            <span>Ln {inputText.split('\n').length}</span>
            <span>Col {inputText.length}</span>
          </div>
        </div>

        {/* Scrollable Document Canvas */}
        <div className="flex-1 overflow-y-auto bg-[var(--app-bg)] p-4 md:p-12 flex justify-center custom-scrollbar">

          {/* Error Toast (Floating) */}
          {errorMessage && (
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-5">
              <AlertCircle className="w-5 h-5 text-red-500" />
              {errorMessage}
            </div>
          )}

          {/* THE PAPER */}
          <div className="w-full max-w-[816px] min-h-[1056px] bg-[var(--paper-bg)] paper-shadow rounded-sm flex flex-col relative transition-all duration-300 ring-1 ring-black/5">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Paste your legal document here..."
              className="w-full h-full bg-transparent border-none resize-none focus:ring-0 text-[var(--ink)] placeholder-slate-300 text-lg leading-loose font-serif outline-none p-8 md:p-16"
              spellCheck={false}
              style={{
                fontFamily: isAdvanced ? font : 'Times New Roman',
                fontSize: isAdvanced ? `${fontSize}pt` : '18px', // Visual approximation
                lineHeight: isAdvanced ? lineSpacing : 1.6
              }}
            />
          </div>
        </div>

        {/* Bottom Right Links (Floating) */}
        <div className="absolute bottom-4 right-6 flex gap-4 text-xs font-medium text-slate-400">
          <a href="/privacy" className="hover:text-slate-600 transition-colors">Privacy</a>
          <a href="/terms" className="hover:text-slate-600 transition-colors">Terms</a>
          <a href="/feedback" className="hover:text-slate-600 transition-colors">Feedback</a>
        </div>

      </main>

      {/* 3. PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-slate-900/5">
            <div className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--accent)]" /> Document Preview
              </h3>
              <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-slate-600 font-medium text-sm">Close</button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100 custom-scrollbar flex justify-center">
              <div
                className="bg-white shadow-xl w-full max-w-[816px] min-h-[1000px] p-12 md:p-16 text-black"
                style={{
                  fontFamily: isAdvanced ? font : 'Times New Roman',
                  fontSize: isAdvanced ? `${fontSize}pt` : '12pt',
                  lineHeight: isAdvanced ? lineSpacing : 1.5
                }}
              >
                {inputText.split('\n').map((para, i) => {
                  if (!para.trim()) return <br key={i} />;

                  // Simulate Citation Conversion
                  let content = para;
                  const footnotes: string[] = [];
                  if (useCitations) {
                    content = content.replace(/\{\{fn:(.*?)\}\}/g, (_, citation) => {
                      footnotes.push(citation);
                      return `<sup class="text-[0.7em] align-super text-blue-600 font-bold" style="line-height: 0">[${footnotes.length}]</sup>`;
                    });
                  }

                  return (
                    <div key={i} className="mb-4 text-justify">
                      <span dangerouslySetInnerHTML={{ __html: content }} />
                      {/* Simulate Footnotes at bottom of paragraph (simplified for preview) */}
                      {footnotes.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200 text-[0.8em] leading-tight text-slate-600">
                          {footnotes.map((fn, idx) => (
                            <div key={idx} className="flex gap-1 mb-1">
                              <span className="font-bold">{idx + 1}.</span>
                              <span>{fn}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
