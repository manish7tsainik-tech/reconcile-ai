'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertTriangle, ArrowRight, X, FileSpreadsheet } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { errorMessage } from '@/lib/api';

type Step = 'upload' | 'preview' | 'mapping' | 'validate' | 'import';

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  headers: string[];
  rows: Record<string, string>[];
  type: 'invoices' | 'bank' | 'payments';
  mapping: { source: string; target: string }[];
}

export default function UploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ name: string; type: string; count: number }[]>([]);
  const [error, setError] = useState('');

  const TARGET_FIELDS: Record<string, { value: string; label: string }[]> = {
    invoices: [
      { value: 'invoice_id', label: 'Invoice ID' },
      { value: 'customer_name', label: 'Customer Name' },
      { value: 'invoice_date', label: 'Invoice Date' },
      { value: 'due_date', label: 'Due Date' },
      { value: 'invoice_amount', label: 'Amount' },
      { value: 'tax', label: 'Tax' },
      { value: 'total_amount', label: 'Total Amount' },
      { value: 'currency', label: 'Currency' },
      { value: 'reference_number', label: 'Reference Number' },
      { value: 'status', label: 'Status' },
    ],
    bank: [
      { value: 'transaction_id', label: 'Transaction ID' },
      { value: 'transaction_date', label: 'Transaction Date' },
      { value: 'description', label: 'Description' },
      { value: 'reference_number', label: 'Reference Number' },
      { value: 'payer_name', label: 'Payer Name' },
      { value: 'amount', label: 'Amount' },
      { value: 'currency', label: 'Currency' },
      { value: 'transaction_type', label: 'Transaction Type' },
      { value: 'bank_account', label: 'Bank Account' },
    ],
    payments: [
      { value: 'payment_id', label: 'Payment ID' },
      { value: 'order_id', label: 'Order ID' },
      { value: 'transaction_id', label: 'Transaction ID' },
      { value: 'customer_name', label: 'Customer Name' },
      { value: 'payment_date', label: 'Payment Date' },
      { value: 'amount', label: 'Amount' },
      { value: 'currency', label: 'Currency' },
      { value: 'payment_method', label: 'Payment Method' },
      { value: 'gateway', label: 'Gateway' },
      { value: 'reference_number', label: 'Reference Number' },
      { value: 'status', label: 'Status' },
    ],
  };

  const AUTO_MAP: Record<string, string> = {
    'invoice_id': 'invoice_id', 'invoice number': 'invoice_id', 'inv_id': 'invoice_id', 'inv no': 'invoice_id',
    'customer_name': 'customer_name', 'company': 'customer_name',
    'invoice_date': 'invoice_date', 'date': 'invoice_date', 'inv_date': 'invoice_date',
    'due_date': 'due_date', 'expiry': 'due_date',
    'amount': 'invoice_amount', 'invoice_amount': 'invoice_amount', 'total': 'total_amount', 'total_amount': 'total_amount',
    'tax': 'tax', 'gst': 'tax', 'vat': 'tax',
    'currency': 'currency', 'curr': 'currency',
    'reference_number': 'reference_number', 'ref': 'reference_number', 'ref_no': 'reference_number',
    'status': 'status',
    'transaction_id': 'transaction_id', 'txn_id': 'transaction_id', 'txn': 'transaction_id',
    'transaction_date': 'transaction_date', 'txn_date': 'transaction_date',
    'description': 'description', 'desc': 'description', 'narration': 'description',
    'payer_name': 'payer_name', 'payer': 'payer_name', 'from': 'payer_name',
    'transaction_type': 'transaction_type', 'type': 'transaction_type',
    'bank_account': 'bank_account', 'account': 'bank_account',
    'payment_id': 'payment_id', 'pay_id': 'payment_id',
    'order_id': 'order_id',
    'customer': 'customer_name',
    'payment_date': 'payment_date', 'pay_date': 'payment_date',
    'payment_method': 'payment_method', 'method': 'payment_method',
    'gateway': 'gateway',
    'gross': 'amount', 'credit': 'amount', 'debit': 'amount', 'value': 'amount',
  };

  const parseCSV = (text: string): { headers: string[]; rows: Record<string, string>[] } => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return { headers: [], rows: [] };
    const parseLine = (line: string): string[] => {
      const out: string[] = [];
      let cur = '';
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"' && !inQ) { inQ = true; continue; }
        if (c === '"' && inQ) {
          if (line[i + 1] === '"') { cur += '"'; i++; continue; }
          inQ = false; continue;
        }
        if (c === ',' && !inQ) { out.push(cur.trim()); cur = ''; continue; }
        cur += c;
      }
      out.push(cur.trim());
      return out;
    };
    const hdrs = parseLine(lines[0]);
    const rows = lines.slice(1).map(line => {
      const vals = parseLine(line);
      const obj: Record<string, string> = {};
      hdrs.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
      return obj;
    });
    return { headers: hdrs, rows };
  };

  const detectType = (headers: string[]): 'invoices' | 'payments' | 'bank' => {
    const joined = headers.join(' ').toLowerCase();
    if (joined.includes('invoice') || joined.includes('invoice_amount') || joined.includes('due_date')) return 'invoices';
    if (joined.includes('payment_id') || joined.includes('payment_date') || joined.includes('gateway') || joined.includes('payment_method')) return 'payments';
    return 'bank';
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError('');
    const newFiles: UploadedFile[] = [];
    const readers = acceptedFiles.map(f => new Promise<UploadedFile>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const { headers, rows } = parseCSV(text);
        const type = detectType(headers);
        const autoMapping = headers.map(h => ({
          source: h,
          target: AUTO_MAP[h.toLowerCase().trim()] || '',
        }));
        resolve({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          file: f,
          name: f.name,
          headers,
          rows,
          type,
          mapping: autoMapping,
        });
      };
      reader.onerror = () => resolve({ id: `${Date.now()}`, file: f, name: f.name, headers: [], rows: [], type: 'invoices', mapping: [] });
      reader.readAsText(f);
    }));

    Promise.all(readers).then(fs => {
      const valid = fs.filter(f => f.headers.length > 0);
      if (valid.length === 0) { setError('None of the files could be read. Please use CSV format.'); return; }
      setFiles(prev => [...prev, ...valid]);
      setActiveIndex(0);
      setStep('preview');
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: true,
  });

  const removeFile = (id: string) => {
    const next = files.filter(f => f.id !== id);
    setFiles(next);
    setActiveIndex(0);
    if (next.length === 0) { setStep('upload'); setError(''); }
  };

  const downloadSample = (type: 'invoices' | 'bank' | 'payments') => {
    const samples: Record<string, string> = {
      invoices: `invoice_id,customer_name,invoice_date,due_date,invoice_amount,tax,total_amount,currency,reference_number,status\nINV-1001,Acme Corp,2026-08-01,2026-08-31,10000,1800,11800,INR,REF-1001,pending\nINV-1002,Globex Inc,2026-08-02,2026-09-01,25000,4500,29500,INR,REF-1002,pending`,
      bank: `transaction_id,transaction_date,description,reference_number,payer_name,amount,currency,transaction_type,bank_account\nTXN-9001,2026-08-03,Payment for invoice,REF-1001,Acme Corp,11800,INR,credit,primary\nTXN-9002,2026-08-04,Payment received,REF-1002,Globex Inc,29500,INR,credit,primary`,
      payments: `payment_id,order_id,transaction_id,customer_name,payment_date,amount,currency,payment_method,gateway,reference_number,status\nPAY-5001,ORD-2001,TXN-7001,Acme Corp,2026-08-03,11800,INR,UPI,Razorpay,REF-1001,completed\nPAY-5002,ORD-2002,TXN-7002,Globex Inc,2026-08-04,29500,INR,card,Stripe,REF-1002,completed`,
    };
    const content = samples[type];
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyAutoMap = (index: number) => {
    const f = files[index];
    const autoMapping = f.headers.map(h => ({
      source: h,
      target: AUTO_MAP[h.toLowerCase().trim()] || '',
    }));
    updateFile(index, { mapping: autoMapping });
  };

  const updateFile = (index: number, patch: Partial<UploadedFile>) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, ...patch } : f));
  };

  const buildPayload = (f: UploadedFile): { endpoint: string; payload: Record<string, unknown>[] } => {
    const mappedRows = f.rows.map(row => {
      const obj: Record<string, unknown> = {};
      f.mapping.forEach(m => {
        if (m.target && row[m.source] !== undefined) {
          const val = row[m.source];
          if ((m.target === 'amount' || m.target === 'invoice_amount' || m.target === 'total_amount' || m.target === 'tax') && typeof val === 'string') {
            obj[m.target] = parseFloat(val.replace(/[^0-9.\-]/g, '')) || 0;
          } else {
            obj[m.target] = val;
          }
        }
      });
      return obj;
    }).filter(row => Object.keys(row).length > 0);

    const now = Date.now();
    const suffix = () => `${now}-${Math.random().toString(36).slice(2, 6)}`;

    if (f.type === 'invoices') {
      return {
        endpoint: '/api/invoices',
        payload: mappedRows.map(r => ({
          invoice_id: r.invoice_id || `INV-${suffix()}`,
          customer_name: r.customer_name || 'Unknown',
          invoice_date: r.invoice_date || new Date().toISOString().split('T')[0],
          due_date: r.due_date || new Date().toISOString().split('T')[0],
          invoice_amount: r.invoice_amount || 0,
          tax: r.tax || 0,
          total_amount: r.total_amount || r.invoice_amount || 0,
          currency: r.currency || 'INR',
          reference_number: r.reference_number || '',
          status: r.status || 'pending',
        })),
      };
    }
    if (f.type === 'bank') {
      return {
        endpoint: '/api/bank-transactions',
        payload: mappedRows.map(r => ({
          transaction_id: r.transaction_id || `TXN-${suffix()}`,
          transaction_date: r.transaction_date || new Date().toISOString().split('T')[0],
          description: r.description || '',
          reference_number: r.reference_number || '',
          payer_name: r.payer_name || '',
          amount: r.amount || 0,
          currency: r.currency || 'INR',
          transaction_type: r.transaction_type || 'credit',
          bank_account: r.bank_account || 'primary',
          status: r.status || 'completed',
        })),
      };
    }
    return {
      endpoint: '/api/payment-transactions',
      payload: mappedRows.map(r => ({
        payment_id: r.payment_id || `PAY-${suffix()}`,
        order_id: r.order_id || '',
        transaction_id: r.transaction_id || `TXN-${suffix()}`,
        customer_name: r.customer_name || 'Unknown',
        payment_date: r.payment_date || new Date().toISOString().split('T')[0],
        amount: r.amount || 0,
        currency: r.currency || 'INR',
        payment_method: r.payment_method || '',
        gateway: r.gateway || '',
        reference_number: r.reference_number || '',
        status: r.status || 'completed',
      })),
    };
  };

  const importData = async () => {
    setImporting(true);
    setError('');
    try {
      const results: { name: string; type: string; count: number }[] = [];
      for (const f of files) {
        const { endpoint, payload } = buildPayload(f);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoices: payload, transactions: payload }),
        });
        if (!res.ok) throw new Error(`Import failed for ${f.name}: ${res.status}`);
        const json = await res.json();
        results.push({ name: f.name, type: f.type, count: json.imported ?? payload.length });
      }
      setImportResults(results);
      setStep('import');
    } catch (e) {
      setError(errorMessage(e) || 'Import failed. Please check your files and try again.');
    }
    setImporting(false);
  };

  const STEPS = ['upload', 'preview', 'mapping', 'validate', 'import'];
  const stepIndex = STEPS.indexOf(step);
  const totalRows = files.reduce((s, f) => s + f.rows.length, 0);
  const TYPE_LABEL: Record<string, string> = {
    invoices: 'Invoices',
    bank: 'Bank Transactions',
    payments: 'Payment Gateway',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Data</h1>
        <p className="text-sm text-gray-500">Upload invoice and payment files together, then reconcile them</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center gap-2 flex-wrap">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${i <= stepIndex ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {i < stepIndex ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-sm ${i <= stepIndex ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
            {i < STEPS.length - 1 && <ArrowRight className="w-4 h-4 text-gray-300" />}
          </div>
        ))}
      </div>

      {/* Upload Step */}
      {step === 'upload' && (
        <>
          <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${isDragActive ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300'}`}>
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700">{isDragActive ? 'Drop your files here' : 'Drag & drop files here'}</p>
            <p className="text-sm text-gray-500 mt-2">Drop MULTIPLE CSVs at once — e.g. one invoice file + one payment file. The type is detected automatically.</p>
          </div>

          <Card>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Don&apos;t have files handy? Download sample templates</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => downloadSample('invoices')}>Sample Invoices CSV</Button>
              <Button variant="secondary" onClick={() => downloadSample('payments')}>Sample Payments CSV</Button>
              <Button variant="secondary" onClick={() => downloadSample('bank')}>Sample Bank CSV</Button>
            </div>
            <p className="text-xs text-gray-500 mt-3">Tip: Download the Invoice and Payment samples, then drop them both here together.</p>
          </Card>
        </>
      )}

      {/* Preview Step */}
      {step === 'preview' && files.length > 0 && (
        <>
          {/* File list */}
          <Card>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Your files ({files.length})</h3>
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={f.id} className={`flex items-center gap-3 p-3 rounded-lg border ${i === activeIndex ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'}`}>
                  <FileSpreadsheet className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                    <p className="text-xs text-gray-500">{f.rows.length} rows · {f.headers.length} columns</p>
                  </div>
                  <Select
                    value={f.type}
                    onChange={(e) => updateFile(i, { type: e.target.value as 'invoices' | 'bank' | 'payments' })}
                    className="w-44"
                    options={[
                      { value: 'invoices', label: 'Invoices' },
                      { value: 'bank', label: 'Bank Transactions' },
                      { value: 'payments', label: 'Payment Gateway' },
                    ]}
                  />
                  <button onClick={() => removeFile(f.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {files.length > 1 && (
              <div className="flex items-center gap-2 mt-3 text-sm text-emerald-600">
                <CheckCircle className="w-4 h-4" />
                <span>Multiple sources detected — they&apos;ll all be imported so you can reconcile them together.</span>
              </div>
            )}
          </Card>

          {/* Active file preview */}
          <Card title={`Preview: ${files[activeIndex].name}`}>
            <p className="text-sm text-gray-500 mb-4">{files[activeIndex].rows.length} rows, {files[activeIndex].headers.length} columns</p>
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">{files[activeIndex].headers.map(h => <th key={h} className="px-3 py-2 text-left font-medium text-gray-600">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {files[activeIndex].rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-gray-50">{files[activeIndex].headers.map(h => <td key={h} className="px-3 py-2 text-gray-500">{row[h]}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => { setStep('upload'); setFiles([]); }}>Back</Button>
              <Button variant="primary" onClick={() => { files.forEach((_, i) => applyAutoMap(i)); setActiveIndex(0); setStep('mapping'); }}>Map Columns</Button>
            </div>
          </Card>
        </>
      )}

      {/* Mapping Step */}
      {step === 'mapping' && (
        <Card title={`Column Mapping — ${files[activeIndex].name}`}>
          <p className="text-sm text-gray-500 mb-4">Map source columns to target fields for {TYPE_LABEL[files[activeIndex].type]}</p>
          <div className="space-y-3">
            {files[activeIndex].mapping.map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-48 text-sm font-mono bg-gray-50 px-3 py-2 rounded truncate">{m.source}</span>
                <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <Select
                  value={m.target}
                  onChange={(e) => {
                    const newMapping = [...files[activeIndex].mapping];
                    newMapping[i].target = e.target.value;
                    const idx = activeIndex;
                    setFiles(prev => prev.map((f, j) => j === idx ? { ...f, mapping: newMapping } : f));
                  }}
                  options={[
                    { value: '', label: '-- Skip --' },
                    ...TARGET_FIELDS[files[activeIndex].type],
                  ]}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center gap-2 mt-4">
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => applyAutoMap(activeIndex)}>Auto Map</Button>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep('preview')}>Back</Button>
              <Button variant="primary" onClick={() => {
                if (activeIndex < files.length - 1) {
                  setActiveIndex(activeIndex + 1);
                } else {
                  setStep('validate');
                }
              }}>
                {activeIndex < files.length - 1 ? `Next File (${files.length - activeIndex - 1} left)` : 'Validate'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Validate Step */}
      {step === 'validate' && (
        <Card title="Validation Results">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
              <span>{totalRows} total records ready across {files.length} file(s)</span>
            </div>
            <div className="space-y-1">
              {files.map((f, i) => (
                <div key={f.id} className="flex items-center gap-2 text-gray-500 text-sm">
                  <FileText className="w-4 h-4" />
                  <span>{f.name} → {TYPE_LABEL[f.type]} ({f.rows.length} rows, {f.mapping.filter(m => m.target).length} columns mapped)</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setStep('mapping')}>Back</Button>
            <Button variant="primary" onClick={importData} loading={importing}>Import All Files</Button>
          </div>
        </Card>
      )}

      {/* Import Complete Step */}
      {step === 'import' && (
        <Card>
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Import Complete!</h2>
            <p className="text-gray-500 mb-4">{totalRows} records imported successfully.</p>
            <div className="max-w-md mx-auto space-y-2 text-left">
              {importResults.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm">
                  <span className="text-gray-700 truncate">{r.name}</span>
                  <span className="text-gray-500 ml-2">{TYPE_LABEL[r.type]}: <strong>{r.count}</strong></span>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2 mt-6">
              <Button variant="secondary" onClick={() => { setStep('upload'); setFiles([]); setImportResults([]); }}>Upload More</Button>
              <Button variant="primary" onClick={() => router.push('/reconciliation')}>Run Reconciliation Now</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
