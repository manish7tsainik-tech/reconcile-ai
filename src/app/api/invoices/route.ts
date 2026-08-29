import { NextResponse } from 'next/server';
import { getDb } from '@/database/connection';
import type { Invoice, InvoiceInput, CountRow } from '@/lib/types';
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
      where += ` AND (invoice_id LIKE ? OR customer_name LIKE ? OR reference_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      where += ` AND status = ?`;
      params.push(status);
    }
    if (matchStatus) {
      where += ` AND match_status = ?`;
      params.push(matchStatus);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM invoices ${where}`).get(...params) as unknown as CountRow;
    const invoices = db.prepare(`SELECT * FROM invoices ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as unknown as Invoice[];

    return NextResponse.json({ invoices, total: total.count, page, limit });
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const { invoices } = (await request.json()) as { invoices: InvoiceInput[] };
    const { v4: uuidv4 } = await import('uuid');

    const insert = db.prepare(`
      INSERT INTO invoices (id, invoice_id, customer_name, invoice_date, due_date, invoice_amount, tax, total_amount, currency, reference_number, status, match_status, paid_amount, outstanding, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    let count = 0;
    const insertMany = db.transaction((items: InvoiceInput[]) => {
      for (const inv of items) {
        const amount = Number(inv.invoice_amount) || 0;
        const tax = Number(inv.tax) || 0;
        const paid = Number(inv.paid_amount) || 0;
        const totalAmount = Number(inv.total_amount) || amount + tax;
        insert.run(
          inv.id || uuidv4(), inv.invoice_id, inv.customer_name, inv.invoice_date,
          inv.due_date, amount, tax, totalAmount,
          inv.currency || 'INR', inv.reference_number || '', inv.status || 'pending',
          'unmatched', paid, totalAmount - paid
        );
        count++;
      }
    });
    insertMany(invoices);

    return NextResponse.json({ success: true, imported: count });
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
