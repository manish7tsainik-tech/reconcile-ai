import { NextResponse } from 'next/server';
import { getDb } from '@/database/connection';
import { v4 as uuidv4 } from 'uuid';
import type { Exception, CountRow } from '@/lib/types';
import { errorMessage } from '@/lib/api';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params: unknown[] = [];
    if (type) { where += ' AND type = ?'; params.push(type); }
    if (status) { where += ' AND status = ?'; params.push(status); }
    if (priority) { where += ' AND priority = ?'; params.push(priority); }

    const total = db.prepare(`SELECT COUNT(*) as count FROM exceptions ${where}`).get(...params) as unknown as CountRow;
    const exceptions = db.prepare(`SELECT * FROM exceptions ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as unknown as Exception[];

    return NextResponse.json({ exceptions, total: total.count, page, limit });
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const db = getDb();
    const { id, status, owner } = (await request.json()) as { id: string; status?: string; owner?: string };

    if (status) {
      db.prepare('UPDATE exceptions SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, id);
    }
    if (owner !== undefined) {
      db.prepare('UPDATE exceptions SET owner = ?, updated_at = datetime(\'now\') WHERE id = ?').run(owner, id);
    }

    db.prepare(`INSERT INTO audit_logs (id, user_id, user_name, action, record_type, record_id, old_value, new_value, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), 'admin-001', 'Admin User', 'Updated Exception', 'exception', id, '', JSON.stringify({ status, owner }), new Date().toISOString()
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
