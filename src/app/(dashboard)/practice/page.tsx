"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/Badge";

type Question = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
};

const CATEGORIES = [
  { id: "all", label: "All", desc: "Mixed practice" },
  { id: "behavioral", label: "Behavioral", desc: "STAR method stories" },
  { id: "technical", label: "Technical", desc: "Coding & algorithms" },
  { id: "system-design", label: "System Design", desc: "Architecture + AI tutor" },
];

export default function StartPractice() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [category, setCategory] = useState("all");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then(setQuestions);
  }, []);

  const filtered =
    category === "all" ? questions : questions.filter((q) => q.category === category);

  function pickRandom() {
    if (filtered.length === 0) return;
    const q = filtered[Math.floor(Math.random() * filtered.length)];
    router.push(`/practice/${q.id}`);
  }

  return (
    <div>
      <h2 className="text-xl font-light mb-2">Practice</h2>
      <p className="text-sm text-stone-400 mb-6">
        Timed sessions with structured notes. System design questions include an AI tutor.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`text-left p-3 rounded-lg border transition-colors ${
              category === cat.id
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-200 hover:border-stone-400"
            }`}
          >
            <div className="text-sm font-medium">{cat.label}</div>
            <div className={`text-xs mt-0.5 ${category === cat.id ? "text-stone-300" : "text-stone-400"}`}>
              {cat.desc}
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={pickRandom}
          disabled={filtered.length === 0}
          className="px-4 py-2 bg-stone-900 text-white text-sm rounded hover:bg-stone-800 disabled:opacity-50"
        >
          Random Question
        </button>
        <span className="text-xs text-stone-400">{filtered.length} questions available</span>
      </div>

      <div className="space-y-2">
        {filtered.map((q) => (
          <a
            key={q.id}
            href={`/practice/${q.id}`}
            className="flex items-center justify-between border border-stone-200 rounded-lg p-4 hover:border-stone-900 transition-colors group"
          >
            <div>
              <h3 className="text-sm font-medium group-hover:text-stone-900">{q.title}</h3>
              <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{q.description}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              <Badge label={q.category} variant="category" />
              <Badge label={q.difficulty} variant="difficulty" difficulty={q.difficulty as "easy" | "medium" | "hard"} />
              <span className="text-stone-300 group-hover:text-stone-900">→</span>
            </div>
          </a>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-stone-400 py-8 text-center">No questions in this category.</p>
        )}
      </div>
    </div>
  );
}
