import Link from 'next/link';

export default function Terms() {
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
                <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">Terms of Service</h1>

                <div className="space-y-6 text-[var(--foreground)]">
                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-[var(--primary)]">1. Acceptance of Terms</h2>
                        <p>By accessing and using CitationFix, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use this service.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-[var(--primary)]">2. Service Description</h2>
                        <p>CitationFix is a tool for formatting legal documents and converting citation markers to footnotes. The service is provided "as is" without any warranties or guarantees.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-[var(--primary)]">3. Disclaimer of Warranties</h2>
                        <p className="font-semibold mb-2">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND.</p>
                        <p>We make no warranties, expressed or implied, and hereby disclaim all warranties including, without limitation:</p>
                        <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                            <li>Warranties of merchantability or fitness for a particular purpose</li>
                            <li>That the service will be uninterrupted, timely, secure, or error-free</li>
                            <li>That the results obtained from use of the service will be accurate or reliable</li>
                            <li>That the quality of any products, services, information obtained will meet your expectations</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-[var(--primary)]">4. Limitation of Liability</h2>
                        <p className="font-semibold mb-2">TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE WEBSITE OWNER AND ALL RELATED PARTIES SHALL NOT BE LIABLE FOR ANY DAMAGES WHATSOEVER.</p>
                        <p>This includes but is not limited to:</p>
                        <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                            <li>Direct, indirect, incidental, special, consequential, or exemplary damages</li>
                            <li>Damages for loss of profits, goodwill, use, data, or other intangible losses</li>
                            <li>Damages resulting from unauthorized access to or alteration of your transmissions or data</li>
                            <li>Any other matter relating to the service</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-[var(--primary)]">5. Content Disclaimer</h2>
                        <p className="font-semibold mb-2">The website owner and all related parties have absolutely no liability for any content processed through this service.</p>
                        <p>You acknowledge that:</p>
                        <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                            <li>You are solely responsible for all content you process</li>
                            <li>We do not review, endorse, or take responsibility for any user content</li>
                            <li>We are not liable for any errors, omissions, or inaccuracies in processed content</li>
                            <li>You must verify all output before use in any legal or professional context</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-[var(--primary)]">6. Professional Advice Disclaimer</h2>
                        <p>CitationFix is a formatting tool only. It does not provide legal advice, and use of this service does not create an attorney-client relationship. Always consult with qualified legal professionals for legal matters.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-[var(--primary)]">7. Indemnification</h2>
                        <p>You agree to indemnify, defend, and hold harmless the website owner and all related parties from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the service or violation of these terms.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-[var(--primary)]">8. Dispute Resolution</h2>
                        <p className="font-semibold mb-2">Any disputes arising from or related to this service shall be resolved through the following mechanism:</p>
                        <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                            <li><strong>Alternative Dispute Resolution (ADR):</strong> Disputes shall first be attempted to be resolved through mediation or arbitration in Chennai, India</li>
                            <li><strong>Jurisdiction:</strong> Subject to the exclusive jurisdiction of the Civil Courts of Chennai, Tamil Nadu, India</li>
                            <li><strong>Governing Law:</strong> These terms shall be governed by the laws of India</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-[var(--primary)]">9. User Responsibilities</h2>
                        <p>You agree to:</p>
                        <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                            <li>Use the service only for lawful purposes</li>
                            <li>Not exceed reasonable usage limits (20,000 words per document)</li>
                            <li>Not attempt to disrupt or interfere with the service</li>
                            <li>Verify all output before professional or legal use</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-[var(--primary)]">10. Modifications to Service</h2>
                        <p>We reserve the right to modify or discontinue the service at any time without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the service.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-[var(--primary)]">11. Changes to Terms</h2>
                        <p>We reserve the right to update these Terms of Service at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
                    </section>

                    <p className="text-sm text-[var(--text-muted)] pt-6 border-t border-[var(--border)]">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                </div>
            </main>
        </div>
    );
}
