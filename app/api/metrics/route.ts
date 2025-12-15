import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { accessCode } = body;

        // 1. Verify Access Code (First Layer of Security)
        // This prevents unauthorized users from even fetching the encrypted logs
        const VALID_ACCESS_CODE = process.env.METRICS_ACCESS_CODE || 'admin123';

        if (accessCode !== VALID_ACCESS_CODE) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch Encrypted Logs
        let logs: string[] = [];
        try {
            logs = await kv.lrange('metrics_logs', 0, 100);
        } catch (e) {
            console.warn('KV fetch failed, returning empty list');
            logs = [];
        }

        // Return the *encrypted* logs. The client must provide the second key to decrypt them.
        return NextResponse.json({ logs });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
