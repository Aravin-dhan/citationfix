'use client';

import { useState, useEffect } from 'react';

export default function Tutorial() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const hasSeenTutorial = localStorage.getItem('citationfix_tutorial_seen');
        if (!hasSeenTutorial) {
            setIsOpen(true);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('citationfix_tutorial_seen', 'true');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-300">
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>

                <div className="text-center space-y-4">
                    <div className="mx-auto w-12 h-12 bg-[var(--primary)]/10 rounded-full flex items-center justify-center text-[var(--primary)]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    <h2 className="text-xl font-bold text-[var(--foreground)]">Welcome to CitationFix!</h2>

                    <div className="text-left space-y-3 text-sm text-[var(--text-muted)]">
                        <p className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-xs">1</span>
                            <span><strong>Upload or Paste:</strong> Add your text or upload a .docx/.txt file.</span>
                        </p>
                        <p className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-xs">2</span>
                            <span><strong>Citations (Optional):</strong> Use <code>{'{{fn: citation}}'}</code> to create footnotes automatically.</span>
                        </p>
                        <p className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-xs">3</span>
                            <span><strong>Format & Download:</strong> Click "Format & Download" to get a perfectly formatted legal document (Times New Roman 12, Justified).</span>
                        </p>
                    </div>

                    <button
                        onClick={handleClose}
                        className="w-full bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-semibold py-2.5 rounded-lg transition-colors mt-4"
                    >
                        Got it, let's start!
                    </button>
                </div>
            </div>
        </div>
    );
}
