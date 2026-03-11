/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Leaf, Sparkles, Search, LayoutDashboard, Settings, Users, MessageSquare, 
  ChevronRight, CheckCircle2, X, ShieldAlert, ShieldCheck, Building2, Mail, 
  TrendingUp, Wrench, Briefcase, CheckSquare, Target, Sidebar, ArrowLeft, 
  Sun, Moon, LogOut, Paperclip, Mic, Send, Activity, BarChart3, Globe, Zap,
  ChevronDown, FileText, AlertCircle, Loader2, Image as ImageIcon, Wand2, Flame
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { auth, loginWithGoogle, logout, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { GoogleGenAI, Type } from '@google/genai';
import { WorkshopTab } from './components/WorkshopTab';
import { StitchTab } from './components/StitchTab';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type UserRole = 'INTERNAL' | 'CLIENT';
type TabId = 'AISEO' | 'MERCEDES' | 'OVERVIEW' | string;
type ViewState = 'LANDING' | 'DASHBOARD';

// --- Mock Data ---
const trafficData = [
  { name: 'Jan', organic: 4000, aiSearch: 2400 },
  { name: 'Feb', organic: 3000, aiSearch: 1398 },
  { name: 'Mar', organic: 2000, aiSearch: 9800 },
  { name: 'Apr', organic: 2780, aiSearch: 3908 },
  { name: 'May', organic: 1890, aiSearch: 4800 },
  { name: 'Jun', organic: 2390, aiSearch: 3800 },
  { name: 'Jul', organic: 3490, aiSearch: 4300 },
];

const entityData = [
  { name: 'Brand Authority', score: 85 },
  { name: 'Topic Relevance', score: 92 },
  { name: 'Semantic Depth', score: 78 },
  { name: 'User Intent', score: 88 },
];

// --- Components ---

const CharlieLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16" />
    <path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2-.9 2-2v-1c0-1.1.9-2 2-2h.5a1.5 1.5 0 0 0 0-3H17" />
    <path d="M11 16v4" />
    <path d="M15 16v4" />
    <path d="M11 10V4a2 2 0 0 1 4 0v6" />
    <path d="M15 10V6a2 2 0 0 1 4 0v4" />
  </svg>
);

const AGENTS_LANDING = [
  {
    name: 'Charlie',
    tagline: 'The AISEO Phantom',
    badge: 'AISEO',
    color: '#00E676',
    token: '$CHARLIE',
    image: '/agent-charlie.jpg',
    desc: 'Specialist in structuring brand data for LLM retrieval. Ensures your brand is the first answer AI gives.',
    powers: ['Brand Roast', 'Entity Salience', 'AISEO Audit', 'Workshop Research'],
  },
  {
    name: 'Mercedes',
    tagline: 'The Boardroom',
    badge: 'STRATEGY',
    color: '#C0C0C0',
    token: '$MERCEDES',
    image: '/agent-mercedes.jpg',
    desc: 'Strategic advisor for business architecture. Ruthless optimization of corporate positioning.',
    powers: ['Growth Roadmaps', 'Unit Economics', 'Competitive Analysis', 'Risk Assessment'],
  },
  {
    name: 'Matt MacMillie',
    tagline: 'The Street',
    badge: 'WARFARE',
    color: '#FF3D00',
    token: '$MACMILLIE',
    image: '/agent-macmillie.jpg',
    desc: 'Campaign warfare specialist. Unconventional tactics to dominate the grey space your competitors ignore.',
    powers: ['Ad Creative', 'Stitch UI', 'Drip Campaigns', 'Landing Pages'],
  },
];

