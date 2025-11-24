import Link from 'next/link';

export default function Privacy() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <header className="border-b border-[var(--border)] bg-[var(--surface)]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
                    <Link href="/" className="text-lg font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">
                        ← Back to CitationFix
                    </Link>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
                <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">Privacy Policy</h1>

                <div className="space-y-6 text-[var(--foreground)]">
                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-[var(--primary)]">Data Collection</h2>
                        <p>CitationFix is designed with privacy as a core principle. We do <strong>NOT</strong> collect, store, or transmit any of your document text or personal data to our servers or any third parties.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-[var(--primary)]">How It Works</h2>
                        <p>All document processing happens in your browser or through ephemeral serverless functions. This means:</p>
                        <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                            <li>Your text is never saved or logged</li>
                            <li>No databases store your documents</li>
                            <li>Processing is temporary and destroyed immediately after completion</li>
                            <li>We cannot access or recover any text you process</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-[var(--primary)]">Local Storage</h2>
                        <p>The only data stored locally in your browser is:</p>
                        <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                            <li>Tutorial preference (whether you've seen the welcome guide)</li>
                            <li>Theme preference (light/dark mode)</li>
                        </ul>
                        <p className="mt-2">This data never leaves your device and can be cleared by clearing your browser storage.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-[var(--primary)]">Third-Party Services</h2>
                        <p>CitationFix is hosted on Vercel. While we don't collect data, Vercel may collect standard web analytics (page views, geographic region) for operational purposes. This does not include your document content.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-[var(--primary)]">Changes to This Policy</h2>
                        <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-[var(--primary)]">Contact</h2>
                        <p>If you have questions about this Privacy Policy, please use our feedback form.</p>
                    </section>

                    <p className="text-sm text-[var(--text-muted)] pt-6 border-t border-[var(--border)]">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                </div>
            </main>
        </div>
    );
}
