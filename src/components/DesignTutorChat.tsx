"use client";

import { useState, useRef, useEffect } from "react";
import ArchitectureDiagramView from "@/components/ArchitectureDiagram";
import ArchitectureWhiteboard, { serializeWhiteboardToText } from "@/components/ArchitectureWhiteboard";
import {
  getDiagram,
  getDiagramsForQuestion,
  type ArchNode,
} from "@/lib/architecture-diagrams";
import type { DesignStep } from "@/lib/tutor";
import { playCyberSound } from "@/lib/cyber-audio";

type Message = {
  role: "user" | "assistant";
  content: string;
  currentStep?: DesignStep;
  nextStepLabel?: string;
};

type DesignTutorChatProps = {
  questionId: string;
  questionTitle: string;
  collapsed?: boolean;
};

const STEPS: { id: DesignStep; label: string; num: number }[] = [
  { id: "requirements", label: "Requirements", num: 1 },
  { id: "api", label: "API & Data", num: 2 },
  { id: "architecture", label: "Architecture", num: 3 },
  { id: "deep-dive", label: "Deep Dive", num: 4 },
];

const CHAT_PROMPTS = [
  { label: "How do I start?", message: "How do I start?" },
  { label: "Step 2: API", message: "Help with API design" },
  { label: "Step 3: Components", message: "Explain the architecture" },
  { label: "What's next?", message: "What's next?" },
];

const NODE_EXPLAIN: Record<string, string> = {
  client: "End users or apps that interact with the system.",
  gateway: "Entry point — load balancer or API gateway. Routes traffic and handles TLS.",
  service: "Business logic layer. Stateless — scale by adding more instances.",
  cache: "In-memory store (Redis) for hot data. Cuts DB load and latency.",
  queue: "Message broker (Kafka) for async, reliable delivery between services.",
  db: "Persistent storage. SQL or NoSQL depending on access patterns.",
  cdn: "Edge cache for static content and redirects. Serves users closer geographically.",
  storage: "Object storage or configuration store for files and settings.",
};

