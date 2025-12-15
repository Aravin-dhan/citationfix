# CitationFix - Technical Specification

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                     User Browser                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │  React Components (app/page.tsx)                   │ │
│  │  - File Upload UI                                  │ │
│  │  - Text Input                                      │ │
│  │  - Word Count Display                              │ │
│  │  - Results Display                                 │ │
│  └────────────────┬───────────────────────────────────┘ │
│                   │                                      │
│  ┌────────────────▼───────────────────────────────────┐ │
│  │  Client-Side Processing                            │ │
│  │  - utils/converter.ts (text parsing)               │ │
│  │  - utils/fileParser.ts (file reading)              │ │
│  └────────────────┬───────────────────────────────────┘ │
│                   │                                      │
└───────────────────┼──────────────────────────────────────┘
                    │
                    │ HTTP POST (only for .docx)
                    │
┌───────────────────▼──────────────────────────────────────┐
│              Next.js Server (Vercel)                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  API Route: /api/convert                           │  │
│  │  - Validate input                                  │  │
│  │  - Process text (server-side)                      │  │
│  │  - Generate .docx using docx package               │  │
│  │  - Return binary file                              │  │
│  └────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Text Input Flow

```
User Input
    ↓
handleTextChange()
    ↓
validateWordLimit()
    ↓
Update State (inputText, wordCount, isOverLimit)
    ↓
UI Updates (word count display, error message)
```

### 2. File Upload Flow

```
User Selects File
    ↓
handleFileUpload()
    ↓
parseFile() → parseTxtFile() OR parseDocxFile()
    ↓
Extract Text Content
    ↓
handleTextChange() (same as text input)
```

### 3. Conversion Flow

```
User Clicks "Convert"
    ↓
handleConvert()
    ↓
processText(inputText)
    ↓
Parse {{fn: ...}} markers
    ↓
Extract citations
    ↓
Replace with superscript numbers
    ↓
Update State (mainText, footnotes)
    ↓
Display Results
```

### 4. .docx Download Flow

```
User Clicks "Download .docx"
    ↓
handleDownloadDocx()
    ↓
fetch('/api/convert', { body: inputText })
    ↓
Server: processText()
    ↓
Server: createParagraphs()
    ↓
Server: createFootnotesSection()
    ↓
Server: Generate .docx with docx package
    ↓
Server: Return binary buffer
    ↓
Client: Validate blob
    ↓
Client: Create download link
    ↓
Client: Trigger download
```

---

## Component Breakdown

### Main Page Component (`app/page.tsx`)

**State Management**:
```typescript
const [inputText, setInputText] = useState('');
const [mainText, setMainText] = useState('');
const [footnotes, setFootnotes] = useState<string[]>([]);
const [wordCount, setWordCount] = useState(0);
const [isOverLimit, setIsOverLimit] = useState(false);
const [errorMessage, setErrorMessage] = useState('');
const [copiedMain, setCopiedMain] = useState(false);
const [copiedFootnotes, setCopiedFootnotes] = useState(false);
const [copiedPrompt, setCopiedPrompt] = useState(false);
const [isDownloading, setIsDownloading] = useState(false);
```

**Key Functions**:
- `handleTextChange(text)` - Updates input and validates word count
- `handleFileUpload(event)` - Processes uploaded files
- `handleConvert()` - Converts text to footnotes
- `handleDownloadDocx(retryCount)` - Downloads .docx file with retry logic
- `copyToClipboard(text, type)` - Copies text to clipboard

**UI Sections**:
1. Header (branding)
2. AI Prompt Guide
3. How It Works
4. Converter (input + file upload)
5. Results (main text + footnotes)
6. Example
7. Footer

---

## Text Processing Algorithm

### Parsing Algorithm (`utils/converter.ts`)

```typescript
function processText(input: string): ConversionResult {
  const footnotes: string[] = [];
  let output = "";
  let i = 0;
  let footnoteCounter = 1;

  while (i < input.length) {
    // Find next marker
    const start = input.indexOf("{{fn:", i);
    
    if (start === -1) {
      // No more markers - append rest
      output += input.slice(i);
      break;
    }

    // Add text before marker
    output += input.slice(i, start);

    // Find closing braces
    const end = input.indexOf("}}", start);
    
    if (end === -1) {
      // Malformed - append rest as-is
      output += input.slice(start);
      break;
    }

    // Extract citation
    const citation = input.slice(start + 5, end).trim();

    if (citation.length > 0) {
      footnotes.push(citation);
      output += toSuperscript(footnoteCounter);
      footnoteCounter++;
    }

    i = end + 2; // Move past }}
  }

  return { mainText: output, footnotes };
}
```

