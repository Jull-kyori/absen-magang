import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DailyLogbook } from '@/types/database.types'
import { getCurrentWIBDate } from '@/lib/utils/time'
import { LogbookClient } from './logbook-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Logbook Harian - Presensi Magang',
}

export default async function LogbookPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: logbooks } = (await supabase
    .from('daily_logbooks')
    .select('*')
    .eq('user_id', user.id)
    .order('tanggal', { ascending: false })) as { data: DailyLogbook[] | null }

  return <LogbookClient logbooks={logbooks || []} today={getCurrentWIBDate()} />
}
