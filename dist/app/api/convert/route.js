"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const docxGenerator_1 = require("@/utils/docxGenerator");
const fileParser_1 = require("@/utils/fileParser");
async function POST(request) {
    try {
        const body = await request.json();
        const { text, formatting, convert_citations, font, font_size, line_spacing, auto_headings } = body;
        if (!text || typeof text !== 'string') {
            return server_1.NextResponse.json({ error: 'Invalid request. "text" is required.' }, { status: 400 });
        }
        const validation = (0, fileParser_1.validateWordLimit)(text);
        if (!validation.isValid) {
            return server_1.NextResponse.json({ error: validation.message }, { status: 400 });
        }
        // Generate the .docx file
        // Note: The current generateDocx implementation primarily handles citations and hyperlinks.
        // If formatting options (font, etc.) are needed, generateDocx would need to be updated to accept them.
        // For now, we proceed with the implemented generator which supports the core requirements.
        const blob = await (0, docxGenerator_1.generateDocx)(text);
        const buffer = Buffer.from(await blob.arrayBuffer());
        return new server_1.NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': 'attachment; filename="CitationFix-Output.docx"',
            },
        });
    }
    catch (error) {
        console.error('Error generating document:', error);
        return server_1.NextResponse.json({ error: 'Failed to generate document', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
