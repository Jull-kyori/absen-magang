'use server'

import { createClient } from '@/lib/supabase/server'
import { Attendance, LocationSetting, WorkSetting, UserProfile } from '@/types/database.types'
import { getCurrentWIBDate, getCurrentWIBTime, calculateHaversineDistance } from '@/lib/utils/time'
import { revalidatePath } from 'next/cache'

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

/**
 * Server Action KHUSUS ADMIN untuk mengubah titik lokasi kantor
 */
export async function calibrateOfficeLocationAction(payload: {
  lat: number
  lng: number
  radius_meter?: number
  gunakan_radius?: boolean
}): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'Sesi login tidak sah.' }
    }

    // Validasi Keamanan: Pastikan yang mengubah lokasi adalah ADMIN
    const { data: profile } = (await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()) as { data: UserProfile | null }

    const isAdmin = profile?.role === 'admin' || user.email?.toLowerCase().includes('admin')
    if (!isAdmin) {
      return { success: false, message: 'Akses ditolak: Hanya Admin/Pembimbing yang berhak mengatur lokasi instansi.' }
    }

    const radius = payload.radius_meter || 350
    const gunakanRadius = payload.gunakan_radius !== false

    if (gunakanRadius && (!Number.isInteger(radius) || radius < 50 || radius > 5000)) {
      return { success: false, message: 'Radius harus berupa angka bulat antara 50 sampai 5.000 meter.' }
    }

    const { data: existing } = (await supabase
      .from('locations')
      .select('id')
      .eq('aktif', true)
      .order('updated_at', { ascending: false })
      .limit(1)) as { data: { id: string }[] | null }

    if (existing && existing.length > 0) {
      const { data: updatedLocation, error } = await (supabase.from('locations') as any)
        .update({
          nama: 'Bakesbangpol Kabupaten Ponorogo',
          lat: payload.lat,
          lng: payload.lng,
          radius_meter: radius,
          gunakan_radius: gunakanRadius,
          aktif: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing[0].id)
        .select('id, radius_meter, gunakan_radius')
        .single()
      if (error) {
        return { success: false, message: 'Gagal menyimpan radius: ' + error.message }
      }
      if (!updatedLocation || updatedLocation.radius_meter !== radius || updatedLocation.gunakan_radius !== gunakanRadius) {
        return { success: false, message: 'Radius tidak berubah di database. Periksa policy RLS atau jalankan ulang schema.sql.' }
      }
    } else {
      const { data: insertedLocation, error } = await (supabase.from('locations') as any).insert({
        nama: 'Bakesbangpol Kabupaten Ponorogo',
        lat: payload.lat,
        lng: payload.lng,
        radius_meter: radius,
        gunakan_radius: gunakanRadius,
        aktif: true,
      })
        .select('id, radius_meter, gunakan_radius')
        .single()
      if (error) {
        return { success: false, message: 'Gagal menyimpan radius: ' + error.message }
      }
      if (!insertedLocation || insertedLocation.radius_meter !== radius || insertedLocation.gunakan_radius !== gunakanRadius) {
        return { success: false, message: 'Radius tidak berhasil dibuat di database. Periksa policy RLS atau jalankan ulang schema.sql.' }
      }
    }

    revalidatePath('/dashboard')
    revalidatePath('/admin/dashboard')
    return {
      success: true,
      message: gunakanRadius
        ? `Titik kantor Bakesbangpol berhasil diperbarui oleh Admin (Radius: ${radius}m).`
        : 'Batas radius presensi berhasil dinonaktifkan. Validasi lokasi tetap dicatat.',
    }
  } catch (err: any) {
    return {
      success: false,
      message: 'Gagal mengkalibrasi lokasi: ' + (err.message || 'Error server'),
    }
  }
}

