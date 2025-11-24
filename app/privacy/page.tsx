'use client';

import { ArrowLeft } from 'lucide-react';

export default function Privacy() {
    return (
        <div className="min-h-screen bg-[var(--desk-bg)] py-8 px-4 sm:px-6 flex flex-col items-center font-sans transition-colors duration-300">
            <div className="w-full max-w-4xl bg-[var(--paper-bg)] rounded-sm paper-shadow min-h-[85vh] flex flex-col relative overflow-hidden">

                {/* Header */}
                <header className="border-b border-[var(--line)] px-8 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-serif font-bold text-[var(--ink)]">
                            Privacy Policy
                        </h1>
                    </div>
                    <a href="/" className="flex items-center gap-2 text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Editor
                    </a>
                </header>

                {/* Content */}
                <div className="flex-1 p-8 md:p-12 overflow-y-auto">
                    <div className="prose prose-stone max-w-none text-[var(--ink)]">
                        <p className="lead text-lg text-[var(--ink-muted)] mb-8">
                            Last updated: November 24, 2025
                        </p>

                        <section className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold font-serif mb-3 text-[var(--ink)]">1. No Data Storage</h2>
                                <p className="text-[var(--ink)] leading-relaxed">
                                    CitationFix operates on a strictly ephemeral basis. When you upload a document or paste text, it is processed in real-time to generate your formatted file. <strong>We do not store, save, or archive your documents or text content on our servers.</strong> Once the processing is complete and your download is ready, the data is immediately discarded from memory.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold font-serif mb-3 text-[var(--ink)]">2. Client-Side Processing</h2>
                                <p className="text-[var(--ink)] leading-relaxed">
                                    Wherever possible, processing logic is executed within your browser. For operations requiring server-side assistance (such as complex .docx generation), data is transmitted securely via HTTPS, processed in memory, and never written to a persistent database or file storage system.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold font-serif mb-3 text-[var(--ink)]">3. User Feedback</h2>
                                <p className="text-[var(--ink)] leading-relaxed">
                                    If you choose to submit feedback via our Feedback form, the information you provide (name, email, message) is the only data we collect. This is used solely for the purpose of improving the application and addressing your inquiries.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold font-serif mb-3 text-[var(--ink)]">4. Third-Party Services</h2>
                                <p className="text-[var(--ink)] leading-relaxed">
                                    We use Vercel for hosting and serverless function execution. Please refer to Vercel's privacy policy for information on their infrastructure security and data handling practices.
                                </p>
                            </div>

                            <div className="p-6 bg-[var(--accent-light)]/30 border border-[var(--line)] rounded-sm mt-8">
                                <h3 className="text-lg font-bold font-serif mb-2 text-[var(--ink)]">Disclaimer</h3>
                                <p className="text-sm text-[var(--ink-muted)]">
                                    While we take every measure to ensure the security of your data during transit and processing, users should exercise standard caution when handling highly sensitive or classified legal documents online. CitationFix is provided "as is" without warranty of any kind.
                                </p>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer */}
                <footer className="border-t border-[var(--line)] px-8 py-4 bg-[var(--paper-bg)]">
                    <div className="flex items-center justify-between text-xs text-[var(--ink-muted)]">
                        <p>© 2025 CitationFix. All rights reserved.</p>
                        <div className="flex gap-6">
                            <a href="/terms" className="hover:text-[var(--accent)] transition-colors">Terms of Service</a>
                            <a href="/feedback" className="hover:text-[var(--accent)] transition-colors">Contact Us</a>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
