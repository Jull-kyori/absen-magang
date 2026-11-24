'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { DailyLogbook } from '@/types/database.types'

type LogbookPayload = {
  tanggal: string
  kegiatan: string
  hasil: string
  kendala: string
  rencana_besok: string
}

export async function saveLogbookAction(
  payload: LogbookPayload
): Promise<{ success: boolean; message: string; data?: DailyLogbook }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, message: 'Sesi login telah berakhir. Silakan login kembali.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.tanggal)) return { success: false, message: 'Tanggal logbook tidak valid.' }
  if (payload.kegiatan.trim().length < 5) return { success: false, message: 'Kegiatan minimal 5 karakter.' }

  const { data, error } = await (supabase.from('daily_logbooks') as any)
    .upsert({
      user_id: user.id,
      tanggal: payload.tanggal,
      kegiatan: payload.kegiatan.trim(),
      hasil: payload.hasil.trim() || null,
      kendala: payload.kendala.trim() || null,
      rencana_besok: payload.rencana_besok.trim() || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,tanggal' })
    .select('*')
    .single()

  if (error) return { success: false, message: 'Gagal menyimpan logbook: ' + error.message }

  revalidatePath('/logbook')
  revalidatePath('/admin/dashboard')
  return { success: true, message: 'Logbook harian berhasil disimpan.', data: data as DailyLogbook }
}
