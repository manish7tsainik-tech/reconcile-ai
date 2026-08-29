'use client';

import { useState, useEffect, useCallback } from 'react';
import { Building2, Search, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import type { BankTransaction } from '@/lib/types';

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);

export default function BankTransactionsPage() {
  const [txns, setTxns] = useState<BankTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [matchStatus, setMatchStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (matchStatus) params.set('match_status', matchStatus);
    const res = await fetch(`/api/bank-transactions?${params}`);
    return res.json();
  }, [page, search, matchStatus]);

  useEffect(() => {
    let active = true;
    fetchData()
      .then((data) => {
        if (!active) return;
        setTxns(data.transactions || []);
        setTotal(data.total || 0);
      })
      .catch((e) => { if (active) console.error(e); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchData]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Transactions</h1>
          <p className="text-sm text-gray-500">{total} total transactions</p>
        </div>
        <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />}>Export</Button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="Search transactions..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} icon={<Search className="w-4 h-4" />} />
        </div>
        <Select value={matchStatus} onChange={(e) => { setMatchStatus(e.target.value); setPage(1); }} options={[
          { value: '', label: 'All Match Status' },
          { value: 'matched', label: 'Matched' },
          { value: 'unmatched', label: 'Unmatched' },
          { value: 'duplicate', label: 'Duplicate' },
          { value: 'flagged', label: 'Flagged' },
        ]} />
      </div>

      {txns.length === 0 && !loading ? (
        <EmptyState icon={<Building2 className="w-12 h-12 text-gray-400" />} title="No bank transactions yet" description="Upload bank transaction data or load demo data." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Transaction ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Payer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Reference</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Amount</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Type</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Match</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {[...Array(9)].map((_, j) => <td key={j} className="py-3 px-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                    </tr>
                  ))
                ) : (
                  txns.map((t: BankTransaction) => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-indigo-600">{t.transaction_id}</td>
                      <td className="py-3 px-4 text-gray-500">{t.transaction_date}</td>
                      <td className="py-3 px-4 max-w-[200px] truncate">{t.description}</td>
                      <td className="py-3 px-4">{t.payer_name}</td>
                      <td className="py-3 px-4 font-mono text-xs">{t.reference_number}</td>
                      <td className="py-3 px-4 text-right font-medium">
                        <span className={t.transaction_type === 'credit' ? 'text-emerald-600' : 'text-red-600'}>
                          {t.transaction_type === 'credit' ? '+' : '-'}{fmt(t.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs ${t.transaction_type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {t.transaction_type === 'credit' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {t.transaction_type === 'credit' ? 'Credit' : 'Debit'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center"><StatusBadge status={t.status} /></td>
                      <td className="py-3 px-4 text-center"><StatusBadge status={t.match_status} /></td>
                    </tr>
                  ))
                )}
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
