'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { processText } from '@/utils/converter'; // Removed formatFootnotes
import { parseFile, validateWordLimit } from '@/utils/fileParser';
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
  AlertCircle
} from 'lucide-react';

const MAX_WORDS = 20000;

const AI_PROMPT = `When providing citations in your response, format them using {{fn: citation}} markers. For example: "This principle is well established.{{fn: Smith v. Jones, 123 F.3d 456 (2020)}}" - This allows for easy conversion to proper legal footnotes.`;

export default function Home() {
  const [inputText, setInputText] = useState('');
  // const [mainText, setMainText] = useState(''); // Removed
  // const [footnotes, setFootnotes] = useState<string[]>([]); // Removed
  const [wordCount, setWordCount] = useState(0);
  const [isOverLimit, setIsOverLimit] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // const [copiedMain, setCopiedMain] = useState(false); // Removed
  // const [copiedFootnotes, setCopiedFootnotes] = useState(false); // Removed
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
      // Ctrl/Cmd + D = Download
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (inputText.trim() && (useCitations || useFormatting)) handleDownloadDocx();
      }
      // Ctrl/Cmd + U = Upload
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        fileInputRef.current?.click();
      }
      // Ctrl/Cmd + 1 = Toggle Citations
      if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        setUseCitations(!useCitations);
      }
      // Ctrl/Cmd + 2 = Toggle Formatting
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
    setIsOverLimit(!validation.isValid && validation.wordCount > 0);
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

  // const handleConvert = () => { // Removed
  //   const result = processText(inputText);
  //   setMainText(result.mainText);
  //   setFootnotes(result.footnotes);
  //   setCopiedMain(false);
  //   setCopiedFootnotes(false);
  // };

  const handleDownloadDocx = async () => {
    if (!useCitations && !useFormatting) {
      setErrorMessage('Please select at least one option (Citations or Formatting)');
      return;
    }

    setIsDownloading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          formatting: useFormatting,
          convert_citations: useCitations
        }),
      });

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

  // const hasResults = mainText || footnotes.length > 0; // Removed
  // const canConvert = inputText.trim() && !isOverLimit; // Removed

  return (
    <div className="min-h-screen bg-[var(--desk-bg)] py-8 px-4 sm:px-6 flex flex-col items-center font-sans transition-colors duration-300">
      <Tutorial />

      {/* The "Paper" Container */}
      <div className="w-full max-w-5xl bg-[var(--paper-bg)] rounded-sm paper-shadow min-h-[85vh] flex flex-col relative overflow-hidden transition-colors duration-300">

        {/* Header / Toolbar */}
        <header className="border-b border-[var(--line)] px-8 py-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-serif font-bold text-[var(--ink)] tracking-tight">
                CitationFix
              </h1>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/20">
                Legal Tools
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowTips(!showTips)}
                className="p-2 text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors rounded-full hover:bg-[var(--accent-light)]"
                title="Tips & Shortcuts"
              >
                <Info className="w-5 h-5" />
              </button>
              <ThemeToggle />
            </div>
          </div>

          {/* Controls Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 bg-[var(--desk-bg)]/30 p-1 rounded-lg border border-[var(--line)]">
              {/* Toggle: Citations */}
              <button
                onClick={() => setUseCitations(!useCitations)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${useCitations
                    ? 'bg-[var(--paper-bg)] text-[var(--ink)] shadow-sm border border-[var(--line)]'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                  }`}
                title="Convert {{fn: ...}} to footnotes (Ctrl+1)"
              >
                <Quote className={`w-4 h-4 ${useCitations ? 'text-[var(--accent)]' : ''}`} />
                Citations
              </button>

              {/* Toggle: Formatting */}
              <button
                onClick={() => setUseFormatting(!useFormatting)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${useFormatting
                    ? 'bg-[var(--paper-bg)] text-[var(--ink)] shadow-sm border border-[var(--line)]'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                  }`}
                title="Apply Legal Formatting (Ctrl+2)"
              >
                <AlignLeft className={`w-4 h-4 ${useFormatting ? 'text-[var(--accent)]' : ''}`} />
                Formatting
              </button>
            </div>

            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".txt,.docx"
                onChange={handleFileUpload}
                disabled={isProcessing}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--ink)] hover:text-[var(--accent)] transition-colors disabled:opacity-50"
                title="Upload .txt or .docx (Ctrl+U)"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-[var(--ink)] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Upload
              </button>

              <div className="h-6 w-px bg-[var(--line)] mx-1" />

              <button
                onClick={handleDownloadDocx}
                disabled={!inputText.trim() || isDownloading || (!useCitations && !useFormatting)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--ink)] text-[var(--paper-bg)] rounded-md text-sm font-medium shadow-sm hover:bg-[var(--accent)] hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                title="Download Document (Ctrl+D)"
              >
                {isDownloading ? (
                  <div className="w-4 h-4 border-2 border-[var(--paper-bg)] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative">

          {/* Tips / AI Prompt Panel (Collapsible) */}
          {showTips && (
            <div className="bg-[var(--accent-light)]/30 border-b border-[var(--line)] p-6 animate-fade-in">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                    <Keyboard className="w-4 h-4" /> Shortcuts
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs text-[var(--ink-muted)]">
                    <div className="flex justify-between p-2 bg-[var(--paper-bg)] rounded border border-[var(--line)]">
                      <span>Toggle Citations</span> <kbd className="font-mono bg-[var(--desk-bg)] px-1 rounded">Ctrl+1</kbd>
                    </div>
                    <div className="flex justify-between p-2 bg-[var(--paper-bg)] rounded border border-[var(--line)]">
                      <span>Toggle Formatting</span> <kbd className="font-mono bg-[var(--desk-bg)] px-1 rounded">Ctrl+2</kbd>
                    </div>
                    <div className="flex justify-between p-2 bg-[var(--paper-bg)] rounded border border-[var(--line)]">
                      <span>Upload File</span> <kbd className="font-mono bg-[var(--desk-bg)] px-1 rounded">Ctrl+U</kbd>
                    </div>
                    <div className="flex justify-between p-2 bg-[var(--paper-bg)] rounded border border-[var(--line)]">
                      <span>Download</span> <kbd className="font-mono bg-[var(--desk-bg)] px-1 rounded">Ctrl+D</kbd>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                    <FileText className="w-4 h-4" /> AI Prompt
                  </h3>
                  <div className="relative">
                    <div className="p-3 bg-[var(--paper-bg)] border border-[var(--line)] rounded text-xs font-mono text-[var(--ink-muted)] leading-relaxed pr-10">
                      {AI_PROMPT}
                    </div>
                    <button
                      onClick={copyPrompt}
                      className="absolute top-2 right-2 p-1.5 hover:bg-[var(--desk-bg)] rounded transition-colors text-[var(--ink-muted)] hover:text-[var(--ink)]"
                      title="Copy Prompt"
                    >
                      {copiedPrompt ? <Check className="w-4 h-4 text-[var(--success)]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mx-8 mt-6 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded text-sm text-[var(--error)] flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {errorMessage}
            </div>
          )}

          {/* Text Area - The "Paper" Surface */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Start typing or paste your document here..."
              className="w-full h-full p-8 bg-transparent border-none resize-none focus:ring-0 text-[var(--ink)] placeholder-[var(--line)] text-lg leading-relaxed font-serif outline-none"
              spellCheck={false}
            />

            {/* Word Count (Floating) */}
            <div className="absolute bottom-4 right-8 text-xs font-medium text-[var(--ink-muted)] bg-[var(--paper-bg)]/80 backdrop-blur-sm px-2 py-1 rounded border border-[var(--line)]">
              {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()} words
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-[var(--line)] px-8 py-4 bg-[var(--paper-bg)]">
          <div className="flex items-center justify-between text-xs text-[var(--ink-muted)]">
            <p>© 2025 CitationFix. Ephemeral Processing.</p>
            <div className="flex gap-6">
              <a href="/feedback" className="hover:text-[var(--accent)] transition-colors">Feedback</a>
              <a href="/privacy" className="hover:text-[var(--accent)] transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-[var(--accent)] transition-colors">Terms</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
