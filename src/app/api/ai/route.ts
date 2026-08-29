import { NextResponse } from 'next/server';
import { getDb } from '@/database/connection';
import { errorMessage } from '@/lib/api';
import type { AiInsight, ReconciliationRun } from '@/lib/types';

interface RowCount {
  count: number;
  total: number;
}
interface RepeatIssueRow {
  customer_name: string;
  issue_count: number;
  total_amount: number;
}
interface DupeRow {
  reference_number: string;
  count: number;
  total: number;
}
interface OutstandingRow {
  total_outstanding: number;
  overdue_total: number;
}
interface ReconStatsRow {
  high_conf: number;
  review: number;
  low_conf: number;
  total: number;
}

export async function GET() {
  try {
    const db = getDb();
    const insights: AiInsight[] = [];

    // High-value unmatched transactions
    const highValueUnmatched = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
      FROM invoices WHERE match_status = 'unmatched' AND total_amount > 100000
    `).get() as unknown as RowCount;
    if (highValueUnmatched.count > 0) {
      insights.push({
        id: uuid(),
        type: 'high_value_unmatched',
        title: `${highValueUnmatched.count} high-value invoices remain unmatched`,
        evidence: `${highValueUnmatched.count} invoices totaling ${formatINR(highValueUnmatched.total)} have no matching payment or bank transaction.`,
        impact: 'High - potential revenue recognition risk and delayed collections.',
        recommended_action: 'Review these invoices and follow up with customers for payment confirmation.',
        severity: 'high',
        created_at: new Date().toISOString(),
      });
    }

    // Customers with repeated payment issues
    const repeatIssues = db.prepare(`
      SELECT customer_name, COUNT(*) as issue_count, SUM(total_amount) as total_amount
      FROM invoices WHERE match_status = 'unmatched'
      GROUP BY customer_name HAVING COUNT(*) > 1
      ORDER BY issue_count DESC LIMIT 5
    `).all() as unknown as RepeatIssueRow[];
    for (const r of repeatIssues) {
      insights.push({
        id: uuid(),
        type: 'repeat_issue',
        title: `${r.customer_name} has ${r.issue_count} unmatched invoices`,
        evidence: `Total outstanding: ${formatINR(r.total_amount)} across ${r.issue_count} invoices.`,
        impact: 'Medium - recurring payment issue requiring customer relationship review.',
        recommended_action: `Contact ${r.customer_name} to establish a payment plan or resolve billing disputes.`,
        severity: 'medium',
        created_at: new Date().toISOString(),
      });
    }

    // Duplicate payment patterns
    const dupes = db.prepare(`
      SELECT reference_number, COUNT(*) as count, SUM(amount) as total
      FROM payment_transactions
      GROUP BY reference_number HAVING COUNT(*) > 1
    `).all() as unknown as DupeRow[];
    if (dupes.length > 0) {
      const totalDupeAmount = dupes.reduce((s: number, d: DupeRow) => s + d.total, 0);
      insights.push({
        id: uuid(),
        type: 'duplicate_pattern',
        title: `${dupes.length} potential duplicate payment patterns detected`,
        evidence: `Found ${dupes.length} references with multiple payments totaling ${formatINR(totalDupeAmount)}.`,
        impact: 'High - potential overpayments requiring immediate investigation.',
        recommended_action: 'Review each duplicate and initiate refund process if confirmed.',
        severity: 'high',
        created_at: new Date().toISOString(),
      });
    }

    // Increasing outstanding balances
    const outstanding = db.prepare(`
      SELECT COALESCE(SUM(outstanding), 0) as total_outstanding,
             COALESCE(SUM(CASE WHEN status = 'overdue' THEN outstanding ELSE 0 END), 0) as overdue_total
      FROM invoices WHERE outstanding > 0
    `).get() as unknown as OutstandingRow;
    if (outstanding.total_outstanding > 0) {
      insights.push({
        id: uuid(),
        type: 'outstanding_balance',
        title: `${formatINR(outstanding.total_outstanding)} in outstanding balances`,
        evidence: `Overdue amount: ${formatINR(outstanding.overdue_total)}. Total outstanding: ${formatINR(outstanding.total_outstanding)}.`,
        impact: 'High - cash flow impact and potential bad debt risk.',
        recommended_action: 'Prioritize collection of overdue invoices and review credit terms.',
        severity: outstanding.overdue_total > outstanding.total_outstanding * 0.5 ? 'high' : 'medium',
        created_at: new Date().toISOString(),
      });
    }

    // Frequently mismatched references
    const refMismatch = db.prepare(`
      SELECT rr.*, i.invoice_id, i.reference_number as inv_ref, pt.reference_number as pay_ref
      FROM reconciliation_results rr
      LEFT JOIN invoices i ON rr.invoice_id = i.id
      LEFT JOIN payment_transactions pt ON rr.payment_transaction_id = pt.id
      WHERE rr.reference_similarity < 50 AND rr.match_type != 'unmatched'
      LIMIT 5
    `).all();
    if (refMismatch.length > 0) {
      insights.push({
        id: uuid(),
        type: 'reference_mismatch',
        title: `${refMismatch.length} matches have low reference similarity`,
        evidence: `Several transactions matched despite poor reference alignment, indicating naming inconsistency.`,
        impact: 'Medium - may indicate systematic reference format issues in invoicing or payment systems.',
        recommended_action: 'Standardize reference number formats across all systems to improve automated matching.',
        severity: 'medium',
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ insights });
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const { query } = await request.json();
    const q = (query || '').toLowerCase();

    let answer = '';
    let records: unknown[] = [];
    const suggestions: string[] = [];

    if (q.includes('unmatched') && q.includes('invoice')) {
      const unmatched = db.prepare("SELECT * FROM invoices WHERE match_status = 'unmatched' ORDER BY total_amount DESC").all() as unknown as Array<{ total_amount: number }>;
      records = unmatched;
      answer = `Found ${unmatched.length} unmatched invoices totaling ${formatINR(unmatched.reduce((s: number, i) => s + i.total_amount, 0))}.`;
      suggestions.push('Run reconciliation to attempt matching', 'Review exception center');
    } else if (q.includes('duplicate') && q.includes('payment')) {
      const dupes = db.prepare(`
        SELECT reference_number, COUNT(*) as count, GROUP_CONCAT(payment_id) as payment_ids, SUM(amount) as total
        FROM payment_transactions GROUP BY reference_number HAVING COUNT(*) > 1
      `).all();
      records = dupes;
      answer = `Found ${dupes.length} potential duplicate payment patterns.`;
      suggestions.push('Review each duplicate group', 'Flag suspicious transactions');
    } else if (q.includes('reconciliation') && q.includes('rate')) {
      const stats = db.prepare(`
        SELECT
          (SELECT COUNT(*) FROM reconciliation_results WHERE confidence_score >= 95) as high_conf,
          (SELECT COUNT(*) FROM reconciliation_results WHERE confidence_score >= 70 AND confidence_score < 95) as review,
          (SELECT COUNT(*) FROM reconciliation_results WHERE confidence_score < 70) as low_conf,
          (SELECT COUNT(*) FROM reconciliation_results) as total
      `).get() as unknown as ReconStatsRow;
      const highRate = stats.total > 0 ? ((stats.high_conf / stats.total) * 100).toFixed(1) : '0';
      answer = `Your reconciliation rate: ${highRate}% high-confidence matches (${stats.high_conf} of ${stats.total}). ${stats.review} need review, ${stats.low_conf} are low-confidence.`;
    } else if (q.includes('overdue') && q.includes('invoice')) {
      const overdue = db.prepare("SELECT * FROM invoices WHERE status = 'overdue' ORDER BY total_amount DESC").all() as unknown as Array<{ outstanding: number }>;
      records = overdue;
      answer = `Found ${overdue.length} overdue invoices totaling ${formatINR(overdue.reduce((s: number, i) => s + i.outstanding, 0))}.`;
      suggestions.push('Send payment reminders', 'Update customer communication');
    } else if (q.includes('suspicious')) {
      const suspicious = db.prepare(`
        SELECT * FROM bank_transactions WHERE amount > 200000 AND match_status = 'unmatched'
      `).all();
      records = suspicious;
      answer = `Found ${suspicious.length} high-value unmatched bank transactions that may need investigation.`;
    } else if (q.includes('highest') && q.includes('outstanding')) {
      const topOutstanding = db.prepare(`
        SELECT customer_name, SUM(outstanding) as total_outstanding, COUNT(*) as invoice_count
        FROM invoices WHERE outstanding > 0
        GROUP BY customer_name ORDER BY total_outstanding DESC LIMIT 10
      `).all();
      records = topOutstanding;
      answer = `Top customers by outstanding balance:`;
    } else if (q.includes('payment') && q.includes('above')) {
      const amountMatch = q.match(/[\d,]+/);
      const threshold = amountMatch ? parseInt(amountMatch[0].replace(/,/g, '')) : 100000;
      const largePayments = db.prepare('SELECT * FROM payment_transactions WHERE amount > ? ORDER BY amount DESC').all(threshold);
      records = largePayments;
      answer = `Found ${largePayments.length} payments above ${formatINR(threshold)}.`;
    } else if (q.includes('today') && q.includes('reconciliation')) {
      const latestRun = db.prepare('SELECT * FROM reconciliation_runs ORDER BY created_at DESC LIMIT 1').get() as unknown as ReconciliationRun | undefined;
      if (latestRun) {
        answer = `Latest reconciliation run: Processed ${latestRun.records_processed} records, found ${latestRun.matches_found} matches, ${latestRun.review_required} need review, ${latestRun.unmatched_count} unmatched. Processing time: ${latestRun.processing_time_ms}ms.`;
      } else {
        answer = 'No reconciliation runs found. Run reconciliation first.';
      }
    } else {
      answer = `I couldn't find specific information matching "${query}" in the current dataset. Try asking about: unmatched invoices, duplicate payments, reconciliation rate, overdue invoices, outstanding balances, or suspicious transactions.`;
    }

    return NextResponse.json({ answer, records, suggestions });
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
}