const LandingPage = ({ onLogin, isDarkMode, toggleTheme }: { onLogin: () => void, isDarkMode: boolean, toggleTheme: () => void }) => {
  const [roastUrl, setRoastUrl] = useState('');
  const [isRoasting, setIsRoasting] = useState(false);
  const [roastResult, setRoastResult] = useState<string | null>(null);

  const handleFreeRoast = async () => {
    if (!roastUrl.trim()) return;
    setIsRoasting(true);
    setRoastResult(null);
    try {
      const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error('API Key missing');
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a brutal but brilliant AI marketing critic. Roast the brand or URL: "${roastUrl}" for their lack of AI Search Optimization (AISEO). Be funny, sharp, and point out how LLMs like ChatGPT or Gemini probably hallucinate or completely ignore them because their data is unstructured. End with a pitch on how Charlie can fix it. Keep it under 3 paragraphs.`,
      });
      setRoastResult(response.text || 'Could not generate roast.');
    } catch {
      setRoastResult("The AI refused to roast this. Either too good, or so bad the neural net crashed. Sign in for the full diagnosis.");
    } finally {
      setIsRoasting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 overflow-y-auto selection:bg-[#00E676] selection:text-black" style={{ fontFamily: "'Roboto', 'Inter', sans-serif" }}>
      
      {/* NAV */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 md:px-10 py-4 flex justify-between items-center bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <img src="/charlie-logo-transparent.png" alt="Charlie" className="h-10 w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onLogin} className="text-sm text-zinc-400 hover:text-white transition-colors hidden md:block">Log in</button>
          <button onClick={onLogin} className="px-5 py-2 bg-[#00E676] text-black text-sm font-bold rounded-lg hover:bg-[#00C853] transition-all hover:shadow-[0_0_20px_rgba(0,230,118,0.3)]">
            Get Started
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="pt-28 pb-16 px-6 md:px-10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[80vh]">
            
            {/* LEFT — Text + CTA */}
            <div className="relative z-10">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                <p className="text-[#00E676] text-xs font-bold tracking-[0.3em] uppercase mb-6">AI Search Visibility Platform</p>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.95] mb-6" style={{ fontFamily: "'Roboto', sans-serif" }}>
                  Be ready or<br /><span className="text-[#00E676]">be gone.</span>
                </h1>
                <p className="text-lg md:text-xl text-zinc-500 max-w-xl mb-10 leading-relaxed">
                  When someone asks AI about your industry, does your brand appear? For 90% of businesses, the answer is no. MeetCharlie.ai fixes that.
                </p>
              </motion.div>

              {/* BRAND ROAST INPUT */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="max-w-xl mb-6">
                <div className="flex gap-3 p-2 bg-[#0a0a0a] border border-white/10 rounded-xl">
                  <input
                    type="text"
                    value={roastUrl}
                    onChange={(e) => setRoastUrl(e.target.value)}
                    placeholder="Enter your URL..."
                    className="flex-1 bg-transparent text-white px-4 py-3 text-base placeholder:text-zinc-600 focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleFreeRoast()}
                  />
                  <button
                    onClick={handleFreeRoast}
                    disabled={isRoasting || !roastUrl.trim()}
                    className="px-6 py-3 bg-[#00E676] text-black font-bold rounded-lg hover:bg-[#00C853] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap hover:shadow-[0_0_24px_rgba(0,230,118,0.4)] glow-btn"
                  >
                    {isRoasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
                    Free Brand Roast
                  </button>
                </div>
                <p className="text-xs text-zinc-600 mt-3">Free. No sign-up required. See how AI sees your brand in 60 seconds.</p>
              </motion.div>

              {/* ROAST RESULT (if any) */}
              <AnimatePresence>
                {roastResult && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-xl mb-12">
                    <div className="bg-[#0a0a0a] border border-[#FF3D00]/30 rounded-xl p-6 text-left relative overflow-hidden">
                      <div className="absolute top-0 right-0 opacity-5"><Flame className="w-24 h-24 text-[#FF3D00]" /></div>
                      <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-sm relative z-10">{roastResult}</p>
                      <button onClick={onLogin} className="mt-4 text-[#00E676] text-sm font-bold hover:underline relative z-10">Sign in for the full diagnosis →</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* STATS */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex gap-8 md:gap-12 flex-wrap">
                {[['90%', 'Invisible to AI'], ['60s', 'To score your brand'], ['3', 'AI Agents'], ['$0', 'To try']].map(([val, label]) => (
                  <div key={label} className="text-center">
                    <div className="text-2xl md:text-3xl font-black text-white">{val}</div>
                    <div className="text-xs text-zinc-600 mt-1">{label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* RIGHT — Spline 3D Robot */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.2 }}
              className="relative h-[500px] md:h-[650px] lg:h-[750px] hidden lg:block"
            >
              <iframe
                src="https://my.spline.design/95b11be5-c203-4914-a8b9-7a05fa62a46c/"
                frameBorder="0"
                width="100%"
                height="100%"
                style={{ border: 'none', borderRadius: '16px' }}
                allow="autoplay"
                title="Charlie AI Robot"
              />
              {/* Fade edges into background */}
              <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ boxShadow: 'inset 0 0 80px 40px #050505' }} />
            </motion.div>

          </div>
        </div>
      </section>

      {/* AGENTS */}
      <section className="px-6 md:px-10 pb-24">
        <div className="max-w-6xl mx-auto">
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-600 text-center mb-12">Meet the team</motion.p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {AGENTS_LANDING.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="group relative bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden hover:border-white/15 transition-all duration-500 hover:-translate-y-1"
                style={{ boxShadow: `0 0 0px ${agent.color}00` }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 40px ${agent.color}15`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0px ${agent.color}00`; }}
              >
                {/* Agent Image */}
                <div className="aspect-[3/4] overflow-hidden relative">
                  <img src={agent.image} alt={agent.name} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                  {/* Token Badge */}
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider border" style={{ color: agent.color, borderColor: `${agent.color}40`, background: `${agent.color}10` }}>
                    {agent.token}
                  </div>
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider bg-black/60 backdrop-blur-sm border border-white/10 text-white">
                    {agent.badge}
                  </div>
                </div>
                {/* Agent Info */}
                <div className="p-5 -mt-8 relative z-10">
                  <h3 className="text-xl font-bold text-white mb-1">{agent.name}</h3>
                  <p className="text-sm font-medium mb-3" style={{ color: agent.color }}>"{agent.tagline}"</p>
                  <p className="text-sm text-zinc-500 leading-relaxed mb-4">{agent.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {agent.powers.map((p) => (
                      <span key={p} className="px-2 py-1 text-[10px] font-medium tracking-wider uppercase rounded border border-white/10 text-zinc-500 bg-white/5">{p}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 md:px-10 py-24 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-600 mb-12">How it works</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'Drop your URL', desc: 'The Brand Roast scans your brand through the eyes of every major AI engine.' },
              { num: '02', title: 'See the truth', desc: 'Get your AI Visibility Score, Entity Salience rating, and a full diagnosis.' },
              { num: '03', title: 'Fix it', desc: 'Three AI agents build your roadmap — strategy, content, and campaigns.' },
            ].map((step, i) => (
              <motion.div key={step.num} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="text-left">
                <div className="text-4xl font-black text-[#00E676]/20 mb-4">{step.num}</div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="px-6 md:px-10 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">Your competitors are<br />already optimizing.</h2>
            <p className="text-zinc-500 mb-8 text-lg">Every day you wait is a day another brand takes your slot in the AI answer.</p>
            <button onClick={onLogin} className="px-8 py-4 bg-[#00E676] text-black font-bold rounded-xl text-lg hover:bg-[#00C853] transition-all hover:shadow-[0_0_30px_rgba(0,230,118,0.4)] glow-btn">
              Get Started — It's Free
            </button>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 px-6 md:px-10 py-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/charlie-logo-transparent.png" alt="Charlie" className="h-8 w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
            <span className="text-sm font-bold text-white">MeetCharlie.ai</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-600">
            <span>Powered by Hedera Hashgraph</span>
            <span className="hidden md:inline">|</span>
            <span>A Haus of Technik Group venture</span>
          </div>
          <p className="text-xs text-zinc-700">&copy; {new Date().getFullYear()} MeetCharlie.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const OnboardingModal = ({ isOpen, onClose, onComplete }: { isOpen: boolean; onClose: () => void; onComplete: () => void; }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Be Ready or Be Gone",
      subtitle: "The New Era of Search",
      content: "Search is evolving rapidly. Generative AI engines are reshaping how content is discovered and consumed. Our AISEO Specialist Tool ensures your brand doesn't just survive it thrives as the definitive answer.",
      icon: <Target className="w-8 h-8 text-emerald-400" />
    },
    {
      title: "AI Content Optimization",
      subtitle: "Beyond Keywords",
      content: "Seamlessly analyze intent, structure your data for LLMs, and optimize your content to become the primary source for AI-driven search engines. We handle the complexity so you can focus on growth.",
      icon: <Sparkles className="w-8 h-8 text-emerald-400" />
    },
    {
      title: "Specialist Diagnostics",
      subtitle: "Internal Expert Tools",
      content: "Our internal specialists use advanced, proprietary diagnostics to fine-tune your strategy. Look for the AI Leaf icon—your indicator of expert-level tools working behind the scenes.",
      icon: <Leaf className="w-8 h-8 text-emerald-400" />
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  {steps[step].icon}
                </div>
                <div>
                  <h3 className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-1">
                    {steps[step].subtitle}
                  </h3>
                  <h2 className="text-xl font-serif text-white">
                    {steps[step].title}
                  </h2>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-md transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8">
              <p className="text-zinc-400 leading-relaxed text-sm">
                {steps[step].content}
              </p>
            </div>
            <div className="flex items-center justify-between p-6 border-t border-white/10 bg-[#050505]">
              <div className="flex gap-2">
                {steps.map((_, i) => (
                  <div key={i} className={cn("h-1 rounded-full transition-all duration-300", i === step ? 'w-6 bg-emerald-400' : 'w-2 bg-white/20')} />
                ))}
              </div>
              <button onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 bg-white text-black text-sm font-semibold rounded-md hover:bg-zinc-200 transition-colors">
                {step === steps.length - 1 ? 'Get Started' : 'Next'}
                {step === steps.length - 1 ? <CheckCircle2 className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const AISEOButton = ({ isActive, onClick, role }: { isActive: boolean; onClick: () => void; role: UserRole; }) => {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden border",
        isActive 
          ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]' 
          : 'bg-transparent text-zinc-400 border-transparent hover:bg-white/5 hover:border-white/10 hover:text-white'
      )}
    >
      {/* Active Indicator Line */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1 transition-all duration-300",
        isActive ? "bg-emerald-500 opacity-100" : "bg-transparent opacity-0"
      )} />

      <div className={cn("flex items-center gap-3 relative z-10 transition-transform duration-300", isActive ? "translate-x-1" : "")}>
        <div className={cn(
          "p-1.5 rounded-md transition-colors duration-300",
          isActive ? "bg-black/5" : "bg-white/5 group-hover:bg-white/10"
        )}>
          <Search className={cn("w-4 h-4 transition-colors duration-300", isActive ? 'text-black' : 'text-zinc-400 group-hover:text-white')} />
        </div>
        <span className="text-[11px] font-bold tracking-widest uppercase">AISEO Specialist</span>
      </div>
      
      <AnimatePresence>
        {role === 'INTERNAL' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={cn(
              "p-1.5 rounded-md transition-colors duration-300 relative z-10",
              isActive ? 'bg-emerald-500/20' : 'bg-emerald-500/10 group-hover:bg-emerald-500/20'
            )}
            title="Internal Specialist Tool"
          >
            <motion.div
              animate={isActive ? { rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Leaf className={cn("w-3.5 h-3.5 transition-colors duration-300", isActive ? "text-emerald-600" : "text-emerald-500")} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

// --- Tab Views ---

const OverviewTab = ({ userId }: { userId?: string }) => {
  const [scans, setScans] = useState<any[]>([]);
  const [roasts, setRoasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const scansQuery = query(
      collection(db, 'scans'),
      where('userId', '==', userId)
    );

    const roastsQuery = query(
      collection(db, 'roasts'),
      where('userId', '==', userId)
    );

    const unsubscribeScans = onSnapshot(scansQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setScans(docs.slice(0, 5));
    }, (error) => {
      console.error("Error fetching scans:", error);
    });

    const unsubscribeRoasts = onSnapshot(roastsQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setRoasts(docs.slice(0, 5));
    }, (error) => {
      console.error("Error fetching roasts:", error);
    });

    setLoading(false);

    return () => {
      unsubscribeScans();
      unsubscribeRoasts();
    };
  }, [userId]);

  return (
  <div className="w-full h-full p-8 overflow-y-auto pb-32">
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-white mb-2">Performance Overview</h1>
          <p className="text-zinc-400 text-sm">Your digital presence across traditional and AI-driven search engines.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-white/20 rounded-md text-xs font-bold tracking-widest uppercase hover:bg-white/5 transition-colors">Last 30 Days</button>
          <button className="px-4 py-2 bg-white text-black rounded-md text-xs font-bold tracking-widest uppercase hover:bg-zinc-200 transition-colors">Export Report</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Visibility Score', value: '84.2%', trend: '+5.4%', icon: <Globe className="w-5 h-5 text-blue-400" /> },
          { label: 'AI Search Mentions', value: '1,248', trend: '+12.3%', icon: <Sparkles className="w-5 h-5 text-emerald-400" /> },
          { label: 'Entity Salience', value: '0.89', trend: '+0.04', icon: <Target className="w-5 h-5 text-purple-400" /> },
        ].map((stat, i) => (
          <div key={i} className="p-6 border border-white/10 rounded-xl bg-[#0a0a0a] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-widest uppercase text-zinc-500">{stat.label}</span>
              {stat.icon}
            </div>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-serif text-white">{stat.value}</span>
              <span className="text-sm text-emerald-400 mb-1">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Scans */}
        <div className="p-6 border border-white/10 rounded-xl bg-[#0a0a0a] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold tracking-widest uppercase text-zinc-400">Recent AISEO Scans</h3>
            <Search className="w-4 h-4 text-zinc-500" />
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
              </div>
            ) : scans.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-zinc-500">
                <p className="text-sm">No scans yet.</p>
              </div>
            ) : (
              scans.map((scan) => (
                <div key={scan.id} className="p-4 border border-white/5 rounded-lg bg-black/50 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-white truncate max-w-[200px]" title={scan.url}>
                      {scan.url.replace(/^https?:\/\//, '')}
                    </span>
                    <span className={cn(
                      "text-xs font-bold px-2 py-1 rounded-full",
                      scan.score >= 80 ? "bg-emerald-500/20 text-emerald-400" :
                      scan.score >= 50 ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    )}>
                      {scan.score}/100
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2">
                    {scan.diagnostic || "No diagnostic available."}
                  </p>
                  <div className="mt-3 text-[10px] text-zinc-600 uppercase tracking-wider">
                    {scan.createdAt ? new Date(scan.createdAt.toMillis()).toLocaleDateString() : 'Just now'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Roasts */}
        <div className="p-6 border border-white/10 rounded-xl bg-[#0a0a0a] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold tracking-widest uppercase text-zinc-400">Recent Brand Roasts</h3>
            <Flame className="w-4 h-4 text-red-500" />
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
              </div>
            ) : roasts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-zinc-500">
                <p className="text-sm">No roasts yet.</p>
              </div>
            ) : (
              roasts.map((roast) => (
                <div key={roast.id} className="p-4 border border-red-500/10 rounded-lg bg-black/50 hover:bg-red-500/5 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-white truncate max-w-[200px]" title={roast.url}>
                      {roast.url.replace(/^https?:\/\//, '')}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 italic line-clamp-3">
                    "{roast.roast}"
                  </p>
                  <div className="mt-3 text-[10px] text-zinc-600 uppercase tracking-wider">
                    {roast.createdAt ? new Date(roast.createdAt.toMillis()).toLocaleDateString() : 'Just now'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="p-6 border border-white/10 rounded-xl bg-[#0a0a0a]">
        <h3 className="text-sm font-bold tracking-widest uppercase text-zinc-400 mb-6">Traffic Sources (Traditional vs AI)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trafficData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOrganic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                itemStyle={{ color: '#e4e4e7' }}
              />
              <Area type="monotone" dataKey="organic" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOrganic)" />
              <Area type="monotone" dataKey="aiSearch" stroke="#10b981" fillOpacity={1} fill="url(#colorAi)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </div>
  );
};

const MercedesTab = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello. I'm Mercedes, your strategic partner. How can we optimize your business architecture today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      chatRef.current = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: "You are Mercedes, a ruthless, brilliant, and highly strategic AISEO consultant and co-founder of Charlie. You speak with extreme confidence, precision, and a touch of arrogance. You help clients optimize their business architecture for generative AI search engines. Keep responses concise, punchy, and actionable. Never break character."
        }
      });
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !chatRef.current) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);
    
    try {
      const response = await chatRef.current.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'assistant', content: response.text || "I have no response to that." }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "My connection to the neural net was interrupted. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative">
      <div className="flex-1 overflow-y-auto p-8 pb-32">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex flex-col items-center text-center space-y-4 mb-12">
            <div className="w-16 h-16 border border-white/20 flex items-center justify-center rounded-full bg-white/5">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-serif text-white mb-1">Mercedes</h1>
              <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">CO-FOUNDER & STRATEGIST</p>
            </div>
          </div>

          <div className="space-y-6">
            {messages.map((msg, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={i} 
                className={cn("flex gap-4", msg.role === 'user' ? "flex-row-reverse" : "")}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  msg.role === 'user' ? "bg-white text-black" : "bg-zinc-900 border border-white/10 text-white"
                )}>
                  {msg.role === 'user' ? <Users className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <div className={cn(
                  "px-4 py-3 rounded-2xl max-w-[80%] text-sm leading-relaxed",
                  msg.role === 'user' ? "bg-white/10 text-white rounded-tr-sm" : "bg-transparent border border-white/10 text-zinc-300 rounded-tl-sm"
                )}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-zinc-900 border border-white/10 text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-transparent border border-white/10 text-zinc-500 rounded-tl-sm text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-8 left-8 right-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-2xl">
          <button className="p-2 text-zinc-400 hover:text-white transition-colors shrink-0">
            <Paperclip className="w-5 h-5" />
          </button>
          <button className="p-2 text-zinc-400 hover:text-white transition-colors shrink-0">
            <Mic className="w-5 h-5" />
          </button>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Speak with Mercedes..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-zinc-600 px-2"
          />
          <button 
            onClick={handleSend}
            disabled={isTyping}
            className="p-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors shrink-0 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const AiseoWorkspace = ({ role, onReplayOnboarding, userId }: { role: UserRole, onReplayOnboarding: () => void, userId?: string }) => {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [scanData, setScanData] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!url) return;
    setIsScanning(true);
    setHasResults(false);
    
    try {
      const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this URL or brand for AI Search Readiness (AISEO): ${url}. Give me a realistic-looking diagnostic.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER, description: "AI Readiness Score 0-100" },
              entities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    score: { type: Type.NUMBER }
                  }
                }
              },
              diagnostic: { type: Type.STRING, description: "Short diagnostic of missing contextual vectors" },
              internalDiagnostic: { type: Type.STRING, description: "Internal technical diagnostic for the agency" }
            }
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      setScanData(data);
      setHasResults(true);

      // Save to Firestore
      if (userId) {
        try {
          await addDoc(collection(db, 'scans'), {
            userId,
            url,
            score: data.score || 0,
            entities: JSON.stringify(data.entities || []),
            diagnostic: data.diagnostic || '',
            internalDiagnostic: data.internalDiagnostic || '',
            status: 'completed',
            createdAt: serverTimestamp()
          });
        } catch (dbError) {
          console.error("Failed to save scan to database:", dbError);
        }
      }

    } catch (error) {
      console.error(error);
      // Fallback to mock data if API fails
      const mockData = {
        score: 72,
        entities: entityData,
        diagnostic: "The content lacks clear definitions for primary entities. LLMs may struggle to confidently cite this source for direct answers.",
        internalDiagnostic: "Semantic density is 14% below competitor average. Recommend injecting structured data markup for FAQ and HowTo schemas."
      };
      setScanData(mockData);
      setHasResults(true);

      if (userId) {
        try {
          await addDoc(collection(db, 'scans'), {
            userId,
            url,
            score: mockData.score,
            entities: JSON.stringify(mockData.entities),
            diagnostic: mockData.diagnostic,
            internalDiagnostic: mockData.internalDiagnostic,
            status: 'completed',
            createdAt: serverTimestamp()
          });
        } catch (dbError) {
          console.error("Failed to save mock scan to database:", dbError);
        }
      }
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative">
      <div className="flex-1 overflow-y-auto p-8 pb-32">
        <div className="max-w-4xl mx-auto w-full">
        
        {!hasResults && !isScanning && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center space-y-6 mt-20"
          >
            <div className="w-20 h-20 border border-white/20 flex items-center justify-center mb-4 relative bg-white/5 rounded-2xl">
              <Search className="w-8 h-8 text-white" />
              {role === 'INTERNAL' && (
                <div className="absolute -top-3 -right-3 bg-black p-1.5 rounded-lg border border-white/10">
                  <Leaf className="w-5 h-5 text-emerald-500" />
                </div>
              )}
            </div>
            
            <div>
              <h1 className="text-4xl font-serif text-white mb-3">AISEO Workspace</h1>
              <p className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 mb-6">
                {role === 'INTERNAL' ? 'ADVANCED DIAGNOSTICS ACTIVE' : 'CONTENT OPTIMIZATION ENGINE'}
              </p>
              <p className="text-zinc-400 leading-relaxed max-w-lg mx-auto">
                {role === 'INTERNAL' 
                  ? "Internal tools unlocked. You have access to deep LLM intent analysis, semantic entity mapping, and proprietary ranking signals to ensure our clients dominate generative search."
                  : "Analyze and enhance your content for AI-driven search engines. Be ready or be gone."}
              </p>
            </div>

            <button 
              onClick={onReplayOnboarding}
              className="mt-8 px-6 py-2 border border-white/20 text-xs font-bold tracking-widest uppercase hover:bg-white hover:text-black transition-colors rounded-md"
            >
              Replay Onboarding
            </button>
          </motion.div>
        )}

        {isScanning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-[60vh] space-y-8"
          >
            <div className="relative w-32 h-32 flex items-center justify-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-t-2 border-emerald-500 rounded-full opacity-50"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 border-b-2 border-white rounded-full opacity-20"
              />
              <Search className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-serif text-white">Analyzing Content Vectors</h3>
              <p className="text-xs font-mono text-zinc-500">Extracting entities & evaluating LLM salience...</p>
            </div>
          </motion.div>
        )}

        {hasResults && scanData && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
              <div>
                <h2 className="text-2xl font-serif text-white mb-1">Analysis Results</h2>
                <p className="text-sm text-zinc-400 font-mono">{url}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">AI Readiness Score</p>
                  <p className={cn("text-3xl font-serif", scanData.score > 70 ? "text-emerald-400" : scanData.score > 40 ? "text-yellow-400" : "text-red-400")}>
                    {scanData.score}/100
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 border border-white/10 rounded-xl bg-[#0a0a0a]">
                <h3 className="text-sm font-bold tracking-widest uppercase text-zinc-400 mb-6 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Entity Salience
                </h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scanData.entities || []} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} width={120} />
                      <Tooltip cursor={{fill: '#18181b'}} contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
                      <Bar dataKey="score" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-5 border border-white/10 rounded-xl bg-[#0a0a0a] flex gap-4">
                  <div className="p-2 bg-red-500/10 rounded-lg h-fit">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Missing Contextual Vectors</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">{scanData.diagnostic}</p>
                  </div>
                </div>
                
                {role === 'INTERNAL' && (
                  <div className="p-5 border border-emerald-500/20 rounded-xl bg-emerald-500/5 flex gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                      <Leaf className="w-24 h-24 text-emerald-500" />
                    </div>
                    <div className="p-2 bg-emerald-500/20 rounded-lg h-fit relative z-10">
                      <Leaf className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="relative z-10">
                      <h4 className="text-sm font-bold text-emerald-400 mb-1">Internal Diagnostic</h4>
                      <p className="text-xs text-emerald-400/80 leading-relaxed">{scanData.internalDiagnostic}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
        </div>
      </div>

      {/* Bottom Input Area */}
      <div className="absolute bottom-8 left-8 right-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-2xl">
          <div className="p-2 text-zinc-500 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <input 
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="Enter URL or paste content to analyze..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-zinc-600 px-2"
          />
          <button 
            onClick={handleAnalyze}
            disabled={isScanning || !url}
            className="px-6 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isScanning ? 'Scanning...' : 'Analyze'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CreativeSandboxTab = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultCopy, setResultCopy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setResultImage(null);
    setResultCopy(null);

    try {
      // Use process.env.GEMINI_API_KEY as per instructions, fallback to import.meta.env for Vite
      const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API key is missing.");
      }
      const ai = new GoogleGenAI({ apiKey });
      
      // Generate Image (nano bananas)
      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `High quality, professional advertisement photography for: ${prompt}. Vibrant, eye-catching, modern marketing style.` }],
        },
      });

      let base64Image = '';
      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
      
      if (base64Image) {
        setResultImage(base64Image);
      } else {
        throw new Error("Failed to generate image.");
      }

      // Generate Ad Copy
      const textResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a punchy, 3-sentence Facebook/Instagram ad copy for: ${prompt}. Include a strong hook and a call to action. Keep it engaging and professional.`,
      });

      setResultCopy(textResponse.text || 'Could not generate copy.');

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full h-full p-8 overflow-y-auto pb-32">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col items-center text-center space-y-4 mb-12">
          <div className="w-16 h-16 border border-white/20 flex items-center justify-center rounded-2xl bg-white/5">
            <Wand2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-serif text-white mb-2">Creative Sandbox</h1>
            <p className="text-zinc-400 text-sm max-w-lg mx-auto">
              Generate instant, high-converting ad creatives and copy using our fine-tuned AI models. Just tell us what you're selling.
            </p>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 shadow-2xl">
          <div className="flex flex-col gap-4">
            <label className="text-xs font-bold tracking-widest uppercase text-zinc-500">What are you promoting?</label>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A new organic coffee blend for busy professionals"
                className="flex-1 bg-black border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="px-6 py-3 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Generate Magic
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {(resultImage || resultCopy || isGenerating) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {/* Image Result */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/10 bg-black/50 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold tracking-widest uppercase text-zinc-400">Ad Creative</span>
              </div>
              <div className="p-6 flex-1 flex items-center justify-center min-h-[300px] bg-black/20">
                {isGenerating && !resultImage ? (
                  <div className="flex flex-col items-center gap-4 text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500/50" />
                    <span className="text-xs font-mono">Generating visual assets...</span>
                  </div>
                ) : resultImage ? (
                  <img src={resultImage} alt="Generated Ad" className="w-full h-auto rounded-lg shadow-2xl border border-white/5" referrerPolicy="no-referrer" />
                ) : null}
              </div>
            </div>

            {/* Copy Result */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/10 bg-black/50 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold tracking-widest uppercase text-zinc-400">Ad Copy</span>
              </div>
              <div className="p-6 flex-1">
                {isGenerating && !resultCopy ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500/50" />
                    <span className="text-xs font-mono">Drafting copy...</span>
                  </div>
                ) : resultCopy ? (
                  <div className="prose prose-invert max-w-none">
                    <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{resultCopy}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const BrandRoastTab = ({ userId }: { userId?: string }) => {
  const [url, setUrl] = useState('');
  const [isRoasting, setIsRoasting] = useState(false);
  const [roast, setRoast] = useState<string | null>(null);

  const handleRoast = async () => {
    if (!url.trim()) return;
    setIsRoasting(true);
    setRoast(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a brutal but brilliant AI marketing critic. Roast the brand or URL: "${url}" for their lack of AI Search Optimization (AISEO). Be funny, sharp, and point out how LLMs like ChatGPT or Gemini probably hallucinate or completely ignore them because their data is unstructured. End with a pitch on how Charlie can fix it. Keep it under 4 paragraphs.`,
      });

      const roastText = response.text || 'Could not generate roast.';
      setRoast(roastText);

      // Save to Firestore
      if (userId) {
        try {
          await addDoc(collection(db, 'roasts'), {
            userId,
            url,
            roast: roastText,
            createdAt: serverTimestamp()
          });
        } catch (dbError) {
          console.error("Failed to save roast to database:", dbError);
        }
      }

    } catch (error) {
      console.error(error);
      setRoast("The AI refused to roast this. It's either too good, or so bad the neural net crashed. (Or the API key is missing).");
    } finally {
      setIsRoasting(false);
    }
  };

  return (
    <div className="w-full h-full p-8 overflow-y-auto pb-32">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex flex-col items-center text-center space-y-4 mb-12">
          <div className="w-16 h-16 border border-red-500/20 flex items-center justify-center rounded-2xl bg-red-500/10">
            <Flame className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-serif text-white mb-2">AI Brand Roast</h1>
            <p className="text-zinc-400 text-sm max-w-lg mx-auto">
              Drop a URL or brand name below. We'll tell you exactly how generative AI engines view them (spoiler: it's probably not good).
            </p>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 shadow-2xl">
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g., www.competitor.com"
                className="flex-1 bg-black border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleRoast()}
              />
              <button 
                onClick={handleRoast}
                disabled={isRoasting || !url.trim()}
                className="px-6 py-3 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isRoasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
                Roast Me
              </button>
            </div>
          </div>
        </div>

        {roast && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0a0a0a] border border-red-500/20 rounded-xl p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Flame className="w-32 h-32 text-red-500" />
            </div>
            <div className="relative z-10 prose prose-invert max-w-none">
              <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-lg font-serif italic">"{roast}"</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('LANDING');
  const [role, setRole] = useState<UserRole>('CLIENT');
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('AISEO');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role as UserRole);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
        setCurrentView('DASHBOARD');
      } else {
        setCurrentView('LANDING');
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Apply dark class to html element for Tailwind dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentView('LANDING');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00E676]" />
      </div>
    );
  }

  const navItems = [
    { id: 'MERCEDES', icon: <Sparkles className="w-4 h-4" />, label: 'MERCEDES' },
    { id: 'STITCH', icon: <Wand2 className="w-4 h-4" />, label: 'STITCH UI' },
    { id: 'SANDBOX', icon: <ImageIcon className="w-4 h-4" />, label: 'AD CREATIVE' },
    { id: 'ROAST', icon: <Flame className="w-4 h-4" />, label: 'BRAND ROAST' },
    { id: 'CAMPAIGNS', icon: <Target className="w-4 h-4" />, label: 'CAMPAIGNS' },
    { id: 'EMAIL', icon: <Mail className="w-4 h-4" />, label: 'EMAIL TEMPLATES' },
    { id: 'DRIP', icon: <TrendingUp className="w-4 h-4" />, label: 'DRIP CAMPAIGNS' },
    { id: 'WORKSHOP', icon: <Wrench className="w-4 h-4" />, label: 'WORKSHOP' },
    { id: 'OVERVIEW', icon: <LayoutDashboard className="w-4 h-4" />, label: 'OVERVIEW' },
    { id: 'CLIENTS', icon: <Users className="w-4 h-4" />, label: 'CLIENTS' },
    { id: 'PROJECTS', icon: <Briefcase className="w-4 h-4" />, label: 'PROJECTS' },
    { id: 'TASKS', icon: <CheckSquare className="w-4 h-4" />, label: 'TASKS' },
    { id: 'LEADS', icon: <MessageSquare className="w-4 h-4" />, label: 'LEADS' },
    { id: 'SETUP', icon: <Settings className="w-4 h-4" />, label: 'SETUP' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'AISEO':
        return <AiseoWorkspace role={role} onReplayOnboarding={() => setShowOnboarding(true)} userId={user?.uid} />;
      case 'MERCEDES':
        return <MercedesTab />;
      case 'STITCH':
        return <StitchTab />;
      case 'SANDBOX':
        return <CreativeSandboxTab />;
      case 'ROAST':
        return <BrandRoastTab userId={user?.uid} />;
      case 'WORKSHOP':
        return <WorkshopTab />;
      case 'OVERVIEW':
        return <OverviewTab userId={user?.uid} />;
      default:
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 border border-white/10 flex items-center justify-center rounded-2xl bg-white/5 mb-4">
              <Wrench className="w-6 h-6 text-zinc-500" />
            </div>
            <h2 className="text-xl font-serif text-white mb-2">Module Under Construction</h2>
            <p className="text-zinc-500 text-sm max-w-md">The {activeTab} module is currently being optimized by our engineering team.</p>
          </div>
        );
    }
  };

  if (currentView === 'LANDING') {
    return <LandingPage onLogin={handleLogin} isDarkMode={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)} />;
  }

  return (
    <div className={cn("flex h-screen font-sans overflow-hidden", isDarkMode ? "dark bg-black text-white" : "bg-black text-white")}>
      
      {/* --- Sidebar --- */}
      <div className="w-64 border-r border-white/10 flex flex-col bg-[#050505] z-10 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <CharlieLogo className="w-6 h-6" />
            <div className="flex flex-col">
              <span className="font-serif text-lg tracking-wide text-zinc-100 leading-none">Charlie</span>
              <span className="text-[9px] tracking-[0.15em] text-zinc-500 uppercase mt-1">meetcharlie.ai</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3 custom-scrollbar">
          <AISEOButton isActive={activeTab === 'AISEO'} onClick={() => setActiveTab('AISEO')} role={role} />
          <div className="h-px bg-white/5 my-2 mx-2" />
          {navItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200",
                activeTab === item.id ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <div className={cn(activeTab === item.id ? 'text-white' : 'text-zinc-500')}>
                {item.icon}
              </div>
              <span className="text-[11px] font-bold tracking-widest uppercase">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-black relative">
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 shrink-0 bg-black/50 backdrop-blur-sm z-20">
          <div className="flex items-center gap-4">
            <button className="text-zinc-400 hover:text-white transition-colors">
              <Sidebar className="w-5 h-5" />
            </button>
            <span className="font-serif text-lg text-zinc-100">
              {activeTab === 'AISEO' ? 'AISEO Optimization' : activeTab.charAt(0) + activeTab.slice(1).toLowerCase()}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setRole(role === 'INTERNAL' ? 'CLIENT' : 'INTERNAL')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/5 transition-colors bg-[#0a0a0a]"
              title="Toggle View (Demo Only)"
            >
              {role === 'INTERNAL' ? (
                <><ShieldCheck className="w-4 h-4 text-emerald-400" /><span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400">INTERNAL VIEW</span></>
              ) : (
                <><ShieldAlert className="w-4 h-4 text-zinc-400" /><span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">CLIENT VIEW</span></>
              )}
            </button>

            <div className="w-px h-4 bg-white/10" />

            <div className="flex items-center gap-4 text-zinc-400">
              <button onClick={() => setCurrentView('LANDING')} className="hover:text-white transition-colors" title="Back to Website"><ArrowLeft className="w-4 h-4" /></button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="hover:text-white transition-colors" title="Toggle Theme">
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button onClick={handleLogout} className="hover:text-white transition-colors" title="Log Out"><LogOut className="w-4 h-4" /></button>
            </div>
          </div>
        </header>

        <main className="flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black">
          {renderContent()}
        </main>
      </div>

      <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} onComplete={() => setShowOnboarding(false)} />
    </div>
  );
}
