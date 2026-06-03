import { Operation, Question, Settings } from '../core/Types'
import { randInt } from '../core/Random'

// ── Helpers ───────────────────────────────────────────────────────────────

function q(op: Operation, a: number, b: number, answer: number, display: string): Question {
  return { operation: op, operandA: a, operandB: b, answer, display }
}

function selectedTables(settings: Settings): number[] {
  return Object.entries(settings.multiplicationTables)
    .filter(([, v]) => v)
    .map(([k]) => Number(k))
}

// Range map for addition and subtraction operands
const DIGIT_RANGE: Record<number, [number, number]> = {
  1: [1,    9],
  2: [10,   99],
  3: [100,  999],
  4: [1000, 4999],
}

/**
 * For large operand ranges we can't enumerate all pairs — sample instead.
 * Returns up to `target` unique (a, b) questions.
 */
function samplePairs(
  op: Operation,
  minA: number, maxA: number,
  minB: number, maxB: number,
  target: number,
  make: (a: number, b: number) => Question,
): Question[] {
  const seen  = new Set<string>()
  const pool: Question[] = []
  let   tries = 0
  while (pool.length < target && tries < target * 8) {
    tries++
    const a = randInt(minA, maxA)
    const b = randInt(minB, maxB)
    const k = `${a},${b}`
    if (seen.has(k)) continue
    seen.add(k)
    pool.push(make(a, b))
  }
  return pool
}

// ── Addition ──────────────────────────────────────────────────────────────

/**
 * Levels 1-4 control the number of digits in each addend:
 *   1 → 1-9   2 → 10-99   3 → 100-999   4 → 1000-4999
 */
export function additionPool(settings: Settings): Question[] {
  const level      = settings.additionDigits ?? 1
  const [min, max] = DIGIT_RANGE[level]

  const make = (a: number, b: number) =>
    q(Operation.Addition, a, b, a + b, `${a} + ${b}`)

  if (level <= 2) {
    // Enumerate all — pool size ≤ 81 (level 1) or ≤ 8100 (level 2)
    const pool: Question[] = []
    for (let a = min; a <= max; a++)
      for (let b = min; b <= max; b++)
        pool.push(make(a, b))
    return pool
  }

  // Levels 3-4: sample to keep pool manageable
  return samplePairs(Operation.Addition, min, max, min, max, 300, make)
}

// ── Subtraction ───────────────────────────────────────────────────────────

/**
 * Levels 1-2:
 *   1 → both operands 1-9,  result ≥ 1
 *   2 → minuend 10-99,      result ≥ 1
 */
export function subtractionPool(settings: Settings): Question[] {
  const level      = settings.subtractionDigits ?? 1
  const [min, max] = DIGIT_RANGE[level]

  const pool: Question[] = []
  for (let a = Math.max(min, 2); a <= max; a++) {
    const bMin = level === 1 ? 1 : 1   // subtrahend always starts at 1
    for (let b = bMin; b < a; b++)
      pool.push(q(Operation.Subtraction, a, b, a - b, `${a} − ${b}`))
  }
  return pool
}

// ── Multiplication ────────────────────────────────────────────────────────

/**
 * Levels 1-2 control factor range:
 *   1 → selectedTables ∩ [1,9]  ×  multiplier [1,9]   (pure single-digit)
 *   2 → all selectedTables       ×  multiplier [1,12]  (includes 2-digit tables)
 */
export function multiplicationPool(settings: Settings): Question[] {
  const level      = settings.multiplicationDigits ?? 1
  const allTables  = selectedTables(settings)

  // Filter tables by digit level
  const tables = level === 1
    ? allTables.filter((t) => t <= 9)
    : allTables

  // Safety: if filter leaves nothing, fall back to all selected tables
  const useTables  = tables.length > 0 ? tables : allTables
  const maxMult    = level === 1 ? 9 : 12

  const pool: Question[] = []
  for (const t of useTables) {
    for (let m = 1; m <= maxMult; m++) {
      pool.push(q(Operation.Multiplication, t, m, t * m, `${t} \xd7 ${m}`))
      if (m !== t)
        pool.push(q(Operation.Multiplication, m, t, m * t, `${m} \xd7 ${t}`))
    }
  }
  return pool
}

// ── Division ──────────────────────────────────────────────────────────────

/**
 * Levels 1-2 control divisor range:
 *   1 → divisors from selectedTables ∩ [1,9],  quotient [2,9]
 *   2 → divisors from all selectedTables,       quotient [2,12]
 */
export function divisionPool(settings: Settings): Question[] {
  const level      = settings.divisionDigits ?? 1
  const allTables  = selectedTables(settings)

  const tables = level === 1
    ? allTables.filter((t) => t <= 9)
    : allTables

  const useTables = tables.length > 0 ? tables : allTables
  const maxQuot   = level === 1 ? 9 : 12

  const pool: Question[] = []
  for (const t of useTables) {
    for (let m = 2; m <= maxQuot; m++) {
      const dividend = t * m
      pool.push(q(Operation.Division, dividend, t, m, `${dividend} \xf7 ${t}`))
      if (m !== t)
        pool.push(q(Operation.Division, dividend, m, t, `${dividend} \xf7 ${m}`))
    }
  }
  return pool
}

/** Return the appropriate pool for a given operation */
export function buildPool(operation: Operation, settings: Settings): Question[] {
  switch (operation) {
    case Operation.Addition:       return additionPool(settings)
    case Operation.Subtraction:    return subtractionPool(settings)
    case Operation.Multiplication: return multiplicationPool(settings)
    case Operation.Division:       return divisionPool(settings)
  }
}
