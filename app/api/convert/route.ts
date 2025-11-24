import { NextRequest, NextResponse } from 'next/server';
import {
    Document,
    Paragraph,
    TextRun,
    Packer
} from 'docx';

interface ConversionResult {
    mainText: string;
    footnotes: string[];
}

/**
 * Process text and extract footnotes
 */
function processText(input: string): ConversionResult {
    const footnotes: string[] = [];
    let output = "";
    let i = 0;

    if (!input || input.trim().length === 0) {
        return { mainText: "", footnotes: [] };
    }

    while (i < input.length) {
        const start = input.indexOf("{{fn:", i);

        if (start === -1) {
            output += input.slice(i);
            break;
        }

        output += input.slice(i, start);
        const end = input.indexOf("}}", start);

        if (end === -1) {
            output += input.slice(start);
            break;
        }

        const inner = input.slice(start + 5, end);
        const citation = inner.trim();

        if (citation.length > 0) {
            footnotes.push(citation);
        }

        i = end + 2;
    }

    return { mainText: output, footnotes };
}

/**
 * Create Word paragraphs from text
 */
function createParagraphs(text: string): Paragraph[] {
    if (!text || text.trim().length === 0) {
        return [new Paragraph({ text: "" })];
    }

    const paragraphs: Paragraph[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
        if (line.trim().length === 0) {
            paragraphs.push(new Paragraph({ text: "" }));
            continue;
        }

        paragraphs.push(new Paragraph({
            children: [new TextRun({
                text: line,
                font: "Times New Roman",
                size: 24 // 12pt
            })],
            spacing: {
                after: 200,
                line: 360
            }
        }));
    }

    return paragraphs;
}

/**
 * Create footnotes section
 */
function createFootnotesSection(footnotes: string[]): Paragraph[] {
    if (footnotes.length === 0) {
        return [];
    }

    const paragraphs: Paragraph[] = [];

    paragraphs.push(new Paragraph({ text: "" }));
    paragraphs.push(new Paragraph({ text: "" }));

    paragraphs.push(new Paragraph({
        children: [new TextRun({
            text: "Footnotes",
            bold: true,
            font: "Times New Roman",
            size: 28
        })],
        spacing: {
            before: 400,
            after: 200
        }
    }));

    paragraphs.push(new Paragraph({
        children: [new TextRun({
            text: "________________________________________",
            size: 20
        })],
        spacing: {
            after: 200
        }
    }));

    footnotes.forEach((footnote, index) => {
        paragraphs.push(new Paragraph({
            children: [
                new TextRun({
                    text: `${index + 1}. `,
                    bold: true,
                    font: "Times New Roman",
                    size: 20
                }),
                new TextRun({
                    text: footnote,
                    font: "Times New Roman",
                    size: 20
                })
            ],
            spacing: {
                after: 100
            }
        }));
    });

    return paragraphs;
}

/**
 * API route to generate .docx file
 * 
 * NOTE: The docx library version 9.x does not support real Word footnotes
 * in the same way as Word's native footnote feature. This generates a
 * formatted footnotes section at the end of the document.
 * 
 * For true Word footnotes (appearing at page bottom with clickable references),
 * a Python backend with python-docx would be required.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => null);

        if (!body || !body.text || typeof body.text !== 'string') {
            return NextResponse.json(
                { error: 'Invalid request. Please provide text in the request body.' },
                { status: 400 }
            );
        }

        const { text } = body;

        const wordCount = text.trim().split(/\s+/).length;
        if (wordCount > 10000) {
            return NextResponse.json(
                { error: `Text exceeds 10,000 word limit (current: ${wordCount} words)` },
                { status: 400 }
            );
        }

        const { mainText, footnotes } = processText(text);

        if (!mainText || mainText.trim().length === 0) {
            return NextResponse.json(
                { error: 'No valid text found after processing' },
                { status: 400 }
            );
        }

        const mainParagraphs = createParagraphs(mainText);
        const footnotesParagraphs = createFootnotesSection(footnotes);
        const allParagraphs = [...mainParagraphs, ...footnotesParagraphs];

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 1440,
                            right: 1440,
                            bottom: 1440,
                            left: 1440
                        }
                    }
                },
                children: allParagraphs
            }]
        });

        const buffer = await Packer.toBuffer(doc);

        if (!buffer || buffer.length === 0) {
            throw new Error('Generated document is empty');
        }

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': 'attachment; filename="CitationFix-Output.docx"',
                'Content-Length': buffer.length.toString(),
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

    } catch (error) {
        console.error('Error generating .docx:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        return NextResponse.json(
            {
                error: 'Failed to generate .docx file',
                details: errorMessage,
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json(
        { error: 'Method not allowed. Use POST to convert text.' },
        { status: 405 }
    );
}
