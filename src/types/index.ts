export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'finance_manager' | 'finance_analyst' | 'viewer';
  avatar?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_id: string;
  customer_name: string;
  invoice_date: string;
  due_date: string;
  invoice_amount: number;
  tax: number;
  total_amount: number;
  currency: string;
  reference_number: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  match_status: 'unmatched' | 'matched' | 'partial' | 'duplicate' | 'review';
  paid_amount: number;
  outstanding: number;
  created_at: string;
  updated_at: string;
}

export interface BankTransaction {
  id: string;
  transaction_id: string;
  transaction_date: string;
  description: string;
  reference_number: string;
  payer_name: string;
  amount: number;
  currency: string;
  transaction_type: 'credit' | 'debit';
  bank_account: string;
  status: 'pending' | 'completed' | 'failed';
  match_status: 'unmatched' | 'matched' | 'partial' | 'duplicate' | 'ignored' | 'flagged';
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  payment_id: string;
  order_id: string;
  transaction_id: string;
  customer_name: string;
  payment_date: string;
  amount: number;
  currency: string;
  payment_method: string;
  gateway: string;
  reference_number: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  match_status: 'unmatched' | 'matched' | 'partial' | 'duplicate';
  created_at: string;
}

export interface ReconciliationRun {
  id: string;
  run_date: string;
  records_processed: number;
  matches_found: number;
  review_required: number;
  unmatched_count: number;
  processing_time_ms: number;
  status: 'running' | 'completed' | 'failed';
  created_at: string;
}

export interface ReconciliationResult {
  id: string;
  run_id: string;
  invoice_id: string | null;
  bank_transaction_id: string | null;
  payment_transaction_id: string | null;
  match_type: 'exact' | 'fuzzy' | 'partial' | 'multiple_candidate' | 'duplicate' | 'overpayment' | 'underpayment' | 'unmatched';
  confidence_score: number;
  reference_similarity: number;
  amount_similarity: number;
  customer_similarity: number;
  date_similarity: number;
  description_similarity: number;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  ai_explanation: string;
  created_at: string;
  invoice?: Invoice;
  bank_transaction?: BankTransaction;
  payment_transaction?: PaymentTransaction;
}

export interface Exception {
  id: string;
  type: 'unmatched_invoice' | 'unmatched_payment' | 'partial_payment' | 'overpayment' | 'duplicate_payment' | 'amount_mismatch' | 'reference_mismatch' | 'date_mismatch';
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'waiting' | 'resolved' | 'rejected';
  owner: string;
  amount: number;
  invoice_id: string | null;
  payment_id: string | null;
  bank_transaction_id: string | null;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface AIInsight {
  id: string;
  type: string;
  title: string;
  evidence: string;
  impact: string;
  recommended_action: string;
  severity: 'high' | 'medium' | 'low';
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  record_type: string;
  record_id: string;
  old_value: string;
  new_value: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  created_at: string;
}

export interface Settings {
  id: string;
  date_tolerance_days: number;
  amount_tolerance: number;
  auto_match_threshold: number;
  review_threshold: number;
  currency: string;
  updated_at: string;
}

export interface DashboardKPI {
  label: string;
  value: number | string;
  change: number;
  changeLabel: string;
  icon?: string;
}

export interface ReconciliationStatusData {
  name: string;
  value: number;
  color: string;
}

export interface TrendData {
  date: string;
  total: number;
  matched: number;
  unmatched: number;
}

export interface AmountData {
  category: string;
  invoice: number;
  payment: number;
  reconciled: number;
  outstanding: number;
}

export interface ExceptionBreakdown {
  type: string;
  count: number;
  color: string;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
}

export interface UploadedData {
  headers: string[];
  rows: Record<string, string>[];
  mapping: ColumnMapping[];
  validRows: Record<string, string>[];
  invalidRows: { row: Record<string, string>; errors: string[] }[];
}
