'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Feedback() {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // For now, just show success message
        // In production, this would send to a form service or email
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 5000);
    };

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <header className="border-b border-[var(--border)] bg-[var(--surface)]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
                    <Link href="/" className="text-lg font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">
                        ← Back to CitationFix
                    </Link>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
                <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4">Feedback</h1>
                <p className="text-[var(--text-muted)] mb-8">
                    We'd love to hear your thoughts, suggestions, or issues you've encountered.
                </p>

                {submitted && (
                    <div className="mb-6 p-4 bg-[var(--success)]/10 border border-[var(--success)] rounded-lg text-[var(--success)] font-medium">
                        Thank you for your feedback! (Note: This is a demo form. In production, feedback would be collected via a service like Google Forms or email.)
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                            Name (Optional)
                        </label>
                        <input
                            type="text"
                            id="name"
                            className="w-full px-4 py-2 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            placeholder="Your name"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                            Email (Optional)
                        </label>
                        <input
                            type="email"
                            id="email"
                            className="w-full px-4 py-2 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            placeholder="your.email@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="type" className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                            Feedback Type
                        </label>
                        <select
                            id="type"
                            className="w-full px-4 py-2 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        >
                            <option>General Feedback</option>
                            <option>Bug Report</option>
                            <option>Feature Request</option>
                            <option>Question</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="message" className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                            Message *
                        </label>
                        <textarea
                            id="message"
                            required
                            rows={6}
                            className="w-full px-4 py-2 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                            placeholder="Tell us what's on your mind..."
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-semibold py-3 rounded transition-colors"
                    >
                        Submit Feedback
                    </button>

                    <p className="text-xs text-[var(--text-muted)] text-center">
                        Your feedback helps us improve CitationFix. Thank you!
                    </p>
                </form>
            </main>
        </div>
    );
}
