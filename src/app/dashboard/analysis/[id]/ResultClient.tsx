"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Code2,
  Copy,
  FileWarning,
  PackageMinus,
  Download,
  FolderTree,
  AlertTriangle,
  Layers,
  Zap,
  ShieldAlert,
  ShieldCheck,
  Shield,
  FileCode,
  Search,
  Check,
  Wrench,
} from "lucide-react";
import { HealthRing, LanguagePie, ScoreBreakdown, IssuesSummary } from "@/components/ScoreChart";
import FileTree from "@/components/FileTree";
import toast from "react-hot-toast";

const TABS = ['Overview', 'Security', 'File Tree', 'Cleanup', 'Dependencies', 'Duplicates', 'Organizer', 'Issues'];

export default function ResultClient({ initialData }: { initialData: any }) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState('Overview');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPatchId, setCopiedPatchId] = useState<string | null>(null);

  const handleDownloadCleanup = () => {
    const files = data.unusedFiles?.map((f: any) => `rm "${f.path}"`).join('\n');
    if (!files) return toast.error("No unused files to cleanup");
    const script = `#!/bin/bash\n\n# RepoMedic Cleanup Script\n# Run at project root\n\n${files}\n\necho "Cleanup complete!"`;
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleanup_${data.repoName}.sh`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Cleanup script downloaded");
  };

  const copyPatch = (id: string, patch: string) => {
    if (!patch) return;
    navigator.clipboard.writeText(patch);
    setCopiedPatchId(id);
    toast.success("Remediation snippet copied!");
    setTimeout(() => setCopiedPatchId(null), 2500);
  };

  const vulnerabilities = data.vulnerabilities || [];
  const filteredVulns = vulnerabilities.filter((v: any) => {
    if (severityFilter !== 'all' && v.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && v.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${v.title || ''} ${v.description || ''} ${v.file || ''} ${v.cwe || ''} ${v.owasp || ''} ${v.ruleId || ''} ${v.snippet || ''} ${v.impact || ''}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  const critCount = vulnerabilities.filter((v: any) => v.severity === 'critical').length;
  const highCount = vulnerabilities.filter((v: any) => v.severity === 'high').length;
  const medCount  = vulnerabilities.filter((v: any) => v.severity === 'medium').length;
  const lowCount  = vulnerabilities.filter((v: any) => v.severity === 'low').length;

  return (
    <div className="min-h-screen bg-bg text-white font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto fade-up">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/history" className="p-2 rounded-lg bg-surface hover:bg-surface2 border border-border text-muted hover:text-[#e8e8f4] transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-white">{data.repoFullName}</h1>
              <p className="text-muted text-sm font-mono flex items-center gap-2 mt-1">
                Branch: {data.branch} <span className="opacity-50">|</span> Analyzed: {new Date(data.analyzedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleDownloadCleanup} className="btn-ghost" disabled={!data.unusedFiles?.length}>
              <Download size={16} /> Cleanup Script
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-4 mb-6">
          {TABS.map(tab => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  active ? "bg-accent/10 text-accent border border-accent/20" : "bg-surface border border-transparent text-muted hover:text-[#e8e8f4] hover:bg-surface2"
                }`}
              >
                {tab === 'Security' && (
                  <Shield size={14} className={critCount > 0 || highCount > 0 ? "text-red-400" : "text-emerald-400"} />
                )}
                <span>{tab}</span>
                {tab === 'Security' && vulnerabilities.length > 0 && (
                  <span className={`ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full font-mono ${
                    critCount > 0 ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}>
                    {vulnerabilities.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="fade-up stagger">
          
          {/* Overview Tab */}
          {activeTab === 'Overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card-sm flex flex-col items-center justify-center py-10">
                  <h2 className="label mb-6 self-start w-full px-2">Overall Health</h2>
                  <HealthRing score={data.healthScore?.total || 0} />
                </div>
                <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card-sm">
                    <h2 className="label mb-4">Score Breakdown</h2>
                    <ScoreBreakdown breakdown={data.healthScore?.breakdown} />
                  </div>
                  <div className="card-sm">
                    <h2 className="label mb-4">Languages</h2>
                    <LanguagePie data={data.languages} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="card-sm flex flex-col items-center text-center p-5 hover:border-accent/30 transition-colors">
                  <Code2 size={24} className="text-accent mb-3" />
                  <span className="text-3xl font-display font-bold">{data.stats?.totalFiles || 0}</span>
                  <span className="label mt-1">Files</span>
                </div>
                <div className="card-sm flex flex-col items-center text-center p-5 hover:border-blue-400/30 transition-colors">
                  <Clock size={24} className="text-blue-400 mb-3" />
                  <span className="text-3xl font-display font-bold">{data.stats?.totalLines || 0}</span>
                  <span className="label mt-1">Lines</span>
                </div>
                <div
                  className="card-sm flex flex-col items-center text-center p-5 hover:border-red-500/40 transition-colors cursor-pointer"
                  onClick={() => setActiveTab('Security')}
                >
                  <ShieldAlert size={24} className={critCount > 0 || highCount > 0 ? "text-red-400 mb-3" : "text-emerald-400 mb-3"} />
                  <span className={`text-3xl font-display font-bold ${critCount > 0 || highCount > 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {vulnerabilities.length}
                  </span>
                  <span className="label mt-1">Vulnerabilities</span>
                </div>
                <div className="card-sm flex flex-col items-center text-center p-5 hover:border-red-400/30 transition-colors">
                  <FileWarning size={24} className="text-red-400 mb-3" />
                  <span className="text-3xl font-display font-bold">{data.stats?.unusedFiles || 0}</span>
                  <span className="label mt-1">Unused</span>
                </div>
                <div className="card-sm flex flex-col items-center text-center p-5 hover:border-purple-400/30 transition-colors">
                  <PackageMinus size={24} className="text-purple-400 mb-3" />
                  <span className="text-3xl font-display font-bold">{data.dependencies?.unused?.length || 0}</span>
                  <span className="label mt-1">Unused Deps</span>
                </div>
                <div className="card-sm flex flex-col items-center text-center p-5 hover:border-amber-400/30 transition-colors">
                  <Copy size={24} className="text-amber-400 mb-3" />
                  <span className="text-3xl font-display font-bold">{data.duplicates?.length || 0}</span>
                  <span className="label mt-1">Dupes</span>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'Security' && (
            <div className="space-y-6">
              {/* Header Posture Card */}
              <div className="card border-red-500/20 bg-gradient-to-r from-red-500/10 via-surface to-surface flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="text-red-400" size={24} />
                    <h2 className="text-xl font-bold font-display text-white">
                      Deep Security & Vulnerability Audit
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-accent/20 text-accent border border-accent/30">
                      SAST Engine v2.0
                    </span>
                  </div>
                  <p className="text-muted text-sm max-w-2xl leading-relaxed">
                    Automated static analysis, taint data-flow tracking, credential leak detection, and supply-chain vulnerability auditing mapped to CWE, OWASP Top 10, and SANS Top 25.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="px-4 py-2 rounded-xl bg-surface2 border border-border flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-mono text-muted tracking-wider">Security Score</div>
                      <div className="text-lg font-bold font-mono text-accent">
                        {data.healthScore?.breakdown?.security !== undefined ? data.healthScore.breakdown.security : 100}/100
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-sm font-bold font-mono border ${
                      (data.healthScore?.breakdown?.security ?? 100) >= 90
                        ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                        : (data.healthScore?.breakdown?.security ?? 100) >= 75
                        ? 'text-blue-400 bg-blue-500/15 border-blue-500/30'
                        : (data.healthScore?.breakdown?.security ?? 100) >= 60
                        ? 'text-amber-400 bg-amber-500/15 border-amber-500/30'
                        : 'text-red-400 bg-red-500/15 border-red-500/30'
                    }`}>
                      Grade {(data.healthScore?.breakdown?.security ?? 100) >= 95 ? 'A+' : (data.healthScore?.breakdown?.security ?? 100) >= 90 ? 'A' : (data.healthScore?.breakdown?.security ?? 100) >= 80 ? 'B' : (data.healthScore?.breakdown?.security ?? 100) >= 70 ? 'C' : (data.healthScore?.breakdown?.security ?? 100) >= 60 ? 'D' : 'F'}
                    </div>
                  </div>

                  <div className="px-3.5 py-2 rounded-xl bg-surface2 border border-border text-xs font-mono space-y-0.5">
                    <div className="text-muted">Files: <span className="text-white font-bold">{data.stats?.totalFiles || 0}</span></div>
                    <div className="text-muted">Density: <span className="text-accent font-bold">{((vulnerabilities.length / Math.max(data.stats?.totalLines || 1, 1)) * 1000).toFixed(1)}</span> / 1k LOC</div>
                  </div>
                </div>
              </div>

              {/* Summary Severity Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setSeverityFilter(severityFilter === 'critical' ? 'all' : 'critical')}
                  className={`card-sm p-4 text-center transition-all ${
                    severityFilter === 'critical' ? 'ring-2 ring-red-500 bg-red-500/15' : 'hover:border-red-500/40'
                  }`}
                >
                  <span className="text-2xl font-bold font-mono text-red-500">{critCount}</span>
                  <span className="block text-xs font-semibold text-red-400 mt-1 uppercase tracking-wide">Critical</span>
                </button>
                <button
                  onClick={() => setSeverityFilter(severityFilter === 'high' ? 'all' : 'high')}
                  className={`card-sm p-4 text-center transition-all ${
                    severityFilter === 'high' ? 'ring-2 ring-orange-500 bg-orange-500/15' : 'hover:border-orange-500/40'
                  }`}
                >
                  <span className="text-2xl font-bold font-mono text-orange-400">{highCount}</span>
                  <span className="block text-xs font-semibold text-orange-400 mt-1 uppercase tracking-wide">High</span>
                </button>
                <button
                  onClick={() => setSeverityFilter(severityFilter === 'medium' ? 'all' : 'medium')}
                  className={`card-sm p-4 text-center transition-all ${
                    severityFilter === 'medium' ? 'ring-2 ring-amber-500 bg-amber-500/15' : 'hover:border-amber-500/40'
                  }`}
                >
                  <span className="text-2xl font-bold font-mono text-amber-400">{medCount}</span>
                  <span className="block text-xs font-semibold text-amber-400 mt-1 uppercase tracking-wide">Medium</span>
                </button>
                <button
                  onClick={() => setSeverityFilter(severityFilter === 'low' ? 'all' : 'low')}
                  className={`card-sm p-4 text-center transition-all ${
                    severityFilter === 'low' ? 'ring-2 ring-blue-500 bg-blue-500/15' : 'hover:border-blue-500/40'
                  }`}
                >
                  <span className="text-2xl font-bold font-mono text-blue-400">{lowCount}</span>
                  <span className="block text-xs font-semibold text-blue-400 mt-1 uppercase tracking-wide">Low</span>
                </button>
              </div>

              {/* Search & Category Filter Controls */}
              <div className="card p-4 space-y-3 border border-border">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
                    <input
                      type="text"
                      placeholder="Search vulnerabilities by keyword, file, CVE, CWE, or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-surface2 rounded-xl border border-border text-sm text-white placeholder-muted focus:outline-none focus:border-accent"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="text-xs font-mono text-muted whitespace-nowrap self-center">
                    Showing <span className="text-white font-bold">{filteredVulns.length}</span> of {vulnerabilities.length} findings
                  </div>
                </div>

                {/* Category Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 pt-1">
                  {[
                    { id: 'all', label: 'All Categories' },
                    { id: 'secret-leak', label: 'Secrets' },
                    { id: 'injection', label: 'Injections' },
                    { id: 'taint-flow', label: 'Taint Flow' },
                    { id: 'ai-security', label: 'AI Security' },
                    { id: 'code-execution', label: 'Code Exec' },
                    { id: 'ssrf', label: 'SSRF' },
                    { id: 'path-traversal', label: 'Path Traversal' },
                    { id: 'xss', label: 'XSS' },
                    { id: 'auth-bypass', label: 'Auth & Access' },
                    { id: 'iac-devops', label: 'DevSecOps & IaC' },
                    { id: 'dependency', label: 'Supply Chain' },
                    { id: 'crypto', label: 'Cryptography' },
                    { id: 'misconfiguration', label: 'Misconfig' },
                  ].map(cat => {
                    const active = categoryFilter === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setCategoryFilter(cat.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                          active
                            ? 'bg-accent text-white shadow-sm'
                            : 'bg-surface2 text-muted hover:text-white hover:bg-surface border border-border/60'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vulnerabilities List */}
              {filteredVulns.length > 0 ? (
                <div className="space-y-4">
                  {filteredVulns.map((vuln: any, idx: number) => {
                    const isCrit = vuln.severity === 'critical';
                    const isHigh = vuln.severity === 'high';
                    const isMed  = vuln.severity === 'medium';
                    const badgeClass = isCrit
                      ? 'bg-red-500/20 text-red-400 border-red-500/40'
                      : isHigh
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                      : isMed
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/40';

                    const cvssColor = (vuln.cvss ?? 0) >= 9.0
                      ? 'bg-red-500/20 text-red-400 border-red-500/40'
                      : (vuln.cvss ?? 0) >= 7.0
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                      : (vuln.cvss ?? 0) >= 4.0
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/40';

                    return (
                      <div key={idx} className="card p-5 border border-border hover:border-border/80 transition-all space-y-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border uppercase ${badgeClass}`}>
                              {vuln.severity}
                            </span>
                            {vuln.cvss && (
                              <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${cvssColor}`}>
                                CVSS {vuln.cvss.toFixed(1)}
                              </span>
                            )}
                            <span className="tag-purple text-xs font-mono">{vuln.cwe}</span>
                            {vuln.owasp && <span className="tag-blue text-xs font-mono">{vuln.owasp.split('-')[0]}</span>}
                            {vuln.sans && <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">SANS Top 25</span>}
                            <span className="tag-gray text-xs">{vuln.category}</span>
                            <h3 className="font-semibold text-base text-white">{vuln.title}</h3>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-mono text-muted bg-surface2 px-2.5 py-1 rounded border border-border">
                            <FileCode size={13} className="text-muted" />
                            <span>{vuln.file}:{vuln.line}</span>
                          </div>
                        </div>

                        {/* Source to Sink Trace if available */}
                        {vuln.sourceSinkFlow && (
                          <div className="bg-purple-950/20 border border-purple-500/30 rounded-lg p-3 text-xs font-mono space-y-1.5">
                            <div className="text-purple-300 font-bold flex items-center gap-1.5">
                              <span>↳ Taint Data Flow Path:</span>
                              <span className="text-white bg-purple-500/20 px-1.5 py-0.5 rounded text-[10px]">Variable: {vuln.sourceSinkFlow.taintedVar}</span>
                            </div>
                            <div className="text-muted">Source: <span className="text-purple-200">{vuln.sourceSinkFlow.source}</span></div>
                            <div className="text-muted">Sink:   <span className="text-red-300">{vuln.sourceSinkFlow.sink}</span></div>
                          </div>
                        )}

                        {vuln.snippet && (
                          <pre className="bg-bg/95 border border-border/80 rounded-lg p-3 font-mono text-xs overflow-x-auto text-[#e8e8f4] whitespace-pre leading-relaxed custom-scrollbar">
                            <code>{vuln.snippet}</code>
                          </pre>
                        )}

                        <p className="text-sm text-muted leading-relaxed">
                          {vuln.description}
                        </p>

                        {vuln.impact && (
                          <div className="text-xs text-red-300/90 leading-relaxed bg-red-500/5 border border-red-500/20 rounded-lg p-2.5 flex items-start gap-1.5">
                            <span className="font-bold text-red-400 shrink-0">Impact:</span>
                            <span>{vuln.impact}</span>
                          </div>
                        )}

                        {vuln.remediation && (
                          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 text-xs flex items-start gap-2 text-emerald-300">
                            <span className="font-bold text-emerald-400 shrink-0">Remediation:</span>
                            <span>{vuln.remediation}</span>
                          </div>
                        )}

                        {vuln.suggestedPatch && (
                          <div className="bg-surface2/80 border border-accent/20 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-accent flex items-center gap-1.5">
                                <Wrench size={13} />
                                Suggested Quick Fix:
                              </span>
                              <button
                                onClick={() => copyPatch(vuln.id, vuln.suggestedPatch)}
                                className="px-2.5 py-1 rounded bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 text-xs font-mono flex items-center gap-1.5 transition-all"
                              >
                                {copiedPatchId === vuln.id ? (
                                  <>
                                    <Check size={12} className="text-emerald-400" />
                                    <span className="text-emerald-400">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span>Copy Patch</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="p-2 rounded bg-bg font-mono text-xs text-emerald-300 overflow-x-auto custom-scrollbar">
                              <code>{vuln.suggestedPatch}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="card py-16 text-center space-y-3 flex flex-col items-center">
                  <ShieldCheck size={48} className="text-emerald-400" />
                  <h3 className="text-lg font-bold text-white">No Matching Vulnerabilities!</h3>
                  <p className="text-sm text-muted max-w-md">
                    {searchQuery
                      ? `No vulnerabilities matching "${searchQuery}" in ${categoryFilter} category.`
                      : severityFilter === 'all'
                      ? 'No security vulnerabilities, secret leaks, or insecure dependencies were detected in this repository.'
                      : `No ${severityFilter} severity vulnerabilities were found.`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* File Tree Tab */}
          {activeTab === 'File Tree' && (
            <div className="card h-[70vh] overflow-hidden flex flex-col">
              <h2 className="label mb-4 flex items-center gap-2"><FolderTree size={16} /> Repository Structure</h2>
              <div className="flex-1 overflow-auto custom-scrollbar pr-4">
                <FileTree nodes={data.fileTree || []} />
              </div>
            </div>
          )}

          {/* Cleanup Tab */}
          {activeTab === 'Cleanup' && (
            <div className="card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold font-display flex items-center gap-2"><FileWarning className="text-danger" size={24}/> Unused Files Cleanup</h2>
                  <p className="text-muted text-sm mt-1">Detected {data.unusedFiles?.length || 0} orphaned or temporary files safe to delete.</p>
                </div>
                <button onClick={handleDownloadCleanup} className="btn-primary" disabled={!data.unusedFiles?.length}>
                  <Download size={16} /> Download .sh Script
                </button>
              </div>

              {data.unusedFiles && data.unusedFiles.length > 0 ? (
                <div className="overflow-x-auto max-h-[60vh] overflow-y-auto custom-scrollbar border border-border rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-surface2 text-xs">
                        <th className="py-3 px-4 label font-semibold text-[#e8e8f4]">File Path</th>
                        <th className="py-3 px-4 label font-semibold text-[#e8e8f4]">Size (Bytes)</th>
                        <th className="py-3 px-4 label font-semibold text-[#e8e8f4]">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-sm">
                      {data.unusedFiles.map((f: any, i: number) => (
                        <tr key={i} className="border-b border-border hover:bg-surface2 transition-colors">
                          <td className="py-3 px-4 text-danger">{f.path}</td>
                          <td className="py-3 px-4 text-muted">{f.size}</td>
                          <td className="py-3 px-4 text-muted">{f.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-20 text-muted">No unused files detected. Great job!</div>
              )}
            </div>
          )}

          {/* Dependencies Tab */}
          {activeTab === 'Dependencies' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h2 className="text-xl font-bold font-display mb-2 flex items-center gap-2 text-emerald-400"><Zap size={20} /> Active Dependencies</h2>
                <p className="text-muted text-sm mb-4">Packages currently imported in code.</p>
                <div className="space-y-2 max-h-[60vh] overflow-auto custom-scrollbar pr-2">
                  {data.dependencies?.used?.map((d: any, i: number) => (
                    <div key={i} className="p-3 bg-surface2 border border-border rounded-lg flex justify-between">
                      <span className="font-mono text-sm font-semibold">{d.name}</span>
                      <span className="font-mono text-xs text-muted">{d.version}</span>
                    </div>
                  ))}
                  {!data.dependencies?.used?.length && <p className="text-muted text-sm">No dependencies tracked.</p>}
                </div>
              </div>
              <div className="card border-red-500/20 bg-red-500/5">
                <h2 className="text-xl font-bold font-display mb-2 flex items-center gap-2 text-red-400"><PackageMinus size={20} /> Unused Dependencies</h2>
                <p className="text-red-400/70 text-sm mb-4">Declared in package file but never imported.</p>
                <div className="space-y-2 max-h-[60vh] overflow-auto custom-scrollbar pr-2">
                  {data.dependencies?.unused?.map((d: any, i: number) => (
                    <div key={i} className="p-3 bg-bg border border-red-500/20 rounded-lg flex justify-between">
                      <span className="font-mono text-sm font-semibold text-red-400">{d.name}</span>
                      <span className="font-mono text-xs text-red-400/50">{d.version}</span>
                    </div>
                  ))}
                  {!data.dependencies?.unused?.length && <p className="text-emerald-400 text-sm">All dependencies are utilized!</p>}
                </div>
              </div>
            </div>
          )}

          {/* Duplicates Tab */}
          {activeTab === 'Duplicates' && (
            <div className="card">
              <div className="mb-6">
                <h2 className="text-xl font-bold font-display flex items-center gap-2"><Copy className="text-amber-400" size={24}/> Duplicate Blocks</h2>
                <p className="text-muted text-sm mt-1">Found {data.duplicates?.length || 0} identical code blocks across multiple files.</p>
              </div>
              {data.duplicates?.length ? (
                <div className="space-y-6 max-h-[65vh] overflow-auto custom-scrollbar pr-4">
                  {data.duplicates.map((d: any, i: number) => (
                    <div key={i} className="p-5 bg-surface2 border border-amber-500/20 rounded-xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50"></div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="tag-yellow">Match ID: {d.hash.substring(0,6)}</span>
                        <span className="text-xs font-mono text-muted">{d.lines} identical lines</span>
                      </div>
                      <ul className="space-y-2">
                        {d.files.map((f: string, j: number) => (
                          <li key={j} className="flex items-center gap-2 text-sm font-mono bg-bg py-2 px-3 rounded border border-border">
                            <span className="text-amber-400 shrink-0">↳</span>
                            <span className="truncate">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-muted">No duplicate code blocks found!</div>
              )}
            </div>
          )}

          {/* Organizer Tab */}
          {activeTab === 'Organizer' && (
            <div className="card">
              <h2 className="text-xl font-bold font-display mb-2 flex items-center gap-2 text-blue-400"><Layers size={24}/> Smart Reorganizer</h2>
              <p className="text-muted text-sm mb-6">AI-suggested folder structure for {data.organizerSuggestion?.primaryLanguage || 'your project'}.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="label mb-3">Suggested Target Structure</h3>
                  <div className="p-4 bg-surface2 rounded-xl border border-border font-mono text-sm space-y-3">
                    {Object.entries(data.organizerSuggestion?.suggestedStructure || {}).map(([path, desc]: any) => (
                      <div key={path}>
                        <div className="text-blue-400 font-bold">{path}</div>
                        <div className="text-muted text-xs ml-4"># {desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="label mb-3">Recommended Actions</h3>
                  <div className="space-y-2">
                    {data.organizerSuggestion?.moveOperations?.map((op: any, i: number) => (
                      <div key={i} className="p-3 bg-surface2 rounded-lg border border-border text-xs font-mono">
                        <span className="text-danger line-through opacity-70">{op.from}</span>
                        <br/>
                        <span className="text-emerald-400 mt-1 inline-block">→ {op.to}</span>
                      </div>
                    ))}
                    {!data.organizerSuggestion?.moveOperations?.length && (
                      <p className="text-muted text-sm py-4">No reorganization actions needed.</p>
                    )}
                  </div>
                  {data.organizerSuggestion?.estimatedCleanup && (
                    <div className="mt-6 p-4 rounded-xl bg-accent/10 border border-accent/20 text-accent font-semibold text-sm text-center">
                      {data.organizerSuggestion.estimatedCleanup}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Issues Tab */}
          {activeTab === 'Issues' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="card-sm col-span-1">
                <h2 className="label mb-6">Issue Severity Summary</h2>
                <IssuesSummary issues={data.issues} />
              </div>
              <div className="card-sm col-span-1 lg:col-span-2">
                <h2 className="label mb-4">Detailed Issue Log</h2>
                {data.issues && data.issues.length > 0 ? (
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {data.issues.map((issue: any) => (
                      <div key={issue.id} className={`p-4 rounded-xl bg-surface border ${
                        issue.severity === 'critical' ? 'border-red-600/50 bg-red-500/5' :
                        issue.severity === 'high' ? 'border-red-500/30' :
                        issue.severity === 'medium' ? 'border-amber-500/30' : 'border-emerald-500/30'
                      }`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <AlertTriangle size={16} className={`${
                            issue.severity === 'critical' ? 'text-red-600' :
                            issue.severity === 'high' ? 'text-red-500' :
                            issue.severity === 'medium' ? 'text-amber-500' : 'text-emerald-500'
                          }`} />
                          <h3 className="font-semibold text-sm">{issue.title}</h3>
                          <span className="ml-auto tag-purple">{issue.category}</span>
                        </div>
                        <p className="text-xs text-muted leading-relaxed pl-6">{issue.description}</p>
                        {issue.remediation && (
                          <p className="text-xs text-emerald-400/90 leading-relaxed pl-6 mt-1.5">
                            <span className="font-bold">Fix: </span>{issue.remediation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted p-8">No issues detected!</div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
