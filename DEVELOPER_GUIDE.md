# CitationFix - Developer Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Core Features](#core-features)
6. [API Documentation](#api-documentation)
7. [Development Setup](#development-setup)
8. [Deployment](#deployment)
9. [Testing](#testing)
10. [Future Enhancements](#future-enhancements)

---

## Project Overview

**CitationFix** is a web application that converts inline citations (formatted as `{{fn: citation}}`) into clean text with numbered footnotes. It's designed for law students, researchers, and academics who need to format citations for legal and academic documents.

### Key Features
- AI prompt guide for ChatGPT/Claude integration
- File upload support (.txt and .docx)
- 10,000 word limit with live validation
- Client-side text processing
- .docx export with professional formatting
- Dark mode support
- Professional legal theme (navy/burgundy colors)

### Live Site
- **Production**: https://citationfix.vercel.app
- **Repository**: https://github.com/Aravin-dhan/citationfix

---

## Architecture

### Client-Side Processing
- Text parsing happens in the browser using `utils/converter.ts`
- File parsing uses `mammoth` library for .docx files
- No data is sent to server except for .docx generation

### Server-Side Processing
- API route `/api/convert` generates .docx files
- Uses `docx` npm package for Word document creation
- Ephemeral processing (no data storage)

### Design Philosophy
- **Privacy-first**: All text processing happens client-side
- **Professional**: Legal-themed design with serif fonts
- **Accessible**: Responsive design, dark mode support
- **Robust**: Comprehensive error handling and validation

---

## Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js | 16.0.3 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS | ^4 |
| Runtime | Node.js | ^20 |
| Package Manager | npm | Latest |

### Key Dependencies

```json
{
  "dependencies": {
    "next": "16.0.3",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "docx": "^8.x",
    "mammoth": "^1.x"
  }
}
```

---

## Project Structure

```
citationfix/
├── app/
│   ├── api/
│   │   └── convert/
│   │       └── route.ts          # .docx generation API
│   ├── privacy/
│   │   └── page.tsx              # Privacy policy page
│   ├── globals.css               # Global styles & design tokens
│   ├── layout.tsx                # Root layout with SEO metadata
│   └── page.tsx                  # Main application page
├── utils/
│   ├── converter.ts              # Text parsing & conversion logic
│   ├── fileParser.ts             # File upload & word counting
│   └── docxGenerator.ts          # .docx generation utilities
├── public/                       # Static assets
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── README.md
```

---

## Core Features

### 1. Text Conversion (`utils/converter.ts`)

**Purpose**: Parse text with `{{fn: ...}}` markers and extract citations.

**Key Functions**:

```typescript
// Main conversion function
export function processText(input: string): ConversionResult {
  // Returns: { mainText: string, footnotes: string[] }
}

// Format footnotes as numbered list
export function formatFootnotes(footnotes: string[]): string {
  // Returns: "1. Citation\n2. Citation..."
}
```

**Algorithm**:
1. Iterate through input text character by character
2. Find `{{fn:` markers
3. Extract text between `{{fn:` and `}}`
4. Replace markers with Unicode superscript numbers (¹, ², ³)
5. Store citations in order
6. Return clean text and footnote array

**Edge Cases Handled**:
- Empty input
- Malformed markers (missing closing `}}`)
- Empty citations
- Nested braces
- Special characters

### 2. File Upload (`utils/fileParser.ts`)

**Purpose**: Parse uploaded .txt and .docx files.

**Key Functions**:

```typescript
// Parse any supported file type
export async function parseFile(file: File): Promise<string>

// Count words in text
export function countWords(text: string): number

// Validate against word limit
export function validateWordLimit(text: string, maxWords: number): ValidationResult
```

**Supported Formats**:
- `.txt` - Plain text files (using FileReader)
- `.docx` - Microsoft Word documents (using mammoth library)

**Word Counting**:
- Splits text by whitespace: `/\s+/`
- Trims extra spaces
- Returns accurate word count

### 3. .docx Export (`app/api/convert/route.ts`)

**Purpose**: Generate professionally formatted Word documents.

**API Endpoint**: `POST /api/convert`

**Request Body**:
```json
{
  "text": "Your text with {{fn: citations}}"
}
```

**Response**: Binary .docx file

**Document Formatting**:
- Font: Times New Roman
- Main text: 12pt (size: 24)
- Footnotes: 10pt (size: 20)
- Margins: 1 inch all sides (1440 twips)
- Line spacing: 1.5 (360)
- Paragraph spacing: 200 after

**Error Handling**:
- Input validation (empty, invalid JSON)
- Word limit check (10,000 words max)
- Buffer validation
- Detailed error responses

### 4. Dark Mode (`app/globals.css`)

**CSS Variables**:

```css
/* Light Mode */
--primary: #1e3a5f;        /* Navy */
--accent: #8b2635;         /* Burgundy */
--surface: #ffffff;
--text-muted: #666666;

/* Dark Mode */
--primary: #4a7bb8;        /* Lighter navy */
--accent: #d66b7a;         /* Lighter burgundy */
--surface: #1a1a1a;
--text-muted: #b0b0b0;     /* Better contrast */
```

**Design Tokens**:
- Professional legal color scheme
- Serif headings (Crimson Text)
- Sans-serif body (Inter)
- Proper contrast ratios for accessibility

---

## API Documentation

### POST /api/convert

Generate a .docx file from text with citations.

**Request**:
```typescript
POST /api/convert
Content-Type: application/json

{
  "text": string  // Text with {{fn: citation}} markers
}
```

**Success Response** (200):
```
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="CitationFix-Output.docx"

[Binary .docx file]
```

**Error Responses**:

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid request | Missing or invalid text field |
| 400 | Word limit exceeded | Text exceeds 10,000 words |
| 400 | No valid text | Empty text after processing |
| 500 | Generation failed | Server error during .docx creation |

**Error Response Format**:
```json
{
  "error": "Error message",
  "details": "Detailed error description",
  "timestamp": "2025-11-23T22:00:00.000Z"
}
```

### GET /api/convert

**Response** (405):
```json
{
  "error": "Method not allowed. Use POST to convert text."
}
```

---

## Development Setup

### Prerequisites
- Node.js 20+ 
- npm or yarn
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/Aravin-dhan/citationfix.git
cd citationfix

# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
# Navigate to http://localhost:3000
```

### Environment Variables

No environment variables required for basic functionality.

### Development Commands

```bash
# Development server (with hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

---

## Deployment

### Vercel (Recommended)

**Automatic Deployment**:
1. Push code to GitHub
2. Vercel auto-detects changes
3. Builds and deploys automatically
4. Live at https://citationfix.vercel.app

**Manual Deployment**:
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Configuration**:
- Framework: Next.js (auto-detected)
- Build Command: `next build`
- Output Directory: `.next`
- Install Command: `npm install`

### Other Platforms

**Netlify**:
```bash
# Build command
npm run build

# Publish directory
.next
```

**Docker**:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Testing

### Manual Testing Checklist

**Text Conversion**:
- [ ] Paste text with citations
- [ ] Verify superscript numbers appear
- [ ] Check footnote list accuracy
- [ ] Test copy-to-clipboard

**File Upload**:
- [ ] Upload .txt file
- [ ] Upload .docx file
- [ ] Test word count updates
- [ ] Verify 10,000 word limit

**.docx Download**:
- [ ] Click download button
- [ ] Verify file downloads
- [ ] Open in Microsoft Word
- [ ] Check formatting (font, margins, spacing)
- [ ] Verify footnotes section

**Dark Mode**:
- [ ] Switch OS to dark mode
- [ ] Check text readability
- [ ] Verify border visibility
- [ ] Test all interactive elements

**Error Handling**:
- [ ] Empty input
- [ ] Malformed citations
- [ ] Over word limit
- [ ] Network errors
- [ ] Invalid file formats

### Test Cases

**Example 1: Basic Conversion**
```
Input: "This is text.{{fn: Smith v. Jones, 123 F.3d 456 (2020)}}"
Expected Output: "This is text.¹"
Expected Footnotes: ["Smith v. Jones, 123 F.3d 456 (2020)"]
```

**Example 2: Multiple Citations**
```
Input: "First.{{fn: Citation 1}} Second.{{fn: Citation 2}}"
Expected Output: "First.¹ Second.²"
Expected Footnotes: ["Citation 1", "Citation 2"]
```

**Example 3: Malformed Marker**
```
Input: "Text{{fn: Missing closing"
Expected Output: "Text{{fn: Missing closing"
Expected Footnotes: []
```

---

## Future Enhancements

### Planned Features

1. **Citation Format Support**
   - Bluebook mode
   - OSCOLA mode
   - Chicago/MLA modes
   - Custom format templates

2. **Real Word Footnotes**
   - Use `FootnoteReferenceRun` from docx package
   - Insert actual Word footnotes (not just numbered lists)
   - Preserve footnote formatting in Word

3. **Enhanced File Support**
   - PDF upload
   - RTF format
   - Preserve original formatting
   - Support for images and tables

4. **User Accounts**
   - Save conversion history
   - Custom citation templates
   - Usage analytics
   - Premium features

5. **Word Add-in**
   - Direct integration with Microsoft Word
   - Convert citations without leaving Word
   - Real-time citation validation

6. **Batch Processing**
   - Upload multiple files
   - Bulk conversion
   - ZIP download

### Technical Debt

- Add unit tests (Jest + React Testing Library)
- Add E2E tests (Playwright)
- Implement proper logging
- Add performance monitoring
- Optimize bundle size
- Add rate limiting to API

---

## Code Style Guide

### TypeScript
- Use strict mode
- Prefer `const` over `let`
- Use interfaces for object shapes
- Add JSDoc comments for public functions

### React
- Use functional components
- Use hooks (useState, useEffect, etc.)
- Keep components focused and small
- Extract reusable logic into custom hooks

### Naming Conventions
- Components: PascalCase (`FileUpload.tsx`)
- Functions: camelCase (`processText()`)
- Constants: UPPER_SNAKE_CASE (`MAX_WORDS`)
- CSS classes: kebab-case or Tailwind utilities

### File Organization
- One component per file
- Group related utilities in `/utils`
- Keep API routes in `/app/api`
- Co-locate tests with source files

---

## Troubleshooting

### Common Issues

**Issue**: .docx file won't download
- **Solution**: Check browser console for errors, verify API route is running, check network tab

**Issue**: Word count not updating
- **Solution**: Verify `handleTextChange` is called on textarea change, check React state updates

**Issue**: Dark mode colors not working
- **Solution**: Check CSS variable definitions, verify `prefers-color-scheme` media query

**Issue**: File upload fails
- **Solution**: Check file size, verify file format, check console for parsing errors

**Issue**: Build fails on Vercel
- **Solution**: Check TypeScript errors, verify all dependencies in package.json, check build logs

---

## Contributing

### Pull Request Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit with descriptive messages
6. Push to your fork
7. Open a Pull Request

### Code Review Checklist
- [ ] Code follows style guide
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Documentation updated
- [ ] Responsive design tested
- [ ] Dark mode tested
- [ ] Accessibility checked

---

## License

MIT License - See LICENSE file for details

---

## Contact & Support

- **Repository**: https://github.com/Aravin-dhan/citationfix
- **Issues**: https://github.com/Aravin-dhan/citationfix/issues
- **Live Site**: https://citationfix.vercel.app

---

## Changelog

### v2.0.0 (2025-11-23)
- Added file upload support (.txt, .docx)
- Added 10,000 word limit with validation
- Added .docx export with professional formatting
- Improved dark mode colors
- Added comprehensive error handling
- Added retry logic for network errors

### v1.0.0 (2025-11-23)
- Initial release
- Basic text conversion
- Copy-to-clipboard functionality
- AI prompt guide
- Privacy page
- Professional legal theme
- Dark mode support

---

**Last Updated**: November 23, 2025
**Maintained By**: CitationFix Team
