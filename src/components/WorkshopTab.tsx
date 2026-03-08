import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, Globe, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';

export const WorkshopTab = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    setResult(null);
    setSources([]);

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an expert brand strategist and researcher. Please provide a comprehensive, well-structured answer to the following query using live search data. Format your response in clean Markdown with clear headings and bullet points where appropriate.\n\nQuery: ${query}`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      if (response.text) {
        setResult(response.text);
      } else {
        setError("No response generated. Please try a different query.");
      }

      // Extract grounding chunks (sources)
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && Array.isArray(chunks)) {
        const extractedSources = chunks
          .filter(chunk => chunk.web && chunk.web.uri && chunk.web.title)
          .map(chunk => ({
            title: chunk.web.title,
            uri: chunk.web.uri
          }));
        
        // Remove duplicates based on URI
        const uniqueSources = Array.from(new Map(extractedSources.map(item => [item.uri, item])).values());
        setSources(uniqueSources);
      }

    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.message || "An error occurred while searching. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full h-full p-8 overflow-y-auto pb-32">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-serif text-white mb-2 flex items-center gap-3">
            <Globe className="w-8 h-8 text-emerald-400" />
            Live Research Workshop
          </h1>
          <p className="text-zinc-400 text-sm">
            Powered by Google Search Grounding. Ask any question, and the AI will search the live web to provide up-to-date, cited research and strategy.
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., What are the latest marketing trends for sustainable fashion in 2026?"
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-4 pl-12 pr-32 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
              disabled={isSearching}
            />
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="absolute right-2 top-2 bottom-2 px-6 bg-white text-black font-bold text-xs tracking-widest uppercase rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Search
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border border-red-500/20 bg-red-500/10 rounded-xl flex items-start gap-3 text-red-400"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="p-8 border border-white/10 rounded-xl bg-[#0a0a0a] prose prose-invert max-w-none prose-headings:font-serif prose-a:text-emerald-400 hover:prose-a:text-emerald-300">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>

            {sources.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold tracking-widest uppercase text-zinc-500 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Sources & Citations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 border border-white/5 rounded-xl bg-[#0a0a0a] hover:bg-white/5 hover:border-white/10 transition-all group flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-zinc-300 font-medium truncate group-hover:text-white transition-colors">
                          {source.title}
                        </p>
                        <p className="text-xs text-zinc-500 truncate mt-1">
                          {new URL(source.uri).hostname}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 shrink-0 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
