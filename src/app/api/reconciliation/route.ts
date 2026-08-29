import { NextResponse } from 'next/server';
import { getDb } from '@/database/connection';
import { calculateMatchScore, classifyMatch, generateExplanation, type MatchScore } from '@/lib/reconciliation-engine';
import { v4 as uuidv4 } from 'uuid';
import { errorMessage } from '@/lib/api';
import type {
  Settings, Invoice, BankTransaction, PaymentTransaction,
  ReconciliationRun, ReconciliationResultDraft, ExceptionDraft, CountRow,
} from '@/lib/types';

type Candidate = { type: 'payment'; data: PaymentTransaction } | { type: 'bank'; data: BankTransaction };

export async function POST() {
  try {
    const db = getDb();
    const startTime = Date.now();

    // Get settings
    const settingsRow = db.prepare('SELECT * FROM settings LIMIT 1').get() as unknown as Settings | undefined;
    const settings: Settings = settingsRow || {
      id: 'default', date_tolerance_days: 7, amount_tolerance: 10, auto_match_threshold: 95,
      review_threshold: 70, currency: 'INR', updated_at: new Date().toISOString(),
    };

    // Get all data
    const invoices = db.prepare('SELECT * FROM invoices WHERE status != ?').all('cancelled') as unknown as Invoice[];
    const bankTxns = db.prepare('SELECT * FROM bank_transactions WHERE transaction_type = ?').all('credit') as unknown as BankTransaction[];
    const payTxns = db.prepare('SELECT * FROM payment_transactions WHERE status = ?').all('completed') as unknown as PaymentTransaction[];

    // Create run
    const runId = uuidv4();
    db.prepare(`INSERT INTO reconciliation_runs (id, run_date, records_processed, matches_found, review_required, unmatched_count, processing_time_ms, status, created_at) VALUES (?, ?, 0, 0, 0, 0, 0, 'running', ?)`).run(runId, new Date().toISOString(), new Date().toISOString());

    // Clear old results for fresh run
    db.prepare('DELETE FROM reconciliation_results WHERE run_id = ?').run(runId);
    db.prepare('DELETE FROM exceptions').run();

    // Reset all match statuses
    db.prepare("UPDATE invoices SET match_status = 'unmatched'").run();
    db.prepare("UPDATE bank_transactions SET match_status = 'unmatched'").run();
    db.prepare("UPDATE payment_transactions SET match_status = 'unmatched'").run();

    const results: ReconciliationResultDraft[] = [];
    const exceptions: ExceptionDraft[] = [];
    const matchedBankIds = new Set<string>();
    const matchedPayIds = new Set<string>();
    let matchesFound = 0;
    let reviewRequired = 0;
    let unmatchedCount = 0;

    // Process each invoice
    for (const invoice of invoices) {
      let bestScore = 0;
      let bestMatch: Candidate | null = null;
      let bestType: string = 'unmatched';
      let bestScores: MatchScore | null = null;

      // Try matching against payment transactions
      for (const payTxn of payTxns) {
        if (matchedPayIds.has(payTxn.id)) continue;

        const score = calculateMatchScore({
          invoiceRef: invoice.reference_number,
          paymentRef: payTxn.reference_number,
          invoiceAmount: invoice.total_amount,
          paymentAmount: payTxn.amount,
          customerName: invoice.customer_name,
          payerName: payTxn.customer_name,
          invoiceDate: invoice.invoice_date,
          paymentDate: payTxn.payment_date,
          settings: { date_tolerance_days: settings.date_tolerance_days, amount_tolerance: settings.amount_tolerance },
        });

        if (score.total > bestScore) {
          bestScore = score.total;
          bestMatch = { type: 'payment', data: payTxn };
          bestScores = score;
        }
      }

      // Try matching against bank transactions
      for (const bankTxn of bankTxns) {
        if (matchedBankIds.has(bankTxn.id)) continue;

        const score = calculateMatchScore({
          invoiceRef: invoice.reference_number,
          bankRef: bankTxn.reference_number,
          invoiceAmount: invoice.total_amount,
          paymentAmount: bankTxn.amount,
          customerName: invoice.customer_name,
          payerName: bankTxn.payer_name,
          invoiceDate: invoice.invoice_date,
          bankDate: bankTxn.transaction_date,
          settings: { date_tolerance_days: settings.date_tolerance_days, amount_tolerance: settings.amount_tolerance },
        });

        if (score.total > bestScore) {
          bestScore = score.total;
          bestMatch = { type: 'bank', data: bankTxn };
          bestScores = score;
        }
      }

      if (bestMatch && bestScore >= 15) {
        const scores = bestScores!;
        bestType = classifyMatch(bestScore, settings.auto_match_threshold, settings.review_threshold);

        // Check for overpayment/underpayment
        const payAmount = bestMatch.data.amount;
        if (bestType !== 'unmatched') {
          if (payAmount > invoice.total_amount * 1.01) {
            bestType = 'overpayment';
          } else if (payAmount < invoice.total_amount * 0.95) {
            bestType = invoice.paid_amount > 0 ? 'partial' : 'underpayment';
          }
        }

        const explanation = generateExplanation({
          invoiceId: invoice.invoice_id,
          paymentId: bestMatch.type === 'payment' ? bestMatch.data.payment_id : undefined,
          bankTxnId: bestMatch.type === 'bank' ? bestMatch.data.transaction_id : undefined,
          score: bestScores!,
          matchType: bestType,
        });

        const resultId = uuidv4();
        const result: ReconciliationResultDraft = {
          id: resultId,
          run_id: runId,
          invoice_id: invoice.id,
          bank_transaction_id: bestMatch.type === 'bank' ? bestMatch.data.id : null,
          payment_transaction_id: bestMatch.type === 'payment' ? bestMatch.data.id : null,
          match_type: bestType,
          confidence_score: bestScore,
          reference_similarity: scores.reference,
          amount_similarity: scores.amount,
          customer_similarity: scores.customer,
          date_similarity: scores.date,
          description_similarity: scores.description,
          status: bestScore >= settings.auto_match_threshold ? 'approved' : bestScore >= settings.review_threshold ? 'pending' : 'pending',
          ai_explanation: explanation,
        };

        results.push(result);

        // Update statuses
        if (bestMatch.type === 'bank') {
          matchedBankIds.add(bestMatch.data.id);
          db.prepare("UPDATE bank_transactions SET match_status = ? WHERE id = ?").run(
            bestType === 'exact' || bestType === 'fuzzy' ? 'matched' : bestType, bestMatch.data.id
          );
        } else {
          matchedPayIds.add(bestMatch.data.id);
          db.prepare("UPDATE payment_transactions SET match_status = ? WHERE id = ?").run(
            bestType === 'exact' || bestType === 'fuzzy' ? 'matched' : bestType, bestMatch.data.id
          );
        }

        const invMatchStatus = bestType === 'exact' || bestType === 'fuzzy' ? 'matched' : bestType === 'partial' ? 'partial' : bestType;
        db.prepare("UPDATE invoices SET match_status = ?, paid_amount = ?, outstanding = ? WHERE id = ?").run(
          invMatchStatus,
          bestMatch.data.amount,
          Math.max(0, invoice.total_amount - bestMatch.data.amount),
          invoice.id
        );

        if (bestScore >= settings.auto_match_threshold) {
          matchesFound++;
        } else if (bestScore >= settings.review_threshold) {
          reviewRequired++;
          exceptions.push({
            id: uuidv4(),
            type: 'amount_mismatch',
            priority: 'medium',
            status: 'open',
            owner: '',
            amount: invoice.total_amount,
            invoice_id: invoice.id,
            payment_id: bestMatch.type === 'payment' ? bestMatch.data.id : null,
            bank_transaction_id: bestMatch.type === 'bank' ? bestMatch.data.id : null,
            description: `Invoice ${invoice.invoice_id} matched with ${bestScore.toFixed(1)}% confidence - requires review.`,
          });
        } else {
          unmatchedCount++;
          exceptions.push({
            id: uuidv4(),
            type: 'unmatched_invoice',
            priority: invoice.total_amount > 100000 ? 'high' : 'medium',
            status: 'open',
            owner: '',
            amount: invoice.total_amount,
            invoice_id: invoice.id,
            payment_id: null,
            bank_transaction_id: null,
            description: `Invoice ${invoice.invoice_id} from ${invoice.customer_name} for ${invoice.total_amount} has low-confidence match (${bestScore.toFixed(1)}%). Manual review needed.`,
          });
        }
      } else {
        // No match found
        unmatchedCount++;
        const resultId = uuidv4();
        results.push({
          id: resultId,
          run_id: runId,
          invoice_id: invoice.id,
          bank_transaction_id: null,
          payment_transaction_id: null,
          match_type: 'unmatched',
          confidence_score: 0,
          reference_similarity: 0,
          amount_similarity: 0,
          customer_similarity: 0,
          date_similarity: 0,
          description_similarity: 0,
          status: 'pending',
          ai_explanation: `No matching transaction found for invoice ${invoice.invoice_id} from ${invoice.customer_name} for amount ${invoice.total_amount}.`,
        });

        // Create exception
        exceptions.push({
          id: uuidv4(),
          type: 'unmatched_invoice',
          priority: invoice.total_amount > 100000 ? 'high' : 'medium',
          status: 'open',
          owner: '',
          amount: invoice.total_amount,
          invoice_id: invoice.id,
          payment_id: null,
          bank_transaction_id: null,
          description: `Invoice ${invoice.invoice_id} from ${invoice.customer_name} for ${invoice.total_amount} has no matching payment or bank transaction.`,
        });
      }
    }

    // Detect duplicates
    const allPayByRef = new Map<string, PaymentTransaction[]>();
    for (const pt of payTxns) {
      const ref = pt.reference_number || pt.payment_id;
      if (!allPayByRef.has(ref)) allPayByRef.set(ref, []);
      allPayByRef.get(ref)!.push(pt);
    }

    for (const [ref, txns] of allPayByRef) {
      if (txns.length > 1) {
        for (const txn of txns.slice(1)) {
          if (!matchedPayIds.has(txn.id)) {
            exceptions.push({
              id: uuidv4(),
              type: 'duplicate_payment',
              priority: 'medium',
              status: 'open',
              owner: '',
              amount: txn.amount,
              invoice_id: null,
              payment_id: txn.id,
              bank_transaction_id: null,
              description: `Potential duplicate payment: ${txn.payment_id} with reference ${ref} for amount ${txn.amount}.`,
            });
          }
        }
      }
    }

    // Batch insert results
    const insertResult = db.prepare(`
      INSERT INTO reconciliation_results (id, run_id, invoice_id, bank_transaction_id, payment_transaction_id, match_type, confidence_score, reference_similarity, amount_similarity, customer_similarity, date_similarity, description_similarity, status, ai_explanation, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    const resultMany = db.transaction((items: ReconciliationResultDraft[]) => {
      for (const r of items) {
        insertResult.run(r.id, r.run_id, r.invoice_id, r.bank_transaction_id, r.payment_transaction_id, r.match_type, r.confidence_score, r.reference_similarity, r.amount_similarity, r.customer_similarity, r.date_similarity, r.description_similarity, r.status, r.ai_explanation);
      }
    });
    resultMany(results);

    // Batch insert exceptions
    const insertExc = db.prepare(`
      INSERT INTO exceptions (id, type, priority, status, owner, amount, invoice_id, payment_id, bank_transaction_id, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    const excMany = db.transaction((items: ExceptionDraft[]) => {
      for (const e of items) {
        insertExc.run(e.id, e.type, e.priority, e.status, e.owner, e.amount, e.invoice_id, e.payment_id, e.bank_transaction_id, e.description);
      }
    });
    excMany(exceptions);

    // Update unmatched bank/payment
    for (const bt of bankTxns) {
      if (!matchedBankIds.has(bt.id)) {
        db.prepare("UPDATE bank_transactions SET match_status = 'unmatched' WHERE id = ?").run(bt.id);
      }
    }
    for (const pt of payTxns) {
      if (!matchedPayIds.has(pt.id)) {
        db.prepare("UPDATE payment_transactions SET match_status = 'unmatched' WHERE id = ?").run(pt.id);
      }
    }

    const processingTime = Date.now() - startTime;

    // Update run
    db.prepare(`UPDATE reconciliation_runs SET records_processed = ?, matches_found = ?, review_required = ?, unmatched_count = ?, processing_time_ms = ?, status = 'completed' WHERE id = ?`).run(
      invoices.length, matchesFound, reviewRequired, unmatchedCount, processingTime, runId
    );

    return NextResponse.json({
      success: true,
      run_id: runId,
      summary: {
        records_processed: invoices.length,
        matches_found: matchesFound,
        review_required: reviewRequired,
        unmatched: unmatchedCount,
        total_results: results.length,
        exceptions_created: exceptions.length,
        processing_time_ms: processingTime,
      },
    });
  } catch (error: unknown) {
    console.error('Reconciliation error:', error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('run_id');
    const status = searchParams.get('status') || '';
    const matchType = searchParams.get('match_type') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    if (runId) {
      const results = db.prepare(`
        SELECT rr.*, 
          i.invoice_id, i.customer_name as inv_customer, i.total_amount as inv_amount, i.invoice_date as inv_date, i.reference_number as inv_ref,
          bt.transaction_id as bank_txn_id, bt.payer_name as bank_payer, bt.amount as bank_amount, bt.transaction_date as bank_date, bt.reference_number as bank_ref,
          pt.payment_id as pay_id, pt.customer_name as pay_customer, pt.amount as pay_amount, pt.payment_date as pay_date, pt.reference_number as pay_ref, pt.gateway as pay_gateway
        FROM reconciliation_results rr
        LEFT JOIN invoices i ON rr.invoice_id = i.id
        LEFT JOIN bank_transactions bt ON rr.bank_transaction_id = bt.id
        LEFT JOIN payment_transactions pt ON rr.payment_transaction_id = pt.id
        WHERE rr.run_id = ?
        ORDER BY rr.confidence_score DESC
      `).all(runId);
      return NextResponse.json({ results });
    }

    // Get latest run
    const latestRun = db.prepare('SELECT * FROM reconciliation_runs ORDER BY created_at DESC LIMIT 1').get() as unknown as ReconciliationRun | undefined;

    let where = 'WHERE 1=1';
    const params: unknown[] = [];
    if (latestRun) {
      where += ' AND rr.run_id = ?';
      params.push(latestRun.id);
    }
    if (status) {
      where += ' AND rr.status = ?';
      params.push(status);
    }
    if (matchType) {
      where += ' AND rr.match_type = ?';
      params.push(matchType);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM reconciliation_results rr ${where}`).get(...params) as unknown as CountRow;
    const results = db.prepare(`
      SELECT rr.*, 
        i.invoice_id, i.customer_name as inv_customer, i.total_amount as inv_amount, i.invoice_date as inv_date, i.reference_number as inv_ref,
        bt.transaction_id as bank_txn_id, bt.payer_name as bank_payer, bt.amount as bank_amount, bt.transaction_date as bank_date, bt.reference_number as bank_ref,
        pt.payment_id as pay_id, pt.customer_name as pay_customer, pt.amount as pay_amount, pt.payment_date as pay_date, pt.reference_number as pay_ref, pt.gateway as pay_gateway
      FROM reconciliation_results rr
      LEFT JOIN invoices i ON rr.invoice_id = i.id
      LEFT JOIN bank_transactions bt ON rr.bank_transaction_id = bt.id
      LEFT JOIN payment_transactions pt ON rr.payment_transaction_id = pt.id
      ${where}
      ORDER BY rr.confidence_score DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const runs = db.prepare('SELECT * FROM reconciliation_runs ORDER BY created_at DESC LIMIT 10').all();

    return NextResponse.json({ results, total: total.count, runs, latestRun, page, limit });
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
