'use client';

import { useState } from 'react';
import { BarChart3, Download, FileText, CreditCard, AlertTriangle, TrendingUp } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const REPORT_TYPES = [
  { id: 'reconciliation_summary', label: 'Reconciliation Summary', icon: TrendingUp, description: 'Overview of all reconciliation runs and match statistics' },
  { id: 'outstanding_invoices', label: 'Outstanding Invoices', icon: FileText, description: 'All invoices with pending payments' },
  { id: 'unmatched_transactions', label: 'Unmatched Transactions', icon: AlertTriangle, description: 'Transactions that could not be matched' },
  { id: 'exception_report', label: 'Exception Report', icon: AlertTriangle, description: 'All exceptions with status and priority' },
  { id: 'payment_report', label: 'Payment Report', icon: CreditCard, description: 'All payment gateway transactions' },
];

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<{ data: unknown } | null>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async (type: string) => {
    setSelectedReport(type);
    setLoading(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      setReportData(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const exportCSV = () => {
    if (!reportData) return;
    const jsonStr = JSON.stringify(reportData.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport}-report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">Generate and download financial reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_TYPES.map(r => (
          <Card key={r.id} className={`cursor-pointer hover:shadow-md transition-shadow ${selectedReport === r.id ? 'ring-2 ring-indigo-500' : ''}`} onClick={() => generateReport(r.id)}>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <r.icon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{r.label}</h3>
                <p className="text-sm text-gray-500 mt-1">{r.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {loading && (
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            <span className="ml-3 text-gray-600">Generating report...</span>
          </div>
        </Card>
      )}

      {reportData && !loading && (
        <Card title={REPORT_TYPES.find(r => r.id === selectedReport)?.label || 'Report'}>
          <div className="mb-4 flex justify-end">
            <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={exportCSV}>Export JSON</Button>
          </div>
          <div className="overflow-x-auto">
            <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
              {JSON.stringify(reportData.data, null, 2)}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
}
