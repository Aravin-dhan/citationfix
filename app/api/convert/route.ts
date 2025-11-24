import { NextRequest, NextResponse } from 'next/server';
import {
    Document,
    Paragraph,
    TextRun,
    Packer,
    FootnoteReferenceRun,
    Footnote
} from 'docx';

interface ConversionResult {
    mainText: string;
    footnotes: string[];
    positions: number[];
}

/**
 * Process text and track footnote positions
 */
function processTextWithPositions(input: string): ConversionResult {
    const footnotes: string[] = [];
    const positions: number[] = [];
    let output = "";
    let i = 0;
    let charPosition = 0;

    if (!input || input.trim().length === 0) {
        return { mainText: "", footnotes: [], positions: [] };
    }

    while (i < input.length) {
        const start = input.indexOf("{{fn:", i);

        if (start === -1) {
            const remaining = input.slice(i);
            output += remaining;
            charPosition += remaining.length;
            break;
        }

        const beforeMarker = input.slice(i, start);
        output += beforeMarker;
        charPosition += beforeMarker.length;

        const end = input.indexOf("}}", start);

        if (end === -1) {
            const remaining = input.slice(start);
            output += remaining;
            charPosition += remaining.length;
            break;
        }

        const inner = input.slice(start + 5, end);
        const citation = inner.trim();

        if (citation.length > 0) {
            footnotes.push(citation);
            positions.push(charPosition);
        }

        i = end + 2;
    }

    return { mainText: output, footnotes, positions };
}

/**
 * Create paragraphs with real Word footnote references
 */
function createParagraphsWithFootnotes(
    text: string,
    footnotes: string[],
    positions: number[]
): { paragraphs: Paragraph[], footnoteObjects: Footnote[] } {

    const footnoteObjects: Footnote[] = [];
    const paragraphs: Paragraph[] = [];

    // Create footnote objects
    footnotes.forEach((citation, index) => {
        footnoteObjects.push(
            new Footnote({
                id: index + 1,
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: citation,
                                font: "Times New Roman",
                                size: 20 // 10pt
                            })
                        ]
                    })
                ]
            })
        );
    });

    // Split text into paragraphs
    const lines = text.split('\n');
    let currentCharPosition = 0;
    let footnoteIndex = 0;

    for (const line of lines) {
        if (line.trim().length === 0) {
            paragraphs.push(new Paragraph({ text: "" }));
            currentCharPosition += 1; // newline character
            continue;
        }

        const children: (TextRun | FootnoteReferenceRun)[] = [];
        let linePosition = 0;

        // Check if this line contains any footnote positions
        while (linePosition < line.length) {
            // Find next footnote position in this line
            const nextFootnotePos = positions[footnoteIndex];
            const relativePos = nextFootnotePos - currentCharPosition;

            if (footnoteIndex < footnotes.length &&
                relativePos >= linePosition &&
                relativePos <= line.length) {

                // Add text before footnote
                if (relativePos > linePosition) {
                    children.push(new TextRun({
                        text: line.slice(linePosition, relativePos),
                        font: "Times New Roman",
                        size: 24
                    }));
                }

                // Add footnote reference
                children.push(new FootnoteReferenceRun(footnoteIndex + 1));

                linePosition = relativePos;
                footnoteIndex++;
            } else {
                // No more footnotes in this line, add remaining text
                children.push(new TextRun({
                    text: line.slice(linePosition),
                    font: "Times New Roman",
                    size: 24
                }));
                break;
            }
        }

        // If no footnotes were found in this line, just add the text
        if (children.length === 0) {
            children.push(new TextRun({
                text: line,
                font: "Times New Roman",
                size: 24
            }));
        }

        paragraphs.push(new Paragraph({
            children,
            spacing: {
                after: 200,
                line: 360
            }
        }));

        currentCharPosition += line.length + 1; // +1 for newline
    }

    return { paragraphs, footnoteObjects };
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

        const wordCount = text.trim().split(/\s+/).length;
        if (wordCount > 10000) {
            return NextResponse.json(
                { error: `Text exceeds 10,000 word limit (current: ${wordCount} words)` },
                { status: 400 }
            );
        }

        const { mainText, footnotes, positions } = processTextWithPositions(text);

        if (!mainText || mainText.trim().length === 0) {
            return NextResponse.json(
                { error: 'No valid text found after processing' },
                { status: 400 }
            );
        }

        const { paragraphs, footnoteObjects } = createParagraphsWithFootnotes(
            mainText,
            footnotes,
            positions
        );

        // Create document with real footnotes
        const doc = new Document({
            footnotes: Object.fromEntries(
                footnoteObjects.map((fn, idx) => [idx + 1, fn])
            ),
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
                children: paragraphs
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
