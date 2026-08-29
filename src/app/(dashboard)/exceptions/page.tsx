'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Search, Filter } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import type { Exception } from '@/lib/types';

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);

const TYPE_LABELS: Record<string, string> = {
  unmatched_invoice: 'Unmatched Invoice',
  unmatched_payment: 'Unmatched Payment',
  partial_payment: 'Partial Payment',
  overpayment: 'Overpayment',
  duplicate_payment: 'Duplicate Payment',
  amount_mismatch: 'Amount Mismatch',
  reference_mismatch: 'Reference Mismatch',
  date_mismatch: 'Date Mismatch',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-blue-100 text-blue-800',
};

export default function ExceptionsPage() {
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (typeFilter) params.set('type', typeFilter);
    if (statusFilter) params.set('status', statusFilter);
    if (priorityFilter) params.set('priority', priorityFilter);
    const res = await fetch(`/api/exceptions?${params}`);
    return res.json();
  }, [page, typeFilter, statusFilter, priorityFilter]);

  useEffect(() => {
    let active = true;
    fetchData()
      .then((data) => {
        if (!active) return;
        setExceptions(data.exceptions || []);
        setTotal(data.total || 0);
      })
      .catch((e) => { if (active) console.error(e); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchData]);

  const applyData = (data: { exceptions: Exception[]; total: number }) => {
    setExceptions(data.exceptions || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  const updateException = async (id: string, status: string) => {
    await fetch('/api/exceptions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    applyData(await fetchData());
  };

  const totalPages = Math.ceil(total / 20);

  // Summary counts
  const openCount = exceptions.filter((e: Exception) => e.status === 'open').length;
  const investigatingCount = exceptions.filter((e: Exception) => e.status === 'investigating').length;
  const highPriority = exceptions.filter((e: Exception) => e.priority === 'high').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exception Center</h1>
          <p className="text-sm text-gray-500">{total} total exceptions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><div className="text-center"><p className="text-2xl font-bold text-red-600">{openCount}</p><p className="text-xs text-gray-500">Open</p></div></Card>
        <Card><div className="text-center"><p className="text-2xl font-bold text-blue-600">{investigatingCount}</p><p className="text-xs text-gray-500">Investigating</p></div></Card>
        <Card><div className="text-center"><p className="text-2xl font-bold text-orange-600">{highPriority}</p><p className="text-xs text-gray-500">High Priority</p></div></Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} options={[
          { value: '', label: 'All Types' },
          ...Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l })),
        ]} />
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} options={[
          { value: '', label: 'All Status' },
          { value: 'open', label: 'Open' },
          { value: 'investigating', label: 'Investigating' },
          { value: 'waiting', label: 'Waiting' },
          { value: 'resolved', label: 'Resolved' },
          { value: 'rejected', label: 'Rejected' },
        ]} />
        <Select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }} options={[
          { value: '', label: 'All Priorities' },
          { value: 'high', label: 'High' },
          { value: 'medium', label: 'Medium' },
          { value: 'low', label: 'Low' },
        ]} />
      </div>

      {exceptions.length === 0 && !loading ? (
        <EmptyState icon={<AlertTriangle className="w-12 h-12 text-gray-400" />} title="No exceptions" description="Exceptions will appear here when reconciliation finds issues." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Description</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Amount</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Priority</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {exceptions.map((exc: Exception) => (
                  <tr key={exc.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium">{TYPE_LABELS[exc.type] || exc.type}</span>
                    </td>
                    <td className="py-3 px-4 max-w-[300px]">
                      <p className="text-sm text-gray-600 truncate">{exc.description}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{fmt(exc.amount)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[exc.priority] || ''}`}>{exc.priority}</span>
                    </td>
                    <td className="py-3 px-4 text-center"><StatusBadge status={exc.status} /></td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex gap-1 justify-center">
                        {exc.status === 'open' && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => updateException(exc.id, 'investigating')}>Investigate</Button>
                            <Button variant="ghost" size="sm" onClick={() => updateException(exc.id, 'resolved')}>Resolve</Button>
                          </>
                        )}
                        {exc.status === 'investigating' && (
                          <Button variant="ghost" size="sm" onClick={() => updateException(exc.id, 'resolved')}>Resolve</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
