import { Star, GitFork, Clock, ArrowRight, Loader2 } from 'lucide-react'

const LANG_DOT: Record<string, string> = {
  Python:'bg-blue-400', JavaScript:'bg-yellow-400', TypeScript:'bg-cyan-400',
  HTML:'bg-orange-400', CSS:'bg-purple-400', Java:'bg-amber-600',
  'C++':'bg-pink-400', Go:'bg-sky-400', Rust:'bg-orange-600', Ruby:'bg-red-500',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function RepoCard({ repo, onAnalyze, loading }: { repo: any, onAnalyze: (repo: any) => void, loading: boolean }) {
  const dot = LANG_DOT[repo.language] || 'bg-gray-400'
  return (
    <div className="card hover:border-accent/40 transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,255,157,0.05)] flex flex-col gap-4 group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-base truncate group-hover:text-accent transition-colors">{repo.name}</h3>
          {repo.description && <p className="text-muted text-xs mt-1 line-clamp-2 leading-relaxed">{repo.description}</p>}
        </div>
        {repo.private && <span className="tag-purple shrink-0">private</span>}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted font-mono">
        {repo.language && <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${dot}`} />{repo.language}</span>}
        <span className="flex items-center gap-1"><Star size={11} />{repo.stargazers_count}</span>
        <span className="flex items-center gap-1"><GitFork size={11} />{repo.forks_count}</span>
        <span className="flex items-center gap-1 ml-auto"><Clock size={11} />{timeAgo(repo.updated_at)}</span>
      </div>
      <button onClick={() => onAnalyze(repo)} disabled={loading} className="btn-primary w-full justify-center mt-auto cursor-pointer">
        {loading ? <><Loader2 size={14} className="animate-spin" /> Analyzing…</> : <>Analyze Repo <ArrowRight size={14} /></>}
      </button>
    </div>
  )
}
