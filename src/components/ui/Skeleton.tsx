"use client";

import { CSSProperties } from "react";

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

function Skeleton({ className = "", style }: SkeletonProps) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} style={style} />;
}

export function TextSkeleton({ lines = 3, className = "" }: { lines?: number } & SkeletonProps) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

export function CardSkeleton({ className = "" }: SkeletonProps) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}>
      <Skeleton className="h-5 w-1/3 mb-4" />
      <Skeleton className="h-3 w-1/2 mb-6" />
      <Skeleton className="h-20 w-full mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 4, rows = 5 }: { cols?: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-6 py-4">
              <Skeleton className={`h-4 ${j === 0 ? "w-1/4" : "w-3/4"}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function ChartSkeleton({ height = 300, className = "" }: { height?: number } & SkeletonProps) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}>
      <Skeleton className="h-5 w-1/4 mb-2" />
      <Skeleton className="h-3 w-1/3 mb-6" />
      <div className="relative" style={{ height }}>
        <Skeleton className="absolute inset-0 rounded-lg" />
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-4 pb-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="w-8" style={{ height: `${20 + ((i * 37) % 61)}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
