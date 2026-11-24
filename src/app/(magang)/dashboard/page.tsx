import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Attendance, LocationSetting, WorkSetting } from '@/types/database.types'
import { getCurrentWIBDate } from '@/lib/utils/time'
import { AttendanceClient } from './attendance-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Presensi Hari Ini - Bakesbangpol Kab. Ponorogo',
}

const DEFAULT_LOCATION: LocationSetting = {
  id: 'default-bakesbangpol',
  nama: 'Bakesbangpol Kabupaten Ponorogo',
  lat: -7.868800,
  lng: 111.464500,
  radius_meter: 350, // Default 350 meter agar menjangkau area kantor
  aktif: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const DEFAULT_WORK_SETTING: WorkSetting = {
  id: 1,
  jam_masuk: '08:00:00',
  batas_terlambat: '08:30:00',
  jam_pulang: '17:00:00',
  updated_at: new Date().toISOString(),
}

export default async function MagangDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const todayDate = getCurrentWIBDate()

  // 1. Ambil absensi hari ini milik user
  const { data: attendance } = (await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', user.id)
    .eq('tanggal', todayDate)
    .maybeSingle()) as { data: Attendance | null }

  // 2. Ambil titik lokasi instansi yang aktif
  const { data: locations } = (await supabase
    .from('locations')
    .select('*')
    .eq('aktif', true)
    .order('updated_at', { ascending: false })
    .limit(1)) as { data: LocationSetting[] | null }

  const activeLocation = locations?.[0] || DEFAULT_LOCATION

  // 3. Ambil konfigurasi jam kerja
  const { data: workSetting } = (await supabase
    .from('work_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle()) as { data: WorkSetting | null }

  const activeWorkSetting = workSetting || DEFAULT_WORK_SETTING

  return (
    <AttendanceClient
      initialAttendance={attendance}
      location={activeLocation}
      workSetting={activeWorkSetting}
      todayDate={todayDate}
    />
  )
}
