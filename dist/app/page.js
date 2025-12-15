"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const fileParser_1 = require("@/utils/fileParser");
const fileParser_2 = require("@/utils/fileParser");
const lucide_react_1 = require("lucide-react");
const MAX_WORDS = 20000;
const AI_PROMPT = `When providing citations in your response, format them using {{fn: citation}} markers. For example: "This principle is well established.{{fn: Smith v. Jones, 123 F.3d 456 (2020)}}" - This allows for easy conversion to proper legal footnotes.`;
function Home() {
    // State
    const [inputText, setInputText] = (0, react_1.useState)('');
    const [wordCount, setWordCount] = (0, react_1.useState)(0);
    const [errorMessage, setErrorMessage] = (0, react_1.useState)('');
    const [copiedPrompt, setCopiedPrompt] = (0, react_1.useState)(false);
    const [isDownloading, setIsDownloading] = (0, react_1.useState)(false);
    const [isProcessing, setIsProcessing] = (0, react_1.useState)(false);
    // Configuration
    const [useCitations, setUseCitations] = (0, react_1.useState)(true);
    const [useFormatting, setUseFormatting] = (0, react_1.useState)(false);
    const [showAiPrompt, setShowAiPrompt] = (0, react_1.useState)(true);
    // Advanced Settings
    const [isAdvanced, setIsAdvanced] = (0, react_1.useState)(false);
    const [font, setFont] = (0, react_1.useState)('Times New Roman');
    const [fontSize, setFontSize] = (0, react_1.useState)(12);
    const [lineSpacing, setLineSpacing] = (0, react_1.useState)(1.5);
    const [autoHeadings, setAutoHeadings] = (0, react_1.useState)(false);
    // Mobile Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = (0, react_1.useState)(false);
    // Preview State
    const [showPreview, setShowPreview] = (0, react_1.useState)(false);
    // Refs
    const fileInputRef = (0, react_1.useRef)(null);
    const textareaRef = (0, react_1.useRef)(null);
    // Handlers
    const handleTextChange = (text) => {
        setInputText(text);
        const validation = (0, fileParser_1.validateWordLimit)(text, MAX_WORDS);
        setWordCount(validation.wordCount);
        setErrorMessage(validation.message || '');
    };
    const handleFileUpload = async (e) => {
        var _a;
        const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file)
            return;
        setIsProcessing(true);
        try {
            setErrorMessage('');
            const text = await (0, fileParser_2.parseFile)(file);
            handleTextChange(text);
            setIsSidebarOpen(false); // Close sidebar on mobile after upload
        }
        catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to parse file');
        }
        finally {
            setIsProcessing(false);
        }
        if (fileInputRef.current)
            fileInputRef.current.value = '';
    };
    const handleDownloadDocx = async () => {
        if (!useCitations && !useFormatting) {
            setErrorMessage('Please select at least one option (Citations or Formatting)');
            return;
        }
        setIsDownloading(true);
        setErrorMessage('');
        try {
            const startTime = Date.now();
            const response = await fetch('/api/convert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: inputText,
                    formatting: useFormatting,
                    convert_citations: useCitations,
                    // Send advanced settings if enabled
                    font: isAdvanced ? font : 'Times New Roman',
                    font_size: isAdvanced ? fontSize : 12,
                    line_spacing: isAdvanced ? lineSpacing : 1.5,
                    auto_headings: isAdvanced ? autoHeadings : false
                }),
            });
            const processingTime = Date.now() - startTime;
            // Fire-and-forget logging
            fetch('/api/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wordCount,
                    processingTimeMs: processingTime,
                    features: { citations: useCitations, formatting: useFormatting, autoHeadings },
                    status: response.ok ? 'success' : 'error',
                    errorType: response.ok ? undefined : 'api_error'
                })
            }).catch(console.error);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to generate file');
            }
            const blob = await response.blob();
            if (blob.size === 0)
                throw new Error('Generated file is empty');
            let filename = 'CitationFix';
            if (useCitations)
                filename += '-Converted';
            if (useFormatting)
                filename += '-Formatted';
            filename += '.docx';
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
        catch (error) {
            console.error('Download error:', error);
            setErrorMessage(error instanceof Error ? error.message : 'Failed to download');
        }
        finally {
            setIsDownloading(false);
        }
    };
    const copyPrompt = async () => {
        try {
            await navigator.clipboard.writeText(AI_PROMPT);
            setCopiedPrompt(true);
            setTimeout(() => setCopiedPrompt(false), 2000);
        }
        catch (err) {
            console.error('Failed to copy:', err);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex h-screen w-full bg-[var(--app-bg)] overflow-hidden font-sans text-[var(--ink)]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "md:hidden fixed top-0 left-0 right-0 h-14 bg-[var(--sidebar-bg)] flex items-center justify-between px-4 z-30 shadow-md", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-lg font-bold text-[var(--sidebar-text)] tracking-tight", children: "CitationFix" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setIsSidebarOpen(!isSidebarOpen), className: "text-white p-2", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Settings, { className: "w-5 h-5" }) })] }), (0, jsx_runtime_1.jsxs)("aside", { className: `
        fixed md:relative inset-y-0 left-0 w-72 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] 
        flex flex-col flex-shrink-0 z-40 shadow-xl transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `, children: [(0, jsx_runtime_1.jsx)("div", { className: "hidden md:flex h-16 items-center px-6 border-b border-[var(--sidebar-border)]", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2.5", children: [(0, jsx_runtime_1.jsx)("div", { className: "bg-[var(--accent)] p-1.5 rounded-lg shadow-lg shadow-blue-900/20", children: (0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { className: "w-5 h-5 text-white" }) }), (0, jsx_runtime_1.jsx)("span", { className: "text-lg font-bold text-[var(--sidebar-text)] tracking-tight", children: "CitationFix" })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "md:hidden h-14 flex items-center justify-end px-4 border-b border-[var(--sidebar-border)]", children: (0, jsx_runtime_1.jsx)("button", { onClick: () => setIsSidebarOpen(false), className: "text-slate-400 text-sm", children: "Close Menu" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-xs font-bold uppercase tracking-wider text-[var(--sidebar-text-muted)]", children: "Input" }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => { var _a; return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }, disabled: isProcessing, className: "w-full flex items-center justify-center gap-2 py-3 px-4 bg-[var(--sidebar-hover)] hover:bg-[var(--sidebar-border)] text-[var(--sidebar-text)] rounded-lg border border-[var(--sidebar-border)] transition-all group", children: [isProcessing ? ((0, jsx_runtime_1.jsx)("div", { className: "w-4 h-4 border-2 border-[var(--sidebar-text)] border-t-transparent rounded-full animate-spin" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.Upload, { className: "w-4 h-4 text-[var(--sidebar-text-muted)] group-hover:text-white transition-colors" })), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: "Upload Document" })] }), (0, jsx_runtime_1.jsx)("input", { ref: fileInputRef, type: "file", className: "hidden", accept: ".txt,.docx", onChange: handleFileUpload }), (0, jsx_runtime_1.jsx)("p", { className: "text-[10px] text-[var(--sidebar-text-muted)] text-center", children: "Supports .docx and .txt (Max 20k words)" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-xs font-bold uppercase tracking-wider text-[var(--sidebar-text-muted)]", children: "Configuration" }), (0, jsx_runtime_1.jsxs)("label", { className: "flex items-center justify-between p-3 rounded-lg bg-[var(--sidebar-hover)]/50 border border-[var(--sidebar-border)] cursor-pointer hover:border-[var(--sidebar-text-muted)] transition-colors", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: `p-1.5 rounded ${useCitations ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-slate-800 text-slate-500'}`, children: (0, jsx_runtime_1.jsx)(lucide_react_1.Quote, { className: "w-4 h-4" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-sm font-medium text-[var(--sidebar-text)]", children: "Convert Citations" }), (0, jsx_runtime_1.jsxs)("span", { className: "text-[10px] text-[var(--sidebar-text-muted)]", children: ["{{fn: ...}}", " \u2192 Footnotes"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: `w-10 h-5 rounded-full relative transition-colors ${useCitations ? 'bg-[var(--accent)]' : 'bg-slate-700'}`, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", className: "hidden", checked: useCitations, onChange: (e) => setUseCitations(e.target.checked) }), (0, jsx_runtime_1.jsx)("div", { className: `absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${useCitations ? 'translate-x-5' : 'translate-x-0'}` })] })] }), (0, jsx_runtime_1.jsxs)("label", { className: "flex items-center justify-between p-3 rounded-lg bg-[var(--sidebar-hover)]/50 border border-[var(--sidebar-border)] cursor-pointer hover:border-[var(--sidebar-text-muted)] transition-colors", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: `p-1.5 rounded ${useFormatting ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-slate-800 text-slate-500'}`, children: (0, jsx_runtime_1.jsx)(lucide_react_1.AlignLeft, { className: "w-4 h-4" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-sm font-medium text-[var(--sidebar-text)]", children: "Legal Formatting" }), (0, jsx_runtime_1.jsx)("span", { className: "text-[10px] text-[var(--sidebar-text-muted)]", children: "Standard Layout" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: `w-10 h-5 rounded-full relative transition-colors ${useFormatting ? 'bg-[var(--accent)]' : 'bg-slate-700'}`, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", className: "hidden", checked: useFormatting, onChange: (e) => setUseFormatting(e.target.checked) }), (0, jsx_runtime_1.jsx)("div", { className: `absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${useFormatting ? 'translate-x-5' : 'translate-x-0'}` })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => setIsAdvanced(!isAdvanced), className: "w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--sidebar-text-muted)] hover:text-white transition-colors", children: [(0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Settings, { className: "w-3 h-3" }), " Advanced Settings"] }), (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { className: `w-3 h-3 transition-transform ${isAdvanced ? 'rotate-90' : ''}` })] }), isAdvanced && ((0, jsx_runtime_1.jsxs)("div", { className: "p-3 bg-[var(--sidebar-hover)] rounded-lg border border-[var(--sidebar-border)] space-y-4 animate-in fade-in slide-in-from-top-2 duration-200", children: [(0, jsx_runtime_1.jsxs)("label", { className: "flex items-center justify-between cursor-pointer group", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-[10px] text-[var(--sidebar-text-muted)] uppercase font-bold group-hover:text-white transition-colors", children: "Auto-Detect Headings" }), (0, jsx_runtime_1.jsxs)("div", { className: `w-8 h-4 rounded-full relative transition-colors ${autoHeadings ? 'bg-[var(--accent)]' : 'bg-slate-700'}`, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", className: "hidden", checked: autoHeadings, onChange: (e) => setAutoHeadings(e.target.checked) }), (0, jsx_runtime_1.jsx)("div", { className: `absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${autoHeadings ? 'translate-x-4' : 'translate-x-0'}` })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-1", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-[10px] text-[var(--sidebar-text-muted)] uppercase font-bold", children: "Font Family" }), (0, jsx_runtime_1.jsxs)("select", { value: font, onChange: (e) => setFont(e.target.value), className: "w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded p-2 focus:ring-1 focus:ring-[var(--accent)] outline-none", children: [(0, jsx_runtime_1.jsx)("option", { value: "Times New Roman", children: "Times New Roman" }), (0, jsx_runtime_1.jsx)("option", { value: "Arial", children: "Arial" }), (0, jsx_runtime_1.jsx)("option", { value: "Calibri", children: "Calibri" }), (0, jsx_runtime_1.jsx)("option", { value: "Garamond", children: "Garamond" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-1", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-[10px] text-[var(--sidebar-text-muted)] uppercase font-bold", children: "Font Size (pt)" }), (0, jsx_runtime_1.jsx)("div", { className: "flex gap-2", children: [10, 11, 12, 14].map(size => ((0, jsx_runtime_1.jsx)("button", { onClick: () => setFontSize(size), className: `flex-1 py-1.5 text-xs rounded border ${fontSize === size ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'}`, children: size }, size))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-1", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-[10px] text-[var(--sidebar-text-muted)] uppercase font-bold", children: "Line Spacing" }), (0, jsx_runtime_1.jsxs)("select", { value: lineSpacing, onChange: (e) => setLineSpacing(parseFloat(e.target.value)), className: "w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded p-2 focus:ring-1 focus:ring-[var(--accent)] outline-none", children: [(0, jsx_runtime_1.jsx)("option", { value: 1.0, children: "Single (1.0)" }), (0, jsx_runtime_1.jsx)("option", { value: 1.15, children: "1.15" }), (0, jsx_runtime_1.jsx)("option", { value: 1.5, children: "1.5" }), (0, jsx_runtime_1.jsx)("option", { value: 2.0, children: "Double (2.0)" })] })] })] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => setShowAiPrompt(!showAiPrompt), className: "w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--sidebar-text-muted)] hover:text-white transition-colors", children: [(0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Sparkles, { className: "w-3 h-3" }), " AI Assistant"] }), (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { className: `w-3 h-3 transition-transform ${showAiPrompt ? 'rotate-90' : ''}` })] }), showAiPrompt && ((0, jsx_runtime_1.jsxs)("div", { className: "p-3 bg-[var(--sidebar-hover)] rounded-lg border border-[var(--sidebar-border)] space-y-2 animate-in fade-in slide-in-from-top-2 duration-200", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-[11px] text-[var(--sidebar-text-muted)] leading-relaxed", children: "Paste this into ChatGPT to generate citations correctly:" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative group", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-2 bg-slate-950 rounded border border-slate-800 text-[10px] font-mono text-slate-400 leading-relaxed break-words", children: [AI_PROMPT.substring(0, 80), "..."] }), (0, jsx_runtime_1.jsx)("button", { onClick: copyPrompt, className: "absolute top-1 right-1 p-1 bg-slate-800 hover:bg-[var(--accent)] text-slate-300 hover:text-white rounded transition-colors", title: "Copy Full Prompt", children: copiedPrompt ? (0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: "w-3 h-3" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Copy, { className: "w-3 h-3" }) })] })] }))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-6 border-t border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] space-y-3", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => { setShowPreview(true); setIsSidebarOpen(false); }, disabled: !inputText.trim(), className: "w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold border border-slate-700 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { className: "w-4 h-4" }), " Preview"] }), (0, jsx_runtime_1.jsxs)("button", { onClick: handleDownloadDocx, disabled: !inputText.trim() || isDownloading, className: "w-full py-3 px-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg font-semibold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95", children: [isDownloading ? ((0, jsx_runtime_1.jsx)("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.Download, { className: "w-4 h-4" })), "Download DOCX"] })] })] }), isSidebarOpen && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm", onClick: () => setIsSidebarOpen(false) })), (0, jsx_runtime_1.jsxs)("main", { className: "flex-1 flex flex-col relative min-w-0 pt-14 md:pt-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "h-10 border-b border-slate-200 bg-white flex items-center justify-between px-6 text-xs font-medium text-slate-500", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { className: "w-3 h-3" }), " ", wordCount.toLocaleString(), " words"] }), wordCount > MAX_WORDS && (0, jsx_runtime_1.jsx)("span", { className: "text-red-500 font-bold", children: "Limit Exceeded" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-4", children: [(0, jsx_runtime_1.jsxs)("span", { children: ["Ln ", inputText.split('\n').length] }), (0, jsx_runtime_1.jsxs)("span", { children: ["Col ", inputText.length] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 overflow-y-auto bg-[var(--app-bg)] p-4 md:p-12 flex justify-center custom-scrollbar", children: [errorMessage && ((0, jsx_runtime_1.jsxs)("div", { className: "absolute top-6 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-5", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "w-5 h-5 text-red-500" }), errorMessage] })), (0, jsx_runtime_1.jsx)("div", { className: "w-full max-w-[816px] min-h-[1056px] bg-[var(--paper-bg)] paper-shadow rounded-sm flex flex-col relative transition-all duration-300 ring-1 ring-black/5", children: (0, jsx_runtime_1.jsx)("textarea", { ref: textareaRef, value: inputText, onChange: (e) => handleTextChange(e.target.value), placeholder: "Paste your legal document here...", className: "w-full h-full bg-transparent border-none resize-none focus:ring-0 text-[var(--ink)] placeholder-slate-300 text-lg leading-loose font-serif outline-none p-8 md:p-16", spellCheck: false, style: {
                                        fontFamily: isAdvanced ? font : 'Times New Roman',
                                        fontSize: isAdvanced ? `${fontSize}pt` : '18px', // Visual approximation
                                        lineHeight: isAdvanced ? lineSpacing : 1.6
                                    } }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "absolute bottom-4 right-6 flex gap-4 text-xs font-medium text-slate-400", children: [(0, jsx_runtime_1.jsx)("a", { href: "/privacy", className: "hover:text-slate-600 transition-colors", children: "Privacy" }), (0, jsx_runtime_1.jsx)("a", { href: "/terms", className: "hover:text-slate-600 transition-colors", children: "Terms" }), (0, jsx_runtime_1.jsx)("a", { href: "/feedback", className: "hover:text-slate-600 transition-colors", children: "Feedback" })] })] }), showPreview && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-slate-900/5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "font-bold text-slate-800 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { className: "w-4 h-4 text-[var(--accent)]" }), " Document Preview"] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setShowPreview(false), className: "text-slate-400 hover:text-slate-600 font-medium text-sm", children: "Close" })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex-1 overflow-y-auto p-8 bg-slate-100 custom-scrollbar flex justify-center", children: (0, jsx_runtime_1.jsx)("div", { className: "bg-white shadow-xl w-full max-w-[816px] min-h-[1000px] p-12 md:p-16 text-black", style: {
                                    fontFamily: isAdvanced ? font : 'Times New Roman',
                                    fontSize: isAdvanced ? `${fontSize}pt` : '12pt',
                                    lineHeight: isAdvanced ? lineSpacing : 1.5
                                }, children: inputText.split('\n').map((para, i) => {
                                    if (!para.trim())
                                        return (0, jsx_runtime_1.jsx)("br", {}, i);
                                    // Simulate Citation Conversion
                                    let content = para;
                                    const footnotes = [];
                                    if (useCitations) {
                                        content = content.replace(/\{\{fn:(.*?)\}\}/g, (_, citation) => {
                                            footnotes.push(citation);
                                            return `<sup class="text-[0.7em] align-super text-blue-600 font-bold" style="line-height: 0">[${footnotes.length}]</sup>`;
                                        });
                                    }
                                    // Simulate Markdown Links in Main Text
                                    content = content.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-[var(--accent)]">$1</a>');
                                    // Simulate Smart Headings
                                    let style = {};
                                    let className = "mb-4 text-justify";
                                    if (autoHeadings && isAdvanced) {
                                        const clean = para.trim();
                                        // Level 1
                                        if (/^(ARTICLE|CHAPTER)\s+[IVX\d]+/i.test(clean) || (clean === clean.toUpperCase() && clean.length < 100 && !/v\./i.test(clean))) {
                                            style = { fontWeight: 'bold', fontSize: '1.2em', textAlign: 'center', marginTop: '1em' };
                                            className = "mb-4";
                                        }
                                        // Level 2
                                        else if (/^(Section\s+\d+|[IVX]+\.)/.test(clean)) {
                                            style = { fontWeight: 'bold', fontSize: '1.1em', marginTop: '0.5em' };
                                            className = "mb-4";
                                        }
                                        // Level 3
                                        else if (/^([A-Z]\.|[0-9]+\.)/.test(clean)) {
                                            style = { marginLeft: '2em' };
                                        }
                                    }
                                    return ((0, jsx_runtime_1.jsxs)("div", { className: className, style: style, children: [(0, jsx_runtime_1.jsx)("span", { dangerouslySetInnerHTML: { __html: content } }), footnotes.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "mt-2 pt-2 border-t border-slate-200 text-[0.8em] leading-tight text-slate-600", children: footnotes.map((fn, idx) => {
                                                    // Parse links in footnotes for preview
                                                    const fnContent = fn.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-[var(--accent)]">$1</a>');
                                                    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex gap-1 mb-1", children: [(0, jsx_runtime_1.jsxs)("span", { className: "font-bold", children: [idx + 1, "."] }), (0, jsx_runtime_1.jsx)("span", { dangerouslySetInnerHTML: { __html: fnContent } })] }, idx));
                                                }) }))] }, i));
                                }) }) })] }) }))] }));
}
