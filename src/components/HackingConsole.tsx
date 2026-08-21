"use client";

import React, { useState, useRef, useEffect } from "react";
import { playCyberSound, isAudioEnabled, setAudioEnabled } from "@/lib/cyber-audio";

type LogLine = {
  text: string;
  type: "info" | "success" | "error" | "output" | "input";
};

export default function HackingConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([
    { text: "SYSTEM DIAGNOSTICS: ONLINE (v1.45)", type: "info" },
    { text: "SECURE SOCKET ESTABLISHED. TYPE /help FOR LIST OF COMMANDS.", type: "info" },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [audioState, setAudioState] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAudioState(isAudioEnabled());
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  // Handle hotkeys (open with Backtick ` key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "`") {
        e.preventDefault();
        setIsOpen((prev) => {
          const next = !prev;
          if (next) playCyberSound("boot");
          else playCyberSound("click");
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const addLog = (text: string, type: LogLine["type"] = "output") => {
    setLogs((prev) => [...prev, { text, type }]);
  };

  const handleCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    playCyberSound("click");
    addLog(`> ${trimmed}`, "input");

    const parts = trimmed.split(" ");
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case "/help":
        addLog("Available commands:", "info");
        addLog("  /decrypt     - Start database decryption probe", "output");
        addLog("  /sysinfo     - System diagnostic specs", "output");
        addLog("  /audio [on]  - Toggle audio sound synthesiser", "output");
        addLog("  /clear       - Flush scroll back logs", "output");
        addLog("  /hack        - Run continuous digital binary rain sweep", "output");
        addLog("  /status      - Tutor connection link strength", "output");
        break;

      case "/clear":
        setLogs([]);
        break;

      case "/sysinfo":
        addLog("PREPWISE NODE CONFIGURATION:", "info");
        addLog(`  PLATFORM: client-sandbox // CPU: WebAssembly Engine`, "output");
        addLog(`  INTELLIGENCE CORE: tutorchat-v4.exe`, "output");
        addLog(`  AUDIO EXTENSIONS: WebAudio Synthesizer`, "output");
        addLog(`  SECURE TUNNEL: SSL/AES-256`, "output");
        addLog(`  DECRYPT OVERRIDES: ACTIVE`, "success");
        break;

      case "/audio":
        if (args[0] === "on") {
          setAudioEnabled(true);
          setAudioState(true);
          addLog("SOUND EMULATOR ENGINE: INITIALIZED", "success");
          playCyberSound("success");
        } else if (args[0] === "off") {
          setAudioEnabled(false);
          setAudioState(false);
          addLog("SOUND EMULATOR ENGINE: DEACTIVATED", "info");
        } else {
          const next = !audioState;
          setAudioEnabled(next);
          setAudioState(next);
          addLog(`SOUND EMULATOR ENGINE: ${next ? "INITIALIZED" : "DEACTIVATED"}`, next ? "success" : "info");
          if (next) playCyberSound("success");
        }
        break;

      case "/status":
        addLog("DIAGNOSTICS RESOLVED:", "info");
        addLog("  [AI TUTOR] => ping: 14ms (healthy)", "success");
        addLog("  [SQLITE DB] => Dev database size: 40KB", "success");
        addLog("  [SESSION] => Active", "info");
        break;

      case "/hack":
        addLog("RUNNING BINARY PROBE OVERRIDES...", "info");
        for (let i = 0; i < 5; i++) {
          const line = Array(15).fill(0).map(() => (Math.random() > 0.5 ? "1" : "0")).join(" ");
          setTimeout(() => {
            addLog(line, "success");
            playCyberSound("click");
          }, i * 350);
        }
        break;

      case "/decrypt":
        addLog("LAUNCHING BRUTEFORCE PROBE ON DB SCHEMA...", "error");
        playCyberSound("error");
        setTimeout(() => {
          addLog("[10%] SCANNING MEMORY SECTORS...", "info");
          playCyberSound("click");
        }, 400);
        setTimeout(() => {
          addLog("[40%] MATCHING CRYPTO HASHES...", "info");
          playCyberSound("click");
        }, 900);
        setTimeout(() => {
          addLog("[80%] SCHEMAS RECOVERED: sqlite_master, User, Question, PracticeSession", "success");
          playCyberSound("click");
        }, 1500);
        setTimeout(() => {
          addLog("[100%] TARGET FULLY DECRYPTED. SECURE INJECTION CAPABLE.", "success");
          playCyberSound("success");
        }, 2200);
        break;

      default:
        addLog(`Unknown shell command: '${cmd}'. Type /help for assistance.`, "error");
        playCyberSound("error");
        break;
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    handleCommand(inputVal);
    setInputVal("");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 select-none">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            playCyberSound("boot");
          }}
          className="flex items-center gap-2 px-3 py-2 bg-stone-950 border border-stone-200 text-[#00ff66] text-xs font-mono rounded-lg hover:border-stone-900 shadow-md shadow-emerald-950/20 active:scale-95 transition-all"
        >
          <span className="animate-pulse">⚡</span>
          <span>SYSTEM_SHELL</span>
        </button>
      )}

      {/* Terminal Expanded Pane */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-80 flex flex-col bg-stone-950 border-2 border-stone-200 rounded-lg shadow-lg shadow-emerald-900/10 overflow-hidden font-mono text-xs">
          {/* Header */}
          <div className="px-3 py-2 bg-stone-100 border-b border-stone-250 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-[10px] text-stone-500 font-bold">PREPWISE_SHELL://v1.45</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const next = !audioState;
                  setAudioEnabled(next);
                  setAudioState(next);
                  playCyberSound(next ? "success" : "click");
                }}
                className="text-[10px] text-stone-505 hover:text-stone-900 bg-none border-none p-0 cursor-pointer"
                title="Toggle Beep Synth Sounds"
              >
                {audioState ? "🔊 SOUNDS" : "🔇 MUTE"}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  playCyberSound("click");
                }}
                className="text-stone-500 hover:text-stone-900 font-bold px-1 text-sm bg-none border-none"
              >
                ×
              </button>
            </div>
          </div>

          {/* Logs scroll console */}
          <div ref={scrollRef} className="flex-1 p-3 overflow-y-auto space-y-2 bg-[#020403] select-text">
            {logs.map((log, i) => {
              let textClasses = "";
              if (log.type === "info") textClasses = "text-amber-500";
              else if (log.type === "success") textClasses = "text-[#00ff66]";
              else if (log.type === "error") textClasses = "text-red-500";
              else if (log.type === "input") textClasses = "text-stone-300 font-semibold";
              else textClasses = "text-stone-400";

              return (
                <div key={i} className={`whitespace-pre-wrap leading-relaxed ${textClasses}`}>
                  {log.text}
                </div>
              );
            })}
          </div>

          {/* Bottom input field */}
          <form onSubmit={handleTextSubmit} className="p-2 border-t border-stone-200 bg-stone-900 flex gap-2">
            <span className="text-[#39ff14] text-xs flex items-center pr-1">&gt;</span>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Type command... (e.g. /help)"
              className="flex-1 bg-transparent px-2 py-1 text-xs border border-transparent focus:border-transparent focus:ring-0 text-[#00ff66] focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="px-2 py-1 bg-stone-100 hover:bg-stone-50 text-[#00ff66] border border-stone-200 rounded text-[10px] active:scale-95"
            >
              RUN
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
