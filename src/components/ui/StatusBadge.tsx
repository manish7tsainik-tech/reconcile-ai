"use client";

const statusConfig: Record<string, { label: string; color: string }> = {
  paid:          { label: "Paid",          color: "bg-emerald-100 text-emerald-700" },
  completed:     { label: "Completed",     color: "bg-emerald-100 text-emerald-700" },
  matched:       { label: "Matched",       color: "bg-emerald-100 text-emerald-700" },
  approved:      { label: "Approved",      color: "bg-emerald-100 text-emerald-700" },
  resolved:      { label: "Resolved",      color: "bg-emerald-100 text-emerald-700" },
  exact:         { label: "Exact Match",   color: "bg-emerald-100 text-emerald-700" },

  pending:       { label: "Pending",       color: "bg-blue-100 text-blue-700" },
  investigating: { label: "Investigating", color: "bg-blue-100 text-blue-700" },
  review:        { label: "In Review",     color: "bg-blue-100 text-blue-700" },
  waiting:       { label: "Waiting",       color: "bg-blue-100 text-blue-700" },
  fuzzy:         { label: "Fuzzy Match",   color: "bg-blue-100 text-blue-700" },

  partial:       { label: "Partial",       color: "bg-amber-100 text-amber-700" },

  overdue:       { label: "Overdue",       color: "bg-red-100 text-red-700" },
  failed:        { label: "Failed",        color: "bg-red-100 text-red-700" },
  rejected:      { label: "Rejected",      color: "bg-red-100 text-red-700" },
  open:          { label: "Open",          color: "bg-red-100 text-red-700" },
  underpayment:  { label: "Underpayment",  color: "bg-red-100 text-red-700" },

  duplicate:     { label: "Duplicate",     color: "bg-purple-100 text-purple-700" },
  multiplecandidate: { label: "Multiple Candidates", color: "bg-purple-100 text-purple-700" },
  flagged:       { label: "Flagged",       color: "bg-orange-100 text-orange-700" },
  overpayment:   { label: "Overpayment",   color: "bg-orange-100 text-orange-700" },

  unmatched:     { label: "Unmatched",     color: "bg-gray-100 text-gray-600" },
  ignored:       { label: "Ignored",       color: "bg-gray-100 text-gray-500" },
  refunded:      { label: "Refunded",      color: "bg-gray-100 text-gray-600" },
  cancelled:     { label: "Cancelled",     color: "bg-gray-100 text-gray-600" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/[\s_-]+/g, "");
  const config = Object.entries(statusConfig).find(
    ([key]) => key.replace(/[\s_-]+/g, "") === normalized
  )?.[1] || { label: status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), color: "bg-gray-100 text-gray-600" };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color} ${className}`}
    >
      {config.label}
    </span>
  );
}
