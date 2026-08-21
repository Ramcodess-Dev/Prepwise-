"use client";

import { useState, useEffect } from "react";
import { playCyberSound } from "@/lib/cyber-audio";

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
    playCyberSound("click");
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const body = mode === "login" ? { email, password } : { email, name, password };
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      playCyberSound("error");
      return setError(data.error);
    }
    playCyberSound("success");
    window.location.href = "/dashboard";
  }

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-stone-400 font-mono">
        <div className="char-load text-sm font-semibold tracking-widest text-[#00ff66]">
          INITIALIZING SECURE PORTAL...
        </div>
        <div className="text-[10px] text-stone-500 mt-2 animate-pulse">
          CONNECTING TO CORE_TUTOR_v4.exe
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 relative">
      <div className="w-full max-w-md border border-stone-200 rounded-lg p-6 bg-white/80 backdrop-blur-md terminal-border-glow relative overflow-hidden">
        {/* Terminal decorative header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-6 text-[10px] text-stone-400 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>SECURE_LINK // PORT: 8443</span>
          </div>
          <div>ENCRYPTION: SHIELD_v2.1</div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-widest text-center mb-1 text-stone-900 terminal-glow font-mono uppercase">
          ARCHDESIGN
        </h1>
        <p className="text-center text-stone-400 text-xs mb-8 uppercase tracking-wider font-mono">
          [ Interview decryption framework ]
        </p>

        <div className="flex mb-6 border-b border-stone-200">
          <button
            onClick={() => { setMode("login"); playCyberSound("click"); }}
            className={`flex-1 pb-2 text-xs font-semibold uppercase tracking-wider font-mono transition-colors ${mode === "login" ? "border-b-2 border-stone-900 text-stone-900" : "text-stone-450 hover:text-stone-900"
              }`}
          >
            SYS_SIGNIN
          </button>
          <button
            onClick={() => { setMode("signup"); playCyberSound("click"); }}
            className={`flex-1 pb-2 text-xs font-semibold uppercase tracking-wider font-mono transition-colors ${mode === "signup" ? "border-b-2 border-stone-900 text-stone-900" : "text-stone-450 hover:text-stone-900"
              }`}
          >
            SYS_INITIALIZE
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "signup" && (
            <div>
              <label className="text-[10px] text-stone-400 block mb-1 uppercase font-mono tracking-wider">Operator Name</label>
              <input type="text" placeholder="e.g. Neo" value={name} onChange={(e) => setName(e.target.value)} className="w-full text-sm" required />
            </div>
          )}
          <div>
            <label className="text-[10px] text-stone-400 block mb-1 uppercase font-mono tracking-wider">Email Address</label>
            <input type="email" placeholder="e.g. operator@archdesign.sys" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full text-sm" required />
          </div>
          <div>
            <label className="text-[10px] text-stone-400 block mb-1 uppercase font-mono tracking-wider">Access Cipher</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full text-sm" required />
          </div>

          {error && (
            <p className="text-red-500 text-xs font-mono text-center uppercase tracking-wide">
              [ ERROR: {error} ]
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-stone-900 text-white font-mono text-xs uppercase tracking-widest rounded hover:bg-stone-50 hover:text-stone-950 font-bold transition-all disabled:opacity-50"
          >
            {loading ? "PROCESSING..." : mode === "login" ? "DECRYPT ACCESS" : "GENERATE COMPONENT"}
          </button>
        </form>

        {/* Console footer decoration */}
        <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between text-[8px] text-stone-500 font-mono uppercase">
          <span>HOST: LOCALHOST</span>
          <span>STATUS: STANDBY</span>
        </div>
      </div>
    </div>
  );
}

