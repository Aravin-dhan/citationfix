import { jsPDF } from 'jspdf';
import { processText } from './converter';

interface PDFOptions {
    font?: string;
    fontSize?: number;
    lineSpacing?: number;
    alignment?: 'left' | 'center' | 'right' | 'justify';
}

/**
 * Generate a PDF file from text with citations
 */
export async function generatePDF(
    inputText: string,
    options: PDFOptions = {}
): Promise<Blob> {
    const { mainText, footnotes } = processText(inputText);
    const {
        fontSize = 12,
        lineSpacing = 1.5,
        alignment = 'left'
    } = options;

    // Create new PDF document (A4 size)
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 72; // 1 inch margins
    const contentWidth = pageWidth - (margin * 2);
    const lineHeight = fontSize * lineSpacing;

    let yPosition = margin;

    // Set font - jsPDF uses 'times' for Times New Roman
    doc.setFont('times', 'normal');
    doc.setFontSize(fontSize);

    // Helper function to add text with word wrap
    const addText = (text: string, x: number, y: number, maxWidth: number, isBold: boolean = false): number => {
        if (isBold) {
            doc.setFont('times', 'bold');
        } else {
            doc.setFont('times', 'normal');
        }

        const lines = doc.splitTextToSize(text, maxWidth);

        for (const line of lines) {
            if (y > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }

            let textX = x;
            if (alignment === 'center') {
                textX = pageWidth / 2;
                doc.text(line, textX, y, { align: 'center' });
            } else if (alignment === 'right') {
                textX = pageWidth - margin;
                doc.text(line, textX, y, { align: 'right' });
            } else if (alignment === 'justify') {
                doc.text(line, textX, y, { align: 'justify', maxWidth: contentWidth });
            } else {
                doc.text(line, textX, y);
            }

            y += lineHeight;
        }

        return y;
    };

    // Process main text - convert superscript unicode back to regular numbers for PDF
    // Since jsPDF doesn't support Unicode superscripts well, we'll format them differently
    let processedText = mainText;
    let footnoteNum = 1;

    // Replace unicode superscripts with [n] format for PDF
    processedText = processedText.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, () => {
        return `[${footnoteNum++}]`;
    });

    // Split by paragraphs and render
    const paragraphs = processedText.split(/\r?\n/);

    for (const paragraph of paragraphs) {
        if (paragraph.trim()) {
            // Handle headings
            if (paragraph.startsWith('# ')) {
                doc.setFontSize(fontSize + 2);
                yPosition = addText(paragraph.substring(2).toUpperCase(), margin, yPosition, contentWidth, true);
                doc.setFontSize(fontSize);
                yPosition += lineHeight * 0.5;
            } else if (paragraph.startsWith('## ')) {
                yPosition = addText(paragraph.substring(3), margin + 36, yPosition, contentWidth - 36, true);
                yPosition += lineHeight * 0.3;
            } else {
                // Remove markdown formatting for PDF
                let cleanText = paragraph
                    .replace(/\*\*(.*?)\*\*/g, '$1')  // Bold
                    .replace(/\*(.*?)\*/g, '$1')      // Italic
                    .replace(/<u>(.*?)<\/u>/g, '$1')  // Underline
                    .replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Links

                yPosition = addText(cleanText, margin, yPosition, contentWidth);
            }
        } else {
            yPosition += lineHeight; // Empty line
        }
    }

    // Add footnotes section if there are any
    if (footnotes.length > 0) {
        yPosition += lineHeight * 2;

        // Check if we need a new page
        if (yPosition > pageHeight - margin * 2) {
            doc.addPage();
            yPosition = margin;
        }

        // Footnotes separator line
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, margin + (contentWidth * 0.3), yPosition);
        yPosition += lineHeight;

        // Add footnotes
        doc.setFontSize(fontSize - 2);

        footnotes.forEach((note, index) => {
            const footnoteText = `${index + 1}. ${note}`;
            yPosition = addText(footnoteText, margin, yPosition, contentWidth);
            yPosition += lineHeight * 0.3;
        });
    }

    // Add page numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setFont('times', 'normal');
        const pageText = `Page ${i} of ${totalPages}`;
        doc.text(pageText, pageWidth / 2, pageHeight - 36, { align: 'center' });
    }

    return doc.output('blob');
}
