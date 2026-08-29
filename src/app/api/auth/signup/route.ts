import { NextResponse } from 'next/server';
import { getDb } from '@/database/connection';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@/lib/types';
import { errorMessage } from '@/lib/api';

export async function POST(request: Request) {
  try {
    const db = getDb();
    const { email, name } = (await request.json()) as { email: string; name?: string };

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const id = uuidv4();
    db.prepare('INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(
      id, email, name || email.split('@')[0], 'demo-hash', 'admin'
    );

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as User;
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at,
    };
    return NextResponse.json({ user: safeUser, token: 'demo-token-' + id });
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
