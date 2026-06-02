import { GameResult, Operation } from '../core/Types'

export interface DayData {
  dateISO: string
  label: string
  percentCorrect: number | null
  gameCount: number
  byOperation: Partial<Record<Operation, number>>
}

const ES_DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']

export class ProgressAggregator {
  static getLast14Days(results: GameResult[]): DayData[] {
    const byDate = new Map<string, GameResult[]>()
    for (const r of results) {
      if (!byDate.has(r.dateISO)) byDate.set(r.dateISO, [])
      byDate.get(r.dateISO)!.push(r)
    }

    const days: DayData[] = []
    const now = new Date()

    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      // Use noon to avoid DST edge cases
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const label = ES_DAYS[d.getDay()]
      const dayResults = byDate.get(iso) ?? []

      if (dayResults.length === 0) {
        days.push({ dateISO: iso, label, percentCorrect: null, gameCount: 0, byOperation: {} })
      } else {
        const avg = Math.round(
          dayResults.reduce((sum, r) => sum + r.percentCorrect, 0) / dayResults.length,
        )
        const byOp: Partial<Record<Operation, number>> = {}
        for (const r of dayResults) {
          // If multiple games for same operation, take last
          byOp[r.operation] = r.percentCorrect
        }
        days.push({ dateISO: iso, label, percentCorrect: avg, gameCount: dayResults.length, byOperation: byOp })
      }
    }

    return days
  }

  static todayISO(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
}
