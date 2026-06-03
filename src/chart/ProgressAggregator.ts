import { GameResult, Operation } from '../core/Types'

export interface DayOperationData {
  attempts: number
  starred: boolean
}

export interface DayData {
  dateISO: string
  label: string
  byOperation: Partial<Record<Operation, DayOperationData>>
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
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const label = ES_DAYS[d.getDay()]
      const dayResults = byDate.get(iso) ?? []

      const byOperation: Partial<Record<Operation, DayOperationData>> = {}
      const grouped = new Map<Operation, GameResult[]>()
      dayResults.forEach((r) => {
        if (!grouped.has(r.operation)) grouped.set(r.operation, [])
        grouped.get(r.operation)!.push(r)
      })

      grouped.forEach((opResults, op) => {
        const unitSum = opResults.reduce(
          (sum, r) => sum + (r.answersPlayed / Math.max(1, r.currentTarget)),
          0,
        )
        byOperation[op] = {
          attempts: Math.ceil(unitSum),
          starred: opResults.some((r) => r.completed),
        }
      })

      days.push({ dateISO: iso, label, byOperation })
    }

    return days
  }

  static todayISO(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
}
