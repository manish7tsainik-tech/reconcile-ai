'use client';

import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Search, Download } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import type { PaymentTransaction } from '@/lib/types';

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);

export default function PaymentGatewayPage() {
  const [txns, setTxns] = useState<PaymentTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [gateway, setGateway] = useState('');
  const [matchStatus, setMatchStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (gateway) params.set('gateway', gateway);
    if (matchStatus) params.set('match_status', matchStatus);
    const res = await fetch(`/api/payment-transactions?${params}`);
    return res.json();
  }, [page, search, gateway, matchStatus]);

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
          <h1 className="text-2xl font-bold text-gray-900">Payment Gateway</h1>
          <p className="text-sm text-gray-500">{total} payment transactions</p>
        </div>
        <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />}>Export</Button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="Search payments..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} icon={<Search className="w-4 h-4" />} />
        </div>
        <Select value={gateway} onChange={(e) => { setGateway(e.target.value); setPage(1); }} options={[
          { value: '', label: 'All Gateways' },
          { value: 'Razorpay', label: 'Razorpay' },
          { value: 'Stripe', label: 'Stripe' },
          { value: 'PayPal', label: 'PayPal' },
        ]} />
        <Select value={matchStatus} onChange={(e) => { setMatchStatus(e.target.value); setPage(1); }} options={[
          { value: '', label: 'All Match Status' },
          { value: 'matched', label: 'Matched' },
          { value: 'unmatched', label: 'Unmatched' },
          { value: 'partial', label: 'Partial' },
        ]} />
      </div>

      {txns.length === 0 && !loading ? (
        <EmptyState icon={<CreditCard className="w-12 h-12 text-gray-400" />} title="No payment transactions yet" description="Payment gateway data will appear here after upload." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Payment ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Order ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Gateway</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Method</th>
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
                  txns.map((t: PaymentTransaction) => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-indigo-600">{t.payment_id}</td>
                      <td className="py-3 px-4 font-mono text-xs">{t.order_id}</td>
                      <td className="py-3 px-4">{t.customer_name}</td>
                      <td className="py-3 px-4 text-gray-500">{t.payment_date}</td>
                      <td className="py-3 px-4 text-right font-medium">{fmt(t.amount)}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{t.gateway}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{t.payment_method}</td>
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
