"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    router.replace("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#061224] px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-300">
              <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2" />
              <rect x="9" y="7" width="12" height="10" rx="2" />
              <circle cx="7" cy="17" r="2" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-white/35">Admin</p>
            <h1 className="text-xl font-semibold text-white">RoadQuest Cars</h1>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-[28px] border border-white/10 bg-white/6 p-7 shadow-2xl shadow-black/30 backdrop-blur">
          <h2 className="mb-1 text-lg font-semibold text-white">Sign in</h2>
          <p className="mb-6 text-sm text-white/45">Enter your credentials to access the admin panel.</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <label>
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-white/45">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-blue-400/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-white/45">Password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-blue-400/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10"
              />
            </label>

            {error && (
              <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 h-12 w-full rounded-2xl bg-blue-500 font-medium text-white transition hover:bg-blue-400 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
