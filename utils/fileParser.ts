import mammoth from 'mammoth';

/**
 * Parse uploaded file and extract text content
 */
export async function parseFile(file: File): Promise<string> {
    const fileType = file.name.split('.').pop()?.toLowerCase();

    if (fileType === 'txt') {
        return await parseTxtFile(file);
    } else if (fileType === 'docx') {
        return await parseDocxFile(file);
    } else {
        throw new Error('Unsupported file format. Please upload .txt or .docx files.');
    }
}

/**
 * Parse .txt file
 */
async function parseTxtFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const text = e.target?.result as string;
            resolve(text);
        };

        reader.onerror = () => {
            reject(new Error('Failed to read text file'));
        };

        reader.readAsText(file);
    });
}

/**
 * Parse .docx file and extract text
 */
async function parseDocxFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target?.result as ArrayBuffer;
                const result = await mammoth.extractRawText({ arrayBuffer });
                resolve(result.value);
            } catch (error) {
                reject(new Error('Failed to parse .docx file'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read .docx file'));
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
    if (!text || text.trim().length === 0) {
        return 0;
    }

    // Remove extra whitespace and split by spaces
    const words = text.trim().split(/\s+/);
    return words.length;
}

/**
 * Validate text length
 */
export function validateWordLimit(text: string, maxWords: number = 10000): {
    isValid: boolean;
    wordCount: number;
    message?: string;
} {
    const wordCount = countWords(text);

    if (wordCount === 0) {
        return {
            isValid: false,
            wordCount: 0,
            message: 'Please enter some text'
        };
    }

    if (wordCount > maxWords) {
        return {
            isValid: false,
            wordCount,
            message: `Text exceeds ${maxWords.toLocaleString()} word limit (current: ${wordCount.toLocaleString()} words)`
        };
    }

    return {
        isValid: true,
        wordCount
    };
}
