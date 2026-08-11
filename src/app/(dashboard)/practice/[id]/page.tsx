"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function PracticeSession() {
  const params = useParams();
  const router = useRouter();
  const questionId = params.id as string;

  const [question, setQuestion] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [notes, setNotes] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then((qs) => {
        const q = qs.find((q: any) => q.id === questionId);
        setQuestion(q);
      });
  }, [questionId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (running) {
      interval = setInterval(() => setTime((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [running]);

  async function startSession() {
    const res = await fetch("/api/practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId }),
    });
    const data = await res.json();
    setSessionId(data.id);
    setRunning(true);
  }

  async function finishSession() {
    setRunning(false);
    setCompleted(true);
    if (sessionId) {
      await fetch("/api/practice", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, notes, score }),
      });
    }
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }

  if (!question) return <div className="text-sm text-stone-400">Loading question...</div>;

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-light mb-2">{question.title}</h2>
      <p className="text-sm text-stone-500 mb-6">{question.description}</p>

      {!running && !completed && (
        <button onClick={startSession} className="px-4 py-2 bg-stone-900 text-white text-sm rounded hover:bg-stone-800">Start Timer</button>
      )}

      {running && (
        <div>
          <div className="text-3xl font-light mb-6">{formatTime(time)}</div>

          <textarea
            placeholder="Your notes / answer..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-40 px-3 py-2 border border-stone-200 rounded text-sm focus:outline-none focus:border-stone-900 mb-4"
          />

          <div className="flex items-center gap-4">
            <div>
              <label className="text-xs text-stone-400 block mb-1">Self Score (1-10)</label>
              <input type="number" min="1" max="10" value={score ?? ""} onChange={(e) => setScore(Number(e.target.value))} className="w-20 px-2 py-1 border border-stone-200 rounded text-sm" />
            </div>
            <button onClick={finishSession} className="px-4 py-2 bg-stone-900 text-white text-sm rounded hover:bg-stone-800">Finish Session</button>
          </div>
        </div>
      )}

      {completed && (
        <div>
          <p className="text-sm text-green-600 mb-4">Session completed in {formatTime(time)}!</p>

          <button onClick={() => setShowAnswer(!showAnswer)} className="text-sm text-stone-500 underline mb-4 block">
            {showAnswer ? "Hide" : "Show"} sample answer
          </button>

          {showAnswer && (
            <div className="border border-stone-200 rounded p-4 mb-4">
              <p className="text-sm whitespace-pre-wrap">{question.answer}</p>
            </div>
          )}

          <div className="flex gap-2">
            <a href="/practice" className="text-sm px-3 py-1.5 border border-stone-200 rounded hover:border-stone-900">Practice another</a>
            <a href="/progress" className="text-sm px-3 py-1.5 bg-stone-900 text-white rounded hover:bg-stone-800">View progress</a>
          </div>
        </div>
      )}
    </div>
  );
}
