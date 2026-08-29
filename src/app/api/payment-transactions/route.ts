import { NextResponse } from 'next/server';
import { getDb } from '@/database/connection';
import type { PaymentTransaction, PaymentTransactionInput, CountRow } from '@/lib/types';
import { errorMessage } from '@/lib/api';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const matchStatus = searchParams.get('match_status') || '';
    const gateway = searchParams.get('gateway') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params: unknown[] = [];

    if (search) {
      where += ` AND (payment_id LIKE ? OR customer_name LIKE ? OR reference_number LIKE ? OR transaction_id LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      where += ` AND status = ?`;
      params.push(status);
    }
    if (matchStatus) {
      where += ` AND match_status = ?`;
      params.push(matchStatus);
    }
    if (gateway) {
      where += ` AND gateway = ?`;
      params.push(gateway);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM payment_transactions ${where}`).get(...params) as unknown as CountRow;
    const transactions = db.prepare(`SELECT * FROM payment_transactions ${where} ORDER BY payment_date DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as unknown as PaymentTransaction[];

    return NextResponse.json({ transactions, total: total.count, page, limit });
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const { transactions } = (await request.json()) as { transactions: PaymentTransactionInput[] };
    const { v4: uuidv4 } = await import('uuid');

    const insert = db.prepare(`
      INSERT INTO payment_transactions (id, payment_id, order_id, transaction_id, customer_name, payment_date, amount, currency, payment_method, gateway, reference_number, status, match_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    let count = 0;
    const insertMany = db.transaction((items: PaymentTransactionInput[]) => {
      for (const txn of items) {
        insert.run(
          txn.id || uuidv4(), txn.payment_id, txn.order_id || '', txn.transaction_id,
          txn.customer_name || '', txn.payment_date,
          Number(txn.amount) || 0, txn.currency || 'INR',
          txn.payment_method || '', txn.gateway || '',
          txn.reference_number || '', txn.status || 'completed', 'unmatched'
        );
        count++;
      }
    });
    insertMany(transactions || []);

    return NextResponse.json({ success: true, imported: count });
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
