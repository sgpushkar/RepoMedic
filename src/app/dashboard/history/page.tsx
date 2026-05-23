"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Trash2, Activity, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

function scoreColor(s: number) { return s >= 80 ? '#00ff9d' : s >= 60 ? '#f59e0b' : '#ef4444'; }
function scoreLabel(s: number) {
  if (s >= 85) return 'Excellent';
  if (s >= 70) return 'Healthy';
  if (s >= 55) return 'Fair';
  if (s >= 40) return 'Needs Work';
  return 'Critical';
}
function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analyze/history');
      const data = await res.json();
      if (data.success) setHistory(data.data);
      else toast.error('Failed to load history');
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await fetch(`/api/analyze/${id}`, { method: 'DELETE' });
      setHistory(h => h.filter(r => r.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={32} className="text-accent animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 fade-up">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl mb-1">Analysis History</h1>
          <p className="text-muted font-mono text-sm">{history.length} past analyses</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push('/dashboard')} className="btn-ghost text-xs gap-1.5">
            <Activity size={13} /> Dashboard
          </button>
          <button onClick={load} className="btn-ghost text-xs gap-1.5">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20">
          <Activity size={40} className="text-muted mx-auto mb-4" />
          <p className="font-semibold mb-1">No analyses yet</p>
          <p className="text-muted font-mono text-sm mb-6">Go analyze a repository to see results here</p>
          <button onClick={() => router.push('/dashboard')} className="btn-primary">Go to Dashboard</button>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {history.map(r => {
            const score = r.healthScore?.total || 0;
            const color = scoreColor(score);
            return (
              <div
                key={r.id}
                onClick={() => router.push(`/dashboard/analysis/${r.id}`)}
                className="card hover:border-accent/40 transition-all hover:-translate-y-0.5 flex items-center gap-4 cursor-pointer group"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center font-display font-bold text-xl shrink-0"
                  style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
                >
                  {score}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold group-hover:text-accent transition-colors">{r.repoName}</span>
                    <span className="text-xs font-mono text-muted">{r.branch}</span>
                    {r.languages?.[0] && <span className="tag-purple text-[10px]">{r.languages[0].name}</span>}
                    <span className="text-xs font-mono text-muted ml-auto">{timeAgo(r.analyzedAt)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono text-muted">
                    <span>{r.stats?.totalFiles || 0} files</span>
                    {r.stats?.unusedFiles > 0 && <span className="text-danger">{r.stats.unusedFiles} unused</span>}
                    {r.stats?.duplicateBlocks > 0 && <span className="text-amber-400">{r.stats.duplicateBlocks} dupes</span>}
                    {r.dependencies?.unused?.length > 0 && <span className="text-orange-400">{r.dependencies.unused.length} unused deps</span>}
                    <span style={{ color }}>{scoreLabel(score)}</span>
                    {r.aiSummary && <span className="text-accent">✓ AI</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={e => handleDelete(e, r.id)}
                    className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={13} />
                  </button>
                  <ArrowRight size={16} className="text-muted" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
