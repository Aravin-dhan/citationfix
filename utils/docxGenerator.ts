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
    AlignmentType,
    UnderlineType
} from 'docx';
import { processText } from '@/utils/converter';

/**
 * Generate a .docx file with proper Word footnotes, hyperlinks, and specific formatting
 * Supports:
 * - Headings: # H1, ## H2, ### H3, #### H4, ##### H5, ###### H6
 * - Bold: **text**
 * - Italic: *text*
 * - Underline: <u>text</u>
 * - Small Caps: ^^text^^
 * - Links: [text](url)
 * - Footnotes: {{fn: citation}}
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
    const alignMap: Record<string, typeof AlignmentType[keyof typeof AlignmentType]> = {
        'left': AlignmentType.LEFT,
        'center': AlignmentType.CENTER,
        'right': AlignmentType.RIGHT,
        'justify': AlignmentType.JUSTIFIED
    };
    const docAlignment = alignMap[alignment] || AlignmentType.LEFT;

    // Create footnotes map
    const footnotesMap: Record<number, { children: Paragraph[] }> = {};
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
                children.push(new TextRun({ text: part, font: font, size: 20 })); // 10pt for footnotes
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
        let headingLevel: (typeof HeadingLevel)[keyof typeof HeadingLevel] | undefined = undefined;
        let paragraphBorder: any = undefined;
        let paragraphIndent: any = undefined;
        let isLineBold = false;
        let isLineAllCaps = false;
        let headingFontSize = fontSize;

        // Heading detection (must check longer prefixes first)
        if (line.startsWith('###### ')) {
            headingLevel = HeadingLevel.HEADING_6;
            textContent = line.substring(7);
            isLineBold = true;
            headingFontSize = fontSize;
        } else if (line.startsWith('##### ')) {
            headingLevel = HeadingLevel.HEADING_5;
            textContent = line.substring(6);
            isLineBold = true;
            headingFontSize = fontSize;
        } else if (line.startsWith('#### ')) {
            headingLevel = HeadingLevel.HEADING_4;
            textContent = line.substring(5);
            isLineBold = true;
            headingFontSize = fontSize + 1;
        } else if (line.startsWith('### ')) {
            headingLevel = HeadingLevel.HEADING_3;
            textContent = line.substring(4);
            isLineBold = true;
            headingFontSize = fontSize + 2;
        } else if (line.startsWith('## ')) {
            headingLevel = HeadingLevel.HEADING_2;
            textContent = line.substring(3);
            isLineBold = true;
            headingFontSize = fontSize + 4;
            paragraphIndent = { left: 720 }; // Indented
            paragraphBorder = { bottom: { color: "auto", space: 1, style: "single", size: 6 } };
        } else if (line.startsWith('# ')) {
            headingLevel = HeadingLevel.HEADING_1;
            textContent = line.substring(2);
            isLineBold = true;
            isLineAllCaps = true;
            headingFontSize = fontSize + 6;
            paragraphBorder = { bottom: { color: "auto", space: 1, style: "single", size: 6 } };
        }

        // Inline Parsing Regex:
        // 1. Bold: (**...**)
        // 2. Italic: (*...*)
        // 3. Underline: (<u>...</u>)
        // 4. Small Caps: (^^...^^)
        // 5. Superscript footnotes: (unicode superscript chars)
        // 6. Links: ([...](...))

        const regex = /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(<u>[^<]+<\/u>)|(\^\^[^^]+\^\^)|([\u2070-\u2079\u00B9\u00B2\u00B3]+)|(\[[^\]]+\]\([^)]+\))/g;
        const parts = textContent.split(regex).filter(p => p !== undefined && p !== '');

        const children: (TextRun | FootnoteReferenceRun | ExternalHyperlink)[] = [];

        for (const part of parts) {
            // Bold: **text**
            if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
                const innerText = part.substring(2, part.length - 2);
                children.push(new TextRun({
                    text: innerText,
                    bold: true,
                    font: font,
                    size: (headingLevel ? headingFontSize : fontSize) * 2,
                    allCaps: isLineAllCaps
                }));
            }
            // Italic: *text*
            else if (part.startsWith('*') && part.endsWith('*') && part.length >= 2 && !part.startsWith('**')) {
                const innerText = part.substring(1, part.length - 1);
                children.push(new TextRun({
                    text: innerText,
                    italics: true,
                    bold: isLineBold,
                    font: font,
                    size: (headingLevel ? headingFontSize : fontSize) * 2,
                    allCaps: isLineAllCaps
                }));
            }
            // Underline: <u>text</u>
            else if (part.startsWith('<u>') && part.endsWith('</u>')) {
                const innerText = part.substring(3, part.length - 4);
                children.push(new TextRun({
                    text: innerText,
                    underline: { type: UnderlineType.SINGLE },
                    bold: isLineBold,
                    font: font,
                    size: (headingLevel ? headingFontSize : fontSize) * 2,
                    allCaps: isLineAllCaps
                }));
            }
            // Small Caps: ^^text^^
            else if (part.startsWith('^^') && part.endsWith('^^') && part.length >= 4) {
                const innerText = part.substring(2, part.length - 2);
                children.push(new TextRun({
                    text: innerText,
                    smallCaps: true,
                    bold: isLineBold,
                    font: font,
                    size: (headingLevel ? headingFontSize : fontSize) * 2
                }));
            }
            // Footnote (Unicode superscript)
            else if (/^[\u2070-\u2079\u00B9\u00B2\u00B3]+$/.test(part)) {
                if (footnoteIndex < footnotes.length) {
                    children.push(new FootnoteReferenceRun(footnoteIndex + 1));
                    footnoteIndex++;
                }
            }
            // Link: [text](url)
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
                        size: (headingLevel ? headingFontSize : fontSize) * 2
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
                    size: (headingLevel ? headingFontSize : fontSize) * 2,
                    allCaps: isLineAllCaps
                }));
            }
        }

        paragraphs.push(new Paragraph({
            children: children.length > 0 ? children : [new TextRun({ text: '' })],
            heading: headingLevel,
            border: paragraphBorder,
            indent: paragraphIndent,
            alignment: docAlignment,
            spacing: {
                after: headingLevel ? 300 : 200,
                before: headingLevel ? 400 : 0,
                line: lineSpacing * 240
            }
        }));
    }

    // Create the document with proper styles and footnotes
    const doc = new Document({
        styles: {
            characterStyles: [
                {
                    id: "FootnoteReference",
                    name: "Footnote Reference",
                    basedOn: "DefaultParagraphFont",
                    run: {
                        superScript: true
                    }
                }
            ]
        },
        footnotes: footnotesMap,
        sections: [{
            properties: {},
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