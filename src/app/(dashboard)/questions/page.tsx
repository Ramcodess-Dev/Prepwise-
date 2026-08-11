"use client";

import { useEffect, useState } from "react";

type Question = {
  id: string;
  category: string;
  title: string;
  description: string;
  difficulty: string;
};

export default function Questions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [category, setCategory] = useState("all");

  useEffect(() => {
    fetch(`/api/questions${category !== "all" ? `?category=${category}` : ""}`)
      .then((r) => r.json())
      .then(setQuestions);
  }, [category]);

  const categories = ["all", "behavioral", "technical", "system-design"];

  return (
    <div>
      <h2 className="text-xl font-light mb-6">Questions</h2>

      <div className="flex gap-2 mb-6">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1 text-xs rounded border ${category === cat ? "bg-stone-900 text-white border-stone-900" : "border-stone-200 text-stone-500 hover:border-stone-900"}`}>
            {cat === "all" ? "All" : cat.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {questions.map((q) => (
          <a key={q.id} href={`/practice/${q.id}`} className="block border border-stone-200 rounded p-4 hover:border-stone-900 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{q.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-500 ${q.difficulty === "hard" ? "text-red-500" : q.difficulty === "easy" ? "text-green-600" : ""}`}>{q.difficulty}</span>
            </div>
            <p className="text-xs text-stone-400 mt-1">{q.description}</p>
          </a>
        ))}
        {questions.length === 0 && <p className="text-sm text-stone-400">No questions found.</p>}
      </div>
    </div>
  );
}
