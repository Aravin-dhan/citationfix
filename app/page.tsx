'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { validateWordLimit, parseFile } from '@/utils/fileParser';
import { processText } from '@/utils/converter';
import {
  Upload,
  Download,
  FileText,
  Quote,
  AlignLeft,
  Copy,
  Check,
  Settings,
  Sparkles,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Share2,
  Link as LinkIcon,
  Menu,
  X
} from 'lucide-react';

const MAX_WORDS = 20000;
const AI_PROMPT = `When providing citations in your response, format them using {{fn: citation}} markers. For example: "This principle is well established.{{fn: Smith v. Jones, 123 F.3d 456 (2020)}}" - This allows for easy conversion to proper legal footnotes.`;

const SIGNATURE_LINES = [
  "",
  "Warm Regards,",
  "",
  "Aravindhan B,",
  "Student, 4th Year, BA. LLB.",
  "Gujarat National Law University.",
  "Email ID: aravindhan22bal014@gnlu.ac.in",
  "Ph No.: +91 8431520025"
];

export default function Home() {
  // State
  const [inputText, setInputText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedFormatted, setCopiedFormatted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Configuration
  const [useCitations, setUseCitations] = useState(true);
  const [useFormatting, setUseFormatting] = useState(false);
  const [showAiPrompt, setShowAiPrompt] = useState(true);

  // Advanced Settings
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [font, setFont] = useState('Times New Roman');
  const [fontSize, setFontSize] = useState(12);
  const [lineSpacing, setLineSpacing] = useState(1.5);
  const [autoHeadings, setAutoHeadings] = useState(false);

  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile toggle
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false); // Desktop collapse

  // Preview State
  const [showPreview, setShowPreview] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load Shared Doc on Mount
  useEffect(() => {
    const fetchSharedDoc = async () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const docId = params.get('doc');
      if (docId) {
        setIsProcessing(true);
        try {
          const res = await fetch(`/api/share?id=${docId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.text) {
              handleTextChange(data.text);
              // Clean URL without reload
              window.history.replaceState({}, '', '/');
            }
          } else {
             setErrorMessage('Shared document not found or expired.');
          }
        } catch (e) {
          console.error(e);
          setErrorMessage('Failed to load shared document.');
        } finally {
          setIsProcessing(false);
        }
      }
    };
    fetchSharedDoc();
  }, []);

  // Handlers
  const handleTextChange = (text: string) => {
    setInputText(text);
    const validation = validateWordLimit(text, MAX_WORDS);
    setWordCount(validation.wordCount);
    setErrorMessage(validation.message || '');
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      setErrorMessage('');
      const text = await parseFile(file);
      handleTextChange(text);
      setIsSidebarOpen(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to parse file');
    } finally {
      setIsProcessing(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadDocx = async () => {
    if (!useCitations && !useFormatting) {
      setErrorMessage('Please select at least one option (Citations or Formatting)');
      return;
    }
    setIsDownloading(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          formatting: useFormatting,
          convert_citations: useCitations,
          font: isAdvanced ? font : 'Times New Roman',
          font_size: isAdvanced ? fontSize : 12,
          line_spacing: isAdvanced ? lineSpacing : 1.5,
          auto_headings: isAdvanced ? autoHeadings : false
        }),
      });

      if (!response.ok) throw new Error('Failed to generate file');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'CitationFix-Output.docx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setErrorMessage('Failed to download document.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!inputText.trim()) return;
    setIsSharing(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await res.json();
      if (data.id) {
        const url = `${window.location.origin}?doc=${data.id}`;
        setShareUrl(url);
        await navigator.clipboard.writeText(url);
        setErrorMessage('Link copied to clipboard! (Valid for 7 days)');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (e) {
      setErrorMessage('Failed to share document.');
    } finally {
      setIsSharing(false);
    }
  };

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(AI_PROMPT);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyFormatted = async () => {
    try {
      const { mainText, footnotes } = processText(inputText);

      let htmlContent = `
        <!DOCTYPE html><html><head><style>
            body { font-family: '${font}', 'Times New Roman', serif; font-size: ${fontSize}pt; line-height: ${lineSpacing}; color: black; }
            p { margin-bottom: 1em; }
            h1 { font-size: 14pt; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid black; padding-bottom: 4px; margin-top: 24px; margin-bottom: 12px; }
            h2 { font-size: 12pt; font-weight: bold; padding-left: 36pt; border-bottom: 1px solid black; padding-bottom: 4px; margin-top: 18px; margin-bottom: 12px; }
            a { color: blue; text-decoration: underline; }
            .footnote-ref { vertical-align: super; font-size: 0.7em; }
            .signature { margin: 0; line-height: 1.2; }
          </style></head><body>`;

      const lines = mainText.split(/\r?\n/);
      let footnoteIndex = 0;

      for (const line of lines) {
        let textContent = line;
        let tag = 'p';
        let style = '';

        if (line.startsWith('# ')) { tag = 'h1'; textContent = line.substring(2); }
        else if (line.startsWith('## ')) { tag = 'h2'; textContent = line.substring(3); }

        const parts = textContent.split(/([\u2070-\u2079\u00B9\u00B2\u00B3]+)|(\[.*?\]\(.*?\))/g).filter(p => p);
        
        let innerHtml = '';
        for (const part of parts) {
           if (/^[\u2070-\u2079\u00B9\u00B2\u00B3]+$/.test(part)) {
             if (footnoteIndex < footnotes.length) {
               innerHtml += `<sup class="footnote-ref">${footnoteIndex + 1}</sup>`;
               footnoteIndex++;
             }
           } else if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
             const mid = part.indexOf('](');
             const linkText = part.substring(1, mid);
             const linkUrl = part.substring(mid + 2, part.length - 1);
             innerHtml += `<a href="${linkUrl}">${linkText}</a>`;
           } else {
             innerHtml += part;
           }
        }

        if (innerHtml || tag !== 'p') htmlContent += `<${tag} ${style ? `style="${style}"` : ''}>${innerHtml}</${tag}>`;
        else htmlContent += `<p><br/></p>`;
      }

      htmlContent += `<div style="margin-top: 2em;">`;
      SIGNATURE_LINES.forEach(line => htmlContent += `<p class="signature">${line || '&nbsp;'}</p>`);
      htmlContent += `</div>`;

      if (footnotes.length > 0) {
        htmlContent += `<hr style="margin-top: 2em; margin-bottom: 1em; width: 30%; text-align: left;" />`;
        footnotes.forEach((fn, idx) => {
           let fnContent = fn; // Simplified link parsing for footnotes if needed
           htmlContent += `<div style="font-size: 10pt; margin-bottom: 0.5em;"><span style="vertical-align: super; font-size: 0.7em;">${idx + 1}</span> ${fnContent}</div>`;
        });
      }
      htmlContent += `</body></html>`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const textBlob = new Blob([inputText], { type: 'text/plain' });
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': blob, 'text/plain': textBlob })]);
      
      setCopiedFormatted(true);
      setTimeout(() => setCopiedFormatted(false), 2000);
    } catch (error) {
      setErrorMessage('Failed to copy. Browser support limited.');
    }
  };

  return (
    <div className="flex h-screen w-full bg-[var(--app-bg)] overflow-hidden font-sans text-[var(--ink)]">

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[var(--sidebar-bg)] flex items-center justify-between px-4 z-30 shadow-md">
        <span className="text-lg font-bold text-[var(--sidebar-text)] tracking-tight">CitationFix</span>
        <div className="flex gap-2">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white p-2">
            <Menu className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* SIDEBAR */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] 
        flex flex-col flex-shrink-0 z-40 shadow-xl transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
        ${isDesktopSidebarCollapsed ? 'md:w-0 md:border-none' : 'md:w-72'}
      `}>
        {/* Close Button for Mobile */}
        <div className="md:hidden h-14 flex items-center justify-end px-4 border-b border-[var(--sidebar-border)]">
          <button onClick={() => setIsSidebarOpen(false)}><X className="text-white w-5 h-5" /></button>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex h-16 items-center justify-between px-6 border-b border-[var(--sidebar-border)] overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-max">
            <div className="bg-[var(--accent)] p-1.5 rounded-lg shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-[var(--sidebar-text)]">CitationFix</span>
          </div>
          <button onClick={() => setIsDesktopSidebarCollapsed(true)} className="text-slate-400 hover:text-white">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Controls */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar overflow-x-hidden">
          
          {/* Input Section */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--sidebar-text-muted)]">Input</h3>
            <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[var(--sidebar-hover)] hover:bg-[var(--sidebar-border)] text-[var(--sidebar-text)] rounded-lg border border-[var(--sidebar-border)] transition-all group">
               {isProcessing ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Upload className="w-4 h-4 text-slate-400 group-hover:text-white" />}
               <span className="font-medium text-sm">Upload File</span>
            </button>
            <input ref={fileInputRef} type="file" className="hidden" accept=".txt,.docx" onChange={handleFileUpload} />
          </div>

          {/* Configuration */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--sidebar-text-muted)]">Settings</h3>
            {/* Citations Toggle */}
            <label className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--sidebar-hover)]/50 border border-[var(--sidebar-border)] cursor-pointer hover:border-slate-500 transition-colors">
               <div className="flex items-center gap-3">
                 <Quote className={`w-4 h-4 ${useCitations ? 'text-[var(--accent)]' : 'text-slate-500'}`} />
                 <span className="text-sm font-medium text-[var(--sidebar-text)]">Citations</span>
               </div>
               <div className={`w-8 h-4 rounded-full relative transition-colors ${useCitations ? 'bg-[var(--accent)]' : 'bg-slate-700'}`}>
                 <input type="checkbox" className="hidden" checked={useCitations} onChange={(e) => setUseCitations(e.target.checked)} />
                 <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${useCitations ? 'translate-x-4' : 'translate-x-0'}`} />
               </div>
            </label>
            {/* Formatting Toggle */}
            <label className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--sidebar-hover)]/50 border border-[var(--sidebar-border)] cursor-pointer hover:border-slate-500 transition-colors">
               <div className="flex items-center gap-3">
                 <AlignLeft className={`w-4 h-4 ${useFormatting ? 'text-[var(--accent)]' : 'text-slate-500'}`} />
                 <span className="text-sm font-medium text-[var(--sidebar-text)]">Formatting</span>
               </div>
               <div className={`w-8 h-4 rounded-full relative transition-colors ${useFormatting ? 'bg-[var(--accent)]' : 'bg-slate-700'}`}>
                 <input type="checkbox" className="hidden" checked={useFormatting} onChange={(e) => setUseFormatting(e.target.checked)} />
                 <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${useFormatting ? 'translate-x-4' : 'translate-x-0'}`} />
               </div>
            </label>
          </div>

          {/* Advanced */}
          <div className="space-y-2">
             <button onClick={() => setIsAdvanced(!isAdvanced)} className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--sidebar-text-muted)] hover:text-white">
                <span>Advanced</span> <ChevronRight className={`w-3 h-3 transition-transform ${isAdvanced ? 'rotate-90' : ''}`} />
             </button>
             {isAdvanced && (
               <div className="p-3 bg-[var(--sidebar-hover)] rounded-lg border border-[var(--sidebar-border)] space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Font</label>
                    <select value={font} onChange={(e) => setFont(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded p-1.5 outline-none">
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Arial">Arial</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Size: {fontSize}pt</label>
                    <input type="range" min="10" max="14" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                  </div>
               </div>
             )}
          </div>

          {/* AI Helper */}
          <div className="space-y-2">
             <button onClick={() => setShowAiPrompt(!showAiPrompt)} className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--sidebar-text-muted)] hover:text-white">
               <span className="flex items-center gap-1"><Sparkles className="w-3 h-3"/> AI Prompt</span>
             </button>
             {showAiPrompt && (
                <div className="p-2 bg-[var(--sidebar-hover)] rounded-lg border border-[var(--sidebar-border)] relative group">
                   <p className="text-[10px] text-slate-400 font-mono line-clamp-3">{AI_PROMPT}</p>
                   <button onClick={copyPrompt} className="absolute top-1 right-1 p-1 bg-slate-800 hover:bg-[var(--accent)] text-slate-300 rounded">
                      {copiedPrompt ? <Check className="w-3 h-3"/> : <Copy className="w-3 h-3"/>}
                   </button>
                </div>
             )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] space-y-2">
          <button onClick={() => { setShowPreview(true); setIsSidebarOpen(false); }} disabled={!inputText.trim()} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium text-sm border border-slate-700 flex items-center justify-center gap-2 transition-all disabled:opacity-50">
            <FileText className="w-4 h-4" /> Preview
          </button>
          
          <div className="flex gap-2">
             <button onClick={handleDownloadDocx} disabled={!inputText.trim() || isDownloading} className="flex-1 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg font-medium text-sm shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95">
               {isDownloading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
               Download
             </button>
             <button onClick={handleCopyFormatted} disabled={!inputText.trim()} className="flex-none w-12 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium shadow-lg flex items-center justify-center transition-all disabled:opacity-50 active:scale-95" title="Copy Formatted Text">
               {copiedFormatted ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
             </button>
          </div>

          {/* Share Button */}
          <button onClick={handleShare} disabled={!inputText.trim() || isSharing} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-medium text-sm border border-slate-700 flex items-center justify-center gap-2 transition-all disabled:opacity-50">
             {isSharing ? <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Share2 className="w-4 h-4" />}
             Share Document
          </button>
        </div>
      </aside>

      {/* Expand Button (Desktop) */}
      {isDesktopSidebarCollapsed && (
        <button onClick={() => setIsDesktopSidebarCollapsed(false)} className="hidden md:flex absolute top-4 left-4 z-50 p-2 bg-slate-800 text-white rounded-lg shadow-lg hover:bg-slate-700 transition-colors">
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Mobile Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col relative min-w-0 pt-14 md:pt-0">
        <div className="h-10 border-b border-slate-200 bg-white flex items-center justify-between px-6 text-[10px] md:text-xs font-medium text-slate-500">
           <div className="flex items-center gap-4">
             <span>{wordCount.toLocaleString()} words</span>
             {shareUrl && <span className="text-green-600 flex items-center gap-1"><LinkIcon className="w-3 h-3"/> Shared</span>}
           </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[var(--app-bg)] p-4 md:p-8 flex justify-center custom-scrollbar">
           {errorMessage && <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-top-5"><AlertCircle className="w-4 h-4"/>{errorMessage}</div>}
           
           <div className="w-full max-w-[816px] min-h-[1056px] bg-[var(--paper-bg)] paper-shadow rounded-sm flex flex-col relative transition-all duration-300 ring-1 ring-black/5">
             <textarea
               ref={textareaRef}
               value={inputText}
               onChange={(e) => handleTextChange(e.target.value)}
               placeholder="Paste your legal document here..."
               className="w-full h-full bg-transparent border-none resize-none focus:ring-0 text-[var(--ink)] placeholder-slate-300 text-base md:text-lg leading-loose font-serif outline-none p-8 md:p-12"
               spellCheck={false}
               style={{ fontFamily: isAdvanced ? font : 'Times New Roman', fontSize: isAdvanced ? `${fontSize}pt` : undefined }}
             />
           </div>
        </div>
      </main>

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-slate-900/5">
            <div className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">Preview</h3>
              <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-slate-600 font-medium text-sm">Close</button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100 custom-scrollbar flex justify-center">
              <div className="bg-white shadow-xl w-full max-w-[816px] min-h-[1000px] p-12 text-black relative" style={{ fontFamily: isAdvanced ? font : 'Times New Roman' }}>
                {(() => {
                  const { mainText, footnotes } = processText(inputText);
                  let footnoteIndex = 0;
                  const lines = mainText.split(/\r?\n/);
                  
                  return (
                    <>
                      {lines.map((line, i) => {
                        let textContent = line;
                        let className = "mb-4";
                        let style: React.CSSProperties = {};
                        
                        if (line.startsWith('# ')) {
                            textContent = line.substring(2);
                            style = { textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginTop: '24px' };
                        } else if (line.startsWith('## ')) {
                            textContent = line.substring(3);
                            style = { fontWeight: 'bold', paddingLeft: '36pt', borderBottom: '1px solid black', paddingBottom: '4px', marginTop: '18px' };
                        }

                        const parts = textContent.split(/([\u2070-\u2079\u00B9\u00B2\u00B3]+)|(\[.*?\]\(.*?\))/g).filter(p => p !== undefined && p !== '');
                        
                        return (
                          <div key={i} className={className} style={style}>
                             {parts.length === 0 ? <br/> : parts.map((part, pIdx) => {
                                if (/^[\u2070-\u2079\u00B9\u00B2\u00B3]+$/.test(part)) {
                                  if (footnoteIndex < footnotes.length) {
                                     footnoteIndex++;
                                     return <sup key={pIdx} className="text-[0.7em] align-super text-blue-600 font-bold">{footnoteIndex}</sup>;
                                  }
                                } else if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
                                   const mid = part.indexOf('](');
                                   const linkText = part.substring(1, mid);
                                   const linkUrl = part.substring(mid + 2, part.length - 1);
                                   return <a key={pIdx} href={linkUrl} className="text-blue-600 underline">{linkText}</a>;
                                }
                                return <span key={pIdx}>{part}</span>;
                             })}
                          </div>
                        );
                      })}
                      
                      <div className="mt-8">
                         {SIGNATURE_LINES.map((line, idx) => <p key={`sig-${idx}`} className="m-0 leading-tight">{line || '\u00A0'}</p>)}
                      </div>

                      {footnotes.length > 0 && (
                        <div className="mt-8 pt-4 border-t border-slate-300 text-sm">
                          {footnotes.map((fn, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                              <span className="font-bold">{idx + 1}.</span>
                              <span>{fn}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
