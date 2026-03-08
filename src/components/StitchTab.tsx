import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Code, Eye, Loader2, Sparkles, AlertCircle, Copy, Check } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export const StitchTab = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [view, setView] = useState<'preview' | 'code'>('preview');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      
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

  return (
    <div className="w-full h-full p-8 flex flex-col overflow-hidden">
      <div className="max-w-6xl mx-auto w-full h-full flex flex-col gap-6">
        {/* Header */}
        <div className="shrink-0">
          <h1 className="text-3xl font-serif text-white mb-2 flex items-center gap-3">
            <Wand2 className="w-8 h-8 text-purple-400" />
            Stitch UI Generator
          </h1>
          <p className="text-zinc-400 text-sm">
            Design with AI. Describe the interface you want, and Gemini will generate production-ready HTML and Tailwind CSS instantly.
          </p>
        </div>

        {/* Input Area */}
        <form onSubmit={handleGenerate} className="shrink-0 relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A modern pricing section with 3 tiers, dark mode, and a glowing primary button..."
            className="w-full h-32 bg-[#0a0a0a] border border-white/10 rounded-xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none custom-scrollbar"
            disabled={isGenerating}
          />
          <div className="absolute bottom-4 right-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="px-6 py-2.5 bg-white text-black font-bold text-xs tracking-widest uppercase rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate UI
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="shrink-0 p-4 border border-red-500/20 bg-red-500/10 rounded-xl flex items-start gap-3 text-red-400"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        {/* Output Area */}
        {code && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col min-h-0 border border-white/10 rounded-xl bg-[#050505] overflow-hidden"
          >
            <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-[#0a0a0a] shrink-0">
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
              
              {view === 'code' && (
                <button
                  onClick={handleCopy}
                  className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-medium"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-hidden relative bg-white">
              {view === 'preview' ? (
                <iframe
                  srcDoc={code}
                  title="UI Preview"
                  className="w-full h-full border-none bg-white"
                  sandbox="allow-scripts allow-same-origin"
                />
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
    </div>
  );
};
