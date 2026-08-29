import { NextResponse } from 'next/server';
import { getDb } from '@/database/connection';
import { errorMessage } from '@/lib/api';
import type { ReconciliationRun, Invoice } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const db = getDb();
    const { type } = (await request.json()) as { type: string; format?: string };

    let reportData: Record<string, unknown> = {};

    switch (type) {
      case 'reconciliation_summary': {
        const runs = db.prepare('SELECT * FROM reconciliation_runs ORDER BY created_at DESC LIMIT 10').all() as unknown as ReconciliationRun[];
        const latestRun = runs[0];
        const matchStats = db.prepare(`
          SELECT match_type, COUNT(*) as count, AVG(confidence_score) as avg_confidence
          FROM reconciliation_results
          WHERE run_id = ?
          GROUP BY match_type
        `).all(latestRun?.id || '');
        reportData = { runs, latestRun, matchStats };
        break;
      }
      case 'outstanding_invoices': {
        const invoices = db.prepare('SELECT * FROM invoices WHERE outstanding > 0 ORDER BY outstanding DESC').all() as unknown as Invoice[];
        const totalOutstanding = invoices.reduce((s, i) => s + i.outstanding, 0);
        const byCustomer = db.prepare(`
          SELECT customer_name, SUM(outstanding) as total, COUNT(*) as count
          FROM invoices WHERE outstanding > 0
          GROUP BY customer_name ORDER BY total DESC
        `).all();
        reportData = { invoices, totalOutstanding, byCustomer };
        break;
      }
      case 'unmatched_transactions': {
        const unmatchedInvoices = db.prepare("SELECT * FROM invoices WHERE match_status = 'unmatched'").all();
        const unmatchedBank = db.prepare("SELECT * FROM bank_transactions WHERE match_status = 'unmatched'").all();
        const unmatchedPayments = db.prepare("SELECT * FROM payment_transactions WHERE match_status = 'unmatched'").all();
        reportData = { unmatchedInvoices, unmatchedBank, unmatchedPayments };
        break;
      }
      case 'exception_report': {
        const exceptions = db.prepare('SELECT * FROM exceptions ORDER BY priority DESC, created_at DESC').all();
        const byType = db.prepare('SELECT type, COUNT(*) as count FROM exceptions GROUP BY type').all();
        reportData = { exceptions, byType };
        break;
      }
      case 'payment_report': {
        const payments = db.prepare('SELECT * FROM payment_transactions ORDER BY payment_date DESC').all();
        const byGateway = db.prepare('SELECT gateway, COUNT(*) as count, SUM(amount) as total FROM payment_transactions GROUP BY gateway').all();
        const byMethod = db.prepare('SELECT payment_method, COUNT(*) as count, SUM(amount) as total FROM payment_transactions GROUP BY payment_method').all();
        reportData = { payments, byGateway, byMethod };
        break;
      }
      default:
        return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
    }

    return NextResponse.json({ type, data: reportData, generated_at: new Date().toISOString() });
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
