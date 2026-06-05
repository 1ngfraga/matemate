import { Operation, Question, Settings } from '../core/Types'
import { randInt, shuffle } from '../core/Random'

// ── Helpers ───────────────────────────────────────────────────────────────

function makeQ(
  op: Operation, a: number, b: number,
  answer: number, display: string,
  addends?: number[],
): Question {
  return { operation: op, operandA: a, operandB: b, answer, display, addends }
}

function selectedTables(tableMap: Record<number, boolean>): number[] {
  return Object.entries(tableMap)
    .filter(([k, v]) => v && Number(k) >= 1 && Number(k) <= 10)
    .map(([k]) => Number(k))
}

// ── ADDITION — multi-addend ───────────────────────────────────────────────
// additionOperandDigits: 1 = numbers 1-9 | 2 = numbers 10-99
// additionNumAddends:    2-5 = how many numbers to sum

export function additionPool(settings: Settings): Question[] {
  const level  = settings.additionOperandDigits ?? 1
  const count  = settings.additionNumAddends    ?? 2
  const [min, max] = level === 1 ? [1, 9] : [10, 99]

  const makeAddends = (nums: number[]): Question => {
    const sum     = nums.reduce((a, b) => a + b, 0)
    const display = nums.join(' + ')
    return makeQ(Operation.Addition, nums[0], nums[1], sum, display, nums)
  }

  if (count === 2) {
    // Enumerate all pairs — manageable pool size
    const pool: Question[] = []
    for (let a = min; a <= max; a++)
      for (let b = min; b <= max; b++)
        pool.push(makeAddends([a, b]))
    return pool
  }

  // 3-5 addends: random sampling (avoids huge enumeration)
  const seen  = new Set<string>()
  const pool: Question[] = []
  const target = 300

  while (pool.length < target) {
    const nums = Array.from({ length: count }, () => randInt(min, max))
    const key  = nums.join(',')
    if (seen.has(key)) continue
    seen.add(key)
    pool.push(makeAddends(nums))
  }
  return pool
}

// ── SUBTRACTION ───────────────────────────────────────────────────────────

export function subtractionPool(settings: Settings): Question[] {
  const level      = settings.subtractionDigits ?? 1
  const [min, max] = level === 1 ? [2, 9] : [10, 99]

  const pool: Question[] = []
  for (let a = min; a <= max; a++)
    for (let b = 1; b < a; b++)
      pool.push(makeQ(Operation.Subtraction, a, b, a - b, `${a} − ${b}`))
  return pool
}

// ── MULTIPLICATION ────────────────────────────────────────────────────────
// Selected tables (1-10) × multiplier (1-10).
// Display: TABLE × multiplier  (table is always first number).

export function multiplicationPool(settings: Settings): Question[] {
  const tables = selectedTables(settings.multiplicationTables)
  const use    = tables.length > 0 ? tables : [5]   // safety fallback

  const style = settings.multiplicationStyle ?? 'signo'
  const pool: Question[] = []
  for (const t of use)
    for (let m = 1; m <= 10; m++) {
      const display =
        style === 'punto'      ? `${t} · ${m}` :
        style === 'parentesis' ? `(${t})(${m})` :
                                 `${t} × ${m}`
      pool.push(makeQ(Operation.Multiplication, t, m, t * m, display))
    }
  return pool
}

// ── DIVISION ──────────────────────────────────────────────────────────────
// Exact division. Divisor from selected tables (1-10), quotient 2-10.

export function divisionPool(settings: Settings): Question[] {
  const tables = selectedTables(settings.divisionTables)
  const use    = tables.length > 0 ? tables : [5]

  const style = settings.divisionStyle ?? 'signo'
  const pool: Question[] = []
  for (const t of use)
    for (let m = 2; m <= 10; m++) {
      const dividend = t * m
      const display =
        style === 'fraccion' ? `${dividend}/${t}` :
        style === 'cajita'   ? `${dividend} ÷ ${t}` : // GameScreen overrides cajita rendering
                               `${dividend} ÷ ${t}`
      pool.push(makeQ(Operation.Division, dividend, t, m, display))
    }
  return pool
}

// ── Router ────────────────────────────────────────────────────────────────

export function buildPool(operation: Operation, settings: Settings): Question[] {
  switch (operation) {
    case Operation.Addition:       return additionPool(settings)
    case Operation.Subtraction:    return subtractionPool(settings)
    case Operation.Multiplication: return multiplicationPool(settings)
    case Operation.Division:       return divisionPool(settings)
  }
}
