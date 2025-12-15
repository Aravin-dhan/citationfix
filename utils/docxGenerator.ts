import { Document, Paragraph, TextRun, FootnoteReferenceRun, ExternalHyperlink, Packer } from 'docx';
import { processText, Segment } from '@/utils/converter';

/**
 * Generate a .docx file with proper Word footnotes and hyperlinks
 */
export async function generateDocx(inputText: string): Promise<Blob> {
    const { footnotes, segments } = processText(inputText);

    // Create footnotes map
    // Note: older docx versions or types might expect an object conforming to interface rather than a class instance
    const footnotesMap: Record<number, any> = {};
    footnotes.forEach((note, index) => {
        const children: (TextRun | ExternalHyperlink)[] = [];
        // Parse links in footnote text
        const parts = note.split(/(\[.*?\]\(.*?\))/g);

        parts.forEach(part => {
            const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
            if (linkMatch) {
                children.push(new ExternalHyperlink({
                    children: [
                        new TextRun({
                            text: linkMatch[1],
                            style: "Hyperlink",
                        }),
                    ],
                    link: linkMatch[2],
                }));
            } else if (part) {
                children.push(new TextRun(part));
            }
        });

        footnotesMap[index + 1] = {
            children: [
                new Paragraph({
                    children: children
                })
            ]
        };
    });

    // Create paragraphs with footnote references and hyperlinks
    const paragraphs: Paragraph[] = [];
    let currentParagraphChildren: (TextRun | FootnoteReferenceRun | ExternalHyperlink)[] = [];

    for (const segment of segments) {
        if (segment.type === 'footnote') {
            // Add footnote reference
            currentParagraphChildren.push(
                new FootnoteReferenceRun(segment.number)
            );
        } else if (segment.type === 'text') {
            // Handle text segment, including markdown links and newlines
            const textContent = segment.content;

            // Split by markdown links
            const parts = textContent.split(/(\[.*?\]\(.*?\))/g);

            for (const part of parts) {
                if (!part) continue;

                // Check if this part is a hyperlink
                const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);

                if (linkMatch) {
                    const linkText = linkMatch[1];
                    const linkUrl = linkMatch[2];
                    currentParagraphChildren.push(
                        new ExternalHyperlink({
                            children: [
                                new TextRun({
                                    text: linkText,
                                    style: "Hyperlink",
                                }),
                            ],
                            link: linkUrl,
                        })
                    );
                } else {
                    // Regular text - handle newlines
                    const lines = part.split('\n');

                    for (let j = 0; j < lines.length; j++) {
                        if (lines[j]) {
                            currentParagraphChildren.push(new TextRun(lines[j]));
                        }

                        // If this is not the last line, it means we had a newline, so push paragraph
                        if (j < lines.length - 1) {
                            paragraphs.push(new Paragraph({
                                children: currentParagraphChildren
                            }));
                            currentParagraphChildren = [];
                        }
                    }
                }
            }
        }
    }

    // Push final paragraph if exists
    if (currentParagraphChildren.length > 0) {
        paragraphs.push(new Paragraph({
            children: currentParagraphChildren
        }));
    }

    // Create the document
    const doc = new Document({
        footnotes: footnotesMap,
        sections: [{
            properties: {},
            children: paragraphs.length > 0 ? paragraphs : [
                new Paragraph({
                    children: [new TextRun("")]
                })
            ]
        }]
    });

    return await Packer.toBlob(doc);
}
