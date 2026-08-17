"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Badge from "@/components/Badge";
import Timer, { formatTime } from "@/components/Timer";
import DesignFramework, { serializeDesignNotes } from "@/components/DesignFramework";
import DesignTutorChat from "@/components/DesignTutorChat";
import { getDesignGuide } from "@/lib/design-knowledge";

type Question = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  answer: string;
};

const TIME_LIMITS: Record<string, number> = {
  easy: 15 * 60,
  medium: 25 * 60,
  hard: 45 * 60,
};

export default function PracticeSession() {
  const params = useParams();
  const router = useRouter();
  const questionId = params.id as string;

  const [question, setQuestion] = useState<Question | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [notes, setNotes] = useState("");
  const [designNotes, setDesignNotes] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showTutor, setShowTutor] = useState(true);

  const isSystemDesign = question?.category === "system-design";
  const timeLimit = question ? TIME_LIMITS[question.difficulty] ?? TIME_LIMITS.medium : undefined;
  const guide = question ? getDesignGuide(question.title) : null;

  useEffect(() => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then((qs: Question[]) => {
        const q = qs.find((q) => q.id === questionId);
        setQuestion(q ?? null);
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

    let whiteboardText = "";
    if (isSystemDesign) {
      try {
        const saved = localStorage.getItem(`whiteboard_${questionId}`);
        if (saved) {
          const { nodes, edges } = JSON.parse(saved);
          if (nodes && nodes.length > 0) {
            const { serializeWhiteboardToText } = require("@/components/ArchitectureWhiteboard");
            whiteboardText = serializeWhiteboardToText(nodes, edges);
          }
        }
      } catch (err) {
        console.error("Failed to load whiteboard for saving", err);
      }
    }

    const allNotes = isSystemDesign
      ? serializeDesignNotes(designNotes) +
      (whiteboardText ? `\n\n## Whiteboard Architecture Sketch\n${whiteboardText}` : "") +
      (notes ? `\n\n## Additional Notes\n${notes}` : "")
      : notes;

    if (sessionId) {
      await fetch("/api/practice", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, notes: allNotes, score }),
      });
    }
  }

  function handleDesignNotesChange(sectionId: string, value: string) {
    setDesignNotes((prev) => ({ ...prev, [sectionId]: value }));
  }

  if (!question) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-stone-400">Loading question...</div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="max-w-2xl">
        <div className="text-center py-8 mb-6 border border-stone-200 rounded-lg bg-green-50/50">
          <div className="text-4xl mb-2">✓</div>
          <h2 className="text-lg font-light mb-1">Session Complete</h2>
          <p className="text-sm text-stone-500">
            Finished in {formatTime(time)}
            {score !== null && ` · Self score: ${score}/10`}
          </p>
        </div>

        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="text-sm text-stone-500 underline mb-4 block"
        >
          {showAnswer ? "Hide" : "Show"} sample answer
        </button>

        {showAnswer && (
          <div className="border border-stone-200 rounded-lg p-4 mb-6 bg-stone-50">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{question.answer}</p>
          </div>
        )}

        <div className="flex gap-2">
          <a href="/practice" className="text-sm px-4 py-2 border border-stone-200 rounded hover:border-stone-900">
            Practice another
          </a>
          <a href="/progress" className="text-sm px-4 py-2 bg-stone-900 text-white rounded hover:bg-stone-800">
            View progress
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={isSystemDesign && showTutor ? "grid grid-cols-1 lg:grid-cols-5 gap-6" : ""}>
      <div className={isSystemDesign && showTutor ? "lg:col-span-3" : "max-w-2xl"}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge label={question.category} variant="category" />
            <Badge label={question.difficulty} variant="difficulty" difficulty={question.difficulty as "easy" | "medium" | "hard"} />
          </div>
          <h2 className="text-xl font-light mb-2">{question.title}</h2>
          <p className="text-sm text-stone-500 leading-relaxed">{question.description}</p>
        </div>

        {/* Pre-start */}
        {!running && !completed && (
          <div className="border border-stone-200 rounded-lg p-6 text-center">
            {isSystemDesign && guide && (
              <p className="text-sm text-stone-500 mb-4 max-w-md mx-auto">{guide.overview}</p>
            )}
            <p className="text-xs text-stone-400 mb-4">
              Recommended time: {Math.floor((timeLimit ?? 0) / 60)} minutes
            </p>
            <button
              onClick={startSession}
              className="px-6 py-2.5 bg-stone-900 text-white text-sm rounded hover:bg-stone-800"
            >
              Start Session
            </button>
            {isSystemDesign && (
              <p className="text-xs text-stone-400 mt-3">
                Design canvas + AI tutor will appear when you start
              </p>
            )}
          </div>
        )}

        {/* Active session */}
        {running && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border border-stone-200 rounded-lg p-4">
              <Timer seconds={time} running={running} limit={timeLimit} />
              <div className="text-right">
                <div className="text-xs text-stone-400 mb-1">Self Score</div>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={score ?? ""}
                  onChange={(e) => setScore(Number(e.target.value))}
                  placeholder="1-10"
                  className="w-16 px-2 py-1 border border-stone-200 rounded text-sm text-center focus:outline-none focus:border-stone-900"
                />
              </div>
            </div>

            {isSystemDesign ? (
              <>
                <DesignFramework notes={designNotes} onNotesChange={handleDesignNotesChange} />
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Additional notes</label>
                  <textarea
                    placeholder="Extra thoughts, trade-offs, diagrams..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-24 px-3 py-2 border border-stone-200 rounded text-sm focus:outline-none focus:border-stone-900 resize-none"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="text-xs text-stone-400 block mb-1">
                  {question.category === "behavioral" ? "Your STAR answer" : "Your solution / notes"}
                </label>
                <textarea
                  placeholder={
                    question.category === "behavioral"
                      ? "Situation → Task → Action → Result..."
                      : "Write your approach, code, or explanation..."
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-48 px-3 py-2 border border-stone-200 rounded text-sm focus:outline-none focus:border-stone-900 resize-none"
                />
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={finishSession}
                className="px-5 py-2 bg-stone-900 text-white text-sm rounded hover:bg-stone-800"
              >
                Finish Session
              </button>
              {isSystemDesign && (
                <button
                  onClick={() => setShowTutor(!showTutor)}
                  className="text-sm px-3 py-2 border border-stone-200 rounded hover:border-stone-900 lg:hidden"
                >
                  {showTutor ? "Hide" : "Show"} Tutor
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI Tutor sidebar — system design only */}
      {isSystemDesign && running && showTutor && (
        <div className="lg:col-span-2">
          <DesignTutorChat questionId={questionId} questionTitle={question.title} />
        </div>
      )}
    </div>
  );
}
