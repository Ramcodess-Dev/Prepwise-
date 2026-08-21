"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Badge from "@/components/Badge";
import Timer, { formatTime } from "@/components/Timer";
import DesignFramework, { serializeDesignNotes } from "@/components/DesignFramework";
import DesignTutorChat from "@/components/DesignTutorChat";
import { getDesignGuide } from "@/lib/design-knowledge";
import { serializeWhiteboardToText } from "@/components/ArchitectureWhiteboard";
import { playCyberSound } from "@/lib/cyber-audio";

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

const QUESTION_HINTS: Record<string, { hints: string[]; boilerplate?: string; structureGuide: string }> = {
  "Tell me about yourself": {
    hints: [
      "Keep it professional and under 2 minutes.",
      "Use the Present-Past-Future framework: state your current role and achievements, highlight relevant past projects, and close with why this job is the perfect next step.",
      "Avoid sharing personal histories or repeating your resume verbatim."
    ],
    structureGuide: "Present (Current Role) ➔ Past (Relevant Projects) ➔ Future (Why this role?)"
  },
  "Tell me about a time you faced a challenge": {
    hints: [
      "Select a situation with a clear, resolution-focused outcome.",
      "Spend 80% of your time on the Action (what YOU did) and Result.",
      "Show how you collaborated, solved conflicts, or managed technical complexity."
    ],
    structureGuide: "Situation (Context) ➔ Task (Goal) ➔ Action (Your steps) ➔ Result (Measurable outcome)"
  },
  "Why do you want to work here?": {
    hints: [
      "Mention a specific product, engineering challenge, or core value of the company.",
      "Show how their culture aligns with your career goals and how you can add value.",
      "Don't sound generic; do actual research on their latest public engineering posts or news."
    ],
    structureGuide: "Company Appeal ➔ Personal Alignment ➔ Synergy & Value Add"
  },
  "Describe a conflict with a coworker": {
    hints: [
      "Choose a minor professional disagreement, NEVER a personal grievance.",
      "Highlight how you active-listened, validated their view, and focused on team goals.",
      "Show that you remain respectful and compromise for optimal engineering outcomes."
    ],
    structureGuide: "Context of Conflict ➔ Your Communication Strategy ➔ Collaborative Resolution ➔ Key Lessons"
  },
  "Reverse a linked list": {
    hints: [
      "Use an iterative approach with 3 pointers: prev (null), curr (head), and next (null).",
      "During iteration, temporarily save curr.next, point curr.next to prev, then advance prev to curr, and advance curr to next.",
      "Time complexity should be O(N) and space complexity should be O(1)."
    ],
    boilerplate: `/* Single Linked List Node:
 * class ListNode {
 *   val: number;
 *   next: ListNode | null;
 * }
 */
function reverseList(head: ListNode | null): ListNode | null {
  let prev = null;
  let curr = head;
  
  while (curr !== null) {
    let nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }
  
  return prev;
}`,
    structureGuide: "Pointers initialization ➔ While Loop Iteration ➔ Link Reversal ➔ Return Head"
  },
  "Two Sum": {
    hints: [
      "A brute force O(N^2) solution uses nested arrays, but you can optimize to O(N) using a Hash Map.",
      "Store each number's complement (target - value) and its index as you iterate.",
      "For each step, check if the current number is already in your Hash Map. If yes, you found the matching indexes!"
    ],
    boilerplate: `function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>(); // val -> index
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }
  
  return [];
}`,
    structureGuide: "Map Definition ➔ Single Pass Loop ➔ Complement Checks ➔ Index Returns"
  },
  "Design a rate limiter": {
    hints: [
      "Determine if the rate limiter should be client-side, API gateway middleware, or a reverse proxy sidecar.",
      "Understand the key algorithms: Token Bucket, Leaking Bucket, Fixed Window, Sliding Window Log, Sliding Window Counter.",
      "In a distributed system, use Redis to store requests counters and handle race conditions using Lua scripts or Redis sorted sets."
    ],
    boilerplate: `// Middleware structure / Token Bucket algorithm representation
class RateLimiter {
  private capacities: Map<string, number>; // client_id -> tokens
  
  constructor(private limit: number, private windowMs: number) {}
  
  allowRequest(clientId: string): boolean {
    // Write rate limiting logic
    return true;
  }
}`,
    structureGuide: "Choose Algorithm ➔ Define Store Schema (Redis/Memory) ➔ Middleware Checks ➔ HTTP Response Headers"
  },
  "Design a URL shortener": {
    hints: [
      "Estimate write/read QPS first. If 100M URLs are generated per day, write QPS is ~1160, and read QPS is likely 10x-100x higher.",
      "Use Base62 encoding (a-z, A-Z, 0-9) to compress a 64-bit auto-incrementing ID into a short string.",
      "Implement a Redis cache for hot URL mappings. Set HTTP status to 301 (Permanent Redirect) so browsers cache it."
    ],
    structureGuide: "Write Path (Counter + Base62) ➔ Read Path (Redis Cache ➔ SQL/NoSQL DB) ➔ Redirect Headers"
  },
  "Design a chat system": {
    hints: [
      "Use WebSockets for real-time bi-directional message sending to active clients.",
      "Use a Message Queue (like Kafka) to decouple message ingestion from the storage/fanout database execution.",
      "Design a Presence Service using a Redis heartbeat to track online status."
    ],
    structureGuide: "WebSocket Handshake ➔ Ingestion Gateway ➔ Kafka Queue ➔ Chat DB Store ➔ Push Notifications"
  },
  "Design a news feed": {
    hints: [
      "Compare Feed Fan-out architectures: Push model (write fan-out, timelines pre-rendered) vs Pull model (read fan-out, feed generated on fly).",
      "For celebrities with millions of followers, push fan-out causes severe write amplification. Use a Hybrid approach.",
      "Cache timelines in Redis Sorted Sets, storing post IDs sorted by timestamp."
    ],
    structureGuide: "Post Upload API ➔ Hybrid Fanout Engine ➔ User Timeline Redis Cache ➔ Media CDN"
  }
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
  const [hintIndex, setHintIndex] = useState(0);
  const [tempRevealAnswer, setTempRevealAnswer] = useState(false);

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

  function copyBoilerplateToEditor(boilerplateText: string) {
    setNotes(boilerplateText);
  }

  return (
    <div className={running ? "grid grid-cols-1 lg:grid-cols-5 gap-6" : ""}>
      <div className={running ? "lg:col-span-3" : "max-w-2xl"}>
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
