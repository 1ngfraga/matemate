import { Operation, Question, Settings } from '../core/Types'

// ── Helpers ───────────────────────────────────────────────────────────────

function q(op: Operation, a: number, b: number, answer: number, display: string): Question {
  return { operation: op, operandA: a, operandB: b, answer, display }
}

function selectedTables(settings: Settings): number[] {
  return Object.entries(settings.multiplicationTables)
    .filter(([, v]) => v)
    .map(([k]) => Number(k))
}

// ── Pool generators ───────────────────────────────────────────────────────

/**
 * Addition: a ∈ [2, 49], b ∈ [2, 99-a], result ≤ 99
 * Skips trivial ±0 and single-digit + single-digit (too easy).
 */
export function additionPool(): Question[] {
  const pool: Question[] = []
  for (let a = 2; a <= 49; a++) {
    for (let b = 2; b <= 99 - a; b++) {
      pool.push(q(Operation.Addition, a, b, a + b, `${a} + ${b}`))
    }
  }
  return pool
}

/**
 * Subtraction: a ∈ [10, 99], b ∈ [1, a-1], result ≥ 1
 * Excludes trivial n − 0 and ensures two-digit minuend.
 */
export function subtractionPool(): Question[] {
  const pool: Question[] = []
  for (let a = 10; a <= 99; a++) {
    for (let b = 1; b < a; b++) {
      pool.push(q(Operation.Subtraction, a, b, a - b, `${a} − ${b}`))
    }
  }
  return pool
}

/**
 * Multiplication: table ∈ selectedTables × multiplier ∈ [1, 12]
 * Both orientations are included (a×b and b×a) for variety, unless a === b.
 */
export function multiplicationPool(settings: Settings): Question[] {
  const tables = selectedTables(settings)
  const pool: Question[] = []

  for (const t of tables) {
    for (let m = 1; m <= 12; m++) {
      pool.push(q(Operation.Multiplication, t, m, t * m, `${t} \xd7 ${m}`))
      // Add reversed orientation only when distinct
      if (m !== t) {
        pool.push(q(Operation.Multiplication, m, t, m * t, `${m} \xd7 ${t}`))
      }
    }
  }
  return pool
}

/**
 * Division: dividend = table × multiplier, divisor = table → result = multiplier
 * Guarantees exact integer division. Excludes ÷1 and trivial n÷n=1.
 */
export function divisionPool(settings: Settings): Question[] {
  const tables = selectedTables(settings)
  const pool: Question[] = []

  for (const t of tables) {
    for (let m = 2; m <= 12; m++) {
      if (m === 1) continue  // n ÷ n = 1 too trivial
      const dividend = t * m
      // divisor = t  → result = m
      pool.push(q(Operation.Division, dividend, t, m, `${dividend} \xf7 ${t}`))
      // Also offer dividing by the multiplier (if multiplier ≠ table)
      if (m !== t) {
        pool.push(q(Operation.Division, dividend, m, t, `${dividend} \xf7 ${m}`))
      }
    }
  }
  return pool
}

/** Return the appropriate pool for a given operation */
export function buildPool(operation: Operation, settings: Settings): Question[] {
  switch (operation) {
    case Operation.Addition:       return additionPool()
    case Operation.Subtraction:    return subtractionPool()
    case Operation.Multiplication: return multiplicationPool(settings)
    case Operation.Division:       return divisionPool(settings)
  }
}
