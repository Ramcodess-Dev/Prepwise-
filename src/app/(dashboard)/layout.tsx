"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) return router.push("/");
        setUser(d.user);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-stone-400">Loading...</div>;

  const nav = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/questions", label: "Questions" },
    { href: "/practice", label: "Practice" },
    { href: "/test", label: "Mock Test" },
    { href: "/progress", label: "Progress" },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          <span className="text-sm font-medium">Prepwise</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-stone-400">{user?.name}</span>
            <button onClick={handleLogout} className="text-xs text-stone-400 hover:text-stone-900">Sign out</button>
          </div>
        </div>
      </header>

      <nav className="border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 flex gap-6">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <a key={item.href} href={item.href} className={`py-2 text-sm border-b-2 ${active ? "border-stone-900" : "border-transparent text-stone-400 hover:text-stone-900"}`}>
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
