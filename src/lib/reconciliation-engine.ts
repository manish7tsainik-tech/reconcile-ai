/**
 * Reconciliation Engine
 * Deterministic matching with scoring - NOT reliant on LLM for matching decisions.
 * 
 * Weight distribution:
 *   Reference Match:  35%
 *   Amount Match:     30%
 *   Customer Match:   20%
 *   Date Match:       10%
 *   Description Match: 5%
 */

function normalizeReference(ref: string): string {
  if (!ref) return '';
  return ref
    .toUpperCase()
    .replace(/[\s_\-./]/g, '')
    .replace(/^(INV|TXN|PAY|ORD|REF|REFNO)/, '')
    .trim();
}

function calculateReferenceSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const normA = normalizeReference(a);
  const normB = normalizeReference(b);
  if (!normA || !normB) return 0;
  if (normA === normB) return 100;
  // Check if one contains the other
  if (normA.includes(normB) || normB.includes(normA)) return 95;
  // Levenshtein-based similarity
  return levenshteinSimilarity(normA, normB);
}

function levenshteinSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
    for (let j = 1; j <= b.length; j++) {
      if (i === 0) {
        matrix[i][j] = j;
      } else if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  const distance = matrix[a.length][b.length];
  return Math.round(((maxLen - distance) / maxLen) * 100);
}

function normalizeName(name: string): string {
  if (!name) return '';
  return name
    .toUpperCase()
    .replace(/\b(PVT|LTD|LLP|INC|CORP|LLC|PRIVATE|LIMITED|INDIA|IND)\b\.?/g, '')
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateCustomerSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const normA = normalizeName(a);
  const normB = normalizeName(b);
  if (!normA || !normB) return 0;
  if (normA === normB) return 100;
  if (normA.includes(normB) || normB.includes(normA)) return 90;
  return levenshteinSimilarity(normA, normB);
}

function calculateAmountSimilarity(a: number, b: number, tolerance: number = 10): number {
  if (a === 0 && b === 0) return 100;
  const diff = Math.abs(a - b);
  if (diff === 0) return 100;
  if (diff <= tolerance) return 95;
  const larger = Math.max(Math.abs(a), Math.abs(b));
  if (larger === 0) return 0;
  const percentDiff = (diff / larger) * 100;
  if (percentDiff <= 1) return 90;
  if (percentDiff <= 3) return 80;
  if (percentDiff <= 5) return 70;
  if (percentDiff <= 10) return 50;
  if (percentDiff <= 20) return 30;
  return Math.max(0, 100 - percentDiff);
}

function calculateDateSimilarity(dateA: string, dateB: string, toleranceDays: number = 7): number {
  if (!dateA || !dateB) return 0;
  const dA = new Date(dateA).getTime();
  const dB = new Date(dateB).getTime();
  if (isNaN(dA) || isNaN(dB)) return 0;
  const diffMs = Math.abs(dA - dB);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays === 0) return 100;
  if (diffDays <= 1) return 95;
  if (diffDays <= toleranceDays / 2) return 85;
  if (diffDays <= toleranceDays) return 70;
  if (diffDays <= toleranceDays * 2) return 50;
  return Math.max(0, 100 - (diffDays * 5));
}

function calculateDescriptionSimilarity(a: string, b: string): number {
  if (!a || !b) return 30;
  const wordsA = a.toLowerCase().split(/\s+/);
  const wordsB = b.toLowerCase().split(/\s+/);
  let matches = 0;
  for (const wA of wordsA) {
    for (const wB of wordsB) {
      if (wA === wB || wA.includes(wB) || wB.includes(wA)) {
        matches++;
        break;
      }
    }
  }
  const maxWords = Math.max(wordsA.length, wordsB.length);
  if (maxWords === 0) return 30;
  return Math.round((matches / maxWords) * 100);
}

export interface MatchScore {
  reference: number;
  amount: number;
  customer: number;
  date: number;
  description: number;
  total: number;
}

