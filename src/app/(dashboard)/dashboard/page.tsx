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
      <h2 className="text-xl font-light mb-6">Welcome back.</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="border border-stone-200 rounded p-4">
          <div className="text-2xl font-light">{stats.total}</div>
          <div className="text-xs text-stone-400 mt-1">Total Sessions</div>
        </div>
        <div className="border border-stone-200 rounded p-4">
          <div className="text-2xl font-light">{stats.completed}</div>
          <div className="text-xs text-stone-400 mt-1">Completed</div>
        </div>
        <div className="border border-stone-200 rounded p-4">
          <div className="text-2xl font-light">{stats.averageScore}%</div>
          <div className="text-xs text-stone-400 mt-1">Avg Score</div>
        </div>
      </div>

      <div className="mt-8">
        <a href="/practice" className="inline-block px-4 py-2 bg-stone-900 text-white text-sm rounded hover:bg-stone-800">Start Practice</a>
      </div>
    </div>
  );
}
