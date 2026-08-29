export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: string;
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
  reference_number?: string | null;
  status: string;
  match_status: string;
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
  reference_number?: string | null;
  payer_name?: string | null;
  amount: number;
  currency: string;
  transaction_type: string;
  bank_account: string;
  status: string;
  match_status: string;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  payment_id: string;
  order_id?: string | null;
  transaction_id: string;
  customer_name?: string | null;
  payment_date: string;
  amount: number;
  currency: string;
  payment_method: string;
  gateway: string;
  reference_number?: string | null;
  status: string;
  match_status: string;
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
  status: string;
  created_at: string;
}

export interface ReconciliationResult {
  id: string;
  run_id: string;
  invoice_id?: string | null;
  bank_transaction_id?: string | null;
  payment_transaction_id?: string | null;
  match_type: string;
  confidence_score: number;
  reference_similarity: number;
  amount_similarity: number;
  customer_similarity: number;
  date_similarity: number;
  description_similarity: number;
  status: string;
  ai_explanation: string;
  created_at: string;
  invoice?: Invoice | null;
  bank_transaction?: BankTransaction | null;
  payment_transaction?: PaymentTransaction | null;
}

export interface Exception {
  id: string;
  type: string;
  priority: string;
  status: string;
  owner: string;
  amount: number;
  invoice_id?: string | null;
  payment_id?: string | null;
  bank_transaction_id?: string | null;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface AiInsight {
  id: string;
  type: string;
  title: string;
  evidence: string;
  impact: string;
  recommended_action: string;
  severity: string;
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
  read: number;
  type: string;
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

export interface PaginatedResponse<T> {
  data?: T;
  total?: number;
  [key: string]: unknown;
}

export interface BankTransactionInput {
  id?: string;
  transaction_id?: string;
  transaction_date?: string;
  description?: string;
  reference_number?: string;
  payer_name?: string;
  amount?: number | string;
  currency?: string;
  transaction_type?: string;
  bank_account?: string;
  status?: string;
  created_at?: string;
}

export interface InvoiceInput {
  id?: string;
  invoice_id?: string;
  customer_name?: string;
  invoice_date?: string;
  due_date?: string;
  invoice_amount?: number | string;
  tax?: number | string;
  total_amount?: number | string;
  currency?: string;
  reference_number?: string;
  status?: string;
  paid_amount?: number | string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentTransactionInput {
  id?: string;
  payment_id?: string;
  order_id?: string;
  transaction_id?: string;
  customer_name?: string;
  payment_date?: string;
  amount?: number | string;
  currency?: string;
  payment_method?: string;
  gateway?: string;
  reference_number?: string;
  status?: string;
  created_at?: string;
}

export interface CountRow {
  count: number;
}

export type ReconciliationResultDraft = Omit<ReconciliationResult, 'created_at'>;

export interface ReconciliationResultRow extends ReconciliationResult {
  inv_customer?: string | null;
  inv_amount?: number | null;
  inv_date?: string | null;
  inv_ref?: string | null;
  bank_txn_id?: string | null;
  bank_payer?: string | null;
  bank_amount?: number | null;
  bank_date?: string | null;
  bank_ref?: string | null;
  pay_id?: string | null;
  pay_customer?: string | null;
  pay_amount?: number | null;
  pay_date?: string | null;
  pay_ref?: string | null;
  pay_gateway?: string | null;
}

export type ExceptionDraft = Omit<Exception, 'created_at' | 'updated_at'>;


