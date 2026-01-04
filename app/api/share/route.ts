import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

    // Generate a short ID (8 chars is enough for transient shares, or UUID)
    // We'll use UUID for collision safety
    const id = crypto.randomUUID();

    // Store in KV with 7-day expiration
    // Check if KV is configured
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
        return NextResponse.json({ error: 'Sharing service not configured' }, { status: 503 });
    }

    await kv.set(`doc:${id}`, text, { ex: 604800 });
    
    return NextResponse.json({ id });
  } catch (error) {
    console.error('Share failed:', error);
    return NextResponse.json({ error: 'Failed to share document' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
        return NextResponse.json({ error: 'Sharing service not configured' }, { status: 503 });
    }

    const text = await kv.get(`doc:${id}`);
    
    if (!text) return NextResponse.json({ error: 'Document not found or expired' }, { status: 404 });
    
    return NextResponse.json({ text });
  } catch (error) {
    console.error('Retrieve failed:', error);
    return NextResponse.json({ error: 'Failed to retrieve document' }, { status: 500 });
  }
}
