"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import RepoCard from "@/components/RepoCard";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [repos, setRepos] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [analyzingRepo, setAnalyzingRepo] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<{ step: string; progress: number } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchRepos = async () => {
      const token = (session as any)?.accessToken;
      if (!token) return;

      setLoadingRepos(true);
      try {
        const res = await fetch("https://api.github.com/user/repos?sort=updated&per_page=30", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json"
          }
        });
        if (res.ok) {
          const data = await res.json();
          setRepos(data);
        }
      } catch (err) {
        console.error("Failed to fetch repos", err);
      } finally {
        setLoadingRepos(false);
      }
    };

    if (session) {
      fetchRepos();
    }
  }, [session]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleAnalyze = async (repo: any) => {
    setAnalyzingRepo(repo.name);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: repo.owner.login, repo: repo.name, branch: repo.default_branch || 'main' }),
      });
      const data = await res.json();
      if (data.success && data.data.jobId) {
        pollJob(data.data.jobId);
      } else {
        console.error("Analysis failed to start:", data.error);
        setAnalyzingRepo(null);
      }
    } catch (err) {
      console.error(err);
      setAnalyzingRepo(null);
    }
  };

  const pollJob = async (jobId: string) => {
    const check = async () => {
      try {
        const res = await fetch(`/api/analyze/job/${jobId}`);
        const data = await res.json();
        if (data.success) {
          const job = data.data;
          setJobProgress({ step: job.step, progress: job.progress });
          
          if (job.status === "done" && job.analysisId) {
            router.push(`/dashboard/analysis/${job.analysisId}`);
            return;
          }
          if (job.status === "error") {
            console.error("Job Error:", job.step);
            setAnalyzingRepo(null);
            setJobProgress(null);
            return;
          }
        }
      } catch (err) {
        console.error(err);
      }
      setTimeout(check, 1000);
    };
    check();
  };

  return (
    <div className="min-h-screen bg-bg text-white font-sans p-8">
      <header className="max-w-4xl mx-auto flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          {session?.user?.image && (
            <img 
              src={session.user.image} 
              alt="Avatar" 
              className="w-12 h-12 rounded-full border-2 border-accent"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold font-display">Welcome, {session?.user?.name}</h1>
            <p className="text-muted text-sm font-mono">{session?.user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors border border-danger/30 font-semibold"
        >
          <LogOut size={16} /> Logout
        </button>
      </header>

      <main className="max-w-4xl mx-auto space-y-8 fade-up">
        {jobProgress && analyzingRepo ? (
          <div className="card-sm bg-accent/5 border border-accent/20 p-12 rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-6">
              <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Analyzing {analyzingRepo}...</h2>
            <p className="text-muted mb-8 font-mono text-sm">{jobProgress.step}</p>
            <div className="w-full max-w-md h-2 bg-black/40 rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${jobProgress.progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold mb-6 text-accent">Your Repositories</h2>
            
            {loadingRepos ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
              </div>
            ) : repos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {repos.map(repo => (
                  <RepoCard 
                    key={repo.id} 
                    repo={repo} 
                    onAnalyze={handleAnalyze} 
                    loading={analyzingRepo === repo.name} 
                  />
                ))}
              </div>
            ) : (
              <div className="h-32 border border-dashed border-muted/30 rounded-xl flex items-center justify-center text-muted">
                No repositories found.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
