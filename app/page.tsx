'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { processText, formatFootnotes } from '@/utils/converter';
import { parseFile, validateWordLimit } from '@/utils/fileParser';
import ThemeToggle from './components/ThemeToggle';
import Tutorial from './components/Tutorial';

const MAX_WORDS = 20000;

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

  // New state for granular control
  const [useCitations, setUseCitations] = useState(true);
  const [useFormatting, setUseFormatting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Reset file input
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
        throw new Error(errorData.error || 'Failed to generate .docx file');
      }

      const blob = await response.blob();

      // Validate blob
      if (blob.size === 0) {
        throw new Error('Generated file is empty');
      }

      // Determine filename
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
      setErrorMessage(error instanceof Error ? error.message : 'Failed to download file');
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[var(--foreground)]">
            CitationFix
          </h1>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Controls Bar */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Citation Toggle */}
                <div
                  onClick={() => setUseCitations(!useCitations)}
                  className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-all border ${useCitations
                      ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                    }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${useCitations ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-current'
                    }`}>
                    {useCitations && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium">Convert Citations</span>
                </div>

                {/* Formatting Toggle */}
                <div
                  onClick={() => setUseFormatting(!useFormatting)}
                  className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-all border ${useFormatting
                      ? 'bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                    }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${useFormatting ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-current'
                    }`}>
                    {useFormatting && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium">Apply Formatting</span>
                </div>

                {/* Upload Button */}
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
                  {isProcessing ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  )}
                  Upload File
                </label>

                {/* Word Count */}
                <div className="ml-auto flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${wordCount > 20000
                      ? 'bg-[var(--error)]/10 text-[var(--error)]'
                      : 'bg-[var(--surface)] text-[var(--text-muted)]'
                    }`}>
                    {wordCount.toLocaleString()} / 20,000 words
                  </span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded bg-[var(--error)]/10 border border-[var(--error)] text-sm text-[var(--error)]">
                {errorMessage}
              </div>
            )}

            {/* Textarea */}
            <textarea
              value={inputText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder='Paste your document here or upload a file above. Use {{fn: Citation}} for footnotes.'
              className="w-full h-[600px] px-4 py-3 rounded-lg border-2 border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none resize-none font-mono text-base leading-relaxed"
            />

            {/* Download Button */}
            <button
              onClick={handleDownloadDocx}
              disabled={!inputText.trim() || isDownloading || (!useCitations && !useFormatting)}
              className="w-full py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  {useCitations && useFormatting && ' (Citations + Formatting)'}
                  {useCitations && !useFormatting && ' (Citations Only)'}
                  {!useCitations && useFormatting && ' (Formatting Only)'}
                </>
              )}
            </button>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* How It Works */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
              <h3 className="font-semibold text-[var(--foreground)] mb-3">How It Works</h3>
              <ol className="space-y-2 text-sm text-[var(--text-muted)]">
                <li className="flex gap-2">
                  <span className="font-semibold text-[var(--primary)]">1.</span>
                  Paste text or upload file
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-[var(--primary)]">2.</span>
                  Select options above
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-[var(--primary)]">3.</span>
                  Download .docx file
                </li>
              </ol>
            </div>

            {/* Example */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Citation Format</h3>
              <code className="block p-2 bg-[var(--background)] rounded text-xs font-mono text-[var(--foreground)] leading-relaxed">
                {'Text here.{{fn: Citation}} More text.'}
              </code>
            </div>

            {/* Features */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
              <h3 className="font-semibold text-[var(--foreground)] mb-3">Features</h3>
              <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[var(--success)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Real Word footnotes
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[var(--success)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Legal formatting (TNR 12)
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[var(--success)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  No data stored
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[var(--success)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Up to 20k words
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
            <p>© 2025 CitationFix. All processing is ephemeral.</p>
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
