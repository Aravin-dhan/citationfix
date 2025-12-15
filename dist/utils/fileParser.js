"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFile = parseFile;
exports.countWords = countWords;
exports.validateWordLimit = validateWordLimit;
const mammoth_1 = __importDefault(require("mammoth"));
/**
 * Parse uploaded file and extract text content
 */
async function parseFile(file) {
    var _a;
    const fileType = (_a = file.name.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    if (fileType === 'txt') {
        return await parseTxtFile(file);
    }
    else if (fileType === 'docx') {
        return await parseDocxFile(file);
    }
    else {
        throw new Error('Unsupported file format. Please upload .txt or .docx files.');
    }
}
/**
 * Parse .txt file
 */
async function parseTxtFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            var _a;
            const text = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result;
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
async function parseDocxFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            var _a;
            try {
                const arrayBuffer = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result;
                const result = await mammoth_1.default.extractRawText({ arrayBuffer });
                resolve(result.value);
            }
            catch (error) {
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
function countWords(text) {
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
function validateWordLimit(text, maxWords = 20000) {
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
