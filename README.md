# CitationFix

A professional web application for converting inline citations to formatted footnotes. Perfect for law students, researchers, and academics.

## Features

- **AI Prompt Integration**: Copy-paste prompt guide for ChatGPT/Claude to generate properly formatted citations
- **Instant Conversion**: Convert `{{fn: citation}}` markers to superscript footnotes
- **Copy to Clipboard**: One-click copying of clean text and footnotes
- **Privacy-First**: All processing happens client-side in your browser
- **Professional Design**: Clean, legal-themed interface

## How It Works

1. **Get AI-formatted citations**: Use the provided prompt with ChatGPT/Claude
2. **Paste your text**: Include `{{fn: citation}}` markers where you want footnotes
3. **Convert**: Click the button to process
4. **Copy to Word**: Get clean main text and numbered footnotes

## Example

**Input:**
```
This is a legal argument.{{fn: Smith v. Jones, 123 F.3d 456 (2020)}} The court held...
```

**Output:**
- Main Text: `This is a legal argument.¹ The court held...`
- Footnotes: `1. Smith v. Jones, 123 F.3d 456 (2020)`

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Deployment**: Vercel

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Visit `http://localhost:3000` to see the application.

## Privacy

CitationFix processes all text client-side. No data is stored, logged, or transmitted to any server.

## License

MIT

## Author

Built for the legal and academic community.