export function calculateMatchScore(params: {
  invoiceRef?: string | null;
  paymentRef?: string | null;
  bankRef?: string | null;
  invoiceAmount: number;
  paymentAmount: number;
  customerName?: string | null;
  payerName?: string | null;
  invoiceDate?: string | null;
  paymentDate?: string | null;
  bankDate?: string | null;
  description?: string | null;
  settings?: {
    date_tolerance_days: number;
    amount_tolerance: number;
  };
}): MatchScore {
  const settings = params.settings || { date_tolerance_days: 7, amount_tolerance: 10 };

  // Reference similarity - best of invoice-ref vs payment-ref, payment-ref vs bank-ref, invoice-ref vs bank-ref
  const invoiceRef = params.invoiceRef || '';
  const paymentRef = params.paymentRef || '';
  const bankRef = params.bankRef || '';

  let refSim = 0;
  if (invoiceRef && paymentRef) refSim = Math.max(refSim, calculateReferenceSimilarity(invoiceRef, paymentRef));
  if (invoiceRef && bankRef) refSim = Math.max(refSim, calculateReferenceSimilarity(invoiceRef, bankRef));
  if (paymentRef && bankRef) refSim = Math.max(refSim, calculateReferenceSimilarity(paymentRef, bankRef));
  if (!refSim && invoiceRef && bankRef) refSim = calculateReferenceSimilarity(invoiceRef, bankRef);

  // Amount similarity
  const amountSim = calculateAmountSimilarity(params.invoiceAmount, params.paymentAmount, settings.amount_tolerance);

  // Customer similarity
  let custSim = 0;
  if (params.customerName && params.payerName) {
    custSim = calculateCustomerSimilarity(params.customerName, params.payerName);
  }

  // Date similarity
  let dateSim = 0;
  const invDate = params.invoiceDate || '';
  const payDate = params.paymentDate || params.bankDate || '';
  if (invDate && payDate) {
    dateSim = calculateDateSimilarity(invDate, payDate, settings.date_tolerance_days);
  }

  // Description similarity
  const descSim = params.description ? calculateDescriptionSimilarity(params.description, params.description) : 0;

  // Weighted score
  const total = Math.round(
    (refSim * 0.35) +
    (amountSim * 0.30) +
    (custSim * 0.20) +
    (dateSim * 0.10) +
    (descSim * 0.05)
  );

  return {
    reference: refSim,
    amount: amountSim,
    customer: custSim,
    date: dateSim,
    description: descSim,
    total: Math.min(100, Math.max(0, total)),
  };
}

export function classifyMatch(score: number, autoThreshold: number = 95, reviewThreshold: number = 70): string {
  if (score >= autoThreshold) return 'exact';
  if (score >= 85) return 'fuzzy';
  if (score >= reviewThreshold) return 'partial';
  if (score >= 50) return 'multiple_candidate';
  return 'unmatched';
}

export function generateExplanation(params: {
  invoiceId: string;
  paymentId?: string;
  bankTxnId?: string;
  score: MatchScore;
  matchType: string;
}): string {
  const parts: string[] = [];
  const target = params.paymentId ? `transaction ${params.paymentId}` : `bank transaction ${params.bankTxnId}`;

  parts.push(`Invoice ${params.invoiceId} was matched with ${target}`);

  const factors: string[] = [];
  if (params.score.reference >= 90) {
    factors.push('the payment reference is highly similar');
  } else if (params.score.reference >= 70) {
    factors.push('the payment reference is somewhat similar');
  }
  if (params.score.amount === 100) {
    factors.push('the payment amount exactly matches the invoice amount');
  } else if (params.score.amount >= 80) {
    factors.push('the payment amount is very close to the invoice amount');
  }
  if (params.score.customer >= 90) {
    factors.push('the payer name is highly similar to the customer name');
  } else if (params.score.customer >= 70) {
    factors.push('the payer name shows some similarity to the customer name');
  }
  if (params.score.date >= 85) {
    factors.push('the dates are close together');
  }

  if (factors.length > 0) {
    parts.push('because ' + factors.join(', ') + '.');
  }

  if (params.matchType === 'partial') {
    parts.push(' This is a partial match requiring review.');
  } else if (params.matchType === 'unmatched') {
    parts.push(' Low confidence match - manual review recommended.');
  }

  return parts.join(' ');
}

export {
  normalizeReference,
  normalizeName,
  calculateReferenceSimilarity,
  calculateAmountSimilarity,
  calculateDateSimilarity,
  calculateCustomerSimilarity,
  calculateDescriptionSimilarity,
};
