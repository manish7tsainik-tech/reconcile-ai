import { NextResponse } from 'next/server';
import { getDb } from '@/database/connection';
import type { Settings } from '@/lib/types';
import { errorMessage } from '@/lib/api';

export async function GET() {
  try {
    const db = getDb();
    const settings = db.prepare('SELECT * FROM settings LIMIT 1').get() as Settings | undefined;
    return NextResponse.json({ settings });
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const db = getDb();
    const updates = (await request.json()) as Partial<Settings>;
    const current = db.prepare('SELECT * FROM settings LIMIT 1').get() as unknown as Settings;

    db.prepare(`
      UPDATE settings SET
        date_tolerance_days = ?,
        amount_tolerance = ?,
        auto_match_threshold = ?,
        review_threshold = ?,
        currency = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      updates.date_tolerance_days ?? current.date_tolerance_days,
      updates.amount_tolerance ?? current.amount_tolerance,
      updates.auto_match_threshold ?? current.auto_match_threshold,
      updates.review_threshold ?? current.review_threshold,
      updates.currency ?? current.currency,
      current.id
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
