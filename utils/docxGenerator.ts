import { Document, Paragraph, TextRun, FootnoteReferenceRun, ExternalHyperlink, Packer } from 'docx';
import { processText } from '@/utils/converter';

/**
 * Generate a .docx file with proper Word footnotes and hyperlinks
 */
export async function generateDocx(inputText: string): Promise<Blob> {
    const { mainText, footnotes } = processText(inputText);

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

    // Split main text by footnote markers (superscript numbers) and hyperlinks
    // Regex matches:
    // 1. Superscript numbers (footnotes): ([\u2070-\u2079\u00B9\u00B2\u00B3]+)
    // 2. Markdown links: (\[.*?\]\(.*?\))
    const parts = mainText.split(/([\u2070-\u2079\u00B9\u00B2\u00B3]+)|(\[.*?\]\(.*?\))/g).filter(part => part !== undefined && part !== '');

    let currentParagraphChildren: (TextRun | FootnoteReferenceRun | ExternalHyperlink)[] = [];
    let footnoteIndex = 0;

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        // Check if this part is a superscript number (footnote reference)
        if (/^[\u2070-\u2079\u00B9\u00B2\u00B3]+$/.test(part)) {
            // Add footnote reference
            // FootnoteReferenceRun automatically renders as a superscript number in Word
            const num = parseSuperscript(part);
            // We can use the parsed number or just increment. 
            // Since processText is sequential, the superscripts match the footnotes array order 1-based.
            // But let's rely on our footnoteIndex to be safe or just use the number if parsing works reliably.
            // Simplest is to assume strict order from processText:
            if (footnoteIndex < footnotes.length) {
                currentParagraphChildren.push(
                    new FootnoteReferenceRun(footnoteIndex + 1)
                );
                footnoteIndex++;
            }
        }
        // Check if this part is a hyperlink
        else if (/^\[(.*?)\]\((.*?)\)$/.test(part)) {
            const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
            if (match) {
                const linkText = match[1];
                const linkUrl = match[2];
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
            }
        }
        // Regular text
        else {
            // Split by newlines to create separate paragraphs
            const lines = part.split('\n');

            for (let j = 0; j < lines.length; j++) {
                if (lines[j]) { // Don't skip empty strings if they are meaningful, but usually split results in empty strings for adjacent delimiters
                    // If line has content
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
                    children: [new TextRun(mainText)]
                })
            ]
        }]
    });

    return await Packer.toBlob(doc);
}

// Helper to parse unicode superscripts back to number (if needed verification)
function parseSuperscript(str: string): number {
    const superscriptMap: { [key: string]: string } = {
        '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
        '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9'
    };
    const numStr = str.split('').map(char => superscriptMap[char] || char).join('');
    return parseInt(numStr, 10);
}
