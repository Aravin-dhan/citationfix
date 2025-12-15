"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDocx = generateDocx;
const docx_1 = require("docx");
const converter_1 = require("@/utils/converter");
/**
 * Generate a .docx file with proper Word footnotes and hyperlinks
 */
async function generateDocx(inputText) {
    const { footnotes, segments } = (0, converter_1.processText)(inputText);
    // Create footnotes map
    // Note: older docx versions or types might expect an object conforming to interface rather than a class instance
    const footnotesMap = {};
    footnotes.forEach((note, index) => {
        const children = [];
        // Parse links in footnote text
        const parts = note.split(/(\[.*?\]\(.*?\))/g);
        parts.forEach(part => {
            const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
            if (linkMatch) {
                children.push(new docx_1.ExternalHyperlink({
                    children: [
                        new docx_1.TextRun({
                            text: linkMatch[1],
                            style: "Hyperlink",
                        }),
                    ],
                    link: linkMatch[2],
                }));
            }
            else if (part) {
                children.push(new docx_1.TextRun(part));
            }
        });
        footnotesMap[index + 1] = {
            children: [
                new docx_1.Paragraph({
                    children: children
                })
            ]
        };
    });
    // Create paragraphs with footnote references and hyperlinks
    const paragraphs = [];
    let currentParagraphChildren = [];
    for (const segment of segments) {
        if (segment.type === 'footnote') {
            // Add footnote reference
            currentParagraphChildren.push(new docx_1.FootnoteReferenceRun(segment.number));
        }
        else if (segment.type === 'text') {
            // Handle text segment, including markdown links and newlines
            const textContent = segment.content;
            // Split by markdown links
            const parts = textContent.split(/(\[.*?\]\(.*?\))/g);
            for (const part of parts) {
                if (!part)
                    continue;
                // Check if this part is a hyperlink
                const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
                if (linkMatch) {
                    const linkText = linkMatch[1];
                    const linkUrl = linkMatch[2];
                    currentParagraphChildren.push(new docx_1.ExternalHyperlink({
                        children: [
                            new docx_1.TextRun({
                                text: linkText,
                                style: "Hyperlink",
                            }),
                        ],
                        link: linkUrl,
                    }));
                }
                else {
                    // Regular text - handle newlines
                    const lines = part.split('\n');
                    for (let j = 0; j < lines.length; j++) {
                        if (lines[j]) {
                            currentParagraphChildren.push(new docx_1.TextRun(lines[j]));
                        }
                        // If this is not the last line, it means we had a newline, so push paragraph
                        if (j < lines.length - 1) {
                            paragraphs.push(new docx_1.Paragraph({
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
        paragraphs.push(new docx_1.Paragraph({
            children: currentParagraphChildren
        }));
    }
    // Create the document
    const doc = new docx_1.Document({
        footnotes: footnotesMap,
        sections: [{
                properties: {},
                children: paragraphs.length > 0 ? paragraphs : [
                    new docx_1.Paragraph({
                        children: [new docx_1.TextRun("")]
                    })
                ]
            }]
    });
    return await docx_1.Packer.toBlob(doc);
}
