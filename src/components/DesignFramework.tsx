"use client";

import { useState } from "react";
import { DESIGN_FRAMEWORK } from "@/lib/design-knowledge";

type DesignFrameworkProps = {
  notes: Record<string, string>;
  onNotesChange: (sectionId: string, value: string) => void;
};

export default function DesignFramework({ notes, onNotesChange }: DesignFrameworkProps) {
  const [activeSection, setActiveSection] = useState(DESIGN_FRAMEWORK[0].id);

  const current = DESIGN_FRAMEWORK.find((s) => s.id === activeSection)!;

  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden">
      <div className="flex border-b border-stone-200 bg-stone-50 overflow-x-auto">
        {DESIGN_FRAMEWORK.map((section, i) => {
          const filled = (notes[section.id] ?? "").trim().length > 0;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex-shrink-0 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeSection === section.id
                  ? "border-stone-900 text-stone-900 bg-white"
                  : "border-transparent text-stone-400 hover:text-stone-700"
              }`}
            >
              <span className="mr-1.5 text-stone-300">{i + 1}.</span>
              {section.title}
              {filled && <span className="ml-1.5 w-1.5 h-1.5 inline-block rounded-full bg-green-500" />}
            </button>
          );
        })}
      </div>

      <div className="p-4">
        <p className="text-xs text-stone-500 mb-3">{current.prompt}</p>

        <textarea
          placeholder={`Your ${current.title.toLowerCase()} notes...`}
          value={notes[activeSection] ?? ""}
          onChange={(e) => onNotesChange(activeSection, e.target.value)}
          className="w-full h-36 px-3 py-2 border border-stone-200 rounded text-sm focus:outline-none focus:border-stone-900 resize-none"
        />

        <div className="mt-3 flex flex-wrap gap-1.5">
          {current.tips.map((tip) => (
            <span key={tip} className="text-xs px-2 py-0.5 bg-stone-50 text-stone-500 rounded border border-stone-100">
              {tip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function serializeDesignNotes(notes: Record<string, string>): string {
  return DESIGN_FRAMEWORK.map((s) => {
    const content = notes[s.id]?.trim();
    if (!content) return null;
    return `## ${s.title}\n${content}`;
  })
    .filter(Boolean)
    .join("\n\n");
}
