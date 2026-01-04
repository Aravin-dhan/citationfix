import { NextRequest, NextResponse } from 'next/server';
import { generateDocx } from '@/utils/docxGenerator';
import { validateWordLimit } from '@/utils/fileParser';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text, formatting, convert_citations, font, font_size, line_spacing, alignment, auto_headings } = body;

        if (!text || typeof text !== 'string') {
            return NextResponse.json(
                { error: 'Invalid request. "text" is required.' },
                { status: 400 }
            );
        }

        const validation = validateWordLimit(text);
        if (!validation.isValid) {
            return NextResponse.json(
                { error: validation.message },
                { status: 400 }
            );
        }

        // Generate the .docx file with all formatting options
        const blob = await generateDocx(text, {
            font,
            fontSize: font_size,
            lineSpacing: line_spacing,
            alignment
        });
        
        const buffer = Buffer.from(await blob.arrayBuffer());

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': 'attachment; filename="CitationFix-Output.docx"',
            },
        });
    } catch (error) {
        console.error('Error generating document:', error);
        return NextResponse.json(
            { error: 'Failed to generate document', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}