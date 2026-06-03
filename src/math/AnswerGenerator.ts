import { AnswerChoice, Operation, Question } from '../core/Types'
import { shuffle } from '../core/Random'

export class AnswerGenerator {
  /**
   * Returns 3 shuffled AnswerChoices: 1 correct + 2 unique plausible distractors.
   * Distractors are chosen to look like realistic errors, not random large values.
   */
  static generate(question: Question): AnswerChoice[] {
    const distractors = this.pickDistractors(question, 2)
    const choices: AnswerChoice[] = [
      { value: question.answer, isCorrect: true },
      ...distractors.map((v) => ({ value: v, isCorrect: false })),
    ]
    return shuffle(choices)
  }

  // ── Distractor selection ────────────────────────────────────────────────

  private static pickDistractors(question: Question, count: number): number[] {
    const correct    = question.answer
    const rawCandidates = this.candidates(question)

    // Deduplicate, remove correct answer, keep only valid positive integers
    const seen = new Set<number>([correct])
    const valid: number[] = []
    for (const n of rawCandidates) {
      if (Number.isInteger(n) && n >= 0 && !seen.has(n)) {
        seen.add(n)
        valid.push(n)
      }
    }

    // Operation-specific candidates are already ordered from most to least plausible.
    // Pick randomly from the top slice to get variety across repeated questions.
    const poolSize = Math.min(valid.length, Math.max(count * 3, 6))
    const pool     = shuffle(valid.slice(0, poolSize))
    const chosen   = pool.slice(0, count)

    // Emergency fallback: if we still need more, add ±offset values
    let offset = 1
    while (chosen.length < count) {
      const candidates = [correct + offset, correct - offset].filter(
        (n) => n >= 0 && !seen.has(n),
      )
      for (const c of candidates) {
        if (chosen.length < count) { chosen.push(c); seen.add(c) }
      }
      offset++
    }

    return chosen
  }

  // ── Per-operation candidate generation ────────────────────────────────

  private static candidates(question: Question): number[] {
    const { operation: op, operandA: a, operandB: b, answer: c, addends } = question
    const list: number[] = []

    switch (op) {
      case Operation.Addition:
        if (addends && addends.length > 2) {
          // Multi-addend: forgot one addend, or off-by-one on one of them
          list.push(c + 1, c - 1, c + 2, c - 2, c + 5, c - 5, c + 10, c - 10)
          list.push(c - addends[0], c - addends[addends.length - 1])
        } else {
          list.push(
            a + (b + 1), a + (b - 1),
            (a + 1) + b, (a - 1) + b,
            c + 10, c - 10, c + 1, c - 1, c + 2, c - 2,
          )
        }
        break

      case Operation.Subtraction:
        list.push(
          a + b,                         // added instead of subtracted (very common)
          a - (b + 1),                   // b slightly too big
          a - (b - 1),                   // b slightly too small
          b - a > 0 ? b - a : -1,        // reversed operands (if positive)
          c + 1, c - 1,
          c + 10, c - 10,
          c + 2, c - 2,
        )
        break

      case Operation.Multiplication:
        list.push(
          a * (b + 1),                   // adjacent column (most natural error)
          a * (b - 1),                   // adjacent column below
          (a + 1) * b,                   // adjacent row
          (a - 1) * b,                   // adjacent row above
          c + a,                         // skipped one 'a' group
          c - a,
          c + b,                         // skipped one 'b' group
          c - b,
          c + 1, c - 1,
        )
        break

      case Operation.Division: {
        // c = a ÷ b — most natural errors are adjacent table entries
        list.push(
          c + 1, c - 1,                  // one entry up/down in the table
          c + 2, c - 2,
          b,                             // confuse divisor with quotient (e.g. 42÷7 → 7)
          a - b,                         // subtracted instead of divided
        )
        // Adjacent divisors (if they produce integers)
        if (b > 1 && a % (b - 1) === 0) list.push(a / (b - 1))
        if (b > 0 && a % (b + 1) === 0) list.push(a / (b + 1))
        break
      }
    }

    // General nearby safety-net (appended last so operation-specific ones come first)
    for (const d of [1, 2, 3, 5]) {
      list.push(c + d, c - d)
    }

    return list
  }
}
