import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Code, Eye, Loader2, Sparkles, AlertCircle, Copy, Check, Monitor, Tablet, Smartphone, X } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export const StitchTab = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [view, setView] = useState<'preview' | 'code'>('preview');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `You are an expert frontend developer and UI designer. 
Generate a beautiful, modern, and responsive UI based on the user's request.
Use HTML5 and Tailwind CSS (via CDN: <script src="https://cdn.tailwindcss.com"></script>).
Include any necessary Google Fonts or FontAwesome icons via CDN.
Do NOT include markdown formatting (like \`\`\`html). Return ONLY the raw HTML code starting with <!DOCTYPE html>.

User Request: ${prompt}`,
      });

      if (response.text) {
        let cleanCode = response.text.trim();
        if (cleanCode.startsWith('```html')) {
          cleanCode = cleanCode.replace(/^```html\n/, '').replace(/\n```$/, '');
        } else if (cleanCode.startsWith('```')) {
          cleanCode = cleanCode.replace(/^```\n/, '').replace(/\n```$/, '');
        }
        setCode(cleanCode);
        setView('preview');
      } else {
        setError("No code generated. Please try a different prompt.");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "An error occurred while generating the UI.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const clearCode = () => {
    setCode(null);
    setPrompt('');
    setError(null);
  };

  // Memoize the iframe to prevent re-rendering on every keystroke
  const previewIframe = useMemo(() => {
    if (!code) return null;
    
    let width = '100%';
    if (device === 'tablet') width = '768px';
    if (device === 'mobile') width = '375px';

    return (
      <div className="w-full h-full flex items-center justify-center bg-[#050505] overflow-auto custom-scrollbar p-4">
        <div 
          className="bg-white rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10 transition-all duration-300 ease-in-out"
          style={{ width, height: '100%', maxHeight: '100%' }}
        >
          <iframe
            srcDoc={code}
            title="UI Preview"
            className="w-full h-full border-none bg-white"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    );
  }, [code, device]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#0a0a0a]">
      {/* Dynamic Header / Input Area */}
      <div className={`shrink-0 transition-all duration-500 ease-in-out ${code ? 'p-4 border-b border-white/10 bg-[#050505]' : 'p-8 flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full'}`}>
        
        {!code && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Wand2 className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-4xl font-serif text-white mb-4">
              Stitch UI Generator
            </h1>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Design with AI. Describe the interface you want, and Gemini will generate production-ready HTML and Tailwind CSS instantly.
            </p>
          </motion.div>
        )}

        <form onSubmit={handleGenerate} className={`relative mx-auto w-full ${code ? 'max-w-6xl flex gap-4 items-center' : ''}`}>
          {code && (
            <button
              type="button"
              onClick={clearCode}
              className="shrink-0 p-2.5 rounded-lg bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Clear and start over"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          
          <div className="relative flex-1">
            {code ? (
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Make changes to this UI..."
                className="w-full h-12 bg-white/5 border border-white/10 rounded-lg pl-4 pr-32 text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                disabled={isGenerating}
              />
            ) : (
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A modern pricing section with 3 tiers, dark mode, and a glowing primary button..."
                className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-6 text-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none custom-scrollbar shadow-2xl"
                disabled={isGenerating}
              />
            )}
            
            <div className={`absolute ${code ? 'right-1.5 top-1.5' : 'bottom-4 right-4'}`}>
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className={`bg-white text-black font-bold tracking-widest uppercase rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2 ${code ? 'px-4 py-1.5 text-[10px]' : 'px-6 py-3 text-xs shadow-lg'}`}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {code ? 'Update' : 'Generate UI'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 border border-red-500/20 bg-red-500/10 rounded-xl flex items-start gap-3 text-red-400 mx-auto w-full ${code ? 'max-w-6xl mt-4' : 'mt-6'}`}
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </motion.div>
        )}
      </div>

      {/* Output Area */}
      {code && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col min-h-0 bg-[#050505]"
        >
          <div className="h-12 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a] shrink-0">
            <div className="flex items-center gap-2 bg-black/50 p-1 rounded-lg border border-white/5">
              <button
                onClick={() => setView('preview')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors ${view === 'preview' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Eye className="w-3.5 h-3.5" /> Preview
              </button>
              <button
                onClick={() => setView('code')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors ${view === 'code' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Code className="w-3.5 h-3.5" /> Code
              </button>
            </div>
            
            {view === 'preview' && (
              <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-white/5">
                <button
                  onClick={() => setDevice('desktop')}
                  className={`p-1.5 rounded-md transition-colors ${device === 'desktop' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                  title="Desktop View"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDevice('tablet')}
                  className={`p-1.5 rounded-md transition-colors ${device === 'tablet' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                  title="Tablet View"
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDevice('mobile')}
                  className={`p-1.5 rounded-md transition-colors ${device === 'mobile' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                  title="Mobile View"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            )}

            {view === 'code' && (
              <button
                onClick={handleCopy}
                className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-medium bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-hidden relative">
            {view === 'preview' ? (
              previewIframe
            ) : (
              <div className="w-full h-full overflow-auto bg-[#050505] p-6 custom-scrollbar">
                <pre className="text-sm text-zinc-300 font-mono whitespace-pre-wrap">
                  <code>{code}</code>
                </pre>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
