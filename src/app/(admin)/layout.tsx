import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserProfile } from '@/types/database.types'
import {
  ShieldCheck,
  LogOut,
  Users,
  FileCheck,
  MapPin,
  BarChart3,
  ExternalLink,
  Building,
} from 'lucide-react'
import { logoutAction } from '@/app/(auth)/login/actions'
import Link from 'next/link'
import { ThemeToggle } from '@/components/layout/theme-toggle'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = (await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()) as { data: UserProfile | null }

  const isAdmin = user.email?.toLowerCase().includes('admin') || profile?.role === 'admin'

  // Jika bukan admin, arahkan ke portal magang
  if (!isAdmin) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Admin (Desktop) */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 border-r border-slate-800">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-white tracking-tight leading-tight">
                PANEL ADMIN
              </h1>
              <p className="text-[10px] text-slate-400">Bakesbangpol Ponorogo</p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <div className="p-3">
          <div className="px-3 py-2 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center gap-2 text-xs text-indigo-300">
            <Building className="w-4 h-4 shrink-0 text-indigo-400" />
            <span className="truncate text-[11px] font-medium">Pembimbing Instansi</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Ringkasan Dashboard</span>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
          >
            <div className="flex items-center gap-3">
              <ExternalLink className="w-4 h-4 text-blue-400" />
              <span>Lihat Presensi Magang</span>
            </div>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
              User
            </span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="truncate mr-2">
            <p className="text-xs font-bold text-white truncate">{profile?.nama || user.email?.split('@')[0]}</p>
            <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Keluar"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </aside>

      {/* Area Konten Utama Admin */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">{children}</main>
    </div>
  )
}
