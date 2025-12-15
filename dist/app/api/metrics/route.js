"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const kv_1 = require("@vercel/kv");
const server_1 = require("next/server");
async function POST(request) {
    try {
        const body = await request.json();
        const { accessCode } = body;
        // 1. Verify Access Code (First Layer of Security)
        // This prevents unauthorized users from even fetching the encrypted logs
        const VALID_ACCESS_CODE = process.env.METRICS_ACCESS_CODE || 'admin123';
        if (accessCode !== VALID_ACCESS_CODE) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // 2. Fetch Encrypted Logs
        let logs = [];
        try {
            logs = await kv_1.kv.lrange('metrics_logs', 0, 100);
        }
        catch (e) {
            console.warn('KV fetch failed, returning empty list');
            logs = [];
        }
        // Return the *encrypted* logs. The client must provide the second key to decrypt them.
        return server_1.NextResponse.json({ logs });
    }
    catch (error) {
        return server_1.NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
