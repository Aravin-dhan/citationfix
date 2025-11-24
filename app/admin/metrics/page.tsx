'use client';

import { useState } from 'react';
import CryptoJS from 'crypto-js';
import { Lock, Unlock, RefreshCw, Eye, EyeOff, ShieldAlert } from 'lucide-react';

interface MetricLog {
    timestamp: string;
    wordCount: number;
    processingTimeMs: number;
    features: {
        citations: boolean;
        formatting: boolean;
    };
    status: string;
    errorType?: string;
    userAgent?: string;
    country?: string;
    region?: string;
}

export default function AdminMetrics() {
    const [accessCode, setAccessCode] = useState('');
    const [decryptionKey, setDecryptionKey] = useState('');
    const [logs, setLogs] = useState<MetricLog[]>([]);
    const [rawLogs, setRawLogs] = useState<string[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isDecrypted, setIsDecrypted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Step 1: Authenticate and Fetch Encrypted Logs
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessCode }),
            });

            if (!res.ok) {
                throw new Error('Invalid Access Code');
            }

            const data = await res.json();
            setRawLogs(data.logs || []);
            setIsAuthenticated(true);
        } catch (err) {
            setError('Access Denied: Invalid Code');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Decrypt Logs Client-Side
    const handleDecrypt = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const decryptedLogs: MetricLog[] = [];

            rawLogs.forEach(encryptedLog => {
                try {
                    const bytes = CryptoJS.AES.decrypt(encryptedLog, decryptionKey);
                    const originalText = bytes.toString(CryptoJS.enc.Utf8);
                    if (originalText) {
                        decryptedLogs.push(JSON.parse(originalText));
                    }
                } catch (e) {
                    // Skip logs that fail to decrypt (wrong key or corrupted)
                }
            });

            if (decryptedLogs.length === 0 && rawLogs.length > 0) {
                throw new Error('Decryption Failed: Invalid Key or No Data');
            }

            setLogs(decryptedLogs);
            setIsDecrypted(true);
        } catch (err) {
            setError('Decryption Failed: Invalid Key');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[var(--desk-bg)] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-[var(--paper-bg)] p-8 rounded-sm paper-shadow">
                    <div className="flex justify-center mb-6 text-[var(--ink)]">
                        <Lock className="w-12 h-12" />
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-center text-[var(--ink)] mb-6">
                        Restricted Access
                    </h1>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--ink-muted)] mb-1">Access Code</label>
                            <input
                                type="password"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                className="w-full px-4 py-2 bg-[var(--desk-bg)]/30 border border-[var(--line)] rounded focus:border-[var(--accent)] outline-none"
                                placeholder="Enter access code..."
                            />
                        </div>
                        {error && <p className="text-sm text-[var(--error)] flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> {error}</p>}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 bg-[var(--ink)] text-[var(--paper-bg)] rounded font-medium hover:bg-[var(--accent)] transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Unlock Metrics'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (!isDecrypted) {
        return (
            <div className="min-h-screen bg-[var(--desk-bg)] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-[var(--paper-bg)] p-8 rounded-sm paper-shadow">
                    <div className="flex justify-center mb-6 text-[var(--accent)]">
                        <Unlock className="w-12 h-12" />
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-center text-[var(--ink)] mb-2">
                        Decrypt Data
                    </h1>
                    <p className="text-center text-[var(--ink-muted)] text-sm mb-6">
                        {rawLogs.length} encrypted records found. Enter decryption key to view.
                    </p>
                    <form onSubmit={handleDecrypt} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--ink-muted)] mb-1">Decryption Key</label>
                            <input
                                type="password"
                                value={decryptionKey}
                                onChange={(e) => setDecryptionKey(e.target.value)}
                                className="w-full px-4 py-2 bg-[var(--desk-bg)]/30 border border-[var(--line)] rounded focus:border-[var(--accent)] outline-none"
                                placeholder="Enter encryption key..."
                            />
                        </div>
                        {error && <p className="text-sm text-[var(--error)] flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> {error}</p>}
                        <button
                            type="submit"
                            className="w-full py-2 bg-[var(--accent)] text-white rounded font-medium hover:bg-[var(--accent-hover)] transition-colors"
                        >
                            Decrypt Logs
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--desk-bg)] p-6 font-sans">
            <div className="max-w-6xl mx-auto bg-[var(--paper-bg)] rounded-sm paper-shadow min-h-[85vh] flex flex-col">
                <header className="border-b border-[var(--line)] px-8 py-6 flex items-center justify-between">
                    <h1 className="text-2xl font-serif font-bold text-[var(--ink)]">Internal Metrics</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-[var(--ink-muted)]">{logs.length} Records</span>
                        <button
                            onClick={() => window.location.reload()}
                            className="p-2 hover:bg-[var(--desk-bg)] rounded-full transition-colors"
                        >
                            <RefreshCw className="w-5 h-5 text-[var(--ink)]" />
                        </button>
                    </div>
                </header>

                <div className="p-8 overflow-x-auto">
                    <table className="w-full text-left text-sm text-[var(--ink)]">
                        <thead className="bg-[var(--desk-bg)]/50 border-b border-[var(--line)]">
                            <tr>
                                <th className="p-3 font-semibold">Timestamp</th>
                                <th className="p-3 font-semibold">Status</th>
                                <th className="p-3 font-semibold">Words</th>
                                <th className="p-3 font-semibold">Time (ms)</th>
                                <th className="p-3 font-semibold">Features</th>
                                <th className="p-3 font-semibold">Location</th>
                                <th className="p-3 font-semibold">User Agent</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--line)]">
                            {logs.map((log, i) => (
                                <tr key={i} className="hover:bg-[var(--desk-bg)]/20 transition-colors">
                                    <td className="p-3 font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.status === 'success'
                                                ? 'bg-[var(--success)]/10 text-[var(--success)]'
                                                : 'bg-[var(--error)]/10 text-[var(--error)]'
                                            }`}>
                                            {log.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-3">{log.wordCount.toLocaleString()}</td>
                                    <td className="p-3 font-mono">{log.processingTimeMs}ms</td>
                                    <td className="p-3">
                                        <div className="flex gap-1">
                                            {log.features.citations && <span className="px-1.5 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded text-[10px]">CIT</span>}
                                            {log.features.formatting && <span className="px-1.5 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded text-[10px]">FMT</span>}
                                        </div>
                                    </td>
                                    <td className="p-3 text-[var(--ink-muted)]">
                                        {log.country || '-'} {log.region ? `(${log.region})` : ''}
                                    </td>
                                    <td className="p-3 text-[var(--ink-muted)] text-xs truncate max-w-[200px]" title={log.userAgent}>
                                        {log.userAgent || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
