import { createClient } from '@/lib/supabase/server'
import { getCurrentWIBDate, calculateHaversineDistance } from '@/lib/utils/time'
import { UserProfile, Attendance, LeaveRequest, LocationSetting, DailyLogbook } from '@/types/database.types'
import { AdminDashboardClient, StudentAttendanceRow } from './admin-dashboard-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Dashboard Pemantauan - Admin Bakesbangpol',
}

const DEFAULT_LOCATION: LocationSetting = {
  id: 'default-bakesbangpol',
  nama: 'Bakesbangpol Kabupaten Ponorogo',
  lat: -7.869857,
  lng: 111.462192,
  radius_meter: 350,
  gunakan_radius: true,
  aktif: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

function shiftWIBDate(dateString: string, offset: number) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + offset)).toISOString().slice(0, 10)
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const today = getCurrentWIBDate()

  // 1. Ambil seluruh mahasiswa magang aktif
  const { data: students } = (await supabase
    .from('users')
    .select('*')
    .eq('role', 'magang')
    .eq('aktif', true)
    .order('nama', { ascending: true })) as { data: UserProfile[] | null }

  // 2. Ambil absensi hari ini
  const { data: todayAttendance } = (await supabase
    .from('attendance')
    .select('*')
    .eq('tanggal', today)) as { data: Attendance[] | null }

  // 3. Ambil data izin/sakit hari ini
  const { data: todayLeaves } = (await supabase
    .from('leave_requests')
    .select('*')
    .eq('tanggal', today)) as { data: LeaveRequest[] | null }

  // 4. Ambil data tujuh hari terakhir untuk grafik tren presensi
  const weekStart = shiftWIBDate(today, -6)
  const [{ data: weeklyAttendance }, { data: weeklyLeaves }] = await Promise.all([
    supabase.from('attendance').select('tanggal, status').gte('tanggal', weekStart).lte('tanggal', today),
    supabase.from('leave_requests').select('tanggal').gte('tanggal', weekStart).lte('tanggal', today),
  ]) as [
    { data: Pick<Attendance, 'tanggal' | 'status'>[] | null },
    { data: Pick<LeaveRequest, 'tanggal'>[] | null },
  ]

  // 5. Ambil lokasi kantor aktif
  const { data: locations } = (await supabase
    .from('locations')
    .select('*')
    .eq('aktif', true)
    .order('updated_at', { ascending: false })
    .limit(1)) as { data: LocationSetting[] | null }

  const activeLocation = locations?.[0] || DEFAULT_LOCATION

  // 6. Ambil logbook terbaru mahasiswa untuk monitoring pembimbing
  const { data: recentLogbooks } = (await supabase
    .from('daily_logbooks')
    .select('*, users(*)')
    .order('tanggal', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(12)) as { data: DailyLogbook[] | null }

  // 6. Gabungkan data per mahasiswa
  const studentList = students || []
  const attendanceList = todayAttendance || []
  const leaveList = todayLeaves || []

  const rows: StudentAttendanceRow[] = studentList.map((student) => {
    const att = attendanceList.find((a) => a.user_id === student.id) || null
    const leave = leaveList.find((l) => l.user_id === student.id) || null

    let distanceMasuk: number | null = null
    if (att && att.lat_masuk && att.lng_masuk && activeLocation) {
      distanceMasuk = calculateHaversineDistance(
        att.lat_masuk,
        att.lng_masuk,
        activeLocation.lat,
        activeLocation.lng
      )
    }

    return {
      student,
      attendance: att,
      leave,
      distanceMasuk,
    }
  })

  // Hitung statistik
  const totalStudents = studentList.length
  const hadirTepatWaktu = attendanceList.filter((a) => a.status === 'hadir').length
  const terlambat = attendanceList.filter((a) => a.status === 'terlambat').length
  const izinSakit = leaveList.length
  const totalProcessed = attendanceList.length + leaveList.length
  const belumAbsen = Math.max(0, totalStudents - totalProcessed)

  const weeklyStats = Array.from({ length: 7 }, (_, index) => {
    const date = shiftWIBDate(weekStart, index)
    const dayAttendance = (weeklyAttendance || []).filter((item) => item.tanggal === date)
    const dayLeaves = (weeklyLeaves || []).filter((item) => item.tanggal === date)
    const hadir = dayAttendance.filter((item) => item.status === 'hadir').length
    const terlambat = dayAttendance.filter((item) => item.status === 'terlambat').length
    const izin = dayLeaves.length

    return {
      date,
      label: `${date.slice(8, 10)}/${date.slice(5, 7)}`,
      hadir,
      terlambat,
      izin,
      belum: Math.max(0, totalStudents - hadir - terlambat - izin),
    }
  })

  return (
    <AdminDashboardClient
      rows={rows}
      todayDate={today}
      location={activeLocation}
      stats={{
        totalStudents,
        hadirTepatWaktu,
        terlambat,
        izinSakit,
        belumAbsen,
      }}
      weeklyStats={weeklyStats}
      recentLogbooks={recentLogbooks || []}
    />
  )
}
