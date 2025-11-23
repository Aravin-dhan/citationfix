import { Document, Paragraph, TextRun, Footer, FootnoteReferenceRun } from 'docx';
import { processText } from '@/utils/converter';

/**
 * Generate a .docx file with proper Word footnotes
 */
export async function generateDocx(inputText: string): Promise<Blob> {
    const { mainText, footnotes } = processText(inputText);

    // Create paragraphs with footnote references
    const paragraphs: Paragraph[] = [];

    // Split main text by footnote markers (superscript numbers)
    const parts = mainText.split(/([\u2070-\u2079\u00B9\u00B2\u00B3]+)/);

    let currentParagraphRuns: TextRun[] = [];
    let footnoteIndex = 0;

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        // Check if this part is a superscript number
        if (/^[\u2070-\u2079\u00B9\u00B2\u00B3]+$/.test(part)) {
            // Add the text before the footnote
            if (currentParagraphRuns.length > 0) {
                // Don't create paragraph yet, just note we need a footnote reference
            }

            // Add footnote reference
            if (footnoteIndex < footnotes.length) {
                currentParagraphRuns.push(
                    new FootnoteReferenceRun(footnoteIndex + 1)
                );
                footnoteIndex++;
            }
        } else if (part) {
            // Regular text - split by newlines to create separate paragraphs
            const lines = part.split('\n');

            for (let j = 0; j < lines.length; j++) {
                if (lines[j].trim()) {
                    currentParagraphRuns.push(new TextRun(lines[j]));
                }

                // Create paragraph if we hit a newline or end of part
                if (j < lines.length - 1 || i === parts.length - 1) {
                    if (currentParagraphRuns.length > 0) {
                        paragraphs.push(new Paragraph({
                            children: currentParagraphRuns
                        }));
                        currentParagraphRuns = [];
                    }
                }
            }
        }
    }

    // If there are remaining runs, create a final paragraph
    if (currentParagraphRuns.length > 0) {
        paragraphs.push(new Paragraph({
            children: currentParagraphRuns
        }));
    }

    // Create the document
    const doc = new Document({
        sections: [{
            properties: {},
            children: paragraphs.length > 0 ? paragraphs : [
                new Paragraph({
                    children: [new TextRun(mainText)]
                })
            ],
            footers: {
                default: new Footer({
                    children: footnotes.map((footnote, index) =>
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `${index + 1}. ${footnote}`,
                                    size: 20 // 10pt font
                                })
                            ]
                        })
                    )
                })
            }
        }]
    });

    // Generate blob
    const { Packer } = await import('docx');
    const blob = await Packer.toBlob(doc);

    return blob;
}
