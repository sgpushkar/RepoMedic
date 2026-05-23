"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, Activity, LogOut } from "lucide-react";

const GithubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();

  const active = (path: string) =>
    pathname === path
      ? "text-accent bg-accent/10"
      : "text-muted hover:text-[#e8e8f4]";

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  const user = session?.user as any;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-sm shadow-[0_0_16px_rgba(0,255,157,0.3)]">
            🩺
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            Repo<span className="text-accent">Medic</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/dashboard"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${active("/dashboard")}`}
          >
            <LayoutDashboard size={14} /> Dashboard
          </Link>
          <Link
            href="/dashboard/history"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${active("/dashboard/history")}`}
          >
            <Activity size={14} /> History
          </Link>
        </nav>

        {user && (
          <div className="flex items-center gap-3">
            {user.image && (
              <a
                href={`https://github.com/${user.name}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-muted hover:text-[#e8e8f4] transition-colors"
              >
                <img
                  src={user.image}
                  alt={user.name ?? "avatar"}
                  className="w-7 h-7 rounded-full border border-border"
                />
                <span className="hidden sm:block font-mono">{user.name}</span>
                <GithubIcon />
              </a>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-muted hover:text-danger border border-transparent hover:border-danger/30 transition-all cursor-pointer"
            >
              <LogOut size={13} />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
