import { NextResponse } from 'next/server';
import { getDb } from '@/database/connection';
import { errorMessage } from '@/lib/api';
import type { Notification } from '@/lib/types';

export async function GET() {
  try {
    const db = getDb();
    const notifications = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC, id DESC LIMIT 20').all() as unknown as Notification[];

    if (notifications.length === 0) {
      return NextResponse.json({ notifications: buildAlerts(db) });
    }

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

interface AlertsRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: number;
  type: string;
  created_at: string;
}

function buildAlerts(db: ReturnType<typeof getDb>): AlertsRow[] {
  const alerts: AlertsRow[] = [];

  const openExceptions = db.prepare("SELECT COUNT(*) as count FROM exceptions WHERE status = 'open'").get() as unknown as { count: number };
  if (openExceptions.count > 0) {
    alerts.push({
      id: 'exc-' + openExceptions.count,
      user_id: 'system',
      title: `${openExceptions.count} open exception${openExceptions.count > 1 ? 's' : ''}`,
      message: 'Reconciliation flagged items that need your review.',
      read: 0,
      type: 'warning',
      created_at: new Date().toISOString(),
    });
  }

  const unmatched = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE match_status = 'unmatched'").get() as unknown as { count: number; total: number };
  if (unmatched.count > 0) {
    alerts.push({
      id: 'unmatched-' + unmatched.count,
      user_id: 'system',
      title: `${unmatched.count} unmatched invoice${unmatched.count > 1 ? 's' : ''}`,
      message: `${unmatched.count} invoices totaling ${fmt(unmatched.total)} have no matching payment.`,
      read: 0,
      type: 'info',
      created_at: new Date().toISOString(),
    });
  }

  const latestRun = db.prepare('SELECT * FROM reconciliation_runs ORDER BY created_at DESC LIMIT 1').get() as unknown as { records_processed?: number; matches_found?: number; unmatched_count?: number } | undefined;
  if (latestRun && latestRun.records_processed !== undefined) {
    alerts.push({
      id: 'run-' + (latestRun.records_processed ?? 0),
      user_id: 'system',
      title: 'Reconciliation completed',
      message: `Processed ${latestRun.records_processed} records, ${latestRun.matches_found} matched, ${latestRun.unmatched_count} unmatched.`,
      read: 0,
      type: 'success',
      created_at: new Date().toISOString(),
    });
  }

  return alerts;
}

function fmt(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing notification id' }, { status: 400 });
    db.prepare("UPDATE notifications SET read = 1 WHERE id = ?").run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
