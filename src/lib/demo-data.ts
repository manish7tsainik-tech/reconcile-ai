import { v4 as uuidv4 } from 'uuid';
import type { Invoice, BankTransaction, PaymentTransaction } from './types';

const CUSTOMERS = [
  'ABC Technologies Pvt Ltd', 'Global Solutions Inc', 'DataFlow Systems',
  'TechVision Corp', 'NexGen Solutions', 'Quantum Analytics',
  'Pinnacle Industries', 'BlueStar Enterprises', 'Horizon Digital',
  'SilverLine Services', 'Apex Manufacturing', 'PrimeLogistics',
  'CloudNine Software', 'EverGreen Trading', 'Summit Healthcare',
  'Pacific Electronics', 'Atlas Construction', 'Vertex Energy',
  'Maven Consulting', 'Precision Engineering', 'BrightPath Education',
  'Cascade Media', 'TrueNorth Finance', 'Zenith Retail',
  'EagleEye Security', 'Stellar Aerospace', 'IronClad Legal',
  'GreenWave Solar', 'SwiftBridge Transport', 'MegaPower Utilities'
];

const BANK_ACCOUNTS = ['HDFC-001234567890', 'ICICI-009876543210', 'SBI-001122334455', 'AXIS-005566778899'];
const GATEWAYS = ['Razorpay', 'Stripe', 'PayPal'];
const PAYMENT_METHODS = ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet', 'NEFT', 'RTGS', 'IMPS'];
const CURRENCIES = ['INR', 'USD'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export interface GeneratedData {
  invoices: Invoice[];
  bankTransactions: BankTransaction[];
  paymentTransactions: PaymentTransaction[];
}

export function generateDemoData(): GeneratedData {
  const invoices: Invoice[] = [];
  const bankTransactions: BankTransaction[] = [];
  const paymentTransactions: PaymentTransaction[] = [];

  const baseDate = new Date('2026-06-01');
  const endDate = new Date('2026-08-25');

  // Generate 250 invoices
  for (let i = 1; i <= 250; i++) {
    const customer = CUSTOMERS[randomInt(0, CUSTOMERS.length - 1)];
    const invDate = randomDate(baseDate, endDate);
    const amount = randomFloat(5000, 500000);
    const taxRate = randomFloat(0.05, 0.18);
    const tax = parseFloat((amount * taxRate).toFixed(2));
    const total = parseFloat((amount + tax).toFixed(2));
    const invNumber = `INV-${String(i).padStart(5, '0')}`;
    const daysUntilDue = randomInt(15, 60);
    let status: string = 'pending';

    // Determine if paid based on position
    if (i <= 170) status = 'paid';
    else if (i <= 200) status = 'pending';
    else if (i <= 220) status = 'overdue';
    else status = 'pending';

    const paidAmount = status === 'paid' ? total : (status === 'overdue' ? 0 : (i > 220 && i <= 230 ? total * 0.6 : 0));
    const outstanding = total - paidAmount;

    const inv = {
      id: uuidv4(),
      invoice_id: invNumber,
      customer_name: customer,
      invoice_date: invDate,
      due_date: addDays(invDate, daysUntilDue),
      invoice_amount: amount,
      tax,
      total_amount: total,
      currency: CURRENCIES[0],
      reference_number: `REF-${String(i).padStart(5, '0')}`,
      status,
      match_status: 'unmatched',
      paid_amount: parseFloat(paidAmount.toFixed(2)),
      outstanding: parseFloat(outstanding.toFixed(2)),
      created_at: invDate,
      updated_at: invDate,
    };
    invoices.push(inv);
  }

  // Generate 300 bank transactions
  // ~170 will match invoices (170 paid invoices), ~50 will have fuzzy matches, ~30 duplicates, ~50 unmatched
  let txnCounter = 1;

  // 170 exact matches for paid invoices
  for (let i = 0; i < 170; i++) {
    const inv = invoices[i];
    const txnDate = addDays(inv.invoice_date, randomInt(1, 10));
    const ref = inv.invoice_id.replace('-', ''); // INV10025 instead of INV-10025

    bankTransactions.push({
      id: uuidv4(),
      transaction_id: `TXN-${String(txnCounter).padStart(5, '0')}`,
      transaction_date: txnDate,
      description: `Payment received from ${inv.customer_name} for ${inv.invoice_id}`,
      reference_number: ref,
      payer_name: inv.customer_name,
      amount: inv.total_amount,
      currency: inv.currency,
      transaction_type: 'credit',
      bank_account: BANK_ACCOUNTS[randomInt(0, BANK_ACCOUNTS.length - 1)],
      status: 'completed',
      match_status: 'unmatched',
      created_at: txnDate,
    });
    txnCounter++;
  }

  // 40 fuzzy matches (slightly different amounts, names, references)
  for (let i = 170; i <= 209; i++) {
    const inv = invoices[i];
    const txnDate = addDays(inv.invoice_date, randomInt(0, 15));
    const refBase = inv.reference_number ?? '';
    const variations = [
      inv.invoice_id.replace('-', ''),
      inv.invoice_id.replace('-', '_'),
      `REF${refBase.replace('REF-', '')}`,
      refBase,
    ];
    const ref = variations[randomInt(0, variations.length - 1)];

    // Slight amount variation (1-5% difference)
    const amountVariation = inv.total_amount * randomFloat(0.95, 1.05);
    const nameVariations = [
      inv.customer_name.replace('Pvt Ltd', '').trim(),
      inv.customer_name.replace('Private Limited', '').trim(),
      inv.customer_name.toUpperCase(),
      inv.customer_name.replace('Inc', '').trim(),
    ];

    bankTransactions.push({
      id: uuidv4(),
      transaction_id: `TXN-${String(txnCounter).padStart(5, '0')}`,
      transaction_date: txnDate,
      description: `Bank transfer from ${inv.customer_name}`,
      reference_number: ref,
      payer_name: nameVariations[randomInt(0, nameVariations.length - 1)],
      amount: parseFloat(amountVariation.toFixed(2)),
      currency: inv.currency,
      transaction_type: 'credit',
      bank_account: BANK_ACCOUNTS[randomInt(0, BANK_ACCOUNTS.length - 1)],
      status: 'completed',
      match_status: 'unmatched',
      created_at: txnDate,
    });
    txnCounter++;
  }

  // 30 duplicate bank transactions
  for (let i = 0; i < 30; i++) {
    const original = bankTransactions[randomInt(0, bankTransactions.length - 1)];
    bankTransactions.push({
      id: uuidv4(),
      transaction_id: `TXN-${String(txnCounter).padStart(5, '0')}`,
      transaction_date: original.transaction_date,
      description: original.description,
      reference_number: original.reference_number,
      payer_name: original.payer_name,
      amount: original.amount,
      currency: original.currency,
      transaction_type: original.transaction_type,
      bank_account: original.bank_account,
      status: 'completed',
      match_status: 'unmatched',
      created_at: original.created_at,
    });
    txnCounter++;
  }

  // Fill remaining to 300 with unmatched
  while (bankTransactions.length < 300) {
    const customer = CUSTOMERS[randomInt(0, CUSTOMERS.length - 1)];
    const txnDate = randomDate(baseDate, endDate);
    bankTransactions.push({
      id: uuidv4(),
      transaction_id: `TXN-${String(txnCounter).padStart(5, '0')}`,
      transaction_date: txnDate,
      description: `Transfer from ${customer}`,
      reference_number: `BANKREF-${String(txnCounter).padStart(5, '0')}`,
      payer_name: customer,
      amount: randomFloat(1000, 300000),
      currency: CURRENCIES[0],
      transaction_type: Math.random() > 0.1 ? 'credit' : 'debit',
      bank_account: BANK_ACCOUNTS[randomInt(0, BANK_ACCOUNTS.length - 1)],
      status: 'completed',
      match_status: 'unmatched',
      created_at: txnDate,
    });
    txnCounter++;
  }

  // Generate 250 payment transactions
  // ~160 exact matches, ~30 fuzzy, ~20 partial, ~40 unmatched
  let payCounter = 1;

  // 160 exact payment matches for paid invoices
  for (let i = 0; i < 160; i++) {
    const inv = invoices[i];
    const payDate = addDays(inv.invoice_date, randomInt(1, 8));
    const gateway = GATEWAYS[randomInt(0, GATEWAYS.length - 1)];

    paymentTransactions.push({
      id: uuidv4(),
      payment_id: `PAY-${String(payCounter).padStart(5, '0')}`,
      order_id: `ORD-${String(payCounter).padStart(5, '0')}`,
      transaction_id: `PGTXN-${String(payCounter).padStart(5, '0')}`,
      customer_name: inv.customer_name,
      payment_date: payDate,
      amount: inv.total_amount,
      currency: inv.currency,
      payment_method: PAYMENT_METHODS[randomInt(0, PAYMENT_METHODS.length - 1)],
      gateway,
      reference_number: inv.invoice_id.replace('-', ''),
      status: 'completed',
      match_status: 'unmatched',
      created_at: payDate,
    });
    payCounter++;
  }

  // 30 fuzzy payment matches
  for (let i = 160; i <= 189; i++) {
    const inv = invoices[i];
    const payDate = addDays(inv.invoice_date, randomInt(2, 12));
    const gateway = GATEWAYS[randomInt(0, GATEWAYS.length - 1)];
    const amountVar = inv.total_amount * randomFloat(0.97, 1.03);

    paymentTransactions.push({
      id: uuidv4(),
      payment_id: `PAY-${String(payCounter).padStart(5, '0')}`,
      order_id: `ORD-${String(payCounter).padStart(5, '0')}`,
      transaction_id: `PGTXN-${String(payCounter).padStart(5, '0')}`,
      customer_name: inv.customer_name.replace('Pvt Ltd', '').trim(),
      payment_date: payDate,
      amount: parseFloat(amountVar.toFixed(2)),
      currency: inv.currency,
      payment_method: PAYMENT_METHODS[randomInt(0, PAYMENT_METHODS.length - 1)],
      gateway,
      reference_number: inv.reference_number,
      status: 'completed',
      match_status: 'unmatched',
      created_at: payDate,
    });
    payCounter++;
  }

  // 20 partial payments (pay 30-70% of invoice)
  for (let i = 190; i <= 209; i++) {
    const inv = invoices[i];
    const payDate = addDays(inv.invoice_date, randomInt(3, 10));
    const gateway = GATEWAYS[randomInt(0, GATEWAYS.length - 1)];
    const partialAmount = inv.total_amount * randomFloat(0.3, 0.7);

    paymentTransactions.push({
      id: uuidv4(),
      payment_id: `PAY-${String(payCounter).padStart(5, '0')}`,
      order_id: `ORD-${String(payCounter).padStart(5, '0')}`,
      transaction_id: `PGTXN-${String(payCounter).padStart(5, '0')}`,
      customer_name: inv.customer_name,
      payment_date: payDate,
      amount: parseFloat(partialAmount.toFixed(2)),
      currency: inv.currency,
      payment_method: PAYMENT_METHODS[randomInt(0, PAYMENT_METHODS.length - 1)],
      gateway,
      reference_number: inv.invoice_id.replace('-', ''),
      status: 'completed',
      match_status: 'unmatched',
      created_at: payDate,
    });
    payCounter++;
  }

  // Fill remaining to 250 with unmatched
  while (paymentTransactions.length < 250) {
    const customer = CUSTOMERS[randomInt(0, CUSTOMERS.length - 1)];
    const payDate = randomDate(baseDate, endDate);
    const gateway = GATEWAYS[randomInt(0, GATEWAYS.length - 1)];

    paymentTransactions.push({
      id: uuidv4(),
      payment_id: `PAY-${String(payCounter).padStart(5, '0')}`,
      order_id: `ORD-${String(payCounter).padStart(5, '0')}`,
      transaction_id: `PGTXN-${String(payCounter).padStart(5, '0')}`,
      customer_name: customer,
      payment_date: payDate,
      amount: randomFloat(1000, 200000),
      currency: CURRENCIES[0],
      payment_method: PAYMENT_METHODS[randomInt(0, PAYMENT_METHODS.length - 1)],
      gateway,
      reference_number: `PGREF-${String(payCounter).padStart(5, '0')}`,
      status: Math.random() > 0.05 ? 'completed' : 'failed',
      match_status: 'unmatched',
      created_at: payDate,
    });
    payCounter++;
  }

  return { invoices, bankTransactions, paymentTransactions };
}
