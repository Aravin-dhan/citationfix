import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';

// Environment variables for security
const ENCRYPTION_KEY = process.env.METRICS_ENCRYPTION_KEY || 'default-dev-key-change-me';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Sanitize: Ensure NO document content is logged
    const metric = {
      timestamp: new Date().toISOString(),
      wordCount: body.wordCount,
      processingTimeMs: body.processingTimeMs,
      features: {
        citations: body.features?.citations,
        formatting: body.features?.formatting,
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
    const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(metric), ENCRYPTION_KEY).toString();

    // 3. Store in Vercel KV (Redis)
    // We'll use a list to store logs
    try {
      await kv.lpush('metrics_logs', encryptedData);
      // Keep only last 1000 logs to save space
      await kv.ltrim('metrics_logs', 0, 999);
    } catch (kvError) {
      console.warn('KV Logger failed (likely missing env vars), falling back to console:', kvError);
      // In dev/local without KV, we just log the encrypted string to console for verification
      console.log('[SECURE_LOG]', encryptedData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logging failed:', error);
    // Fail silently to not impact user experience
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
