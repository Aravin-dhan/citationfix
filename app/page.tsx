'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { processText, formatFootnotes } from '@/utils/converter';
import { parseFile, validateWordLimit } from '@/utils/fileParser';
import ThemeToggle from './components/ThemeToggle';
import Tutorial from './components/Tutorial';

const MAX_WORDS = 10000;

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

  const handleDownloadDocx = async (format: boolean = false) => {
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
          formatting: format
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

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format ? `CitationFix-Formatted-${Date.now()}.docx` : `CitationFix-${Date.now()}.docx`;
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

  const aiPrompt = `When providing citations in your response, format them using {{fn: citation}} markers. For example: "This principle is well established.{{fn: Smith v. Jones, 123 F.3d 456 (2020)}}" This allows me to easily convert them to proper footnotes.`;

  const hasResults = mainText || footnotes.length > 0;
  const canConvert = inputText.trim() && !isOverLimit;

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)] bg-[var(--background)] transition-colors duration-300">
      <Tutorial />

      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-10 backdrop-blur-md bg-opacity-80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[var(--primary)]/20">
              C
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
              Citation<span className="text-[var(--primary)]">Fix</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1 text-xs font-medium text-[var(--success)] bg-[var(--success)]/10 px-2.5 py-1 rounded-full border border-[var(--success)]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse"></span>
              System Online
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero Section */}
        <section className="text-center space-y-3 py-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] tracking-tight">
            Legal Formatting & Citations <span className="text-[var(--primary)]">Made Simple</span>
          </h2>
          <p className="text-[var(--text-muted)] max-w-2xl mx-auto text-base sm:text-lg">
            Instantly format your legal documents and convert <code>{'{{fn: ...}}'}</code> markers into real Word footnotes.
          </p>
        </section>

        {/* Input Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Document Text
              </label>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${wordCount > 10000
                ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                : 'bg-[var(--background)] text-[var(--text-muted)] border-[var(--border)]'
                }`}>
                {wordCount.toLocaleString()} / 10,000 words
              </span>
            </div>

            <div className="flex items-center gap-2">
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
                className={`cursor-pointer px-3 py-1.5 rounded text-xs font-medium border transition-colors flex items-center gap-1.5 ${isProcessing
                  ? 'bg-[var(--background)] text-[var(--text-muted)] border-[var(--border)] opacity-50 cursor-not-allowed'
                  : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--border)]'
                  }`}
              >
                {isProcessing ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )}
                Upload File
              </label>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
              {errorMessage}
            </div>
          )}

          <textarea
            value={inputText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder='Paste your text here or upload a file. Use {{fn: Citation}} for footnotes.'
            className="w-full h-64 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none resize-y font-mono text-sm leading-relaxed transition-all"
          />

          {/* Action Buttons - Now at the top/middle for easy access */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={handleConvert}
              disabled={!canConvert}
              className="px-6 py-3 rounded-lg font-semibold text-sm text-white bg-[var(--accent)] hover:bg-[var(--accent-light)] disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
              Preview Citations
            </button>

            <button
              onClick={() => handleDownloadDocx(false)}
              disabled={!inputText.trim() || isDownloading}
              className="px-6 py-3 rounded-lg font-semibold text-sm bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--background)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {isDownloading ? (
                <span className="animate-pulse">Generating...</span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download .docx
                </>
              )}
            </button>

            <button
              onClick={() => handleDownloadDocx(true)}
              disabled={!inputText.trim() || isDownloading}
              className="px-6 py-3 rounded-lg font-semibold text-sm text-white bg-[var(--primary)] hover:bg-[var(--primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center gap-2 border border-white/10"
            >
              {isDownloading ? (
                <span className="animate-pulse">Formatting...</span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  Format & Download
                </>
              )}
            </button>
          </div>
        </section>

        {/* Results Preview (Only shown if converted) */}
        {hasResults && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--foreground)]">Preview</h3>
              <span className="text-xs text-[var(--text-muted)]">(This is just a preview. Use buttons above to download)</span>
            </div>

            {/* Main Text */}
            <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  Clean Main Text
                </h3>
                <button
                  onClick={() => copyToClipboard(mainText, 'main')}
                  className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors flex items-center gap-1.5"
                >
                  {copiedMain ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="p-3 rounded bg-[var(--background)] border border-[var(--border)]">
                <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
                  {mainText}
                </p>
              </div>
            </section>

            {/* Footnotes */}
            {footnotes.length > 0 && (
              <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    Footnotes ({footnotes.length})
                  </h3>
                  <button
                    onClick={() => copyToClipboard(formatFootnotes(footnotes), 'footnotes')}
                    className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors flex items-center gap-1.5"
                  >
                    {copiedFootnotes ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 rounded bg-[var(--background)] border border-[var(--border)]">
                  <ol className="space-y-2">
                    {footnotes.map((fn, index) => (
                      <li key={index} className="text-sm text-[var(--foreground)] leading-relaxed">
                        <span className="font-semibold text-[var(--accent)] mr-2">
                          {index + 1}.
                        </span>
                        {fn}
                      </li>
                    ))}
                  </ol>
                </div>
              </section>
            )}
          </div>
        )}

        {/* Example */}
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">Example</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] mb-1.5">Input:</p>
              <code className="block p-3 bg-[var(--background)] border border-[var(--border)] rounded text-xs font-mono text-[var(--foreground)]">
                {'This is a legal argument.{{fn: Smith v. Jones, 123 F.3d 456 (2020)}} The court held...{{fn: Legal Theory, p. 45}}'}
              </code>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] mb-1.5">Output:</p>
              <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded text-xs">
                <p className="text-[var(--foreground)] mb-2">
                  This is a legal argument.¹ The court held...²
                </p>
                <ol className="space-y-1 text-[var(--text-muted)]">
                  <li><span className="font-semibold text-[var(--accent)]">1.</span> Smith v. Jones, 123 F.3d 456 (2020)</li>
                  <li><span className="font-semibold text-[var(--accent)]">2.</span> Legal Theory, p. 45</li>
                </ol>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
            <p>© 2025 CitationFix. Client-side processing only.</p>
            <a
              href="/privacy"
              className="hover:text-[var(--primary)] transition-colors font-medium"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
