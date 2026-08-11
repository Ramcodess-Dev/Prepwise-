type BadgeProps = {
  label: string;
  variant?: "default" | "category" | "difficulty";
  difficulty?: "easy" | "medium" | "hard";
};

const categoryColors: Record<string, string> = {
  behavioral: "bg-blue-50 text-blue-700 border-blue-200",
  technical: "bg-violet-50 text-violet-700 border-violet-200",
  "system-design": "bg-amber-50 text-amber-700 border-amber-200",
};

const difficultyColors: Record<string, string> = {
  easy: "bg-green-50 text-green-700 border-green-200",
  medium: "bg-stone-50 text-stone-600 border-stone-200",
  hard: "bg-red-50 text-red-700 border-red-200",
};

export default function Badge({ label, variant = "default", difficulty }: BadgeProps) {
  let classes = "inline-flex items-center px-2 py-0.5 text-xs rounded border ";

  if (variant === "category") {
    classes += categoryColors[label] ?? "bg-stone-50 text-stone-600 border-stone-200";
  } else if (variant === "difficulty" && difficulty) {
    classes += difficultyColors[difficulty] ?? difficultyColors.medium;
  } else {
    classes += "bg-stone-50 text-stone-600 border-stone-200";
  }

  const display =
    variant === "category"
      ? label.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
      : label;

  return <span className={classes}>{display}</span>;
}
