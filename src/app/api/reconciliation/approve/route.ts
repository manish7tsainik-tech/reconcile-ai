import { NextResponse } from 'next/server';
import { getDb } from '@/database/connection';
import { v4 as uuidv4 } from 'uuid';
import type { ReconciliationResult } from '@/lib/types';
import { errorMessage } from '@/lib/api';

export async function POST(request: Request) {
  try {
    const db = getDb();
    const { result_id, action } = (await request.json()) as { result_id: string; action: string };

    if (!result_id || !action) {
      return NextResponse.json({ error: 'Missing result_id or action' }, { status: 400 });
    }

    const result = db.prepare('SELECT * FROM reconciliation_results WHERE id = ?').get(result_id) as unknown as ReconciliationResult | undefined;
    if (!result) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'flag' ? 'flagged' : 'pending';
    db.prepare('UPDATE reconciliation_results SET status = ? WHERE id = ?').run(newStatus, result_id);

    if (action === 'approve') {
      // Update invoice match status
      if (result.invoice_id) {
        db.prepare("UPDATE invoices SET match_status = 'matched' WHERE id = ?").run(result.invoice_id);
      }
      if (result.bank_transaction_id) {
        db.prepare("UPDATE bank_transactions SET match_status = 'matched' WHERE id = ?").run(result.bank_transaction_id);
      }
      if (result.payment_transaction_id) {
        db.prepare("UPDATE payment_transactions SET match_status = 'matched' WHERE id = ?").run(result.payment_transaction_id);
      }
    }

    // Log audit
    db.prepare(`INSERT INTO audit_logs (id, user_id, user_name, action, record_type, record_id, old_value, new_value, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), 'admin-001', 'Admin User',
      action === 'approve' ? 'Approved Match' : action === 'reject' ? 'Rejected Match' : 'Flagged for Review',
      'reconciliation_result', result_id, result.status, newStatus, new Date().toISOString()
    );

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
