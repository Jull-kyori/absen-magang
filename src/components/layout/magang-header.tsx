'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserProfile } from '@/types/database.types'
import { Building2, CalendarCheck, History, LogOut, Shield } from 'lucide-react'
import { logoutAction } from '@/app/(auth)/login/actions'
import { useTransition } from 'react'

export function MagangHeader({ user, isAdmin }: { user: UserProfile; isAdmin?: boolean }) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  // Menu mahasiswa magang: Hanya Presensi dan Riwayat Absen
  const navLinks = [
    { name: 'Presensi Hari Ini', href: '/dashboard', icon: CalendarCheck },
    { name: 'Riwayat Absensi', href: '/riwayat', icon: History },
  ]

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      startTransition(async () => {
        await logoutAction()
      })
    }
  }

  return (
    <header className="liquid-header sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Identitas Instansi & Logo */}
        <div className="flex items-center gap-3">
          <div className="liquid-icon-bloom w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold text-slate-900 tracking-tight leading-tight">
                BAKESBANGPOL
              </h1>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                Kab. Ponorogo
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-none mt-0.5">
              Sistem Presensi Magang
            </p>
          </div>
        </div>

        {/* Navigasi Desktop (Presensi & Riwayat) */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
          {navLinks.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Info Mahasiswa & Tombol Admin Switcher */}
        <div className="flex items-center gap-2.5">
          {/* Tombol Pintasan ke Panel Admin (JIKA AKUN ADALAH ADMIN) */}
          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-500/25 transition-all"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Panel Admin →</span>
            </Link>
          )}

          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[140px]">
              {user.nama}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              {isAdmin ? 'Akun Admin' : (user.nim ? `NIM: ${user.nim}` : 'Mahasiswa')}
            </p>
          </div>

          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
            {user.nama?.charAt(0).toUpperCase() || 'M'}
          </div>

          <button
            onClick={handleLogout}
            disabled={isPending}
            title="Keluar dari akun"
            className="flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
          >
            {isPending ? (
              <div className="w-4 h-4 rounded-full border-2 border-red-500/30 border-t-red-600 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
