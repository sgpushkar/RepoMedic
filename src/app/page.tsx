"use client";

import { Zap, Code2, Bot, Shield } from "lucide-react";
import { signIn } from "next-auth/react";

const Github = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
    <path d="M9 18c-4.51 2-5-2-7-2"/>
  </svg>
);

const features = [
  { icon: <Github size={18} />,  label: "GitHub OAuth",    desc: "Secure login, access all your repos instantly" },
  { icon: <Code2 size={18} />,   label: "Static Analysis", desc: "File scanning, duplicate detection, dependency audit" },
  { icon: <Bot size={18} />,     label: "AI Explainer",    desc: "GPT-4o reads your codebase and explains everything" },
  { icon: <Shield size={18} />,  label: "Health Score",    desc: "Weighted scoring across 5 dimensions of code quality" },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
      <div className="relative z-10 w-full max-w-4xl fade-up">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-mono mb-8">
            <Zap size={11} /> Intelligent Repository Health Platform
          </div>
          <h1 className="font-display font-bold text-5xl sm:text-7xl tracking-tight leading-[1.05] mb-6">
            Diagnose & heal your<br />
            <span className="text-accent">repositories</span>
          </h1>
          <p className="text-muted text-lg max-w-lg mx-auto leading-relaxed mb-10">
            Connect GitHub. Clone. Analyze. Get AI-powered health reports with
            unused file detection, duplicate code scanning, and dependency audits.
          </p>
          <button
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#e8e8f4] text-black font-bold text-base
                       hover:bg-white hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(232,232,244,0.15)] transition-all"
          >
            <Github size={20} /> Continue with GitHub
          </button>
          <p className="text-muted text-xs mt-4 font-mono">Only reads repository metadata — never writes to your code</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          {features.map((f) => (
            <div key={f.label} className="card-sm flex flex-col gap-3 hover:border-accent/30 transition-all hover:-translate-y-0.5">
              <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">{f.icon}</div>
              <div>
                <h3 className="font-semibold text-sm mb-0.5">{f.label}</h3>
                <p className="text-muted text-xs leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-2">
          {["React", "Next.js", "OpenAI GPT-4o", "GitHub OAuth", "MongoDB"].map((t) => (
            <span key={t} className="tag-purple">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
