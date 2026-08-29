import { NextResponse } from 'next/server';
import { getDb } from '@/database/connection';
import { generateDemoData } from '@/lib/demo-data';
import { v4 as uuidv4 } from 'uuid';
import { errorMessage } from '@/lib/api';
import type { Invoice, BankTransaction, PaymentTransaction } from '@/lib/types';

export async function POST() {
  try {
    const db = getDb();

    // Clear existing data
    db.exec(`
      DELETE FROM reconciliation_results;
      DELETE FROM reconciliation_runs;
      DELETE FROM exceptions;
      DELETE FROM ai_insights;
      DELETE FROM invoices;
      DELETE FROM bank_transactions;
      DELETE FROM payment_transactions;
    `);

    const { invoices, bankTransactions, paymentTransactions } = generateDemoData();

    // Insert invoices
    const insertInv = db.prepare(`
      INSERT INTO invoices (id, invoice_id, customer_name, invoice_date, due_date, invoice_amount, tax, total_amount, currency, reference_number, status, match_status, paid_amount, outstanding, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const invMany = db.transaction((items: Invoice[]) => {
      for (const inv of items) {
        insertInv.run(inv.id, inv.invoice_id, inv.customer_name, inv.invoice_date, inv.due_date, inv.invoice_amount, inv.tax, inv.total_amount, inv.currency, inv.reference_number ?? '', inv.status, inv.match_status, inv.paid_amount, inv.outstanding, inv.created_at, inv.updated_at);
      }
    });
    invMany(invoices);

    // Insert bank transactions
    const insertBank = db.prepare(`
      INSERT INTO bank_transactions (id, transaction_id, transaction_date, description, reference_number, payer_name, amount, currency, transaction_type, bank_account, status, match_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const bankMany = db.transaction((items: BankTransaction[]) => {
      for (const txn of items) {
        insertBank.run(txn.id, txn.transaction_id, txn.transaction_date, txn.description, txn.reference_number ?? '', txn.payer_name ?? '', txn.amount, txn.currency, txn.transaction_type, txn.bank_account, txn.status, txn.match_status, txn.created_at);
      }
    });
    bankMany(bankTransactions);

    // Insert payment transactions
    const insertPay = db.prepare(`
      INSERT INTO payment_transactions (id, payment_id, order_id, transaction_id, customer_name, payment_date, amount, currency, payment_method, gateway, reference_number, status, match_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const payMany = db.transaction((items: PaymentTransaction[]) => {
      for (const pay of items) {
        insertPay.run(pay.id, pay.payment_id, pay.order_id ?? '', pay.transaction_id, pay.customer_name ?? '', pay.payment_date, pay.amount, pay.currency, pay.payment_method, pay.gateway, pay.reference_number ?? '', pay.status, pay.match_status, pay.created_at);
      }
    });
    payMany(paymentTransactions);

    // Insert audit log
    db.prepare(`INSERT INTO audit_logs (id, user_id, user_name, action, record_type, record_id, old_value, new_value, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), 'admin-001', 'Admin User', 'Load Demo Data', 'system', 'all', '', `${invoices.length} invoices, ${bankTransactions.length} bank txns, ${paymentTransactions.length} payment txns`, new Date().toISOString()
    );

    return NextResponse.json({
      success: true,
      counts: {
        invoices: invoices.length,
        bankTransactions: bankTransactions.length,
        paymentTransactions: paymentTransactions.length,
      },
    });
  } catch (error: unknown) {
    console.error('Demo data error:', error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
