"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, completed: 0, averageScore: 0 });

  useEffect(() => {
    fetch("/api/practice?stats=true")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-light mb-2">Welcome back.</h2>
      <p className="text-sm text-stone-400 mb-8">Practice solo or run a full mock test.</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-stone-200 rounded-lg p-4">
          <div className="text-2xl font-light">{stats.total}</div>
          <div className="text-xs text-stone-400 mt-1">Total Sessions</div>
        </div>
        <div className="border border-stone-200 rounded-lg p-4">
          <div className="text-2xl font-light">{stats.completed}</div>
          <div className="text-xs text-stone-400 mt-1">Completed</div>
        </div>
        <div className="border border-stone-200 rounded-lg p-4">
          <div className="text-2xl font-light">{stats.averageScore}%</div>
          <div className="text-xs text-stone-400 mt-1">Avg Score</div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <a
          href="/practice"
          className="block border border-stone-200 rounded-lg p-5 hover:border-stone-900 transition-colors group"
        >
          <div className="text-sm font-medium mb-1 group-hover:text-stone-900">Practice</div>
          <p className="text-xs text-stone-400">
            Timed sessions with structured design canvas. System design questions include an AI tutor.
          </p>
        </a>
        <a
          href="/test"
          className="block border border-stone-200 rounded-lg p-5 hover:border-stone-900 transition-colors group"
        >
          <div className="text-sm font-medium mb-1 group-hover:text-stone-900">Mock Test</div>
          <p className="text-xs text-stone-400">
            Multi-question timed test simulating a real interview. Review answers when done.
          </p>
        </a>
      </div>
    </div>
  );
}
