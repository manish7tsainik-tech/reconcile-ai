'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, CreditCard, GitMerge, AlertTriangle, TrendingUp, TrendingDown,
  DollarSign, BarChart3, ArrowUpRight, ArrowDownRight, RefreshCw, Upload
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import Link from 'next/link';
import KPICard from '@/components/ui/KPICard';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfidenceScore from '@/components/ui/ConfidenceScore';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import type { Invoice, BankTransaction, PaymentTransaction, ReconciliationRun, Exception, ReconciliationResultRow } from '@/lib/types';

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);
const COLORS = { matched: '#10b981', partial: '#3b82f6', review: '#f59e0b', unmatched: '#ef4444', duplicate: '#8b5cf6' };

type DashData = {
  inv: { invoices: Invoice[]; total: number };
  bank: { transactions: BankTransaction[]; total: number };
  pay: { transactions: PaymentTransaction[]; total: number };
  recon: { results: ReconciliationResultRow[]; runs: ReconciliationRun[]; latestRun: ReconciliationRun | null };
  exc: { exceptions: Exception[]; total: number };
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bankTxns, setBankTxns] = useState<BankTransaction[]>([]);
  const [payTxns, setPayTxns] = useState<PaymentTransaction[]>([]);
  const [results, setResults] = useState<ReconciliationResultRow[]>([]);
  const [runs, setRuns] = useState<ReconciliationRun[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [hasData, setHasData] = useState(false);

  const fetchData = async (): Promise<DashData> => {
    const [invRes, bankRes, payRes, reconRes, excRes] = await Promise.allSettled([
      fetch('/api/invoices?limit=9999').then(r => r.json()),
      fetch('/api/bank-transactions?limit=9999').then(r => r.json()),
      fetch('/api/payment-transactions?limit=9999').then(r => r.json()),
      fetch('/api/reconciliation').then(r => r.json()),
      fetch('/api/exceptions?limit=9999').then(r => r.json()),
    ]);

    const inv = (invRes.status === 'fulfilled' ? invRes.value : { invoices: [], total: 0 }) as DashData['inv'];
    const bank = (bankRes.status === 'fulfilled' ? bankRes.value : { transactions: [], total: 0 }) as DashData['bank'];
    const pay = (payRes.status === 'fulfilled' ? payRes.value : { transactions: [], total: 0 }) as DashData['pay'];
    const recon = (reconRes.status === 'fulfilled' ? reconRes.value : { results: [], runs: [], latestRun: null }) as DashData['recon'];
    const exc = (excRes.status === 'fulfilled' ? excRes.value : { exceptions: [], total: 0 }) as DashData['exc'];

    return { inv, bank, pay, recon, exc };
  };

  const applyData = (d: DashData) => {
    setInvoices(d.inv.invoices || []);
    setBankTxns(d.bank.transactions || []);
    setPayTxns(d.pay.transactions || []);
    setResults(d.recon.results || []);
    setRuns(d.recon.runs || []);
    setExceptions(d.exc.exceptions || []);
    setHasData((d.inv.total || 0) > 0 || (d.bank.total || 0) > 0);
  };

  const refresh = async () => {
    try {
      applyData(await fetchData());
    } catch (e) {
      console.error('Fetch error:', e);
    }
  };

  useEffect(() => {
    let active = true;
    fetchData()
      .then((d) => { if (active) applyData(d); })
      .catch((e) => { if (active) console.error('Fetch error:', e); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchData]);

  const loadDemo = async () => {
    setLoadingDemo(true);
    try {
      await fetch('/api/demo', { method: 'POST' });
      await new Promise(r => setTimeout(r, 500));
      await fetch('/api/reconciliation', { method: 'POST' });
      await refresh();
    } catch (e) {
      console.error(e);
    }
    setLoadingDemo(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-gray-200 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 bg-white rounded-xl border border-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={<BarChart3 className="w-12 h-12 text-gray-400" />}
          title="No data yet"
          description="Load demo data to see the dashboard in action with real reconciliation results."
          actionLabel={loadingDemo ? 'Loading...' : 'Load Demo Data'}
          onAction={loadDemo}
        />
      </div>
    );
  }

  // Compute KPIs
  const totalInvoices = invoices.length;
  const totalPayments = payTxns.length;
  const matched = results.filter((r: ReconciliationResultRow) => r.match_type !== 'unmatched').length;
  const unmatched = results.filter((r: ReconciliationResultRow) => r.match_type === 'unmatched').length;
  const partialResults = results.filter((r: ReconciliationResultRow) => r.match_type === 'partial').length;
  const matchRate = results.length > 0 ? ((matched / results.length) * 100).toFixed(1) : '0';
  const openExceptions = exceptions.filter((e: Exception) => e.status === 'open').length;
  const totalOutstanding = invoices.reduce((s: number, i: Invoice) => s + (i.outstanding || 0), 0);
  const duplicateCount = exceptions.filter((e: Exception) => e.type === 'duplicate_payment').length;

  // Chart data
  const pieData = [
    { name: 'Matched', value: results.filter((r: ReconciliationResultRow) => ['exact', 'fuzzy'].includes(r.match_type)).length, color: COLORS.matched },
    { name: 'Partial', value: partialResults, color: COLORS.partial },
    { name: 'Review', value: results.filter((r: ReconciliationResultRow) => r.status === 'pending' && r.match_type !== 'unmatched').length, color: COLORS.review },
    { name: 'Unmatched', value: unmatched, color: COLORS.unmatched },
    { name: 'Duplicate', value: results.filter((r: ReconciliationResultRow) => r.match_type === 'duplicate').length, color: COLORS.duplicate },
  ].filter(d => d.value > 0);

  const trendData = runs.length > 1 
    ? runs.map((r: ReconciliationRun) => ({ date: r.run_date?.split(' ')[0] || r.created_at?.split('T')[0], matched: r.matches_found, unmatched: r.unmatched_count, total: r.records_processed })).reverse()
    : [{ date: 'Current', matched, unmatched, total: results.length }];

  const amountData = [{
    category: 'Amounts',
    Invoice: invoices.reduce((s: number, i: Invoice) => s + i.total_amount, 0),
    Payment: payTxns.reduce((s: number, p: PaymentTransaction) => s + p.amount, 0),
    Outstanding: totalOutstanding,
  }];

  const excByType: Record<string, number> = {};
  exceptions.forEach((e: Exception) => { excByType[e.type] = (excByType[e.type] || 0) + 1; });
  const excChartData = Object.entries(excByType).map(([type, count]) => ({
    type: type.replace(/_/g, ' '),
    count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Financial reconciliation overview</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={refresh}>Refresh</Button>
          <Button variant="primary" size="sm" icon={<Upload className="w-4 h-4" />} onClick={loadDemo} loading={loadingDemo}>Load Demo Data</Button>
        </div>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Invoices" value={totalInvoices} icon={<FileText className="w-5 h-5" />} borderColor="border-l-indigo-500" />
        <KPICard label="Total Payments" value={totalPayments} icon={<CreditCard className="w-5 h-5" />} borderColor="border-l-blue-500" />
        <KPICard label="Match Rate" value={`${matchRate}%`} icon={<GitMerge className="w-5 h-5" />} borderColor="border-l-emerald-500" />
        <KPICard label="Open Exceptions" value={openExceptions} icon={<AlertTriangle className="w-5 h-5" />} borderColor="border-l-red-500" />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Matched" value={matched} icon={<TrendingUp className="w-5 h-5 text-emerald-500" />} borderColor="border-l-emerald-500" />
        <KPICard label="Partial Matches" value={partialResults} icon={<DollarSign className="w-5 h-5 text-amber-500" />} borderColor="border-l-amber-500" />
        <KPICard label="Duplicates Detected" value={duplicateCount} icon={<AlertTriangle className="w-5 h-5 text-purple-500" />} borderColor="border-l-purple-500" />
        <KPICard label="Outstanding" value={fmt(totalOutstanding)} icon={<TrendingDown className="w-5 h-5 text-red-500" />} borderColor="border-l-red-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reconciliation Status Donut */}
        <Card title="Reconciliation Status">
          <div className="h-72">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No reconciliation data</div>
            )}
          </div>
        </Card>

        {/* Reconciliation Trend */}
        <Card title="Reconciliation Trend">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="matched" stroke="#10b981" strokeWidth={2} name="Matched" />
                <Line type="monotone" dataKey="unmatched" stroke="#ef4444" strokeWidth={2} name="Unmatched" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Amount Reconciliation */}
        <Card title="Amount Overview">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={amountData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/100000).toFixed(0)}L`} />
                <Tooltip formatter={(v) => fmt(Number(v))} />
                <Legend />
                <Bar dataKey="Invoice" fill="#6366f1" radius={[4,4,0,0]} />
                <Bar dataKey="Payment" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="Outstanding" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Exception Breakdown */}
        <Card title="Exception Breakdown">
          <div className="h-72">
            {excChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={excChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="type" type="category" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No exceptions</div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Results */}
      {results.length > 0 && (
        <Card title="Recent Reconciliation Results" action={
          <Link href="/reconciliation" className="text-sm text-indigo-600 hover:text-indigo-800">View All →</Link>
        }>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Invoice</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Customer</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Amount</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Confidence</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Type</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 10).map((r: ReconciliationResultRow) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{r.invoice_id || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{r.inv_customer || '-'}</td>
                    <td className="py-3 px-4 text-right">{fmt(r.inv_amount || 0)}</td>
                    <td className="py-3 px-4 text-center"><ConfidenceScore score={r.confidence_score} /></td>
                    <td className="py-3 px-4 text-center"><StatusBadge status={r.match_type} /></td>
                    <td className="py-3 px-4 text-center"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
