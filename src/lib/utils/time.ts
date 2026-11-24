/**
 * Helper utilitas untuk zona waktu Asia/Jakarta (WIB)
 */

export function getCurrentWIBDate(): string {
  // Mengembalikan tanggal format YYYY-MM-DD sesuai waktu WIB
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(now)
}

export function getCurrentWIBTime(): string {
  // Mengembalikan jam format HH:mm:ss sesuai waktu WIB
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  return formatter.format(now)
}

export function formatIndonesianDate(dateString: string): string {
  if (!dateString) return '-'
  try {
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch {
    return dateString
  }
}

export function formatTimeShort(timeString: string | null): string {
  if (!timeString) return '--:--'
  // Ambil HH:mm dari format HH:mm:ss
  return timeString.slice(0, 5)
}

/**
 * Menghitung jarak Haversine (meter) di sisi client
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Radius bumi dalam meter
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}
