'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarCheck, History, LogOut } from 'lucide-react'
import { logoutAction } from '@/app/(auth)/login/actions'
import { useTransition } from 'react'

export function BottomNav() {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  // Hanya Presensi dan Riwayat
  const navItems = [
    {
      name: 'Presensi',
      href: '/dashboard',
      icon: CalendarCheck,
    },
    {
      name: 'Riwayat Absen',
      href: '/riwayat',
      icon: History,
    },
  ]

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      startTransition(async () => {
        await logoutAction()
      })
    }
  }

  return (
    // Hanya tampil di layar HP/ponsel
    <nav className="liquid-nav md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-blue-50 scale-105' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{item.name}</span>
            </Link>
          )
        })}

        <button
          onClick={handleLogout}
          disabled={isPending}
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-red-600 transition-colors"
        >
          <div className="p-1 rounded-xl">
            {isPending ? (
              <div className="w-5 h-5 rounded-full border-2 border-red-500/30 border-t-red-600 animate-spin" />
            ) : (
              <LogOut className="w-5 h-5 stroke-2" />
            )}
          </div>
          <span className="text-[11px] mt-0.5 tracking-tight">Keluar</span>
        </button>
      </div>
    </nav>
  )
}
