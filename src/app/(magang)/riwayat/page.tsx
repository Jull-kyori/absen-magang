import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Attendance } from '@/types/database.types'
import { getCurrentWIBDate } from '@/lib/utils/time'
import { RiwayatClient } from './riwayat-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Riwayat Absensi Pribadi - Bakesbangpol Kab. Ponorogo',
}

export default async function RiwayatPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const today = getCurrentWIBDate()
  const currentMonth = today.slice(0, 7) // "YYYY-MM"

  // Ambil seluruh riwayat absensi milik user ini
  const { data: attendances } = (await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', user.id)
    .order('tanggal', { ascending: false })) as { data: Attendance[] | null }

  return (
    <RiwayatClient
      attendances={attendances || []}
      currentMonth={currentMonth}
    />
  )
}
