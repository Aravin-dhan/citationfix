/**
 * Citation Library - Stores recent citations in localStorage
 */

export interface Citation {
    id: string;
    text: string;
    createdAt: number;
    usedCount: number;
}

const STORAGE_KEY = 'citationfix_library';
const MAX_CITATIONS = 50;

/**
 * Get all saved citations from localStorage
 */
export function getCitations(): Citation[] {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];

        const citations: Citation[] = JSON.parse(stored);
        // Sort by most recently used
        return citations.sort((a, b) => b.createdAt - a.createdAt);
    } catch {
        return [];
    }
}

/**
 * Add a new citation to the library
 */
export function addCitation(text: string): Citation {
    const citations = getCitations();

    // Check if citation already exists
    const existingIndex = citations.findIndex(c => c.text.toLowerCase() === text.toLowerCase());

    if (existingIndex >= 0) {
        // Update existing citation
        citations[existingIndex].usedCount++;
        citations[existingIndex].createdAt = Date.now();
        saveCitations(citations);
        return citations[existingIndex];
    }

    // Create new citation
    const newCitation: Citation = {
        id: generateId(),
        text: text.trim(),
        createdAt: Date.now(),
        usedCount: 1
    };

    // Add to beginning of array
    citations.unshift(newCitation);

    // Limit to MAX_CITATIONS
    if (citations.length > MAX_CITATIONS) {
        citations.splice(MAX_CITATIONS);
    }

    saveCitations(citations);
    return newCitation;
}

/**
 * Extract and save citations from text containing {{fn: ...}} markers
 */
export function extractAndSaveCitations(text: string): Citation[] {
    const regex = /\{\{fn:\s*(.*?)\}\}/g;
    const savedCitations: Citation[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
        const citationText = match[1].trim();
        if (citationText) {
            const saved = addCitation(citationText);
            savedCitations.push(saved);
        }
    }

    return savedCitations;
}

/**
 * Delete a citation by ID
 */
export function deleteCitation(id: string): void {
    const citations = getCitations();
    const filtered = citations.filter(c => c.id !== id);
    saveCitations(filtered);
}

/**
 * Clear all citations
 */
export function clearAllCitations(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Search citations by text
 */
export function searchCitations(query: string): Citation[] {
    if (!query.trim()) return getCitations();

    const citations = getCitations();
    const lowerQuery = query.toLowerCase();

    return citations.filter(c =>
        c.text.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Get most frequently used citations
 */
export function getFrequentCitations(limit: number = 10): Citation[] {
    const citations = getCitations();
    return citations
        .sort((a, b) => b.usedCount - a.usedCount)
        .slice(0, limit);
}

// Helper functions
function saveCitations(citations: Citation[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(citations));
}

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
