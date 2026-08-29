import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(
  process.env.LOCALAPPDATA || process.env.HOME || process.cwd(),
  'reconcile-ai-data'
);
const DB_PATH = path.join(dataDir, 'reconcile-ai.db');

let db: InstanceType<typeof Database> | null = null;

export function getDb(): InstanceType<typeof Database> {
  if (!db) {
    fs.mkdirSync(dataDir, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(db: InstanceType<typeof Database>) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      invoice_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      invoice_amount REAL NOT NULL,
      tax REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      reference_number TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      match_status TEXT NOT NULL DEFAULT 'unmatched',
      paid_amount REAL NOT NULL DEFAULT 0,
      outstanding REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bank_transactions (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      transaction_date TEXT NOT NULL,
      description TEXT NOT NULL,
      reference_number TEXT,
      payer_name TEXT,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      transaction_type TEXT NOT NULL DEFAULT 'credit',
      bank_account TEXT NOT NULL DEFAULT 'primary',
      status TEXT NOT NULL DEFAULT 'completed',
      match_status TEXT NOT NULL DEFAULT 'unmatched',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payment_transactions (
      id TEXT PRIMARY KEY,
      payment_id TEXT NOT NULL,
      order_id TEXT,
      transaction_id TEXT NOT NULL,
      customer_name TEXT,
      payment_date TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      payment_method TEXT NOT NULL,
      gateway TEXT NOT NULL,
      reference_number TEXT,
      status TEXT NOT NULL DEFAULT 'completed',
      match_status TEXT NOT NULL DEFAULT 'unmatched',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reconciliation_runs (
      id TEXT PRIMARY KEY,
      run_date TEXT NOT NULL,
      records_processed INTEGER NOT NULL DEFAULT 0,
      matches_found INTEGER NOT NULL DEFAULT 0,
      review_required INTEGER NOT NULL DEFAULT 0,
      unmatched_count INTEGER NOT NULL DEFAULT 0,
      processing_time_ms INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'completed',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reconciliation_results (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      invoice_id TEXT,
      bank_transaction_id TEXT,
      payment_transaction_id TEXT,
      match_type TEXT NOT NULL DEFAULT 'unmatched',
      confidence_score REAL NOT NULL DEFAULT 0,
      reference_similarity REAL NOT NULL DEFAULT 0,
      amount_similarity REAL NOT NULL DEFAULT 0,
      customer_similarity REAL NOT NULL DEFAULT 0,
      date_similarity REAL NOT NULL DEFAULT 0,
      description_similarity REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      ai_explanation TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (run_id) REFERENCES reconciliation_runs(id),
      FOREIGN KEY (invoice_id) REFERENCES invoices(id),
      FOREIGN KEY (bank_transaction_id) REFERENCES bank_transactions(id),
      FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions(id)
    );

    CREATE TABLE IF NOT EXISTS exceptions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'open',
      owner TEXT DEFAULT '',
      amount REAL NOT NULL DEFAULT 0,
      invoice_id TEXT,
      payment_id TEXT,
      bank_transaction_id TEXT,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_insights (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      evidence TEXT NOT NULL,
      impact TEXT NOT NULL,
      recommended_action TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'medium',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      record_type TEXT NOT NULL,
      record_id TEXT NOT NULL,
      old_value TEXT DEFAULT '',
      new_value TEXT DEFAULT '',
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      type TEXT NOT NULL DEFAULT 'info',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      date_tolerance_days INTEGER NOT NULL DEFAULT 7,
      amount_tolerance REAL NOT NULL DEFAULT 10,
      auto_match_threshold REAL NOT NULL DEFAULT 95,
      review_threshold REAL NOT NULL DEFAULT 70,
      currency TEXT NOT NULL DEFAULT 'INR',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_invoices_invoice_id ON invoices(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_name);
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
    CREATE INDEX IF NOT EXISTS idx_invoices_match_status ON invoices(match_status);
    CREATE INDEX IF NOT EXISTS idx_bank_txn_transaction_id ON bank_transactions(transaction_id);
    CREATE INDEX IF NOT EXISTS idx_bank_txn_date ON bank_transactions(transaction_date);
    CREATE INDEX IF NOT EXISTS idx_bank_txn_reference ON bank_transactions(reference_number);
    CREATE INDEX IF NOT EXISTS idx_bank_txn_match_status ON bank_transactions(match_status);
    CREATE INDEX IF NOT EXISTS idx_pay_txn_payment_id ON payment_transactions(payment_id);
    CREATE INDEX IF NOT EXISTS idx_pay_txn_transaction_id ON payment_transactions(transaction_id);
    CREATE INDEX IF NOT EXISTS idx_pay_txn_date ON payment_transactions(payment_date);
    CREATE INDEX IF NOT EXISTS idx_pay_txn_reference ON payment_transactions(reference_number);
    CREATE INDEX IF NOT EXISTS idx_pay_txn_match_status ON payment_transactions(match_status);
    CREATE INDEX IF NOT EXISTS idx_recon_results_run ON reconciliation_results(run_id);
    CREATE INDEX IF NOT EXISTS idx_recon_results_status ON reconciliation_results(status);
    CREATE INDEX IF NOT EXISTS idx_exceptions_status ON exceptions(status);
    CREATE INDEX IF NOT EXISTS idx_exceptions_type ON exceptions(type);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  `);

  // Insert default settings if not exists
  const settingsExists = db.prepare('SELECT id FROM settings LIMIT 1').get();
  if (!settingsExists) {
    db.prepare(`INSERT INTO settings (id, date_tolerance_days, amount_tolerance, auto_match_threshold, review_threshold, currency) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'default', 7, 10, 95, 70, 'INR'
    );
  }

  // Insert default admin user if not exists
  const userExists = db.prepare('SELECT id FROM users LIMIT 1').get();
  if (!userExists) {
    db.prepare(`INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)`).run(
      'admin-001', 'admin@reconcileai.com', 'Admin User', 'demo-password-hash', 'admin'
    );
  }
}
