/**
 * Convertir des heures décimales en format HH:MM
 * Exemple: 3.42 => "3h25"
 */
export function decimalToHHMM(decimal: number): string {
  if (!decimal || decimal === 0) return "0h00"

  const hours = Math.floor(decimal)
  const minutes = Math.round((decimal - hours) * 60)

  return `${hours}h${minutes.toString().padStart(2, '0')}`
}

/**
 * Calculer la différence en heures entre deux temps au format HH:MM
 * Retourne un objet avec hours et minutes
 */
export function calculateTimeDifference(start: string, end: string): { hours: number; minutes: number; total: string } {
  const [startHour, startMin] = start.split(':').map(Number)
  const [endHour, endMin] = end.split(':').map(Number)

  const startTotalMin = startHour * 60 + startMin
  const endTotalMin = endHour * 60 + endMin

  const diffMin = endTotalMin - startTotalMin

  const hours = Math.floor(diffMin / 60)
  const minutes = diffMin % 60

  return {
    hours,
    minutes,
    total: `${hours}h${minutes.toString().padStart(2, '0')}`
  }
}

/**
 * Calculer les heures de retard par rapport à l'heure prévue
 */
export function calculateLateTime(actualStart: string, expectedStart: string): string {
  const [actualH, actualM] = actualStart.split(':').map(Number)
  const [expectedH, expectedM] = expectedStart.split(':').map(Number)

  const actualTotalMin = actualH * 60 + actualM
  const expectedTotalMin = expectedH * 60 + expectedM

  const lateMin = actualTotalMin - expectedTotalMin

  if (lateMin <= 0) return "0h00"

  const hours = Math.floor(lateMin / 60)
  const minutes = lateMin % 60

  return `${hours}h${minutes.toString().padStart(2, '0')}`
}

/**
 * Calculer les heures supplémentaires
 */
export function calculateOvertime(actualHours: string, expectedHours: string): string {
  const [actualH, actualM] = actualHours.split('h').map(s => parseInt(s) || 0)
  const [expectedH, expectedM] = expectedHours.split('h').map(s => parseInt(s) || 0)

  const actualTotalMin = actualH * 60 + actualM
  const expectedTotalMin = expectedH * 60 + expectedM

  const overtimeMin = actualTotalMin - expectedTotalMin

  if (overtimeMin <= 0) return "0h00"

  const hours = Math.floor(overtimeMin / 60)
  const minutes = overtimeMin % 60

  return `${hours}h${minutes.toString().padStart(2, '0')}`
}

/**
 * Vérifier si une date est aujourd'hui
 */
export function isToday(date: Date): boolean {
  const today = new Date()
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
}

/**
 * Vérifier si aujourd'hui est dans une période
 */
export function isTodayInPeriod(startDate: Date | string, endDate: Date | string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate

  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  return today >= start && today <= end
}
