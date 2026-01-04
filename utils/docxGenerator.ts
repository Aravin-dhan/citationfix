import { Document, Paragraph, TextRun, FootnoteReferenceRun, ExternalHyperlink, Packer, HeadingLevel, BorderStyle } from 'docx';
import { processText } from '@/utils/converter';

/**
 * Generate a .docx file with proper Word footnotes, hyperlinks, and specific formatting
 */
export async function generateDocx(inputText: string): Promise<Blob> {
    const { mainText, footnotes } = processText(inputText);

    // Create footnotes map
    const footnotesMap: Record<number, any> = {};
    footnotes.forEach((note, index) => {
        const children: (TextRun | ExternalHyperlink)[] = [];
        // Parse links in footnote text
        const parts = note.split(/(\[.*?\]\(.*?\))/g);

        parts.forEach(part => {
            const linkMatch = part.match(/^\\\[(.*?)\]\((.*?)\\\\)$/);
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

    // Create paragraphs
    const paragraphs: Paragraph[] = [];
    
    // Split by newlines to handle line-based formatting (headers)
    const lines = mainText.split(/\r?\n/);
    
    let footnoteIndex = 0;

    for (const line of lines) {
        let textContent = line;
        let headingLevel: any = undefined;
        let isBold = false;
        let isAllCaps = false;
        let paragraphBorder: any = undefined;
        let paragraphIndent: any = undefined;

        // Heading 1: "# " -> All Caps, Bold, Bottom Border
        if (line.startsWith('# ')) {
            headingLevel = HeadingLevel.HEADING_1;
            textContent = line.substring(2);
            isBold = true;
            isAllCaps = true;
            paragraphBorder = {
                bottom: { color: "auto", space: 1, value: "single", size: 6 }
            };
        } 
        // Heading 2: "## " -> Bold, Indented, Bottom Border
        else if (line.startsWith('## ')) {
            headingLevel = HeadingLevel.HEADING_2;
            textContent = line.substring(3);
            isBold = true;
            paragraphIndent = { left: 720 }; // ~0.5 inch
            paragraphBorder = {
                bottom: { color: "auto", space: 1, value: "single", size: 6 }
            };
        }

        // Parse content for Footnotes (Superscripts) and Markdown Links
        // Regex matches:
        // 1. Superscript numbers (unicode from processText): ([\u2070-\u2079\u00B9\u00B2\u00B3]+)
        // 2. Markdown links: (\[.*?]\(.*?\))
        const parts = textContent.split(/([\u2070-\u2079\u00B9\u00B2\u00B3]+)|(\[.*?]\(.*?\))/g).filter(p => p !== undefined && p !== '');
        
        const children: (TextRun | FootnoteReferenceRun | ExternalHyperlink)[] = [];

        for (const part of parts) {
            // Check for Footnote Reference (Superscript chars)
            if (/^[\u2070-\u2079\u00B9\u00B2\u00B3]+$/.test(part)) {
                if (footnoteIndex < footnotes.length) {
                    children.push(new FootnoteReferenceRun(footnoteIndex + 1));
                    footnoteIndex++;
                }
            }
            // Check for Hyperlink
            else if (/^\[(.*?)\]\((.*?)\)$/.test(part)) {
                const match = part.match(/^\\\[(.*?)\]\((.*?)\\\\)$/);
                if (match) {
                    children.push(new ExternalHyperlink({
                        children: [
                            new TextRun({
                                text: match[1],
                                style: "Hyperlink",
                                bold: isBold,
                                allCaps: isAllCaps
                            }),
                        ],
                        link: match[2],
                    }));
                }
            }
            // Regular Text
            else {
                children.push(new TextRun({
                    text: part,
                    bold: isBold,
                    allCaps: isAllCaps
                }));
            }
        }

        // Create Paragraph
        paragraphs.push(new Paragraph({
            children: children,
            heading: headingLevel,
            border: paragraphBorder,
            indent: paragraphIndent,
            spacing: { after: 200 } // Add some spacing after paragraphs
        }));
    }

    // Append Signature/Metadata
    const signatureLines = [
        "", // Spacing
        "Warm Regards,",
        "",
        "Aravindhan B,",
        "Student, 4th Year, BA. LLB.",
        "Gujarat National Law University.",
        "Email ID: aravindhan22bal014@gnlu.ac.in",
        "Ph No.: +91 8431520025"
    ];

    for (const line of signatureLines) {
        paragraphs.push(new Paragraph({
            children: [new TextRun(line)]
        }));
    }

    // Create the document
    const doc = new Document({
        footnotes: footnotesMap,
        sections: [{
            properties: {},
            children: paragraphs
        }]
    });

    return await Packer.toBlob(doc);
}
