"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StartPractice() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then(setQuestions);
  }, []);

  function start() {
    if (selectedId) router.push(`/practice/${selectedId}`);
  }

  return (
    <div>
      <h2 className="text-xl font-light mb-6">Practice</h2>
      <p className="text-sm text-stone-400 mb-4">Select a question to practice with a timer.</p>

      <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full px-3 py-2 border border-stone-200 rounded text-sm focus:outline-none focus:border-stone-900 mb-4">
        <option value="">Choose a question...</option>
        {questions.map((q) => (
          <option key={q.id} value={q.id}>{q.title}</option>
        ))}
      </select>

      <button onClick={start} disabled={!selectedId} className="px-4 py-2 bg-stone-900 text-white text-sm rounded hover:bg-stone-800 disabled:opacity-50">Start Session</button>
    </div>
  );
}
