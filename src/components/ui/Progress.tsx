"use client";

interface ProgressProps {
  value: number;
  showLabel?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

function getColor(value: number): string {
  if (value < 50) return "bg-red-500";
  if (value < 80) return "bg-amber-500";
  return "bg-emerald-500";
}

function getTrackColor(value: number): string {
  if (value < 50) return "bg-red-100";
  if (value < 80) return "bg-amber-100";
  return "bg-emerald-100";
}

export default function Progress({ value, showLabel = false, className = "", size = "md" }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{Math.round(clamped)}%</span>
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-full ${getTrackColor(clamped)} ${sizeStyles[size]}`}>
        <div
          className={`${getColor(clamped)} ${sizeStyles[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
