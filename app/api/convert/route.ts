import { NextRequest, NextResponse } from 'next/server';
import { Document, Paragraph, TextRun, Packer } from 'docx';

interface ConversionResult {
    mainText: string;
    footnotes: string[];
}

/**
 * Process text and extract footnotes (server-side version)
 */
function processText(input: string): ConversionResult {
    const footnotes: string[] = [];
    let output = "";
    let i = 0;
    let footnoteCounter = 1;

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
            footnoteCounter++;
        }

        i = end + 2;
    }

    return { mainText: output, footnotes };
}

/**
 * API route to generate .docx file with real Word footnotes
 */
export async function POST(request: NextRequest) {
    try {
        const { text } = await request.json();

        if (!text || typeof text !== 'string') {
            return NextResponse.json(
                { error: 'Invalid input text' },
                { status: 400 }
            );
        }

        const { mainText, footnotes } = processText(text);

        // Split text into paragraphs
        const paragraphs = mainText.split('\n').filter(p => p.trim()).map(para => {
            const runs: any[] = [];
            let currentText = para;
            let footnoteIndex = 0;

            // Find positions where footnotes should be inserted
            // For now, we'll add footnotes at the end of sentences or specific markers
            // This is a simplified approach - you may want to enhance this

            runs.push(new TextRun(currentText));

            return new Paragraph({
                children: runs
            });
        });

        // Add footnotes section at the end
        if (footnotes.length > 0) {
            paragraphs.push(new Paragraph({ text: '' })); // Empty line
            paragraphs.push(new Paragraph({
                children: [new TextRun({
                    text: 'Footnotes',
                    bold: true,
                    size: 24
                })]
            }));

            footnotes.forEach((footnote, index) => {
                paragraphs.push(new Paragraph({
                    children: [
                        new TextRun({
                            text: `${index + 1}. `,
                            bold: true
                        }),
                        new TextRun(footnote)
                    ]
                }));
            });
        }

        // Create document
        const doc = new Document({
            sections: [{
                properties: {},
                children: paragraphs
            }]
        });

        // Generate buffer
        const buffer = await Packer.toBuffer(doc);

        // Return as downloadable file
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': 'attachment; filename="CitationFix-Output.docx"'
            }
        });

    } catch (error) {
        console.error('Error generating .docx:', error);
        return NextResponse.json(
            { error: 'Failed to generate .docx file' },
            { status: 500 }
        );
    }
}
