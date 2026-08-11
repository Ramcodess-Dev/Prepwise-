"use client";

import { useState, useEffect } from "react";

export default function Landing() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.user) window.location.href = "/dashboard"; })
      .finally(() => setChecking(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const body = mode === "login" ? { email, password } : { email, name, password };
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error);
    window.location.href = "/dashboard";
  }

  if (checking) return <div className="flex items-center justify-center min-h-screen text-stone-400">Loading...</div>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-light tracking-tight text-center mb-1">Prepwise</h1>
        <p className="text-center text-stone-400 text-sm mb-8">Interview preparation, simplified.</p>

        <div className="flex mb-6 border-b border-stone-200">
          <button onClick={() => setMode("login")} className={`flex-1 pb-2 text-sm ${mode === "login" ? "border-b-2 border-stone-900 font-medium" : "text-stone-400"}`}>Sign In</button>
          <button onClick={() => setMode("signup")} className={`flex-1 pb-2 text-sm ${mode === "signup" ? "border-b-2 border-stone-900 font-medium" : "text-stone-400"}`}>Create Account</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded text-sm focus:outline-none focus:border-stone-900" required />
          )}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded text-sm focus:outline-none focus:border-stone-900" required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded text-sm focus:outline-none focus:border-stone-900" required />

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button type="submit" disabled={loading} className="w-full py-2 bg-stone-900 text-white text-sm rounded hover:bg-stone-800 disabled:opacity-50">
            {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
