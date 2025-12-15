/**
 * CitationFix - Text Conversion Utility
 * Converts text with {{fn: ...}} markers into clean text with numbered footnotes
 */

export type Segment =
  | { type: 'text'; content: string }
  | { type: 'footnote'; content: string; number: number };

export interface ConversionResult {
  mainText: string; // Kept for backward compatibility / easy debugging
  footnotes: string[];
  segments: Segment[];
}

/**
 * Converts superscript numbers (1-9) to Unicode superscript characters
 */
function toSuperscript(num: number): string {
  const superscriptMap: { [key: string]: string } = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
  };

  return num.toString()
    .split('')
    .map(digit => superscriptMap[digit] || digit)
    .join('');
}

/**
 * Processes text containing {{fn: ...}} markers and converts them to numbered footnotes
 * 
 * @param input - Raw text with {{fn: citation}} markers
 * @returns Object containing clean main text, array of footnotes, and structured segments
 */
export function processText(input: string): ConversionResult {
  const footnotes: string[] = [];
  const segments: Segment[] = [];
  let output = "";
  let i = 0;
  let footnoteCounter = 1;

  // Handle empty or whitespace-only input
  if (!input || input.trim().length === 0) {
    return { mainText: "", footnotes: [], segments: [] };
  }

  while (i < input.length) {
    // Find the next {{fn: marker
    const start = input.indexOf("{{fn:", i);

    if (start === -1) {
      // No more markers found - append remaining text
      const remaining = input.slice(i);
      output += remaining;
      if (remaining.length > 0) {
        segments.push({ type: 'text', content: remaining });
      }
      break;
    }

    // Add text before the marker
    const textBefore = input.slice(i, start);
    output += textBefore;
    if (textBefore.length > 0) {
      segments.push({ type: 'text', content: textBefore });
    }

    // Find the closing }}
    const end = input.indexOf("}}", start);

    if (end === -1) {
      // Malformed marker - no closing braces found
      // Treat the rest as plain text
      const remaining = input.slice(start);
      output += remaining;
      segments.push({ type: 'text', content: remaining });
      break;
    }

    // Extract the citation text (everything after "{{fn:" and before "}}")
    const inner = input.slice(start + 5, end); // +5 to skip "{{fn:"
    const citation = inner.trim();

    // Only add non-empty citations
    if (citation.length > 0) {
      footnotes.push(citation);

      // Insert superscript footnote number for string output
      output += toSuperscript(footnoteCounter);

      // Add footnote segment
      segments.push({ type: 'footnote', content: citation, number: footnoteCounter });

      footnoteCounter++;
    }

    // Move past the closing }}
    i = end + 2;
  }

  return { mainText: output, footnotes, segments };
}

/**
 * Formats footnotes as a numbered list
 * 
 * @param footnotes - Array of footnote citations
 * @returns Formatted string with numbered list
 */
export function formatFootnotes(footnotes: string[]): string {
  if (footnotes.length === 0) {
    return "";
  }

  return footnotes
    .map((fn, index) => `${index + 1}. ${fn}`)
    .join('\n');
}
