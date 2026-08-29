export function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatPercent(num: number): string {
  return `${num.toFixed(1)}%`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(dateStr);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    paid: 'bg-emerald-100 text-emerald-800',
    completed: 'bg-emerald-100 text-emerald-800',
    approved: 'bg-emerald-100 text-emerald-800',
    matched: 'bg-emerald-100 text-emerald-800',
    resolved: 'bg-emerald-100 text-emerald-800',
    pending: 'bg-amber-100 text-amber-800',
    investigating: 'bg-blue-100 text-blue-800',
    waiting: 'bg-purple-100 text-purple-800',
    review: 'bg-blue-100 text-blue-800',
    overdue: 'bg-red-100 text-red-800',
    failed: 'bg-red-100 text-red-800',
    rejected: 'bg-red-100 text-red-800',
    unmatched: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-gray-100 text-gray-800',
    flagged: 'bg-orange-100 text-orange-800',
    partial: 'bg-amber-100 text-amber-800',
    duplicate: 'bg-purple-100 text-purple-800',
    refunded: 'bg-gray-100 text-gray-800',
    ignored: 'bg-gray-100 text-gray-500',
    open: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getConfidenceColor(score: number): string {
  if (score >= 95) return 'text-emerald-600';
  if (score >= 85) return 'text-blue-600';
  if (score >= 70) return 'text-amber-600';
  if (score >= 50) return 'text-orange-600';
  return 'text-red-600';
}

export function getConfidenceBg(score: number): string {
  if (score >= 95) return 'bg-emerald-50 border-emerald-200';
  if (score >= 85) return 'bg-blue-50 border-blue-200';
  if (score >= 70) return 'bg-amber-50 border-amber-200';
  if (score >= 50) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
}

export function getMatchTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    exact: 'Exact Match',
    fuzzy: 'Fuzzy Match',
    partial: 'Partial Match',
    multiple_candidate: 'Multiple Candidates',
    duplicate: 'Duplicate',
    overpayment: 'Overpayment',
    underpayment: 'Underpayment',
    unmatched: 'Unmatched',
  };
  return labels[type] || type;
}

export function getMatchTypeColor(type: string): string {
  const colors: Record<string, string> = {
    exact: 'bg-emerald-100 text-emerald-800',
    fuzzy: 'bg-blue-100 text-blue-800',
    partial: 'bg-amber-100 text-amber-800',
    multiple_candidate: 'bg-purple-100 text-purple-800',
    duplicate: 'bg-red-100 text-red-800',
    overpayment: 'bg-orange-100 text-orange-800',
    underpayment: 'bg-yellow-100 text-yellow-800',
    unmatched: 'bg-gray-100 text-gray-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

export function getExceptionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    unmatched_invoice: 'Unmatched Invoice',
    unmatched_payment: 'Unmatched Payment',
    partial_payment: 'Partial Payment',
    overpayment: 'Overpayment',
    duplicate_payment: 'Duplicate Payment',
    amount_mismatch: 'Amount Mismatch',
    reference_mismatch: 'Reference Mismatch',
    date_mismatch: 'Date Mismatch',
  };
  return labels[type] || type;
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-amber-100 text-amber-800',
    low: 'bg-blue-100 text-blue-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
}
