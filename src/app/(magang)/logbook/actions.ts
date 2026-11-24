'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { DailyLogbook } from '@/types/database.types'

type LogbookPayload = {
  tanggal: string
  kegiatan: string
  hasil: string
  kendala: string
  buktiBase64?: string | null
}

export async function saveLogbookAction(
  payload: LogbookPayload
): Promise<{ success: boolean; message: string; data?: DailyLogbook }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, message: 'Sesi login telah berakhir. Silakan login kembali.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.tanggal)) return { success: false, message: 'Tanggal logbook tidak valid.' }
  if (payload.kegiatan.trim().length < 5) return { success: false, message: 'Kegiatan minimal 5 karakter.' }

  let buktiUrl: string | undefined
  if (payload.buktiBase64) {
    try {
      const match = payload.buktiBase64.match(/^data:image\/(\w+);base64,(.+)$/)
      if (!match) return { success: false, message: 'Format foto bukti tidak valid.' }
      const extension = match[1] === 'jpeg' ? 'jpg' : match[1]
      const buffer = Buffer.from(match[2], 'base64')
      if (buffer.byteLength > 5 * 1024 * 1024) return { success: false, message: 'Ukuran foto maksimal 5 MB.' }
      const fileName = `${user.id}/${payload.tanggal}-${Date.now()}.${extension}`
      const { error: uploadError } = await supabase.storage.from('logbook_photos').upload(fileName, buffer, {
        contentType: `image/${match[1]}`,
        upsert: true,
      })
      if (uploadError) return { success: false, message: 'Gagal mengunggah foto bukti: ' + uploadError.message }
      buktiUrl = supabase.storage.from('logbook_photos').getPublicUrl(fileName).data.publicUrl
    } catch {
      return { success: false, message: 'Foto bukti tidak dapat diproses.' }
    }
  }

  const logbookData: Record<string, unknown> = {
    user_id: user.id,
    tanggal: payload.tanggal,
    kegiatan: payload.kegiatan.trim(),
    hasil: payload.hasil.trim() || null,
    kendala: payload.kendala.trim() || null,
    updated_at: new Date().toISOString(),
  }
  if (buktiUrl) logbookData.bukti_url = buktiUrl

  const { data, error } = await (supabase.from('daily_logbooks') as any)
    .upsert({
      ...logbookData,
    }, { onConflict: 'user_id,tanggal' })
    .select('*')
    .single()

  if (error) return { success: false, message: 'Gagal menyimpan logbook: ' + error.message }

  revalidatePath('/logbook')
  revalidatePath('/admin/dashboard')
  return { success: true, message: 'Logbook harian berhasil disimpan.', data: data as DailyLogbook }
}
