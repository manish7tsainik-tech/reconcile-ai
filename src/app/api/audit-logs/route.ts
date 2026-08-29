import { NextResponse } from 'next/server';
import { getDb } from '@/database/connection';
import type { AuditLog, CountRow } from '@/lib/types';
import { errorMessage } from '@/lib/api';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const total = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as unknown as CountRow;
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?').all(limit, offset) as unknown as AuditLog[];

    return NextResponse.json({ logs, total: total.count, page, limit });
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
