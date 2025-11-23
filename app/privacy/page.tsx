export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Header */}
            <header className="border-b border-[var(--border)] bg-[var(--surface)]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium text-sm transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to CitationFix
                    </a>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 sm:p-8 space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--primary)] serif-heading mb-2">Privacy Policy</h1>
                        <p className="text-sm text-[var(--text-muted)]">
                            Last updated: November 23, 2025
                        </p>
                    </div>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-[var(--foreground)]">
                            Your Privacy Matters
                        </h2>
                        <p className="text-sm text-[var(--foreground)] leading-relaxed">
                            CitationFix is designed with privacy at its core. We believe your academic and legal work
                            should remain completely private.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-[var(--foreground)]">
                            No Data Storage
                        </h2>
                        <p className="text-sm text-[var(--foreground)] leading-relaxed">
                            All text processing happens entirely in your browser. We do not:
                        </p>
                        <ul className="list-disc list-inside space-y-1.5 text-sm text-[var(--foreground)] ml-4">
                            <li>Store your input text on any server</li>
                            <li>Save your converted footnotes</li>
                            <li>Keep any logs of your citations</li>
                            <li>Track what you paste or convert</li>
                        </ul>
                        <p className="text-sm text-[var(--foreground)] leading-relaxed">
                            When you close the browser tab, your data is gone forever.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-[var(--foreground)]">
                            Client-Side Processing
                        </h2>
                        <p className="text-sm text-[var(--foreground)] leading-relaxed">
                            The conversion from <code className="px-1.5 py-0.5 bg-[var(--background)] border border-[var(--border)] rounded text-xs font-mono">
                                {'{{fn: ...}}'}
                            </code> markers to footnotes happens using JavaScript running in your browser.
                            Your text never leaves your device.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-[var(--foreground)]">
                            No Tracking or Analytics
                        </h2>
                        <p className="text-sm text-[var(--foreground)] leading-relaxed">
                            We currently do not use any analytics, tracking pixels, or third-party services that
                            would monitor your usage of CitationFix.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold text-[var(--foreground)]">
                            Future Features
                        </h2>
                        <p className="text-sm text-[var(--foreground)] leading-relaxed">
                            If we add features that require server-side processing (such as .docx file generation),
                            we will:
                        </p>
                        <ul className="list-disc list-inside space-y-1.5 text-sm text-[var(--foreground)] ml-4">
                            <li>Update this privacy policy clearly</li>
                            <li>Process your data ephemerally (deleted immediately after conversion)</li>
                            <li>Never store or log your content</li>
                            <li>Use encryption for any data in transit</li>
                        </ul>
                    </section>

                    <div className="pt-4 border-t border-[var(--border)]">
                        <p className="text-xs text-[var(--text-muted)]">
                            <strong>TL;DR:</strong> Your text stays on your device. We don't see it, store it, or track it.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
