'use client';

import { useState } from 'react';
import { processText, formatFootnotes } from '@/utils/converter';

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [mainText, setMainText] = useState('');
  const [footnotes, setFootnotes] = useState<string[]>([]);
  const [copiedMain, setCopiedMain] = useState(false);
  const [copiedFootnotes, setCopiedFootnotes] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const handleConvert = () => {
    const result = processText(inputText);
    setMainText(result.mainText);
    setFootnotes(result.footnotes);
    setCopiedMain(false);
    setCopiedFootnotes(false);
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
                  Paste Text
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Include <code className="px-1 py-0.5 bg-[var(--background)] rounded text-xs">{'{{fn: ...}}'}</code> markers
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
                  Click button to process
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[var(--foreground)] mb-1">
                  Copy to Word
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Get clean formatted output
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Converter */}
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
              Input Text
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder='Example: "This principle is established.{{fn: Smith v. Jones, 123 F.3d 456 (2020)}} The court ruled..."'
              className="w-full h-48 px-3 py-2.5 rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 outline-none resize-none font-mono text-sm"
            />
          </div>

          <button
            onClick={handleConvert}
            disabled={!inputText.trim()}
            className="w-full sm:w-auto px-6 py-2.5 rounded font-semibold text-sm text-white bg-[var(--accent)] hover:bg-[var(--accent-light)] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
