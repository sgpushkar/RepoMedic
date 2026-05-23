"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Star, GitFork, GitBranch, Eye, Loader2, Activity } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

export default function RepoViewPage() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = (session as any)?.accessToken;
    if (!token) return;
    fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" },
    })
      .then(r => r.json())
      .then(setData)
      .catch(() => toast.error("Failed to load repo"))
      .finally(() => setLoading(false));
  }, [session, owner, repo]);

  const handleAnalyze = async () => {
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, branch: data?.default_branch || "main" }),
      });
      const json = await res.json();
      if (json.success && json.data?.jobId) {
        toast.success("Analysis started!");
        router.push(`/dashboard?jobId=${json.data.jobId}&repo=${repo}`);
      } else {
        toast.error(json?.error || "Failed to start analysis");
      }
    } catch {
      toast.error("Failed to start analysis");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={32} className="text-accent animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-muted font-mono">Repository not found</p>
      <button onClick={() => router.push("/dashboard")} className="btn-ghost mt-4">Back to Dashboard</button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 fade-up">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-muted hover:text-accent text-sm font-mono mb-6 transition-colors bg-transparent border-none cursor-pointer"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="card mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl mb-1">{data.name}</h1>
            <p className="text-muted text-sm mb-4">{data.description || "No description"}</p>
            <div className="flex flex-wrap gap-4 text-xs font-mono text-muted">
              <span className="flex items-center gap-1"><Star size={12} />{data.stargazers_count} stars</span>
              <span className="flex items-center gap-1"><GitFork size={12} />{data.forks_count} forks</span>
              <span className="flex items-center gap-1"><Eye size={12} />{data.watchers_count} watchers</span>
              <span className="flex items-center gap-1"><GitBranch size={12} />{data.default_branch}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <a href={data.html_url} target="_blank" rel="noreferrer" className="btn-ghost text-xs">View on GitHub</a>
            <button onClick={handleAnalyze} className="btn-primary text-xs gap-1.5">
              <Activity size={13} /> Analyze
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 stagger">
        {[
          { label: "Language",       value: data.language || "Unknown" },
          { label: "Size",           value: data.size > 1024 ? `${(data.size / 1024).toFixed(1)} MB` : `${data.size} KB` },
          { label: "Default Branch", value: data.default_branch },
          { label: "Open Issues",    value: data.open_issues_count },
          { label: "Visibility",     value: data.private ? "Private" : "Public" },
          { label: "Updated",        value: new Date(data.updated_at).toLocaleDateString() },
        ].map(s => (
          <div key={s.label} className="card-sm">
            <p className="label mb-1">{s.label}</p>
            <p className="font-semibold text-sm">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
