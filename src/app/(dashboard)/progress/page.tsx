"use client";

import { useEffect, useState } from "react";

type Session = {
  id: string;
  question: { title: string; category: string };
  status: string;
  score: number | null;
  startedAt: string;
  completedAt: string | null;
};

export default function Progress() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    fetch("/api/practice")
      .then((r) => r.json())
      .then(setSessions);
  }, []);

  const completed = sessions.filter((s) => s.status === "completed");
  const avg = completed.length
    ? Math.round(completed.reduce((a, s) => a + (s.score || 0), 0) / completed.length * 10)
    : 0;

  return (
    <div>
      <h2 className="text-xl font-light mb-6">Progress</h2>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border border-stone-200 rounded p-4">
          <div className="text-2xl font-light">{sessions.length}</div>
          <div className="text-xs text-stone-400 mt-1">Total Sessions</div>
        </div>
        <div className="border border-stone-200 rounded p-4">
          <div className="text-2xl font-light">{avg}%</div>
          <div className="text-xs text-stone-400 mt-1">Avg Score</div>
        </div>
      </div>

      <div className="space-y-2">
        {sessions.map((s) => (
          <div key={s.id} className="border border-stone-200 rounded p-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm">{s.question.title}</h3>
              <p className="text-xs text-stone-400">{s.question.category} &middot; {new Date(s.startedAt).toLocaleDateString()}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded ${s.status === "completed" ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"}`}>
              {s.status === "completed" ? `${s.score}/10` : "In progress"}
            </span>
          </div>
        ))}
        {sessions.length === 0 && <p className="text-sm text-stone-400">No sessions yet.</p>}
      </div>
    </div>
  );
}