export default function DesignTutorChat({
  questionId,
  questionTitle,
  collapsed: initialCollapsed = false,
}: DesignTutorChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [tab, setTab] = useState<"chat" | "diagram">("chat");
  const [workspaceMode, setWorkspaceMode] = useState<"whiteboard" | "reference">("whiteboard");
  const [activeDiagramId, setActiveDiagramId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<ArchNode | null>(null);
  const [currentStep, setCurrentStep] = useState<DesignStep>("requirements");
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function speakResponse(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.pitch = 1.05;
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  function startSpeechRecognition() {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setIsListening(true);
      playCyberSound("click");
    };
    recognition.onerror = () => {
      setIsListening(false);
      playCyberSound("error");
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        setInput(transcript);
        playCyberSound("success");
      }
    };
    recognition.start();
  }

  const allDiagrams = getDiagramsForQuestion(questionTitle);
  const currentDiagram = getDiagram(questionTitle, activeDiagramId ?? allDiagrams[0]?.id ?? "");

  useEffect(() => {
    if (allDiagrams[0] && !activeDiagramId) {
      setActiveDiagramId(allDiagrams[0].id);
    }
  }, [allDiagrams, activeDiagramId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string, options?: { switchTab?: "chat" | "diagram" }) {
    if (!text.trim() || loading) return;

    if (options?.switchTab) setTab(options.switchTab);

    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      let whiteboardSummary = "";
      try {
        const saved = localStorage.getItem(`whiteboard_${questionId}`);
        if (saved) {
          const { nodes, edges } = JSON.parse(saved);
          if (nodes && nodes.length > 0) {
            whiteboardSummary = serializeWhiteboardToText(nodes, edges);
          }
        }
      } catch (err) {
        console.error("Failed to load whiteboard summary", err);
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, messages: newMessages, whiteboardSummary }),
      });
      const data = await res.json();

      if (data.diagramId) setActiveDiagramId(data.diagramId);
      if (data.currentStep) setCurrentStep(data.currentStep);
      if (data.switchToDiagram) setTab("diagram");

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: data.reply,
          currentStep: data.currentStep,
          nextStepLabel: data.nextStepLabel,
        },
      ]);
      if (ttsEnabled) {
        speakResponse(data.reply);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function askAboutNode(node: ArchNode) {
    setSelectedNode(node);
    setTab("chat");
    sendMessage(`Explain the ${node.label} component — what is it used for and why do we need it?`);
  }

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-stone-900 text-white text-sm rounded-full shadow-lg hover:bg-stone-800 transition-colors"
      >
        <span className="text-base">🎓</span>
        Design Tutor
      </button>
    );
  }

  return (
    <div className="flex flex-col border border-stone-200 rounded-lg bg-white h-full min-h-[520px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-stone-50 rounded-t-lg">
        <div>
          <h3 className="text-sm font-medium">Design Tutor</h3>
          <p className="text-xs text-stone-400 truncate max-w-[150px]">{questionTitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = !ttsEnabled;
              setTtsEnabled(next);
              if (!next && typeof window !== "undefined") {
                window.speechSynthesis?.cancel();
              }
            }}
            className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${ttsEnabled ? "bg-stone-900 text-[#00ff66] border-[#00ff66]" : "bg-transparent text-stone-450 border-stone-200"
              }`}
          >
            {ttsEnabled ? "🔊 VOICE ON" : "🔇 VOICE OFF"}
          </button>
          <button
            type="button"
            onClick={() => {
              setCollapsed(true);
              if (typeof window !== "undefined") {
                window.speechSynthesis?.cancel();
              }
            }}
            className="text-xs text-stone-405 hover:text-stone-900 px-1 py-0.5"
          >
            Minimize
          </button>
        </div>
      </div>

      <div className="flex border-b border-stone-200">
        <button
          onClick={() => setTab("chat")}
          className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${tab === "chat" ? "border-stone-900 text-stone-900" : "border-transparent text-stone-400"
            }`}
        >
          💬 Step-by-step Guide
        </button>
        <button
          onClick={() => setTab("diagram")}
          className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${tab === "diagram" ? "border-stone-900 text-stone-900" : "border-transparent text-stone-400"
            }`}
        >
          🏗️ Architecture
        </button>
      </div>

      {tab === "diagram" ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Segmented Workspace Toggle */}
          <div className="p-2 border-b border-stone-200 bg-stone-50/50 flex gap-2">
            <div className="flex rounded-md bg-stone-100 p-0.5 border border-stone-200 w-full font-medium">
              <button
                type="button"
                onClick={() => setWorkspaceMode("whiteboard")}
                className={`flex-1 py-1 text-center rounded text-[10px] transition-all duration-150 cursor-pointer ${workspaceMode === "whiteboard"
                  ? "bg-white text-stone-950 shadow-xs ring-1 ring-black/5"
                  : "text-stone-500 hover:text-stone-850"
                  }`}
              >
                🏗️ Design Workspace
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceMode("reference")}
                className={`flex-1 py-1 text-center rounded text-[10px] transition-all duration-150 cursor-pointer ${workspaceMode === "reference"
                  ? "bg-white text-stone-950 shadow-xs ring-1 ring-black/5"
                  : "text-stone-500 hover:text-stone-850"
                  }`}
              >
                📖 Reference Solution
              </button>
            </div>
          </div>

          {workspaceMode === "whiteboard" ? (
            <div className="flex-1 overflow-y-auto min-h-0 bg-stone-50">
              <ArchitectureWhiteboard questionId={questionId} />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
              {allDiagrams.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-8">No diagram for this question.</p>
              ) : (
                <>
                  <p className="text-[10px] text-stone-400 px-1">
                    Visual layout only — switch to <strong>Step-by-step Guide</strong> for explanations
                  </p>

                  {allDiagrams.length > 1 && (
                    <div className="flex flex-wrap gap-1.5">
                      {allDiagrams.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => { setActiveDiagramId(d.id); setSelectedNode(null); }}
                          className={`text-xs px-2 py-1 rounded border ${activeDiagramId === d.id
                            ? "bg-stone-900 text-white border-stone-900"
                            : "border-stone-200 text-stone-500 hover:border-stone-400"
                            }`}
                        >
                          {d.title.split("—")[1]?.trim() ?? d.title}
                        </button>
                      ))}
                    </div>
                  )}

                  {currentDiagram && (
                    <ArchitectureDiagramView
                      diagram={currentDiagram}
                      compact
                      onNodeClick={(node) => setSelectedNode(node)}
                    />
                  )}

                  {selectedNode && (
                    <div className="border border-stone-200 rounded-lg p-3 bg-stone-50">
                      <div className="text-xs font-medium text-stone-700 mb-1">{selectedNode.label}</div>
                      {selectedNode.sublabel && (
                        <div className="text-[10px] text-stone-400 mb-1">{selectedNode.sublabel}</div>
                      )}
                      <p className="text-xs text-stone-500">{NODE_EXPLAIN[selectedNode.type]}</p>
                      <button
                        onClick={() => askAboutNode(selectedNode)}
                        className="text-xs text-stone-600 underline mt-2 hover:text-stone-900"
                      >
                        Explain in chat →
                      </button>
                    </div>
                  )}

                  <p className="text-[10px] text-stone-400 text-center">
                    Click a component, then "Explain in chat" for a step-by-step breakdown
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Step progress */}
          <div className="px-4 py-2 border-b border-stone-100 bg-stone-50/50">
            <div className="flex gap-1">
              {STEPS.map((s) => {
                const active = s.id === currentStep;
                const done = STEPS.findIndex((x) => x.id === currentStep) > STEPS.findIndex((x) => x.id === s.id);
                return (
                  <div
                    key={s.id}
                    className={`flex-1 text-center py-1 rounded text-[10px] font-medium ${active
                      ? "bg-stone-900 text-white"
                      : done
                        ? "bg-stone-200 text-stone-600"
                        : "bg-stone-100 text-stone-400"
                      }`}
                  >
                    {s.num}. {s.label.split(" ")[0]}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="text-center py-6 px-2">
                <div className="text-2xl mb-2">🎓</div>
                <p className="text-sm text-stone-600 mb-1">Step-by-step interview coach</p>
                <p className="text-xs text-stone-400 leading-relaxed">
                  I'll explain each step in order — requirements, API, components, and trade-offs.
                  Visual diagrams are in the <strong>Architecture</strong> tab.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className="group/msg relative">
                <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-start gap-1 pb-1`}>
                  {msg.role === "assistant" && (
                    <button
                      type="button"
                      onClick={() => speakResponse(msg.content)}
                      className="opacity-0 group-hover/msg:opacity-100 transition-opacity text-xs p-1 rounded border border-stone-200 bg-white hover:bg-stone-100 cursor-pointer self-center"
                      title="Speak message out loud"
                    >
                      🔊
                    </button>
                  )}
                  <div
                    className={`max-w-[92%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${msg.role === "user"
                      ? "bg-stone-900 text-white rounded-br-sm"
                      : "bg-stone-50 text-stone-700 border border-stone-100 rounded-bl-sm"
                      }`}
                  >
                    {renderMarkdown(msg.content)}
                  </div>
                </div>

                {msg.role === "assistant" && msg.nextStepLabel && (
                  <button
                    onClick={() => sendMessage("What's next?")}
                    disabled={loading}
                    className="mt-2 ml-1 text-xs px-3 py-1.5 rounded-full border border-stone-300 text-stone-600 hover:bg-stone-100 hover:border-stone-400 disabled:opacity-50"
                  >
                    → {msg.nextStepLabel}
                  </button>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-lg bg-stone-50 border border-stone-100 text-sm text-stone-400">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce">·</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>·</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>·</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-3 pt-2 pb-1 flex flex-wrap gap-1.5 border-t border-stone-100">
            {CHAT_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => sendMessage(p.message)}
                disabled={loading}
                className="text-xs px-2 py-1 rounded border border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-700 disabled:opacity-50"
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => { setTab("diagram"); }}
              className="text-xs px-2 py-1 rounded border border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300"
            >
              🏗️ View diagram
            </button>
          </div>

          <div className="p-3 border-t border-stone-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-2"
            >
              <button
                type="button"
                onClick={startSpeechRecognition}
                disabled={loading}
                className={`px-2.5 py-2 rounded border focus:outline-none flex items-center justify-center transition-all ${isListening
                  ? "bg-red-500/25 border-red-500 text-red-500 animate-pulse"
                  : "bg-[#060b09] border-stone-200 text-stone-507 hover:border-[#00ff66] hover:text-[#00ff66]"
                  }`}
                title="Speak your doubt (Voice Dictation)"
              >
                {isListening ? "🎤 ON" : "🎙️ Voice"}
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Ask about the next step..."}
                disabled={loading || isListening}
                className="flex-1 px-3 py-2 border border-stone-200 rounded text-sm focus:outline-none focus:border-stone-900 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim() || isListening}
                className="px-3 py-2 bg-stone-900 text-white text-sm rounded hover:bg-stone-800 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
