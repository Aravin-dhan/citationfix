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
  AlignCenter,
  AlignRight,
  AlignJustify,
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
  X,
  Type,
  Clock,
  Layout,
  Minimize2,
  Bold,
  Italic,
  Underline
} from 'lucide-react';

const MAX_WORDS = 20000;
const AI_PROMPT = `When providing citations in your response, format them using {{fn: citation}} markers. For example: "This principle is well established.{{fn: Smith v. Jones, 123 F.3d 456 (2020)}}" - This allows for easy conversion to proper legal footnotes.`;

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

  // Editor State
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [dateTime, setDateTime] = useState('');

  // Configuration
  const [useCitations, setUseCitations] = useState(true);
  const [useFormatting, setUseFormatting] = useState(false);
  const [showAiPrompt, setShowAiPrompt] = useState(true);

  // Advanced Settings
  const [isAdvanced, setIsAdvanced] = useState(true); // Default to open for visibility
  const [font, setFont] = useState('Times New Roman');
  const [fontSize, setFontSize] = useState(12);
  const [lineSpacing, setLineSpacing] = useState(1.5);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [autoHeadings, setAutoHeadings] = useState(false);

  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  // Preview State
  const [showPreview, setShowPreview] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Effects
  useEffect(() => {
    // Clock
    const timer = setInterval(() => {
       const now = new Date();
       setDateTime(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
    }, 1000);

    // Shared Doc Load
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
              window.history.replaceState({}, '', '/');
            }
          }
        } catch (e) {
          setErrorMessage('Failed to load shared document.');
        } finally {
          setIsProcessing(false);
        }
      }
    };
    fetchSharedDoc();

    // Escape Key for Preview
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setShowPreview(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
        clearInterval(timer);
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handlers
  const handleTextChange = (text: string) => {
    setInputText(text);
    const validation = validateWordLimit(text, MAX_WORDS);
    setWordCount(validation.wordCount);
    setErrorMessage(validation.message || '');
  };

  const handleCursor = (e: any) => {
    const val = e.target.value;
    const sel = e.target.selectionStart;
    const lines = val.substring(0, sel).split("\n");
    setCursorPos({ line: lines.length, col: lines[lines.length-1].length + 1 });
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

  const insertFormat = (type: 'bold' | 'italic' | 'underline') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selection = text.substring(start, end);
    
    let prefix = '';
    let suffix = '';
    
    if (type === 'bold') { prefix = '**'; suffix = '**'; }
    if (type === 'italic') { prefix = '*'; suffix = '*'; }
    if (type === 'underline') { prefix = '<u>'; suffix = '</u>'; }

    const newText = text.substring(0, start) + prefix + selection + suffix + text.substring(end);
    handleTextChange(newText);
    
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleDownloadDocx = async () => {
    if (!useCitations && !useFormatting) {
      setErrorMessage('Select Citations or Formatting to download.');
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
          font,
          font_size: fontSize,
          line_spacing: lineSpacing,
          alignment,
          auto_headings: autoHeadings
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
        setErrorMessage('Link copied! (Valid 7 days)');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (e) {
      setErrorMessage('Failed to share.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyFormatted = async () => {
    try {
      const { mainText, footnotes } = processText(inputText);

      let htmlContent = `
        <!DOCTYPE html><html><head><style>
            body { font-family: '${font}', 'Times New Roman', serif; font-size: ${fontSize}pt; line-height: ${lineSpacing}; color: black; text-align: ${alignment}; }
            p { margin-bottom: 1em; }
            h1 { font-size: 14pt; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid black; padding-bottom: 4px; margin-top: 24px; margin-bottom: 12px; text-align: left; }
            h2 { font-size: 12pt; font-weight: bold; padding-left: 36pt; border-bottom: 1px solid black; padding-bottom: 4px; margin-top: 18px; margin-bottom: 12px; text-align: left; }
            a { color: blue; text-decoration: underline; }
            .footnote-ref { vertical-align: super; font-size: 0.7em; }
          </style></head><body>`;

      const lines = mainText.split(/\r?\n/);
      let footnoteIndex = 0;

      for (const line of lines) {
        let textContent = line;
        let tag = 'p';
        let style = '';

        if (line.startsWith('# ')) {
          tag = 'h1'; textContent = line.substring(2);
        } else if (line.startsWith('## ')) {
          tag = 'h2'; textContent = line.substring(3);
        }

        const regex = /(\*\*.*?\*\*)|(\*.*?\*)|(<u>.*?<\/u>)|([\u2070-\u2079\u00B9\u00B2\u00B3]+)|(\[.*?\]\(.*?\))/g;
        const parts = textContent.split(regex).filter(p => p !== undefined && p !== '');
        
        let innerHtml = '';
        for (const part of parts) {
           if (part.startsWith('**') && part.endsWith('**')) {
               innerHtml += `<b>${part.substring(2, part.length-2)}</b>`;
           } else if (part.startsWith('*') && part.endsWith('*')) {
               innerHtml += `<i>${part.substring(1, part.length-1)}</i>`;
           } else if (part.startsWith('<u>') && part.endsWith('</u>')) {
               innerHtml += `<u>${part.substring(3, part.length-4)}</u>`;
           } else if (/^[\u2070-\u2079\u00B9\u00B2\u00B3]+$/.test(part)) {
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

      if (footnotes.length > 0) {
        htmlContent += `<hr style="margin-top: 2em; margin-bottom: 1em; width: 30%; text-align: left;" />`;
        footnotes.forEach((fn, idx) => {
           htmlContent += `<div style="font-size: 10pt; margin-bottom: 0.5em; text-align: left;"><span style="vertical-align: super; font-size: 0.7em;">${idx + 1}</span> ${fn}</div>`;
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

  const getPageCount = () => Math.max(1, Math.ceil(wordCount / 500));

  return (
    <div className="flex h-screen w-full bg-[#f8f9fa] overflow-hidden font-sans text-slate-800">
      <header className="fixed top-0 left-0 right-0 h-10 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4 shadow-sm select-none">
         <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
               <FileText className="w-3.5 h-3.5 text-[var(--accent)]" /> 
               CitationFix
            </div>
            <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
            <span>{wordCount.toLocaleString()} words</span>
            <span className="hidden sm:inline">| {getPageCount()} pages</span>
            <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>
            <span className="hidden sm:inline">Ln {cursorPos.line}, Col {cursorPos.col}</span>
         </div>
         <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <span className="hidden md:flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
               <Type className="w-3 h-3" /> {font}, {fontSize}pt
            </span>
            <span className="hidden md:flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
               <Layout className="w-3 h-3" /> A4 Normal
            </span>
            <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
            <span className="flex items-center gap-1.5 text-slate-600">
               <Clock className="w-3 h-3" /> {dateTime}
            </span>
         </div>
      </header>

      <aside className={`
        fixed md:relative top-10 bottom-0 left-0 bg-[#0f172a] text-slate-300 z-40 shadow-xl transition-all duration-300 ease-in-out flex flex-col border-r border-slate-800
        ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
        ${isDesktopCollapsed ? 'md:w-16' : 'md:w-72'}
      `}>
         
         <div className="hidden md:flex h-10 items-center justify-end px-4 border-b border-slate-800 bg-slate-900/50">
             <button onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors">{isDesktopCollapsed ? <ChevronRight className="w-4 h-4"/> : <ChevronLeft className="w-4 h-4"/>}</button>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
           
           {isDesktopCollapsed ? (
             <div className="flex flex-col items-center py-4 gap-6">
                <button onClick={() => setIsDesktopCollapsed(false)} className="p-2 hover:bg-slate-800 rounded-lg group relative"><Upload className="w-5 h-5 text-slate-400 group-hover:text-white"/><span className="absolute left-full ml-2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50">Upload</span></button>
                <button onClick={() => setIsDesktopCollapsed(false)} className="p-2 hover:bg-slate-800 rounded-lg group relative"><Settings className="w-5 h-5 text-slate-400 group-hover:text-white"/><span className="absolute left-full ml-2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50">Settings</span></button>
             </div>
           ) : (
             <div className="p-5 space-y-6 animate-in fade-in duration-200">
               
               <div className="space-y-2">
                 <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Processing</h3>
                 <div className="flex flex-col gap-2">
                    <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 border border-slate-700 cursor-pointer hover:border-slate-600">
                       <span className="text-sm font-medium flex items-center gap-2"><Quote className="w-3.5 h-3.5 text-blue-400"/> Citations</span>
                       <input type="checkbox" checked={useCitations} onChange={(e) => setUseCitations(e.target.checked)} className="accent-blue-500 w-4 h-4"/>
                    </label>
                    <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 border border-slate-700 cursor-pointer hover:border-slate-600">
                       <span className="text-sm font-medium flex items-center gap-2"><AlignLeft className="w-3.5 h-3.5 text-blue-400"/> Formatting</span>
                       <input type="checkbox" checked={useFormatting} onChange={(e) => setUseFormatting(e.target.checked)} className="accent-blue-500 w-4 h-4"/>
                    </label>
                 </div>
               </div>
               <div className="space-y-2">
                 <button onClick={() => setIsAdvanced(!isAdvanced)} className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-white"><span>Typography</span> <ChevronRight className={`w-3 h-3 transition-transform ${isAdvanced ? 'rotate-90' : ''}`} /></button>
                 {isAdvanced && (
                   <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 space-y-3">
                      <div><label className="text-[10px] text-slate-400 block mb-1">Font Family</label><select value={font} onChange={(e) => setFont(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded p-1.5 outline-none focus:border-blue-500"><option value="Times New Roman">Times New Roman</option><option value="Garamond">Garamond</option><option value="Arial">Arial</option><option value="Calibri">Calibri</option></select></div>
                      <div className="flex gap-2"><div className="flex-1"><label className="text-[10px] text-slate-400 block mb-1">Size: {fontSize}pt</label><input type="number" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded p-1.5 outline-none"/></div><div className="flex-1"><label className="text-[10px] text-slate-400 block mb-1">Spacing</label><select value={lineSpacing} onChange={(e) => setLineSpacing(parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded p-1.5 outline-none"><option value="1.0">1.0</option><option value="1.15">1.15</option><option value="1.5">1.5</option><option value="2.0">2.0</option></select></div></div>
                      <div><label className="text-[10px] text-slate-400 block mb-1">Alignment</label><div className="flex bg-slate-900 rounded border border-slate-700 p-1 gap-1">{['left', 'center', 'right', 'justify'].map((align) => (<button key={align} onClick={() => setAlignment(align as any)} className={`flex-1 p-1 rounded flex justify-center ${alignment === align ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-300'}`}>{align === 'left' && <AlignLeft className="w-3.5 h-3.5"/>}{align === 'center' && <AlignCenter className="w-3.5 h-3.5"/>}{align === 'right' && <AlignRight className="w-3.5 h-3.5"/>}{align === 'justify' && <AlignJustify className="w-3.5 h-3.5"/>}</button>))}</div></div>
                   </div>
                 )}
               </div>
               <div className="space-y-2"><div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50"><div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Sparkles className="w-3 h-3"/> AI Prompt</span><button onClick={() => setShowAiPrompt(!showAiPrompt)} className="text-slate-500 hover:text-white"><Minimize2 className="w-3 h-3"/></button></div>{showAiPrompt && (<div className="relative group mt-2"><p className="text-[10px] text-slate-400 font-mono leading-relaxed opacity-70 hover:opacity-100 transition-opacity">{AI_PROMPT.substring(0, 100)}...</p><button onClick={() => {navigator.clipboard.writeText(AI_PROMPT); setCopiedPrompt(true); setTimeout(()=>setCopiedPrompt(false),2000)}} className="absolute -top-1 -right-1 p-1 bg-slate-700 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">{copiedPrompt ? <Check className="w-3 h-3"/> : <Copy className="w-3 h-3"/>}</button></div>)}</div></div>
             </div>
           )}
         </div>

         <div className={`p-4 border-t border-slate-800 bg-[#0f172a] space-y-2 ${isDesktopCollapsed ? 'hidden' : 'block'}`}>
            <button onClick={() => { setShowPreview(true); setIsSidebarOpen(false); }} disabled={!inputText.trim()} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium text-sm border border-slate-700 flex items-center justify-center gap-2 transition-all disabled:opacity-50"><FileText className="w-4 h-4" /> Preview</button>
            <div className="flex gap-2"><button onClick={handleDownloadDocx} disabled={!inputText.trim() || isDownloading} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95">{isDownloading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4" />} Download</button><button onClick={handleCopyFormatted} disabled={!inputText.trim()} className="w-12 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium shadow-lg flex items-center justify-center transition-all disabled:opacity-50 active:scale-95 relative group">{copiedFormatted ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}<span className="absolute bottom-full mb-2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">Copy Formatted</span></button></div>
            <button onClick={handleShare} disabled={!inputText.trim() || isSharing} className="w-full py-2 text-slate-400 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors">{isSharing ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Share2 className="w-3.5 h-3.5" />} Share via Link</button>
         </div>
      </aside>
      
      <div className="md:hidden fixed top-0 left-0 right-0 h-10 bg-[#0f172a] flex items-center justify-between px-4 z-30 shadow-md"><span className="text-sm font-bold text-white">CitationFix</span><button onClick={() => setIsSidebarOpen(!isSidebarOpen)}><Menu className="w-5 h-5 text-white"/></button></div>
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />} 

      <main className="flex-1 flex flex-col relative min-w-0 pt-10 md:pt-10 bg-[#e2e8f0]">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center custom-scrollbar">
           {errorMessage && <div className="absolute top-14 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-top-5"><AlertCircle className="w-4 h-4"/>{errorMessage}</div>}
           
           <div className="w-full max-w-[816px] min-h-[1056px] bg-white shadow-2xl shadow-slate-300/50 flex flex-col relative transition-all duration-300">
             {/* EDIT TOOLBAR */}
             <div className="absolute top-4 right-8 flex gap-1 z-10 bg-slate-50 border border-slate-200 rounded-lg p-1 shadow-sm opacity-50 hover:opacity-100 transition-opacity">
                <button onClick={() => insertFormat('bold')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Bold (**)"><Bold className="w-3.5 h-3.5"/></button>
                <button onClick={() => insertFormat('italic')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Italic (*)"><Italic className="w-3.5 h-3.5"/></button>
                <button onClick={() => insertFormat('underline')} className="p-1.5 hover:bg-slate-200 rounded text-slate-600" title="Underline"><Underline className="w-3.5 h-3.5"/></button>
             </div>
             <textarea
               ref={textareaRef}
               value={inputText}
               onChange={(e) => handleTextChange(e.target.value)}
               onKeyUp={handleCursor}
               onClick={handleCursor}
               placeholder="Paste your legal document here..."
               className="w-full h-full bg-transparent border-none resize-none focus:ring-0 text-slate-900 placeholder-slate-300 text-base leading-loose outline-none p-12 selection:bg-blue-100 selection:text-blue-900"
               spellCheck={false}
               style={{ fontFamily: font, fontSize: `${fontSize}pt`, lineHeight: lineSpacing, textAlign: alignment }}
             />
           </div>
        </div>
      </main>

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-slate-900/5">
            <div className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">Print Preview (Esc to close)</h3>
              <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-slate-600 font-medium text-sm">Close</button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100 custom-scrollbar flex justify-center">
              <div className="bg-white shadow-xl w-full max-w-[816px] min-h-[1000px] p-12 text-black relative" 
                   style={{ fontFamily: font, lineHeight: lineSpacing, textAlign: alignment }}>
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
                            style = { textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginTop: '24px', textAlign: 'left' };
                        } else if (line.startsWith('## ')) {
                            textContent = line.substring(3);
                            style = { fontWeight: 'bold', paddingLeft: '36pt', borderBottom: '1px solid black', paddingBottom: '4px', marginTop: '18px', textAlign: 'left' };
                        }

                        const regex = /(\*\*.*?\*\*)|(\*.*?\*)|(<u>.*?<\/u>)|([\u2070-\u2079\u00B9\u00B2\u00B3]+)|(\[.*?\]\(.*?\))/g;
                        const parts = textContent.split(regex).filter(p => p !== undefined && p !== '');
                        
                        return (
                          <div key={i} className={className} style={style}>
                             {parts.length === 0 ? <br/> : parts.map((part, pIdx) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                   return <b key={pIdx}>{part.substring(2, part.length-2)}</b>;
                                } else if (part.startsWith('*') && part.endsWith('*')) {
                                   return <i key={pIdx}>{part.substring(1, part.length-1)}</i>;
                                } else if (part.startsWith('<u>') && part.endsWith('</u>')) {
                                   return <u key={pIdx}>{part.substring(3, part.length-4)}</u>;
                                } else if (/^[\u2070-\u2079\u00B9\u00B2\u00B3]+$/.test(part)) {
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
                      
                      {footnotes.length > 0 && (
                        <div className="mt-8 pt-4 border-t border-slate-300 text-sm text-left">
                          {footnotes.map((fn, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                              <span className="font-bold">{idx + 1}.</span>
                              <span>{fn}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Footer Mockup */}
                      <div className="absolute bottom-8 left-0 right-0 text-center text-xs text-slate-400">
                         Page 1 of 1
                      </div>
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
