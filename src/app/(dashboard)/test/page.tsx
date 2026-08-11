"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Question = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
};

const CATEGORIES = ["all", "behavioral", "technical", "system-design"];
const COUNTS = [3, 5, 10];
const TIME_OPTIONS = [
  { label: "5 min / question", value: 5 * 60 },
  { label: "10 min / question", value: 10 * 60 },
  { label: "15 min / question", value: 15 * 60 },
  { label: "No limit", value: 0 },
];

export default function TestSetup() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [category, setCategory] = useState("all");
  const [count, setCount] = useState(5);
  const [timePerQuestion, setTimePerQuestion] = useState(10 * 60);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then(setQuestions);
  }, []);

  const available =
    category === "all" ? questions : questions.filter((q) => q.category === category);

  function startTest() {
    const pool = [...available].sort(() => Math.random() - 0.5);
    const selected = pool.slice(0, Math.min(count, pool.length));

    if (selected.length === 0) return;

    const config = {
      questionIds: selected.map((q) => q.id),
      timePerQuestion,
      category,
    };

    sessionStorage.setItem("testConfig", JSON.stringify(config));
    router.push("/test/run");
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-light mb-2">Mock Test</h2>
      <p className="text-sm text-stone-400 mb-8">
        Simulate an interview with multiple timed questions. Score yourself at the end.
      </p>

      <div className="space-y-6">
        <div>
          <label className="text-xs text-stone-400 block mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 text-xs rounded border ${
                  category === cat
                    ? "bg-stone-900 text-white border-stone-900"
                    : "border-stone-200 text-stone-500 hover:border-stone-900"
                }`}
              >
                {cat === "all" ? "All" : cat.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-stone-400 block mb-2">Number of questions</label>
          <div className="flex gap-2">
            {COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                disabled={n > available.length}
                className={`w-12 h-12 text-sm rounded border ${
                  count === n
                    ? "bg-stone-900 text-white border-stone-900"
                    : "border-stone-200 text-stone-500 hover:border-stone-900 disabled:opacity-30"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-stone-400 mt-1">{available.length} questions available</p>
        </div>

        <div>
          <label className="text-xs text-stone-400 block mb-2">Time per question</label>
          <div className="flex flex-wrap gap-2">
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTimePerQuestion(opt.value)}
                className={`px-3 py-1.5 text-xs rounded border ${
                  timePerQuestion === opt.value
                    ? "bg-stone-900 text-white border-stone-900"
                    : "border-stone-200 text-stone-500 hover:border-stone-900"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-stone-200 rounded-lg p-4 bg-stone-50">
          <h3 className="text-sm font-medium mb-2">Test summary</h3>
          <ul className="text-xs text-stone-500 space-y-1">
            <li>· {Math.min(count, available.length)} questions from {category === "all" ? "all categories" : category}</li>
            <li>· {timePerQuestion ? `${timePerQuestion / 60} min per question` : "No time limit"}</li>
            <li>· Self-score each answer (1–10)</li>
            <li>· Review sample answers at the end</li>
          </ul>
        </div>

        <button
          onClick={startTest}
          disabled={available.length === 0}
          className="w-full px-4 py-3 bg-stone-900 text-white text-sm rounded hover:bg-stone-800 disabled:opacity-50"
        >
          Start Mock Test
        </button>
      </div>
    </div>
  );
}
