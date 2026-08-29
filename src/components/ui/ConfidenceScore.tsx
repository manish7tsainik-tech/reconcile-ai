"use client";

interface ConfidenceScoreProps {
  score: number;
  showBar?: boolean;
  className?: string;
}

function getLevel(score: number): { label: string; color: string; bg: string; trackBg: string } {
  if (score >= 95) return { label: "Exact / Very High", color: "text-emerald-700", bg: "bg-emerald-500", trackBg: "bg-emerald-100" };
  if (score >= 85) return { label: "High", color: "text-blue-700", bg: "bg-blue-500", trackBg: "bg-blue-100" };
  if (score >= 70) return { label: "Medium", color: "text-amber-700", bg: "bg-amber-500", trackBg: "bg-amber-100" };
  if (score >= 50) return { label: "Low", color: "text-orange-700", bg: "bg-orange-500", trackBg: "bg-orange-100" };
  return { label: "No Match", color: "text-red-700", bg: "bg-red-500", trackBg: "bg-red-100" };
}

export default function ConfidenceScore({ score, showBar = true, className = "" }: ConfidenceScoreProps) {
  const level = getLevel(score);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center gap-2">
        <span className={`text-lg font-bold tabular-nums ${level.color}`}>
          {score.toFixed(1)}%
        </span>
        <span className={`text-xs font-medium ${level.color} rounded-full px-2 py-0.5 ${level.trackBg}`}>
          {level.label}
        </span>
      </div>
      {showBar && (
        <div className={`h-2 w-full overflow-hidden rounded-full ${level.trackBg}`}>
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${level.bg}`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
      )}
    </div>
  );
}
