import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { UserProfile, UserRole } from '@/types/database.types'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request)
  const path = request.nextUrl.pathname

  // Lewati file statis, aset, dan ikon
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.includes('.') ||
    path === '/favicon.ico'
  ) {
    return supabaseResponse
  }

  // Jika belum login dan mencoba akses selain /login
  if (!user && path !== '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Jika sudah login:
  if (user) {
    const { data: profile } = (await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()) as { data: UserProfile | null }

    // DETEKSI ADMIN: Berdasarkan email yang mengandung 'admin' ATAU role di database
    const isAdmin = user.email?.toLowerCase().includes('admin') || profile?.role === 'admin'
    const role: UserRole = isAdmin ? 'admin' : 'magang'
    const isAktif = profile?.aktif ?? true

    if (!isAktif) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'Akun Anda dinonaktifkan. Hubungi instansi.')
      return NextResponse.redirect(url)
    }

    // Jika di halaman /login atau root /, arahkan sesuai peran
    if (path === '/login' || path === '/') {
      const targetPath = role === 'admin' ? '/admin/dashboard' : '/dashboard'
      return NextResponse.redirect(new URL(targetPath, request.url))
    }

    // Jika magang mencoba akses area admin
    if (path.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Jika admin mengakses root dashboard magang secara langsung dari URL root
    // (Admin tetap boleh melihat /dashboard jika ingin simulasi presensi)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
