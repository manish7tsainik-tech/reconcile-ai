"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { ReactNode } from "react";

interface KPICardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: ReactNode;
  borderColor?: string;
  className?: string;
}

export default function KPICard({
  label,
  value,
  change,
  icon,
  borderColor = "border-l-indigo-500",
  className = "",
}: KPICardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div
      className={`rounded-xl border border-gray-200 border-l-4 ${borderColor} bg-white p-5 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-600" />
              )}
              <span
                className={`text-xs font-semibold ${isPositive ? "text-emerald-600" : "text-red-600"}`}
              >
                {isPositive ? "+" : ""}
                {change.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
