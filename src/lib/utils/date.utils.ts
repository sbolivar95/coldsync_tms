/**
 * Date utility functions
 */

/**
 * Checks if a date string is in the past (before today)
 * @param dateValue - ISO date string or null
 * @returns true if the date is before today, false otherwise
 */
export function isPastDate(dateValue: string | null): boolean {
  if (!dateValue) return false
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return date.getTime() < today.getTime()
}
