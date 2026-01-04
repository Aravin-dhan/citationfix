import {
    Document,
    Paragraph,
    TextRun,
    FootnoteReferenceRun,
    ExternalHyperlink,
    Packer,
    HeadingLevel,
    Footer,
    PageNumber,
    AlignmentType
} from 'docx';
import { processText } from '@/utils/converter';

/**
 * Generate a .docx file with proper Word footnotes, hyperlinks, and specific formatting
 */
export async function generateDocx(
    inputText: string,
    options: {
        font?: string;
        fontSize?: number;
        lineSpacing?: number;
        alignment?: 'left' | 'center' | 'right' | 'justify';
    } = {}
): Promise<Blob> {
    const { mainText, footnotes } = processText(inputText);
    const {
        font = 'Times New Roman',
        fontSize = 12,
        lineSpacing = 1.5,
        alignment = 'left'
    } = options;

    // Map string alignment to docx AlignmentType
    const alignMap: any = {
        'left': AlignmentType.LEFT,
        'center': AlignmentType.CENTER,
        'right': AlignmentType.RIGHT,
        'justify': AlignmentType.JUSTIFIED
    };
    const docAlignment = alignMap[alignment] || AlignmentType.LEFT;

    // Create footnotes map
    const footnotesMap: Record<number, any> = {};
    footnotes.forEach((note, index) => {
        const children: (TextRun | ExternalHyperlink)[] = [];
        const parts = note.split(/(\[.*?\]\(.*?\))/g);

        parts.forEach(part => {
             if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
                const mid = part.indexOf('](');
                const linkText = part.substring(1, mid);
                const linkUrl = part.substring(mid + 2, part.length - 1);
                children.push(new ExternalHyperlink({
                    children: [new TextRun({ text: linkText, style: "Hyperlink" })],
                    link: linkUrl
                }));
            } else if (part) {
                children.push(new TextRun({ text: part, font: font }));
            }
        });

        footnotesMap[index + 1] = {
            children: [new Paragraph({ children })]
        };
    });

    // Create paragraphs
    const paragraphs: Paragraph[] = [];
    const lines = mainText.split(/\r?\n/);
    
    let footnoteIndex = 0;

    for (const line of lines) {
        let textContent = line;
        let headingLevel: any = undefined;
        let paragraphBorder: any = undefined;
        let paragraphIndent: any = undefined;
        let isLineBold = false;
        let isLineAllCaps = false;

        // Heading 1: "# "
        if (line.startsWith('# ')) {
            headingLevel = HeadingLevel.HEADING_1;
            textContent = line.substring(2);
            isLineBold = true;
            isLineAllCaps = true;
            paragraphBorder = { bottom: { color: "auto", space: 1, value: "single", size: 6 } };
        } 
        // Heading 2: "## "
        else if (line.startsWith('## ')) {
            headingLevel = HeadingLevel.HEADING_2;
            textContent = line.substring(3);
            isLineBold = true;
            paragraphIndent = { left: 720 };
            paragraphBorder = { bottom: { color: "auto", space: 1, value: "single", size: 6 } };
        }

        // Inline Parsing: Bold (**), Italic (*), Underline (<u>), Links ([]), Footnotes (Superscript)
        // Regex to split by all tokens
        // 1. Bold: (\**.*?\**)
        // 2. Italic: (\*.*?\*)
        // 3. Underline: (<u>.*?</u>)
        // 4. Superscript: ([\u2070-\u2079\u00B9\u00B2\u00B3]+)
        // 5. Link: (\['.*?']\(.*?\))
        
        const regex = /(\*\*.*?\*\*)|(\*.*?\*)|(<u>.*?<\/u>)|([\u2070-\u2079\u00B9\u00B2\u00B3]+)|(\[.*?\]\(.*?\))/g;
        const parts = textContent.split(regex).filter(p => p !== undefined && p !== '');
        
        const children: (TextRun | FootnoteReferenceRun | ExternalHyperlink)[] = [];

        for (const part of parts) {
            // Bold
            if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
                children.push(new TextRun({
                    text: part.substring(2, part.length - 2),
                    bold: true,
                    font: font,
                    size: fontSize * 2, // docx uses half-points
                    allCaps: isLineAllCaps
                }));
            }
            // Italic
            else if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
                children.push(new TextRun({
                    text: part.substring(1, part.length - 1),
                    italics: true,
                    bold: isLineBold,
                    font: font,
                    size: fontSize * 2,
                    allCaps: isLineAllCaps
                }));
            }
            // Underline
            else if (part.startsWith('<u>') && part.endsWith('</u>')) {
                children.push(new TextRun({
                    text: part.substring(3, part.length - 4),
                    underline: { type: "single" },
                    bold: isLineBold,
                    font: font,
                    size: fontSize * 2,
                    allCaps: isLineAllCaps
                }));
            }
            // Footnote
            else if (/^[\u2070-\u2079\u00B9\u00B2\u00B3]+$/.test(part)) {
                if (footnoteIndex < footnotes.length) {
                    children.push(new FootnoteReferenceRun(footnoteIndex + 1));
                    footnoteIndex++;
                }
            }
            // Link
            else if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
                const mid = part.indexOf('](');
                const linkText = part.substring(1, mid);
                const linkUrl = part.substring(mid + 2, part.length - 1);
                children.push(new ExternalHyperlink({
                    children: [new TextRun({ 
                        text: linkText, 
                        style: "Hyperlink", 
                        bold: isLineBold,
                        font: font,
                        size: fontSize * 2
                    })],
                    link: linkUrl
                }));
            }
            // Regular Text
            else {
                children.push(new TextRun({
                    text: part,
                    bold: isLineBold,
                    font: font,
                    size: fontSize * 2,
                    allCaps: isLineAllCaps
                }));
            }
        }

        paragraphs.push(new Paragraph({
            children: children,
            heading: headingLevel,
            border: paragraphBorder,
            indent: paragraphIndent,
            alignment: docAlignment,
            spacing: { 
                after: 200, 
                line: lineSpacing * 240 // docx line spacing rule (240 = 1.0)
            }
        }));
    }

    // Create the document with Footer (Page Numbers)
    const doc = new Document({
        footnotes: footnotesMap,
        sections: [{
            properties: {},
            headers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    children: [PageNumber.CURRENT],
                                }),
                            ],
                        }),
                    ],
                }),
            },
            footers: {
                default: new Footer({
                    children: [
                         new Paragraph({
                             alignment: AlignmentType.CENTER,
                             children: [
                                 new TextRun({
                                     children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES],
                                     font: font,
                                     size: 20 // 10pt
                                 })
                             ]
                         })
                    ]
                })
            },
            children: paragraphs
        }]
    });

    return await Packer.toBlob(doc);
}