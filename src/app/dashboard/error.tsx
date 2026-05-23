"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-red-400 text-6xl">⚠️</div>
      <h2 className="text-2xl font-bold text-white">Something went wrong loading the dashboard</h2>
      <p className="text-muted font-mono text-sm max-w-xl text-center break-all bg-black/40 p-4 rounded-xl border border-red-900/30">
        {error.message || "Unknown error"}
        {error.digest && <><br /><span className="text-xs text-red-400">Digest: {error.digest}</span></>}
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 rounded-xl bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-colors font-semibold"
      >
        Try Again
      </button>
    </div>
  );
}
