"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const kv_1 = require("@vercel/kv");
const server_1 = require("next/server");
const crypto_js_1 = __importDefault(require("crypto-js"));
// Environment variables for security
const ENCRYPTION_KEY = process.env.METRICS_ENCRYPTION_KEY || 'default-dev-key-change-me';
async function POST(request) {
    var _a, _b;
    try {
        const body = await request.json();
        // 1. Sanitize: Ensure NO document content is logged
        const metric = {
            timestamp: new Date().toISOString(),
            wordCount: body.wordCount,
            processingTimeMs: body.processingTimeMs,
            features: {
                citations: (_a = body.features) === null || _a === void 0 ? void 0 : _a.citations,
                formatting: (_b = body.features) === null || _b === void 0 ? void 0 : _b.formatting,
            },
            status: body.status, // 'success' or 'error'
            errorType: body.errorType, // Generic error category, not full stack trace with content
            userAgent: request.headers.get('user-agent'),
            // Geo-approx (Vercel headers)
            country: request.headers.get('x-vercel-ip-country'),
            region: request.headers.get('x-vercel-ip-country-region'),
        };
        // 2. Encrypt the payload
        // We encrypt the JSON string so the database only sees ciphertext
        const encryptedData = crypto_js_1.default.AES.encrypt(JSON.stringify(metric), ENCRYPTION_KEY).toString();
        // 3. Store in Vercel KV (Redis)
        // Check if KV is configured
        if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
            try {
                await kv_1.kv.lpush('metrics_logs', encryptedData);
                // Keep only last 1000 logs to save space
                await kv_1.kv.ltrim('metrics_logs', 0, 999);
            }
            catch (kvError) {
                console.warn('KV Logger failed:', kvError);
            }
        }
        else {
            // In dev/local without KV, we just log the encrypted string to console for verification
            console.log('[SECURE_LOG (Local)]', encryptedData);
        }
        return server_1.NextResponse.json({ success: true });
    }
    catch (error) {
        console.error('Logging failed:', error);
        // Fail silently to not impact user experience
        return server_1.NextResponse.json({ success: false }, { status: 500 });
    }
}
