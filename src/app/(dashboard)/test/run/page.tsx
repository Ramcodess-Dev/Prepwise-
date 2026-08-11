"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/Badge";
import Timer, { formatTime } from "@/components/Timer";
import DesignFramework, { serializeDesignNotes } from "@/components/DesignFramework";
import DesignTutorChat from "@/components/DesignTutorChat";

type Question = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  answer: string;
};

type TestConfig = {
  questionIds: string[];
  timePerQuestion: number;
  category: string;
};

type QuestionResult = {
  questionId: string;
  notes: string;
  score: number | null;
  timeSpent: number;
};

export default function TestRun() {
  const router = useRouter();
  const [config, setConfig] = useState<TestConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [notes, setNotes] = useState("");
  const [designNotes, setDesignNotes] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [finished, setFinished] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const advancingRef = useRef(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("testConfig");
    if (!raw) {
      router.push("/test");
      return;
    }
    setConfig(JSON.parse(raw));
  }, [router]);

  useEffect(() => {
    if (!config) return;
    fetch("/api/questions")
      .then((r) => r.json())
      .then((all: Question[]) => {
        const ordered = config.questionIds
          .map((id) => all.find((q) => q.id === id))
          .filter(Boolean) as Question[];
        setQuestions(ordered);
        setRunning(true);
      });
  }, [config]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (running && !finished) {
      interval = setInterval(() => setTime((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [running, finished]);

  const current = questions[currentIndex];
  const isSystemDesign = current?.category === "system-design";
  const timeLimit = config?.timePerQuestion || undefined;

  const advanceQuestion = useCallback(() => {
    if (!current || advancingRef.current) return;
    advancingRef.current = true;

    const allNotes = isSystemDesign
      ? serializeDesignNotes(designNotes) + (notes ? `\n\n## Additional Notes\n${notes}` : "")
      : notes;

    const result: QuestionResult = {
      questionId: current.id,
      notes: allNotes,
      score,
      timeSpent: time,
    };

    const newResults = [...results, result];
    setResults(newResults);
    setNotes("");
    setDesignNotes({});
    setScore(null);
    setTime(0);

    if (currentIndex + 1 >= questions.length) {
      setRunning(false);
      setFinished(true);
      saveResults(newResults);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
    setTimeout(() => { advancingRef.current = false; }, 500);
  }, [current, currentIndex, designNotes, isSystemDesign, notes, questions.length, results, score, time]);

  useEffect(() => {
    if (timeLimit && time >= timeLimit && running && !finished) {
      advanceQuestion();
    }
  }, [time, timeLimit, running, finished, advanceQuestion]);

  async function saveResults(testResults: QuestionResult[]) {
    for (const r of testResults) {
      const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: r.questionId }),
      });
      const session = await res.json();
      await fetch("/api/practice", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          notes: `[Mock Test]\n${r.notes}`,
          score: r.score,
        }),
      });
    }
  }

  if (!config || questions.length === 0) {
    return <div className="text-sm text-stone-400 py-20 text-center">Loading test...</div>;
  }

  if (finished && !showReview) {
    const scored = results.filter((r) => r.score !== null);
    const avg = scored.length
      ? Math.round((scored.reduce((a, r) => a + (r.score ?? 0), 0) / scored.length) * 10)
      : 0;
    const totalTime = results.reduce((a, r) => a + r.timeSpent, 0);

    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-10 mb-8 border border-stone-200 rounded-lg">
          <h2 className="text-2xl font-light mb-2">Test Complete</h2>
          <p className="text-sm text-stone-400 mb-6">
            {results.length} questions · {formatTime(totalTime)} total
          </p>
          <div className="text-5xl font-light mb-1">{avg}%</div>
          <div className="text-xs text-stone-400">Average score</div>
        </div>

        <div className="space-y-2 mb-8">
          {results.map((r, i) => {
            const q = questions.find((q) => q.id === r.questionId);
            return (
              <div key={i} className="flex items-center justify-between border border-stone-200 rounded p-3">
                <div>
                  <div className="text-sm">{q?.title}</div>
                  <div className="text-xs text-stone-400">{formatTime(r.timeSpent)}</div>
                </div>
                <span className="text-sm font-medium">{r.score ?? "—"}/10</span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { setShowReview(true); setReviewIndex(0); }}
            className="px-4 py-2 border border-stone-200 rounded text-sm hover:border-stone-900"
          >
            Review answers
          </button>
          <a href="/test" className="px-4 py-2 bg-stone-900 text-white rounded text-sm hover:bg-stone-800">
            New test
          </a>
          <a href="/progress" className="px-4 py-2 border border-stone-200 rounded text-sm hover:border-stone-900">
            Progress
          </a>
        </div>
      </div>
    );
  }

  if (showReview) {
    const q = questions[reviewIndex];
    const r = results[reviewIndex];
    return (
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-light">Review ({reviewIndex + 1}/{questions.length})</h2>
          <button onClick={() => setShowReview(false)} className="text-xs text-stone-400 hover:text-stone-900">
            Back to summary
          </button>
        </div>

        <div className="mb-4">
          <Badge label={q.category} variant="category" />
        </div>
        <h3 className="text-sm font-medium mb-2">{q.title}</h3>

        {r.notes && (
          <div className="border border-stone-200 rounded p-4 mb-4 bg-stone-50">
            <div className="text-xs text-stone-400 mb-1">Your notes</div>
            <p className="text-sm whitespace-pre-wrap">{r.notes}</p>
          </div>
        )}

        <div className="border border-stone-200 rounded p-4 mb-6">
          <div className="text-xs text-stone-400 mb-1">Sample answer</div>
          <p className="text-sm whitespace-pre-wrap">{q.answer}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setReviewIndex(Math.max(0, reviewIndex - 1))}
            disabled={reviewIndex === 0}
            className="px-3 py-1.5 text-sm border border-stone-200 rounded disabled:opacity-30"
          >
            Previous
          </button>
          <button
            onClick={() => setReviewIndex(Math.min(questions.length - 1, reviewIndex + 1))}
            disabled={reviewIndex === questions.length - 1}
            className="px-3 py-1.5 text-sm border border-stone-200 rounded disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-stone-400">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <Timer seconds={time} running={running} limit={timeLimit} size="sm" />
        </div>
        <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-stone-900 transition-all duration-300"
            style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className={isSystemDesign ? "grid grid-cols-1 lg:grid-cols-5 gap-6" : ""}>
        <div className={isSystemDesign ? "lg:col-span-3" : "max-w-2xl"}>
          <div className="flex items-center gap-2 mb-3">
            <Badge label={current.category} variant="category" />
            <Badge label={current.difficulty} variant="difficulty" difficulty={current.difficulty as "easy" | "medium" | "hard"} />
          </div>

          <h2 className="text-xl font-light mb-2">{current.title}</h2>
          <p className="text-sm text-stone-500 mb-6">{current.description}</p>

          {isSystemDesign ? (
            <>
              <DesignFramework notes={designNotes} onNotesChange={(id, v) => setDesignNotes((p) => ({ ...p, [id]: v }))} />
              <textarea
                placeholder="Additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-20 mt-4 px-3 py-2 border border-stone-200 rounded text-sm focus:outline-none focus:border-stone-900 resize-none"
              />
            </>
          ) : (
            <textarea
              placeholder="Your answer..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-48 px-3 py-2 border border-stone-200 rounded text-sm focus:outline-none focus:border-stone-900 resize-none"
            />
          )}

          <div className="flex items-center gap-4 mt-4">
            <div>
              <label className="text-xs text-stone-400 block mb-1">Score (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={score ?? ""}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-20 px-2 py-1 border border-stone-200 rounded text-sm"
              />
            </div>
            <button
              onClick={advanceQuestion}
              className="px-5 py-2 bg-stone-900 text-white text-sm rounded hover:bg-stone-800 mt-4"
            >
              {currentIndex + 1 >= questions.length ? "Finish Test" : "Next Question →"}
            </button>
          </div>
        </div>

        {isSystemDesign && (
          <div className="lg:col-span-2">
            <DesignTutorChat questionId={current.id} questionTitle={current.title} />
          </div>
        )}
      </div>
    </div>
  );
}
