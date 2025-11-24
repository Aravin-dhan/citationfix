'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { validateWordLimit } from '@/utils/fileParser';
import { parseFile } from '@/utils/fileParser';
import ThemeToggle from './components/ThemeToggle';
import Tutorial from './components/Tutorial';
import {
  Upload,
  Download,
  FileText,
  Quote,
  AlignLeft,
  Copy,
  Check,
  Info,
  Keyboard,
  AlertCircle,
  Settings,
  Menu
} from 'lucide-react';

const MAX_WORDS = 20000;
const AI_PROMPT = `When providing citations in your response, format them using {{fn: citation}} markers. For example: "This principle is well established.{{fn: Smith v. Jones, 123 F.3d 456 (2020)}}" - This allows for easy conversion to proper legal footnotes.`;

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [useCitations, setUseCitations] = useState(true);
  const [useFormatting, setUseFormatting] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (inputText.trim() && (useCitations || useFormatting)) handleDownloadDocx();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        fileInputRef.current?.click();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        setUseCitations(!useCitations);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '2') {
        e.preventDefault();
        setUseFormatting(!useFormatting);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [inputText, useCitations, useFormatting]);

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
          convert_citations: useCitations
        }),
      });

      const processingTime = Date.now() - startTime;
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
    <div className="flex flex-col h-screen bg-[var(--app-bg)] overflow-hidden font-sans">
      <Tutorial />

      {/* Top Navigation Bar (DocHub Style) */}
      <header className="h-16 bg-[var(--header-bg)] text-[var(--header-text)] flex items-center justify-between px-4 shadow-md z-10 flex-shrink-0 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="bg-[var(--primary)] p-1.5 rounded-md">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight hidden sm:block">CitationFix</h1>
          </div>
          <div className="h-6 w-px bg-gray-600 mx-2 hidden sm:block" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-gray-700 hover:bg-gray-600 rounded transition-colors whitespace-nowrap"
            >
              <Upload className="w-4 h-4" /> <span className="hidden sm:inline">Upload</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".txt,.docx"
              onChange={handleFileUpload}
              disabled={isProcessing}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Action Toggles */}
          <div className="flex bg-gray-800 rounded-md p-1 border border-gray-700 gap-1">
            <button
              onClick={() => setUseCitations(!useCitations)}
              className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition-all ${useCitations ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              title="Convert {{fn: ...}} to footnotes"
            >
              <Quote className="w-3.5 h-3.5" /> <span className="hidden md:inline">Citations</span>
            </button>
            <button
              onClick={() => setUseFormatting(!useFormatting)}
              className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition-all ${useFormatting ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              title="Apply Legal Formatting"
            >
              <AlignLeft className="w-3.5 h-3.5" /> <span className="hidden md:inline">Formatting</span>
            </button>
          </div>

          <button
            onClick={handleDownloadDocx}
            disabled={!inputText.trim() || isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--success)] hover:bg-green-600 text-white rounded-md text-sm font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isDownloading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">Download</span>
          </button>

          <div className="h-6 w-px bg-gray-600 mx-1 hidden sm:block" />

          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <button onClick={() => setShowTips(!showTips)} className="p-2 text-gray-400 hover:text-white transition-colors">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex relative overflow-hidden">

        {/* Sidebar / Tips Panel (Slide-over or persistent) */}
        {showTips && (
          <div className="w-80 bg-white border-r border-[var(--border)] flex-shrink-0 overflow-y-auto z-20 shadow-xl absolute left-0 top-0 bottom-0 animate-fade-in md:relative md:shadow-none">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-[var(--ink)] flex items-center gap-2">
                <Menu className="w-4 h-4" /> Tools & Tips
              </h2>
              <button onClick={() => setShowTips(false)} className="md:hidden text-gray-500">Close</button>
            </div>

            <div className="p-4 space-y-6">
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase text-[var(--ink-muted)] tracking-wider">AI Assistant</h3>
                <p className="text-sm text-[var(--ink)] mb-2">Paste this prompt into ChatGPT/Claude to generate citations:</p>
                <div className="relative group">
                  <div className="p-3 bg-gray-100 rounded text-xs font-mono text-gray-600 border border-gray-200">
                    {AI_PROMPT}
                  </div>
                  <button
                    onClick={copyPrompt}
                    className="absolute top-2 right-2 p-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 text-gray-600"
                    title="Copy"
                  >
                    {copiedPrompt ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase text-[var(--ink-muted)] tracking-wider">Shortcuts</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm text-[var(--ink)]"><span>Upload</span> <kbd className="bg-gray-100 px-1.5 rounded border border-gray-300 font-mono text-xs">Ctrl+U</kbd></div>
                  <div className="flex justify-between text-sm text-[var(--ink)]"><span>Download</span> <kbd className="bg-gray-100 px-1.5 rounded border border-gray-300 font-mono text-xs">Ctrl+D</kbd></div>
                  <div className="flex justify-between text-sm text-[var(--ink)]"><span>Toggle Citations</span> <kbd className="bg-gray-100 px-1.5 rounded border border-gray-300 font-mono text-xs">Ctrl+1</kbd></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Canvas */}
        <div className="flex-1 bg-[var(--app-bg)] overflow-y-auto p-8 flex justify-center relative">

          {/* Error Toast */}
          {errorMessage && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md shadow-lg flex items-center gap-2 text-sm font-medium animate-fade-in">
              <AlertCircle className="w-4 h-4" />
              {errorMessage}
            </div>
          )}

          {/* The "Paper" */}
          <div className="w-full max-w-[850px] min-h-[1100px] bg-[var(--paper-bg)] doc-shadow flex flex-col relative transition-all duration-300">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Paste your legal document here..."
              className="w-full h-full p-16 bg-transparent border-none resize-none focus:ring-0 text-[var(--ink)] placeholder-gray-300 text-lg leading-relaxed font-serif outline-none"
              spellCheck={false}
            />

            {/* Footer / Status Bar inside the paper */}
            <div className="absolute bottom-0 left-0 right-0 h-12 border-t border-[var(--border)] bg-gray-50/50 flex items-center justify-between px-6 text-xs text-[var(--ink-muted)]">
              <span>{wordCount.toLocaleString()} words</span>
              <div className="flex gap-4">
                <span>Ln {inputText.split('\n').length}</span>
                <span>Col {inputText.length}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
