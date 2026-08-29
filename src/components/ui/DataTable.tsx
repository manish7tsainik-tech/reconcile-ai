"use client";

import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Inbox,
} from "lucide-react";
import { ReactNode, useState, useMemo } from "react";

export interface Column<T> {
  header: string;
  accessorKey: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchKey?: string;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  keyExtractor: (row: T) => string;
}

function SkeletonRows({ count, cols }: { count: number; cols: number }) {
  return Array.from({ length: count }).map((_, i) => (
    <tr key={i} className="animate-pulse">
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="px-6 py-4">
          <div className="h-4 rounded bg-gray-200 w-3/4" />
        </td>
      ))}
    </tr>
  ));
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchPlaceholder = "Search...",
  searchKey,
  page = 1,
  totalPages = 1,
  onPageChange,
  onRowClick,
  loading = false,
  emptyMessage = "No data found",
  keyExtractor,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filteredData = useMemo(() => {
    if (!search || !searchKey) return data;
    const q = search.toLowerCase();
    return data.filter((row) => {
      const val = row[searchKey];
      return val !== undefined && String(val).toLowerCase().includes(q);
    });
  }, [data, search, searchKey]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      const an = Number(aVal);
      const bn = Number(bVal);
      const cmp = (!Number.isNaN(an) && !Number.isNaN(bn)) ? an - bn : String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir]);

  return (
    <div className="w-full">
      {searchKey && (
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm
                text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2
                focus:ring-indigo-500/20 focus:outline-none transition-colors"
            />
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.accessorKey}
                  className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500
                    ${col.sortable ? "cursor-pointer select-none hover:text-gray-700" : ""}
                    ${col.className || ""}`}
                  onClick={() => col.sortable !== false && handleSort(col.accessorKey)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable !== false && sortKey === col.accessorKey && (
                      sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              <SkeletonRows count={5} cols={columns.length} />
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center text-gray-400">
                    <Inbox className="h-10 w-10 mb-2" />
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((row, i) => (
                <tr
                  key={keyExtractor(row)}
                  className={`${onRowClick ? "cursor-pointer " : ""}${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-indigo-50/40 transition-colors`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.accessorKey} className={`px-6 py-3.5 text-sm text-gray-700 ${col.className || ""}`}>
                      {col.render ? col.render(row) : String(row[col.accessorKey] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                {columns.slice(0, 3).map((_, j) => (
                  <div key={j} className="h-4 rounded bg-gray-200 w-3/4" />
                ))}
              </div>
            ))
          : sortedData.length === 0
          ? (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <Inbox className="h-10 w-10 mb-2" />
              <p className="text-sm">{emptyMessage}</p>
            </div>
          )
          : sortedData.map((row) => (
              <div
                key={keyExtractor(row)}
                className={`rounded-xl border border-gray-200 bg-white p-4 ${onRowClick ? "cursor-pointer hover:border-indigo-300" : ""} transition-colors`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <div key={col.accessorKey} className="flex items-center justify-between py-1.5">
                    <span className="text-xs font-medium text-gray-500">{col.header}</span>
                    <span className="text-sm text-gray-900">
                      {col.render ? col.render(row) : String(row[col.accessorKey] ?? "")}
                    </span>
                  </div>
                ))}
              </div>
            ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white p-2
                text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (page <= 4) {
                pageNum = i + 1;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange?.(pageNum)}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors
                    ${pageNum === page
                      ? "bg-indigo-600 text-white"
                      : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white p-2
                text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
