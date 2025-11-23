/**
 * CitationFix - Text Conversion Utility
 * Converts text with {{fn: ...}} markers into clean text with numbered footnotes
 */

export interface ConversionResult {
  mainText: string;
  footnotes: string[];
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
 * @returns Object containing clean main text and array of footnotes
 * 
 * @example
 * const input = "This is text.{{fn: Smith, 2020}} More text.{{fn: Doe v. Roe}}";
 * const result = processText(input);
 * // result.mainText: "This is text.¹ More text.²"
 * // result.footnotes: ["Smith, 2020", "Doe v. Roe"]
 */
export function processText(input: string): ConversionResult {
  const footnotes: string[] = [];
  let output = "";
  let i = 0;
  let footnoteCounter = 1;

  // Handle empty or whitespace-only input
  if (!input || input.trim().length === 0) {
    return { mainText: "", footnotes: [] };
  }

  while (i < input.length) {
    // Find the next {{fn: marker
    const start = input.indexOf("{{fn:", i);
    
    if (start === -1) {
      // No more markers found - append remaining text
      output += input.slice(i);
      break;
    }

    // Add text before the marker
    output += input.slice(i, start);

    // Find the closing }}
    const end = input.indexOf("}}", start);
    
    if (end === -1) {
      // Malformed marker - no closing braces found
      // Treat the rest as plain text
      output += input.slice(start);
      break;
    }

    // Extract the citation text (everything after "{{fn:" and before "}}")
    const inner = input.slice(start + 5, end); // +5 to skip "{{fn:"
    const citation = inner.trim();

    // Only add non-empty citations
    if (citation.length > 0) {
      footnotes.push(citation);
      
      // Insert superscript footnote number
      output += toSuperscript(footnoteCounter);
      footnoteCounter++;
    }

    // Move past the closing }}
    i = end + 2;
  }

  return { mainText: output, footnotes };
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
