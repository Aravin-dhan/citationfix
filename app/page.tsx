'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { processText, formatFootnotes } from '@/utils/converter';
import { parseFile, validateWordLimit } from '@/utils/fileParser';
import ThemeToggle from './components/ThemeToggle';
import Tutorial from './components/Tutorial';

const MAX_WORDS = 20000;

const AI_PROMPT = `When providing citations in your response, format them using {{fn: citation}} markers. For example: "This principle is well established.{{fn: Smith v. Jones, 123 F.3d 456 (2020)}}" - This allows for easy conversion to proper legal footnotes.`;

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [mainText, setMainText] = useState('');
  const [footnotes, setFootnotes] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [isOverLimit, setIsOverLimit] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [copiedMain, setCopiedMain] = useState(false);
  const [copiedFootnotes, setCopiedFootnotes] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [useCitations, setUseCitations] = useState(true);
  const [useFormatting, setUseFormatting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + D = Download
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (inputText.trim() && (useCitations || useFormatting)) {
          handleDownloadDocx();
        }
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

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConvert = () => {
    const result = processText(inputText);
    setMainText(result.mainText);
    setFootnotes(result.footnotes);
    setCopiedMain(false);
    setCopiedFootnotes(false);
  };

  const handleDownloadDocx = async () => {
    if (!useCitations && !useFormatting) {
      setErrorMessage('Please select at least one option');
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

  const copyToClipboard = async (text: string, type: 'main' | 'footnotes' | 'prompt') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'main') {
        setCopiedMain(true);
        setTimeout(() => setCopiedMain(false), 2000);
      } else if (type === 'footnotes') {
        setCopiedFootnotes(true);
        setTimeout(() => setCopiedFootnotes(false), 2000);
      } else {
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const hasResults = mainText || footnotes.length > 0;
  const canConvert = inputText.trim() && !isOverLimit;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Tutorial />

      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            CitationFix
          </h1>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-5 text-sm">
              <a href="/feedback" className="text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">
                Feedback
              </a>
              <a href="/privacy" className="text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">
                Privacy
              </a>
              <a href="/terms" className="text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">
                Terms
              </a>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* AI Prompt Section */}
        <section className="mb-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Prompt for Citation Formatting
              </h3>
              <p className="text-sm text-[var(--text-muted)] mb-3">
                Copy this prompt and add it to your AI assistant (ChatGPT, Claude, Gemini) for proper citation formatting:
              </p>
              <div className="bg-[var(--background)] border border-[var(--border)] rounded p-3 font-mono text-sm text-[var(--foreground)] leading-relaxed">
                {AI_PROMPT}
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(AI_PROMPT, 'prompt')}
              className="flex-shrink-0 px-4 py-2 rounded text-sm font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] transition-colors flex items-center gap-2"
            >
              {copiedPrompt ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Prompt
                </>
              )}
            </button>
          </div>
        </section>

        {/* Tips Section */}
        <section className="mb-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
          <h3 className="text-base font-semibold text-[var(--foreground)] mb-3">💡 Tips for Legal Document Generation</h3>
          <div className="space-y-3 text-sm text-[var(--text-muted)]">
            <p>
              <strong className="text-[var(--foreground)]">Speed up your workflow:</strong> Use <kbd className="px-1.5 py-0.5 bg-[var(--background)] border border-[var(--border)] rounded text-xs">Ctrl+1</kbd> to toggle citations, <kbd className="px-1.5 py-0.5 bg-[var(--background)] border border-[var(--border)] rounded text-xs">Ctrl+2</kbd> for formatting, <kbd className="px-1.5 py-0.5 bg-[var(--background)] border border-[var(--border)] rounded text-xs">Ctrl+D</kbd> to download, <kbd className="px-1.5 py-0.5 bg-[var(--background)] border border-[var(--border)] rounded text-xs">Ctrl+U</kbd> to upload.
            </p>
            <p>
              <strong className="text-[var(--foreground)]">Use Google AI Studio:</strong> Upload your entire document to <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">Google AI Studio</a> along with the prompt above. AI will automatically convert any citations it generates into the <code>{'{{fn: ...}}'}</code> format that CitationFix can process.
            </p>
            <p>
              <strong className="text-[var(--foreground)]">For existing documents:</strong> Paste your document with the AI prompt into any AI assistant (ChatGPT, Claude, Gemini) and ask it to reformat all citations using the <code>{'{{fn: ...}}'}</code> marker format.
            </p>
          </div>
        </section>

        {/* Main Input Area */}
        <section className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div
              onClick={() => setUseCitations(!useCitations)}
              className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-all border text-sm ${useCitations
                  ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                }`}
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${useCitations ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-current'
                }`}>
                {useCitations && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="font-medium">Convert Citations</span>
            </div>

            <div
              onClick={() => setUseFormatting(!useFormatting)}
              className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-all border text-sm ${useFormatting
                  ? 'bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                }`}
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${useFormatting ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-current'
                }`}>
                {useFormatting && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="font-medium">Apply Formatting</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              id="file-upload"
              className="hidden"
              accept=".txt,.docx"
              onChange={handleFileUpload}
              disabled={isProcessing}
            />
            <label
              htmlFor="file-upload"
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium border transition-colors cursor-pointer ${isProcessing
                  ? 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] opacity-50 cursor-not-allowed'
                  : 'bg-[var(--surface)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--background)]'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload File
            </label>

            <div className="ml-auto">
              <span className={`text-xs px-2 py-1 rounded ${wordCount > 20000
                  ? 'bg-[var(--error)]/10 text-[var(--error)]'
                  : 'bg-[var(--surface)] text-[var(--text-muted)]'
                }`}>
                {wordCount.toLocaleString()} / 20,000 words
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded bg-[var(--error)]/10 border border-[var(--error)] text-sm text-[var(--error)]">
              {errorMessage}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder='Paste your document here or upload a file. Use {{fn: Citation}} for footnotes.'
            className="w-full h-96 px-4 py-3 rounded-lg border-2 border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none resize-y font-mono text-base leading-relaxed"
          />

          <button
            onClick={handleDownloadDocx}
            disabled={!inputText.trim() || isDownloading || (!useCitations && !useFormatting)}
            className="w-full py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
            style={{
              backgroundColor: isDownloading || !inputText.trim() ? 'var(--text-muted)' : 'var(--primary)'
            }}
          >
            {isDownloading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Document
              </>
            )}
          </button>

          <p className="text-xs text-center text-[var(--text-muted)]">
            {useCitations && useFormatting && 'With citations converted and legal formatting applied'}
            {useCitations && !useFormatting && 'Citations will be converted to footnotes'}
            {!useCitations && useFormatting && 'Legal formatting will be applied (TNR 12, Justified, 1.5)'}
            {!useCitations && !useFormatting && 'Select at least one option above'}
          </p>
        </section>

        {/* Example */}
        <section className="mt-8 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
          <h3 className="text-base font-semibold text-[var(--foreground)] mb-3">Example Format</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Input:</p>
              <code className="block p-3 bg-[var(--background)] border border-[var(--border)] rounded text-sm font-mono text-[var(--foreground)]">
                {'This legal principle is established.{{fn: Smith v. Jones, 123 F.3d 456 (2020)}}'}
              </code>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Output (.docx):</p>
              <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded text-sm">
                <p className="text-[var(--foreground)]">
                  This legal principle is established.<sup className="text-[var(--primary)]">1</sup>
                </p>
                <hr className="my-2 border-[var(--border)]" />
                <p className="text-xs text-[var(--text-muted)]">
                  <sup className="text-[var(--primary)]">1</sup> Smith v. Jones, 123 F.3d 456 (2020)
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] mt-16">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
            <p>© 2025 CitationFix. No data stored. Processing is ephemeral.</p>
            <div className="flex gap-4">
              <a href="/feedback" className="hover:text-[var(--primary)] transition-colors">Feedback</a>
              <a href="/privacy" className="hover:text-[var(--primary)] transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-[var(--primary)] transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
