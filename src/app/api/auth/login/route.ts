import { NextResponse } from 'next/server';
import { getDb } from '@/database/connection';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@/lib/types';
import { errorMessage } from '@/lib/api';

export async function POST(request: Request) {
  try {
    const db = getDb();
    const { email } = (await request.json()) as { email: string; password: string };

    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;

    if (!user) {
      // Auto-create user for demo
      const id = uuidv4();
      db.prepare('INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(
        id, email, email.split('@')[0], 'demo-hash', 'admin'
      );
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as User;
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at,
    };
    return NextResponse.json({ user: safeUser, token: 'demo-token-' + user.id });
  } catch (error: unknown) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
