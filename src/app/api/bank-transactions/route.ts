import { NextResponse } from 'next/server';
import { getDb } from '@/database/connection';
import type { BankTransaction, BankTransactionInput, CountRow } from '@/lib/types';
import { errorMessage } from '@/lib/api';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const matchStatus = searchParams.get('match_status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params: unknown[] = [];

    if (search) {
      where += ` AND (transaction_id LIKE ? OR description LIKE ? OR payer_name LIKE ? OR reference_number LIKE ?)`;
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

    const total = db.prepare(`SELECT COUNT(*) as count FROM bank_transactions ${where}`).get(...params) as unknown as CountRow;
    const transactions = db.prepare(`SELECT * FROM bank_transactions ${where} ORDER BY transaction_date DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as unknown as BankTransaction[];

    return NextResponse.json({ transactions, total: total.count, page, limit });
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const { transactions } = (await request.json()) as { transactions: BankTransactionInput[] };
    const { v4: uuidv4 } = await import('uuid');

    const insert = db.prepare(`
      INSERT INTO bank_transactions (id, transaction_id, transaction_date, description, reference_number, payer_name, amount, currency, transaction_type, bank_account, status, match_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    let count = 0;
    const insertMany = db.transaction((items: BankTransactionInput[]) => {
      for (const txn of items) {
        insert.run(
          txn.id || uuidv4(), txn.transaction_id, txn.transaction_date,
          txn.description || '', txn.reference_number || '', txn.payer_name || '',
          Number(txn.amount) || 0, txn.currency || 'INR',
          txn.transaction_type || 'credit', txn.bank_account || 'primary',
          txn.status || 'completed', 'unmatched'
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
