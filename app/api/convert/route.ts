import { NextRequest, NextResponse } from 'next/server';
import {
    Document,
    Paragraph,
    TextRun,
    Packer,
    FootnoteReferenceRun,
    Footnote
} from 'docx';

interface ParsedSegment {
    text: string;
    hasFootnote: boolean;
    footnoteId?: number;
    footnoteText?: string;
}

/**
 * Parse text into segments with footnote markers
 */
function parseTextIntoSegments(input: string): ParsedSegment[] {
    const segments: ParsedSegment[] = [];
    let i = 0;
    let footnoteCounter = 1;

    while (i < input.length) {
        const start = input.indexOf("{{fn:", i);

        if (start === -1) {
            // No more footnotes, add remaining text
            const remaining = input.slice(i);
            if (remaining) {
                segments.push({ text: remaining, hasFootnote: false });
            }
            break;
        }

        // Add text before the footnote marker
        if (start > i) {
            segments.push({
                text: input.slice(i, start),
                hasFootnote: false
            });
        }

        // Find the closing braces
        const end = input.indexOf("}}", start);

        if (end === -1) {
            // Malformed marker, add rest as text
            segments.push({
                text: input.slice(start),
                hasFootnote: false
            });
            break;
        }

        // Extract the citation
        const citation = input.slice(start + 5, end).trim();

        if (citation.length > 0) {
            // Add a segment with footnote marker
            segments.push({
                text: "", // No text, just the footnote reference
                hasFootnote: true,
                footnoteId: footnoteCounter,
                footnoteText: citation
            });
            footnoteCounter++;
        }

        i = end + 2;
    }

    return segments;
}

/**
 * Create paragraphs with real Word footnotes
 */
function createDocumentWithFootnotes(text: string): {
    paragraphs: Paragraph[],
    footnotes: Record<number, Footnote>
} {
    const segments = parseTextIntoSegments(text);
    const paragraphs: Paragraph[] = [];
    const footnotes: Record<number, Footnote> = {};

    // Create footnote objects
    segments.forEach(segment => {
        if (segment.hasFootnote && segment.footnoteId && segment.footnoteText) {
            footnotes[segment.footnoteId] = new Footnote({
                id: segment.footnoteId,
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: segment.footnoteText,
                                font: "Times New Roman",
                                size: 20 // 10pt
                            })
                        ]
                    })
                ]
            });
        }
    });

    // Split into lines and create paragraphs
    const lines = text.split('\n');

    for (const line of lines) {
        if (line.trim().length === 0) {
            paragraphs.push(new Paragraph({ text: "" }));
            continue;
        }

        // Parse this line for footnotes
        const lineSegments = parseTextIntoSegments(line);
        const children: (TextRun | FootnoteReferenceRun)[] = [];

        for (const segment of lineSegments) {
            if (segment.hasFootnote && segment.footnoteId) {
                // Add footnote reference
                children.push(new FootnoteReferenceRun(segment.footnoteId));
            } else if (segment.text) {
                // Add regular text
                children.push(new TextRun({
                    text: segment.text,
                    font: "Times New Roman",
                    size: 24 // 12pt
                }));
            }
        }

        if (children.length > 0) {
            paragraphs.push(new Paragraph({
                children,
                spacing: {
                    after: 200,
                    line: 360
                }
            }));
        }
    }

    return { paragraphs, footnotes };
}

/**
 * API route to generate .docx file with REAL Word footnotes
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

        // Validate word count
        const wordCount = text.trim().split(/\s+/).length;
        if (wordCount > 10000) {
            return NextResponse.json(
                { error: `Text exceeds 10,000 word limit (current: ${wordCount} words)` },
                { status: 400 }
            );
        }

        // Validate input
        if (!text || text.trim().length === 0) {
            return NextResponse.json(
                { error: 'No valid text found' },
                { status: 400 }
            );
        }

        // Create document with real footnotes
        const { paragraphs, footnotes } = createDocumentWithFootnotes(text);

        if (paragraphs.length === 0) {
            return NextResponse.json(
                { error: 'No content to generate' },
                { status: 400 }
            );
        }

        // Create the Word document
        const doc = new Document({
            footnotes: footnotes,
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 1440,    // 1 inch
                            right: 1440,
                            bottom: 1440,
                            left: 1440
                        }
                    }
                },
                children: paragraphs
            }]
        });

        // Generate buffer
        const buffer = await Packer.toBuffer(doc);

        if (!buffer || buffer.length === 0) {
            throw new Error('Generated document is empty');
        }

        // Return the .docx file
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
