"use client";

type TimerProps = {
  seconds: number;
  running: boolean;
  limit?: number;
  size?: "sm" | "lg";
};

export default function Timer({ seconds, running, limit, size = "lg" }: TimerProps) {
  const m = Math.floor(seconds / 60);
  const sec = seconds % 60;
  const display = `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;

  const progress = limit ? Math.min((seconds / limit) * 100, 100) : 0;
  const overtime = limit ? seconds > limit : false;

  if (size === "sm") {
    return (
      <span className={`font-mono text-sm ${overtime ? "text-red-600" : running ? "text-stone-900" : "text-stone-400"}`}>
        {display}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        {limit && (
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#e7e5e4" strokeWidth="4" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke={overtime ? "#dc2626" : "#292524"}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
        )}
        <div className={`absolute inset-0 flex items-center justify-center text-3xl font-light font-mono ${overtime ? "text-red-600" : ""}`}>
          {display}
        </div>
      </div>
      {running && (
        <span className="text-xs text-stone-400 animate-pulse">
          {overtime ? "Time's up!" : "Recording..."}
        </span>
      )}
      {limit && !running && (
        <span className="text-xs text-stone-400">Limit: {Math.floor(limit / 60)} min</span>
      )}
    </div>
  );
}

export function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}