**Time Complexity**: O(n) where n is input length
**Space Complexity**: O(n) for output and footnotes array

### Superscript Conversion

```typescript
function toSuperscript(num: number): string {
  const map = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
  };
  
  return num.toString()
    .split('')
    .map(digit => map[digit] || digit)
    .join('');
}
```

---

## File Parsing

### .txt File Parsing

```typescript
async function parseTxtFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read text file'));
    };
    
    reader.readAsText(file);
  });
}
```

### .docx File Parsing

```typescript
async function parseDocxFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const result = await mammoth.extractRawText({ arrayBuffer });
        resolve(result.value);
      } catch (error) {
        reject(new Error('Failed to parse .docx file'));
      }
    };
    
    reader.readAsArrayBuffer(file);
  });
}
```

**Library Used**: `mammoth` - Converts .docx to plain text
**Limitations**: 
- Loses formatting (intentional for our use case)
- May not handle complex Word features (tables, images)

---

## .docx Generation

### Document Structure

```
Document
└── Section
    ├── Properties (margins, page size)
    └── Children (paragraphs)
        ├── Main Text Paragraphs
        │   └── TextRuns (font, size, spacing)
        ├── Empty Paragraph (spacing)
        ├── "Footnotes" Heading
        ├── Separator Line
        └── Footnote Paragraphs
            └── TextRuns (number + citation)
```

### Formatting Specifications

| Element | Font | Size | Spacing |
|---------|------|------|---------|
| Main Text | Times New Roman | 12pt (24) | 1.5 line, 200 after |
| Footnote Number | Times New Roman | 10pt (20) | Bold |
| Footnote Text | Times New Roman | 10pt (20) | 100 after |
| Heading | Default | Default | 400 before, 200 after |

### Margins

```typescript
margin: {
  top: 1440,    // 1 inch (1440 twips)
  right: 1440,
  bottom: 1440,
  left: 1440
}
```

**Note**: 1 twip = 1/1440 inch

---

## Error Handling Strategy

### Client-Side Errors

```typescript
try {
  // Operation
} catch (error) {
  const errorMsg = error instanceof Error 
    ? error.message 
    : 'Generic error message';
  
  setErrorMessage(errorMsg);
}
```

### Server-Side Errors

```typescript
try {
  // Processing
  return new NextResponse(data, { status: 200 });
} catch (error) {
  console.error('Error:', error);
  
  return NextResponse.json({
    error: 'User-friendly message',
    details: error.message,
    timestamp: new Date().toISOString()
  }, { status: 500 });
}
```

### Retry Logic

```typescript
async function handleDownloadDocx(retryCount = 0) {
  try {
    // Download logic
  } catch (error) {
    if (retryCount < 2 && isNetworkError(error)) {
      setTimeout(() => handleDownloadDocx(retryCount + 1), 1000);
      return;
    }
    setErrorMessage(error.message);
  }
}
```

**Retry Conditions**:
- Network errors
- Fetch failures
- Maximum 2 retries
- 1 second delay between retries

---

## Validation Rules

### Input Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| Text | Not empty | "Please enter some text" |
| Text | ≤ 10,000 words | "Text exceeds 10,000 word limit" |
| File | .txt or .docx | "Unsupported file format" |
| Citation | Not empty | Silently ignored |

### Word Counting

```typescript
function countWords(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }
  return text.trim().split(/\s+/).length;
}
```

**Regex**: `/\s+/` - Splits on any whitespace (spaces, tabs, newlines)

---

## Performance Considerations

### Client-Side Optimization

1. **Debouncing**: Word count updates on every keystroke (no debounce needed - fast operation)
2. **Memoization**: Not needed for current scale
3. **Code Splitting**: Next.js handles automatically
4. **Bundle Size**: ~500KB (gzipped)

### Server-Side Optimization

1. **Ephemeral Processing**: No database, no caching
2. **Memory Management**: Buffer created and immediately returned
3. **Timeout**: Vercel default (10 seconds for Hobby plan)
4. **Concurrent Requests**: Serverless scales automatically

### File Size Limits

- **Client Upload**: Browser limit (~100MB practical)
- **Word Limit**: 10,000 words (~50KB text)
- **Generated .docx**: ~20-50KB for typical documents

---

## Security Considerations

