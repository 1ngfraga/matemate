import { Operation, Question, Settings } from '../core/Types'
import { shuffle } from '../core/Random'
import { buildPool } from './Operations'

export class QuestionGenerator {
  /**
   * Build a session of `count` questions for the given operation.
   *
   * Strategy:
   *  1. Generate the full distinct pool for this operation + settings.
   *  2. Shuffle it.
   *  3. If pool ≥ count → slice first `count` (all unique).
   *  4. If pool < count → tile shuffled copies until we have enough,
   *     then slice — avoids infinite loops with tiny table selections.
   */
  static generateSession(
    operation: Operation,
    settings: Settings,
    count = 50,
  ): Question[] {
    const pool = buildPool(operation, settings)

    if (pool.length === 0) {
      // Fallback: shouldn't happen with valid settings, but guard anyway
      return []
    }

    if (pool.length >= count) {
      return shuffle([...pool]).slice(0, count)
    }

    // Pool smaller than needed — tile with independent shuffles
    const result: Question[] = []
    while (result.length < count) {
      result.push(...shuffle([...pool]))
    }
    return result.slice(0, count)
  }

  /** Pool size info — useful for debugging / tests */
  static poolSize(operation: Operation, settings: Settings): number {
    return buildPool(operation, settings).length
  }
}
