'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserProfile } from '@/types/database.types'

export type AuthActionState = {
  error?: string
  success?: string
}

export async function loginAction(prevState: AuthActionState | null, formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email dan password wajib diisi.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Email atau password salah. Silakan coba lagi.' }
  }

  if (data?.user) {
    let { data: profile } = (await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()) as { data: UserProfile | null }

    // Jika email adalah admin (misal admin@...), otomatis jadikan role admin di database
    if (email.includes('admin') && profile?.role !== 'admin') {
      await (supabase.from('users') as any)
        .update({ role: 'admin' })
        .eq('id', data.user.id)
      
      if (profile) {
        profile.role = 'admin'
      }
    }

    if (profile && !profile.aktif) {
      await supabase.auth.signOut()
      return { error: 'Akun Anda dinonaktifkan oleh instansi.' }
    }

    if (profile?.role === 'admin' || email.includes('admin')) {
      redirect('/admin/dashboard')
    } else {
      redirect('/dashboard')
    }
  }

  redirect('/dashboard')
}

export async function registerAction(prevState: AuthActionState | null, formData: FormData) {
  const nama = (formData.get('nama') as string)?.trim()
  const nim = (formData.get('nim') as string)?.trim()
  const instansi = (formData.get('instansi') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!nama || !nim || !instansi || !email || !password) {
    return { error: 'Nama, NIM, instansi, email, dan kata sandi wajib diisi.' }
  }

  if (password.length < 6) {
    return { error: 'Kata sandi minimal terdiri dari 6 karakter.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nama,
        nim,
        instansi,
        role: 'magang',
      },
    },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return { error: 'Email tersebut sudah terdaftar. Silakan masuk.' }
    }

    return { error: 'Pendaftaran gagal: ' + error.message }
  }

  // Jika konfirmasi email Supabase dimatikan, user langsung memiliki sesi.
  if (data.session) {
    redirect('/dashboard')
  }

  return {
    success: 'Akun berhasil dibuat. Silakan cek email untuk konfirmasi sebelum masuk.',
  }
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
