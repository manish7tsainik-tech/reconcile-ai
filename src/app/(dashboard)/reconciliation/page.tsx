'use client';

import { useState, useEffect, useCallback } from 'react';
import { GitMerge, Play, RefreshCw, CheckCircle, XCircle, AlertTriangle, Eye, ChevronRight, Clock, Zap } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfidenceScore from '@/components/ui/ConfidenceScore';
import EmptyState from '@/components/ui/EmptyState';
import Select from '@/components/ui/Select';
import type { ReconciliationRun, ReconciliationResultRow } from '@/lib/types';

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);

export default function ReconciliationPage() {
  const [results, setResults] = useState<ReconciliationResultRow[]>([]);
  const [runs, setRuns] = useState<ReconciliationRun[]>([]);
  const [latestRun, setLatestRun] = useState<ReconciliationRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedResult, setSelectedResult] = useState<ReconciliationResultRow | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: '30' });
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter) params.set('match_type', typeFilter);
    const res = await fetch(`/api/reconciliation?${params}`);
    return res.json();
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    let active = true;
    fetchData()
      .then((data) => {
        if (!active) return;
        setResults(data.results || []);
        setRuns(data.runs || []);
        setLatestRun(data.latestRun || null);
        setTotal(data.total || 0);
      })
      .catch((e) => { if (active) console.error(e); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchData]);

  const applyData = (data: { results: ReconciliationResultRow[]; runs: ReconciliationRun[]; latestRun?: ReconciliationRun | null; total: number }) => {
    setResults(data.results || []);
    setRuns(data.runs || []);
    setLatestRun(data.latestRun || null);
    setTotal(data.total || 0);
    setLoading(false);
  };

  const runReconciliation = async () => {
    setRunning(true);
    setProgress(0);
    // Simulate progress
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 15, 95));
    }, 300);

    try {
      const res = await fetch('/api/reconciliation', { method: 'POST' });
      const data = await res.json();
      clearInterval(interval);
      setProgress(100);
      await new Promise(r => setTimeout(r, 500));
      applyData(await fetchData());
    } catch (e) {
      clearInterval(interval);
      console.error(e);
    }
    setRunning(false);
  };

  const handleAction = async (resultId: string, action: string) => {
    try {
      await fetch('/api/reconciliation/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result_id: resultId, action }),
      });
      setSelectedResult(null);
      applyData(await fetchData());
    } catch (e) { console.error(e); }
  };

  const totalPages = Math.ceil(total / 30);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reconciliation</h1>
          <p className="text-sm text-gray-500">Match invoices with bank and payment transactions</p>
        </div>
        <Button variant="primary" icon={running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} onClick={runReconciliation} loading={running} disabled={running}>
          {running ? 'Running...' : 'Run Reconciliation'}
        </Button>
      </div>

      {/* Progress Bar */}
      {running && (
        <Card>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Processing...</span>
              <span className="font-medium text-indigo-600">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </Card>
      )}

      {/* Run Summary */}
      {latestRun && !running && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card><div className="text-center"><p className="text-2xl font-bold text-gray-900">{latestRun.records_processed}</p><p className="text-xs text-gray-500">Processed</p></div></Card>
          <Card><div className="text-center"><p className="text-2xl font-bold text-emerald-600">{latestRun.matches_found}</p><p className="text-xs text-gray-500">Matched</p></div></Card>
          <Card><div className="text-center"><p className="text-2xl font-bold text-amber-600">{latestRun.review_required}</p><p className="text-xs text-gray-500">Review Required</p></div></Card>
          <Card><div className="text-center"><p className="text-2xl font-bold text-red-600">{latestRun.unmatched_count}</p><p className="text-xs text-gray-500">Unmatched</p></div></Card>
          <Card><div className="text-center"><p className="text-2xl font-bold text-gray-600">{latestRun.processing_time_ms}ms</p><p className="text-xs text-gray-500">Processing Time</p></div></Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} options={[
          { value: '', label: 'All Status' },
          { value: 'approved', label: 'Approved' },
          { value: 'pending', label: 'Pending' },
          { value: 'rejected', label: 'Rejected' },
          { value: 'flagged', label: 'Flagged' },
        ]} />
        <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} options={[
          { value: '', label: 'All Types' },
          { value: 'exact', label: 'Exact Match' },
          { value: 'fuzzy', label: 'Fuzzy Match' },
          { value: 'partial', label: 'Partial Match' },
          { value: 'unmatched', label: 'Unmatched' },
          { value: 'overpayment', label: 'Overpayment' },
          { value: 'underpayment', label: 'Underpayment' },
          { value: 'duplicate', label: 'Duplicate' },
        ]} />
      </div>

      {/* Results Table */}
      {results.length === 0 && !loading ? (
        <EmptyState icon={<GitMerge className="w-12 h-12 text-gray-400" />} title="No reconciliation results" description="Run reconciliation to match invoices with payments." actionLabel="Run Reconciliation" onAction={runReconciliation} />
      ) : (
        <div className="flex gap-6">
          <div className={`${selectedResult ? 'w-1/2' : 'w-full'} transition-all`}>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-3 font-medium text-gray-600">Invoice</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-600">Payment/Bank</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-600">Inv. Amount</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-600">Pay. Amount</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-600">Diff</th>
                      <th className="text-center py-3 px-3 font-medium text-gray-600">Confidence</th>
                      <th className="text-center py-3 px-3 font-medium text-gray-600">Type</th>
                      <th className="text-center py-3 px-3 font-medium text-gray-600">Status</th>
                      <th className="text-center py-3 px-3 font-medium text-gray-600"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r: ReconciliationResultRow) => (
                      <tr key={r.id} className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${selectedResult?.id === r.id ? 'bg-indigo-50' : ''}`} onClick={() => setSelectedResult(r)}>
                        <td className="py-3 px-3">
                          <div className="font-medium">{r.invoice_id || '-'}</div>
                          <div className="text-xs text-gray-500">{r.inv_customer || ''}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium">{r.pay_id || r.bank_txn_id || '-'}</div>
                          <div className="text-xs text-gray-500">{r.pay_customer || r.bank_payer || ''}</div>
                        </td>
                        <td className="py-3 px-3 text-right">{fmt(r.inv_amount || 0)}</td>
                        <td className="py-3 px-3 text-right">{fmt(r.pay_amount || r.bank_amount || 0)}</td>
                        <td className="py-3 px-3 text-right">
                          <span className={Math.abs((r.inv_amount || 0) - (r.pay_amount || r.bank_amount || 0)) < 1 ? 'text-emerald-600' : 'text-amber-600'}>
                            {fmt(Math.abs((r.inv_amount || 0) - (r.pay_amount || r.bank_amount || 0)))}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center"><ConfidenceScore score={r.confidence_score} showBar /></td>
                        <td className="py-3 px-3 text-center"><StatusBadge status={r.match_type} /></td>
                        <td className="py-3 px-3 text-center"><StatusBadge status={r.status} /></td>
                        <td className="py-3 px-3 text-center"><ChevronRight className="w-4 h-4 text-gray-400" /></td>
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
          </div>

          {/* Detail Panel */}
          {selectedResult && (
            <div className="w-1/2">
              <Card title="Match Detail">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-xs font-medium text-gray-500 mb-2">Invoice</h4>
                      <p className="font-medium">{selectedResult.invoice_id || 'N/A'}</p>
                      <p className="text-sm text-gray-600">{selectedResult.inv_customer || ''}</p>
                      <p className="text-lg font-bold mt-1">{fmt(selectedResult.inv_amount || 0)}</p>
                      <p className="text-xs text-gray-500">{selectedResult.inv_date || ''}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-xs font-medium text-gray-500 mb-2">Payment</h4>
                      <p className="font-medium">{selectedResult.pay_id || selectedResult.bank_txn_id || 'N/A'}</p>
                      <p className="text-sm text-gray-600">{selectedResult.pay_customer || selectedResult.bank_payer || ''}</p>
                      <p className="text-lg font-bold mt-1">{fmt(selectedResult.pay_amount || selectedResult.bank_amount || 0)}</p>
                      <p className="text-xs text-gray-500">{selectedResult.pay_date || selectedResult.bank_date || ''}</p>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">AI Analysis</h4>
                    <div className="space-y-2">
                      {[
                        { label: 'Reference', value: selectedResult.reference_similarity },
                        { label: 'Amount', value: selectedResult.amount_similarity },
                        { label: 'Customer', value: selectedResult.customer_similarity },
                        { label: 'Date', value: selectedResult.date_similarity },
                        { label: 'Description', value: selectedResult.description_similarity },
                      ].map(f => (
                        <div key={f.label} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-24">{f.label}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className={`h-2 rounded-full ${f.value >= 90 ? 'bg-emerald-500' : f.value >= 70 ? 'bg-blue-500' : f.value >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${f.value}%` }} />
                          </div>
                          <span className="text-xs font-medium w-10 text-right">{f.value}%</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-800">Confidence: {selectedResult.confidence_score}%</span>
                      </div>
                      <p className="text-sm text-indigo-700">{selectedResult.ai_explanation}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="success" size="sm" icon={<CheckCircle className="w-4 h-4" />} onClick={() => handleAction(selectedResult.id, 'approve')} disabled={selectedResult.status === 'approved'}>Approve</Button>
                    <Button variant="danger" size="sm" icon={<XCircle className="w-4 h-4" />} onClick={() => handleAction(selectedResult.id, 'reject')} disabled={selectedResult.status === 'rejected'}>Reject</Button>
                    <Button variant="warning" size="sm" icon={<AlertTriangle className="w-4 h-4" />} onClick={() => handleAction(selectedResult.id, 'flag')}>Flag</Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