export async function submitAttendanceAction(payload: {
  lat: number
  lng: number
  fotoBase64?: string | null
  jenis: 'masuk' | 'pulang'
}): Promise<{ success: boolean; message: string; data?: Attendance }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: 'Sesi login telah berakhir. Silakan login kembali.' }
    }

    // 1. Ambil Pengaturan Lokasi Aktif (dengan Fallback Akurat Bakesbangpol Ponorogo)
    const { data: locations } = (await supabase
      .from('locations')
      .select('*')
      .eq('aktif', true)
      .order('updated_at', { ascending: false })
      .limit(1)) as { data: LocationSetting[] | null }

    const activeLocation = locations?.[0] || DEFAULT_LOCATION

    // 2. Validasi Jarak Geofencing di Server (Anti-Spoofing)
    const distanceMeter = calculateHaversineDistance(
      payload.lat,
      payload.lng,
      activeLocation.lat,
      activeLocation.lng
    )

    if (activeLocation.gunakan_radius !== false && distanceMeter > activeLocation.radius_meter) {
      return {
        success: false,
        message: `Absen ditolak. Jarak Anda (${distanceMeter} m) melebihi batas radius kantor (${activeLocation.radius_meter} m).`,
      }
    }

    // 3. Waktu Server Realtime (Asia/Jakarta)
    const today = getCurrentWIBDate()
    const currentTime = getCurrentWIBTime()

    // 4. Ambil Jam Kerja
    const { data: workSetting } = (await supabase
      .from('work_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()) as { data: WorkSetting | null }

    const batasTerlambat = workSetting?.batas_terlambat || '08:30:00'

    // 5. Cek Absensi Hari Ini
    const { data: existingAttendance } = (await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .eq('tanggal', today)
      .maybeSingle()) as { data: Attendance | null }

    // 6. Upload Foto Selfie jika ada
    let fotoUrl: string | null = null
    if (payload.fotoBase64) {
      try {
        const base64Data = payload.fotoBase64.replace(/^data:image\/\w+;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')
        const fileName = `${user.id}/${today}-${payload.jenis}-${Date.now()}.jpg`

        const { error: uploadError } = await supabase.storage
          .from('attendance_photos')
          .upload(fileName, buffer, {
            contentType: 'image/jpeg',
            upsert: true,
          })

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('attendance_photos')
            .getPublicUrl(fileName)
          fotoUrl = publicUrlData.publicUrl
        }
      } catch (err) {
        console.error('Gagal upload foto selfie:', err)
      }
    }

    if (payload.jenis === 'masuk') {
      if (existingAttendance && existingAttendance.jam_masuk) {
        return { success: false, message: 'Anda sudah melakukan absen masuk hari ini.' }
      }

      const status = currentTime > batasTerlambat ? 'terlambat' : 'hadir'

      const insertData = {
        user_id: user.id,
        tanggal: today,
        jam_masuk: currentTime,
        lat_masuk: payload.lat,
        lng_masuk: payload.lng,
        foto_masuk_url: fotoUrl,
        status,
      }

      const { data: newRecord, error } = (await (supabase.from('attendance') as any)
        .insert(insertData)
        .select()
        .single()) as { data: Attendance | null; error: any }

      if (error) {
        return { success: false, message: 'Gagal mencatat absen masuk: ' + error.message }
      }

      revalidatePath('/dashboard')
      return {
        success: true,
        message:
          status === 'terlambat'
            ? `Absen masuk berhasil pada ${currentTime.slice(0, 5)} WIB (Status: Terlambat)`
            : `Absen masuk berhasil pada ${currentTime.slice(0, 5)} WIB (Tepat Waktu)`,
        data: newRecord || undefined,
      }
    } else {
      // Absen Pulang
      if (!existingAttendance || !existingAttendance.jam_masuk) {
        return { success: false, message: 'Anda belum melakukan absen masuk hari ini.' }
      }

      if (existingAttendance.jam_pulang) {
        return { success: false, message: 'Anda sudah melakukan absen pulang hari ini.' }
      }

      const updateData = {
        jam_pulang: currentTime,
        lat_pulang: payload.lat,
        lng_pulang: payload.lng,
        foto_pulang_url: fotoUrl || existingAttendance.foto_pulang_url,
      }

      const { data: updatedRecord, error } = (await (supabase.from('attendance') as any)
        .update(updateData)
        .eq('id', existingAttendance.id)
        .select()
        .single()) as { data: Attendance | null; error: any }

      if (error) {
        return { success: false, message: 'Gagal mencatat absen pulang: ' + error.message }
      }

      revalidatePath('/dashboard')
      return {
        success: true,
        message: `Absen pulang berhasil pada ${currentTime.slice(0, 5)} WIB. Sampai jumpa besok!`,
        data: updatedRecord || undefined,
      }
    }
  } catch (error: any) {
    return { success: false, message: error.message || 'Terjadi kesalahan sistem server.' }
  }
}
