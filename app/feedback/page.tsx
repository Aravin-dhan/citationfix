'use client';

import { useState } from 'react';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';

export default function Feedback() {
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSubmitted(true);
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-[var(--desk-bg)] py-8 px-4 sm:px-6 flex flex-col items-center font-sans transition-colors duration-300">
            <div className="w-full max-w-2xl bg-[var(--paper-bg)] rounded-sm paper-shadow min-h-[60vh] flex flex-col relative overflow-hidden">

                {/* Header */}
                <header className="border-b border-[var(--line)] px-8 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-serif font-bold text-[var(--ink)]">
                            Feedback
                        </h1>
                    </div>
                    <a href="/" className="flex items-center gap-2 text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Editor
                    </a>
                </header>

                {/* Content */}
                <div className="flex-1 p-8 md:p-12">
                    {submitted ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-fade-in">
                            <div className="w-16 h-16 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] mb-2">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-serif font-bold text-[var(--ink)]">Thank You!</h2>
                            <p className="text-[var(--ink-muted)] max-w-md">
                                Your feedback has been received. We appreciate your help in improving CitationFix.
                            </p>
                            <button
                                onClick={() => setSubmitted(false)}
                                className="mt-6 px-6 py-2 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                            >
                                Send another message
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <p className="text-[var(--ink-muted)] mb-6">
                                Found a bug? Have a feature request? We'd love to hear from you.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium text-[var(--ink)]">
                                        Name (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        className="w-full px-4 py-2 bg-[var(--desk-bg)]/30 border border-[var(--line)] rounded-sm focus:outline-none focus:border-[var(--accent)] text-[var(--ink)]"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-[var(--ink)]">
                                        Email (Optional)
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        className="w-full px-4 py-2 bg-[var(--desk-bg)]/30 border border-[var(--line)] rounded-sm focus:outline-none focus:border-[var(--accent)] text-[var(--ink)]"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="type" className="text-sm font-medium text-[var(--ink)]">
                                    Feedback Type
                                </label>
                                <select
                                    id="type"
                                    className="w-full px-4 py-2 bg-[var(--desk-bg)]/30 border border-[var(--line)] rounded-sm focus:outline-none focus:border-[var(--accent)] text-[var(--ink)]"
                                >
                                    <option>General Feedback</option>
                                    <option>Bug Report</option>
                                    <option>Feature Request</option>
                                    <option>Other</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="message" className="text-sm font-medium text-[var(--ink)]">
                                    Message
                                </label>
                                <textarea
                                    id="message"
                                    required
                                    rows={5}
                                    className="w-full px-4 py-3 bg-[var(--desk-bg)]/30 border border-[var(--line)] rounded-sm focus:outline-none focus:border-[var(--accent)] text-[var(--ink)] resize-none"
                                    placeholder="Tell us what's on your mind..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-[var(--ink)] text-[var(--paper-bg)] rounded-sm font-medium hover:bg-[var(--accent)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-[var(--paper-bg)] border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Send Feedback
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