### Input Sanitization

- **No HTML rendering**: All text displayed as plain text
- **No eval()**: No dynamic code execution
- **No SQL**: No database queries
- **File validation**: Only .txt and .docx accepted

### Privacy

- **Client-side processing**: Text never leaves browser (except .docx generation)
- **No logging**: No text content logged
- **No analytics**: No tracking of user content
- **Ephemeral API**: Text processed and immediately discarded

### CORS

```typescript
// No CORS headers needed - same-origin requests only
```

### Rate Limiting

**Current**: None (relying on Vercel's built-in protection)
**Future**: Implement rate limiting for API route

---

## Browser Compatibility

### Supported Browsers

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 14+ | Full support |
| Edge | 90+ | Full support |

### Required Features

- ES6+ JavaScript
- FileReader API
- Blob API
- Fetch API
- CSS Grid
- CSS Custom Properties
- CSS `prefers-color-scheme`

### Polyfills

None required for modern browsers.

---

## Accessibility

### WCAG 2.1 Compliance

- **Level AA** target
- Color contrast ratios meet standards
- Keyboard navigation supported
- Screen reader friendly
- Semantic HTML

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Focus textarea | Tab |
| Upload file | Tab to button, Enter |
| Convert | Tab to button, Enter |
| Copy | Tab to button, Enter |

### ARIA Labels

```tsx
<button aria-label="Upload file">
<textarea aria-label="Input text with citations">
<button aria-label="Copy main text to clipboard">
```

---

## Monitoring & Logging

### Current Implementation

- **Console logging**: Development only
- **Error tracking**: Console.error()
- **Performance**: None

### Recommended Additions

1. **Sentry** - Error tracking
2. **Vercel Analytics** - Performance monitoring
3. **LogRocket** - Session replay
4. **Custom logging** - API usage metrics

---

## CI/CD Pipeline

### Current Setup

```
GitHub Push
    ↓
Vercel Webhook
    ↓
Build (next build)
    ↓
Deploy to Production
    ↓
Live at citationfix.vercel.app
```

### Build Process

1. Install dependencies (`npm ci`)
2. TypeScript compilation
3. Next.js build
4. Static optimization
5. Deploy to CDN

### Deployment Time

- **Average**: 1-2 minutes
- **Cache hit**: 30-60 seconds

---

## Database Schema

**Current**: No database

**Future** (if user accounts added):

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP
);

CREATE TABLE conversions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  input_text TEXT,
  created_at TIMESTAMP,
  word_count INTEGER
);

CREATE TABLE templates (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(255),
  format VARCHAR(50), -- 'bluebook', 'oscola', etc.
  created_at TIMESTAMP
);
```

---

## API Rate Limiting (Future)

### Proposed Limits

| Tier | Requests/Hour | Word Limit |
|------|---------------|------------|
| Free | 100 | 10,000 |
| Pro | 1,000 | 50,000 |
| Enterprise | Unlimited | Unlimited |

### Implementation

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 h"),
});

export async function POST(request: NextRequest) {
  const ip = request.ip ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }
  
  // Continue processing...
}
```

---

## Testing Strategy

### Unit Tests (Recommended)

```typescript
// utils/converter.test.ts
describe('processText', () => {
  it('should extract single citation', () => {
    const input = "Text{{fn: Citation}}";
    const result = processText(input);
    expect(result.mainText).toBe("Text¹");
    expect(result.footnotes).toEqual(["Citation"]);
  });
  
  it('should handle malformed markers', () => {
    const input = "Text{{fn: Missing";
    const result = processText(input);
    expect(result.mainText).toBe("Text{{fn: Missing");
    expect(result.footnotes).toEqual([]);
  });
});
```

### Integration Tests (Recommended)

```typescript
// app/api/convert/route.test.ts
describe('POST /api/convert', () => {
  it('should return .docx file', async () => {
    const response = await POST({
      json: () => ({ text: "Test{{fn: Citation}}" })
    });
    
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type'))
      .toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  });
});
```

### E2E Tests (Recommended)

```typescript
// e2e/conversion.spec.ts
test('complete conversion flow', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('textarea', 'Test{{fn: Citation}}');
  await page.click('button:has-text("Convert")');
  await expect(page.locator('.main-text')).toContainText('Test¹');
  await expect(page.locator('.footnotes')).toContainText('1. Citation');
});
```

---

**Document Version**: 2.0
**Last Updated**: November 23, 2025
**Author**: CitationFix Development Team
