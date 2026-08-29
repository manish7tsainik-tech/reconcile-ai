'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, Upload, Plus, Search, Download, Eye, Trash2, Edit } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import type { Invoice } from '@/lib/types';

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [matchStatus, setMatchStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newInv, setNewInv] = useState({ invoice_id: '', customer_name: '', invoice_date: '', due_date: '', invoice_amount: '', tax: '', currency: 'INR', reference_number: '' });

  const fetchInvoices = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (matchStatus) params.set('match_status', matchStatus);
    const res = await fetch(`/api/invoices?${params}`);
    return res.json();
  }, [page, search, status, matchStatus]);

  useEffect(() => {
    let active = true;
    fetchInvoices()
      .then((data) => {
        if (!active) return;
        setInvoices(data.invoices || []);
        setTotal(data.total || 0);
      })
      .catch((e) => { if (active) console.error(e); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchInvoices]);

  const applyData = (data: { invoices: Invoice[]; total: number }) => {
    setInvoices(data.invoices || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  const addInvoice = async () => {
    const amt = parseFloat(newInv.invoice_amount) || 0;
    const tax = parseFloat(newInv.tax) || 0;
    await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoices: [{ ...newInv, invoice_amount: amt, tax, total_amount: amt + tax }] }),
    });
    setShowAdd(false);
    setNewInv({ invoice_id: '', customer_name: '', invoice_date: '', due_date: '', invoice_amount: '', tax: '', currency: 'INR', reference_number: '' });
    applyData(await fetchInvoices());
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500">{total} total invoices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />}>Export</Button>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>Add Invoice</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="Search invoices..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} icon={<Search className="w-4 h-4" />} />
        </div>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={[
          { value: '', label: 'All Status' },
          { value: 'pending', label: 'Pending' },
          { value: 'paid', label: 'Paid' },
          { value: 'overdue', label: 'Overdue' },
          { value: 'cancelled', label: 'Cancelled' },
        ]} />
        <Select value={matchStatus} onChange={(e) => { setMatchStatus(e.target.value); setPage(1); }} options={[
          { value: '', label: 'All Match Status' },
          { value: 'matched', label: 'Matched' },
          { value: 'unmatched', label: 'Unmatched' },
          { value: 'partial', label: 'Partial' },
          { value: 'duplicate', label: 'Duplicate' },
        ]} />
      </div>

      {invoices.length === 0 && !loading ? (
        <EmptyState icon={<FileText className="w-12 h-12 text-gray-400" />} title="No invoices yet" description="Upload invoice data or load demo data to get started." actionLabel="Add Invoice" onAction={() => setShowAdd(true)} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Invoice ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Due Date</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Amount</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Paid</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Outstanding</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Match</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {[...Array(10)].map((_, j) => <td key={j} className="py-3 px-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                    </tr>
                  ))
                ) : (
                  invoices.map((inv: Invoice) => (
                    <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-indigo-600">{inv.invoice_id}</td>
                      <td className="py-3 px-4">{inv.customer_name}</td>
                      <td className="py-3 px-4 text-gray-500">{inv.invoice_date}</td>
                      <td className="py-3 px-4 text-gray-500">{inv.due_date}</td>
                      <td className="py-3 px-4 text-right font-medium">{fmt(inv.total_amount)}</td>
                      <td className="py-3 px-4 text-right text-emerald-600">{fmt(inv.paid_amount)}</td>
                      <td className="py-3 px-4 text-right text-red-600">{fmt(inv.outstanding)}</td>
                      <td className="py-3 px-4 text-center"><StatusBadge status={inv.status} /></td>
                      <td className="py-3 px-4 text-center"><StatusBadge status={inv.match_status} /></td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex gap-1 justify-center">
                          <button className="p-1 hover:bg-gray-100 rounded"><Eye className="w-4 h-4 text-gray-500" /></button>
                          <button className="p-1 hover:bg-gray-100 rounded"><Edit className="w-4 h-4 text-gray-500" /></button>
                          <button className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-400" /></button>
                        </div>
                      </td>
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

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Invoice">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Invoice ID" value={newInv.invoice_id} onChange={(e) => setNewInv({ ...newInv, invoice_id: e.target.value })} placeholder="INV-00001" />
            <Input label="Customer Name" value={newInv.customer_name} onChange={(e) => setNewInv({ ...newInv, customer_name: e.target.value })} />
            <Input label="Invoice Date" type="date" value={newInv.invoice_date} onChange={(e) => setNewInv({ ...newInv, invoice_date: e.target.value })} />
            <Input label="Due Date" type="date" value={newInv.due_date} onChange={(e) => setNewInv({ ...newInv, due_date: e.target.value })} />
            <Input label="Amount" type="number" value={newInv.invoice_amount} onChange={(e) => setNewInv({ ...newInv, invoice_amount: e.target.value })} />
            <Input label="Tax" type="number" value={newInv.tax} onChange={(e) => setNewInv({ ...newInv, tax: e.target.value })} />
            <Input label="Reference" value={newInv.reference_number} onChange={(e) => setNewInv({ ...newInv, reference_number: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" onClick={addInvoice}>Add Invoice</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
