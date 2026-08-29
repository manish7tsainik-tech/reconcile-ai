'use client';

import { useState, useEffect } from 'react';
import { ScrollText } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import type { AuditLog } from '@/lib/types';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/audit-logs?page=${page}&limit=30`)
      .then(r => r.json())
      .then((data) => {
        if (!active) return;
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      })
      .catch(() => { if (active) setLoading(false); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page]);

  const totalPages = Math.ceil(total / 30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500">Track all financial actions and changes</p>
      </div>

      {logs.length === 0 && !loading ? (
        <EmptyState icon={<ScrollText className="w-12 h-12 text-gray-400" />} title="No audit logs yet" description="Actions will be logged as you use the application." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Time</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">User</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Action</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Record Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Record ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Old Value</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">New Value</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: AuditLog) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-500 text-xs">{log.timestamp}</td>
                    <td className="py-3 px-4 font-medium">{log.user_name}</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">{log.action}</span></td>
                    <td className="py-3 px-4 text-gray-500">{log.record_type}</td>
                    <td className="py-3 px-4 font-mono text-xs">{log.record_id?.substring(0, 8)}...</td>
                    <td className="py-3 px-4 text-gray-500 max-w-[150px] truncate">{log.old_value || '-'}</td>
                    <td className="py-3 px-4 text-gray-500 max-w-[150px] truncate">{log.new_value || '-'}</td>
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
