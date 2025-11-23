'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { processText, formatFootnotes } from '@/utils/converter';
import { parseFile, countWords, validateWordLimit } from '@/utils/fileParser';

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

    try {
      setErrorMessage('');
      const text = await parseFile(file);
      handleTextChange(text);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to parse file');
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

  const handleDownloadDocx = async (retryCount = 0) => {
    try {
      setIsDownloading(true);
      setErrorMessage('');

      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        // Try to get detailed error message from API
        const errorData = await response.json().catch(() => null);
        const errorMsg = errorData?.error || errorData?.details || 'Failed to generate .docx file';
        throw new Error(errorMsg);
      }

      const blob = await response.blob();

      // Validate blob
      if (!blob || blob.size === 0) {
        throw new Error('Generated file is empty. Please try again.');
      }

      // Validate blob type
      if (blob.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        console.warn('Unexpected blob type:', blob.type);
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CitationFix-${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      // Success - clear any previous errors
      setErrorMessage('');

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to download file';

      // Retry logic for network errors
      if (retryCount < 2 && (errorMsg.includes('network') || errorMsg.includes('fetch'))) {
        console.log(`Retrying download (attempt ${retryCount + 1}/2)...`);
        setTimeout(() => handleDownloadDocx(retryCount + 1), 1000);
        return;
      }

      setErrorMessage(`Download failed: ${errorMsg}`);
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
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--primary)] serif-heading">
            CitationFix
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Convert inline citations to formatted footnotes
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* AI Prompt Guide */}
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                AI Prompt Guide
              </h2>
              <p className="text-sm text-[var(--text-muted)] mb-3">
                Add this to your ChatGPT/Claude prompts to get properly formatted citations:
              </p>
              <div className="bg-[var(--background)] border border-[var(--border)] rounded p-3 font-mono text-xs text-[var(--foreground)] leading-relaxed">
                {aiPrompt}
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(aiPrompt, 'prompt')}
              className="px-3 py-2 rounded text-xs font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] transition-colors flex items-center gap-1.5 shrink-0"
            >
              {copiedPrompt ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        </section>

        {/* How It Works */}
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[var(--foreground)] mb-1">
                  Paste or Upload
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Text with <code className="px-1 py-0.5 bg-[var(--background)] rounded text-xs">{'{{fn: ...}}'}</code> markers
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[var(--foreground)] mb-1">
                  Convert
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Process citations
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[var(--foreground)] mb-1">
                  Download .docx
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Get Word file with real footnotes
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Converter */}
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-[var(--foreground)]">
              Input Text
            </label>
            <div className="flex items-center gap-3">
              <span className={`text-xs ${isOverLimit ? 'text-[var(--error)] font-semibold' : 'text-[var(--text-muted)]'}`}>
                {wordCount.toLocaleString()} / {MAX_WORDS.toLocaleString()} words
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.docx"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
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
            placeholder='Example: "This principle is established.{{fn: Smith v. Jones, 123 F.3d 456 (2020)}} The court ruled..."'
            className="w-full h-48 px-3 py-2.5 rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none resize-none font-mono text-sm"
          />

          <button
            onClick={handleConvert}
            disabled={!canConvert}
            className="w-full sm:w-auto px-6 py-2.5 rounded font-semibold text-sm text-white bg-[var(--accent)] hover:bg-[var(--accent-light)] disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
          >
            Convert to Footnotes
          </button>
        </section>

        {/* Results */}
        {hasResults && (
          <div className="space-y-6">
            {/* Main Text */}
            <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  Clean Main Text
                </h3>
                <div className="flex gap-2">
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
                  <button
                    onClick={() => handleDownloadDocx()}
                    disabled={isDownloading}
                    className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                  >
                    {isDownloading ? (
                      <>
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download .docx
                      </>
                    )}
                  </button>
                </div>
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
