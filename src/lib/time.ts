import { formatInTimeZone } from 'date-fns-tz'
import { differenceInMinutes, isPast, isFuture, addMinutes } from 'date-fns'

export const BD_TIMEZONE = 'Asia/Dhaka' // UTC+6

export function toBDTime(utcDate: string | Date): Date {
  return new Date(utcDate)
}

export function formatBDDate(utcDate: string | Date, fmt = 'd MMM, h:mm a') {
  return formatInTimeZone(new Date(utcDate), BD_TIMEZONE, fmt)
}

export function formatBDTime(utcDate: string | Date) {
  return formatInTimeZone(new Date(utcDate), BD_TIMEZONE, 'h:mm a')
}

export function formatBDFull(utcDate: string | Date) {
  return formatInTimeZone(new Date(utcDate), BD_TIMEZONE, 'EEEE, d MMMM · h:mm a')
}

export function formatBDDay(utcDate: string | Date) {
  return formatInTimeZone(new Date(utcDate), BD_TIMEZONE, 'd MMM')
}

export function isMatchLocked(kickoffUtc: string): boolean {
  // Predictions lock at kickoff
  return isPast(new Date(kickoffUtc))
}

export function isMatchSoon(kickoffUtc: string): boolean {
  const diff = differenceInMinutes(new Date(kickoffUtc), new Date())
  return diff > 0 && diff <= 60
}

export function getCountdown(kickoffUtc: string): string {
  const now = new Date()
  const kickoff = new Date(kickoffUtc)
  const diff = differenceInMinutes(kickoff, now)

  if (diff <= 0) return 'Kicked off'
  if (diff < 60) return `${diff}m`
  const hrs = Math.floor(diff / 60)
  const mins = diff % 60
  if (hrs < 24) return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`
  const days = Math.floor(hrs / 24)
  const remHrs = hrs % 24
  return remHrs > 0 ? `${days}d ${remHrs}h` : `${days}d`
}

export function groupMatchesByBDDate(matches: Array<{ kickoff_utc: string }>): Record<string, typeof matches> {
  return matches.reduce((acc, match) => {
    const day = formatInTimeZone(new Date(match.kickoff_utc), BD_TIMEZONE, 'yyyy-MM-dd')
    if (!acc[day]) acc[day] = []
    acc[day].push(match)
    return acc
  }, {} as Record<string, typeof matches>)
}

export function getTodayBD(): string {
  return formatInTimeZone(new Date(), BD_TIMEZONE, 'yyyy-MM-dd')
}
