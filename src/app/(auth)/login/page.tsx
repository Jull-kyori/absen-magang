'use client'

import { useActionState, useState } from 'react'
import { loginAction, registerAction, type AuthActionState } from './actions'
import { LogIn, UserPlus, Building2, AlertCircle, Shield, GraduationCap, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [loginState, loginFormAction, isLoginPending] = useActionState<AuthActionState | null, FormData>(loginAction, null)
  const [registerState, registerFormAction, isRegisterPending] = useActionState<AuthActionState | null, FormData>(registerAction, null)
  const [activeTab, setActiveTab] = useState<'magang' | 'admin'>('magang')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [namaInput, setNamaInput] = useState('')
  const [nimInput, setNimInput] = useState('')
  const [instansiInput, setInstansiInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')

  const isRegister = activeTab === 'magang' && mode === 'register'
  const isPending = isLoginPending || isRegisterPending
  const state = isRegister ? registerState : loginState

  const handleSelectRole = (role: 'magang' | 'admin') => {
    setActiveTab(role)
    setMode('login')
    if (role === 'admin') {
      setEmailInput('admin@magang.com')
      setPasswordInput('admin123')
    } else {
      setEmailInput('magang@magang.com')
      setPasswordInput('magang123')
    }
  }

  return (
    <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-w-md w-full mx-auto">
      {/* Top Animated Progress/Loading Bar saat isPending */}
      {isPending && (
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-100 overflow-hidden z-20">
          <div className="h-full bg-blue-600 animate-[loadingBar_1.5s_infinite_linear] origin-left" />
        </div>
      )}

      {/* Header Visual dengan Branding Bakesbangpol Ponorogo */}
      <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 p-7 text-white text-center relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20 shadow-inner">
          <Building2 className="w-7 h-7 text-white" />
        </div>
        <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950 mb-1">
          Pemerintah Kab. Ponorogo
        </div>
        <h1 className="text-xl font-extrabold tracking-tight">Presensi Magang</h1>
        <p className="text-blue-200 text-xs mt-0.5 font-medium">
          Badan Kesatuan Bangsa dan Politik (Bakesbangpol)
        </p>
      </div>

      {/* TAB PILIHAN PERAN (MAGANG VS ADMIN) */}
      <div className="px-6 pt-5">
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200/70">
          <button
            type="button"
            onClick={() => handleSelectRole('magang')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'magang'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Mahasiswa</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectRole('admin')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'admin'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Admin / Pembimbing</span>
          </button>
        </div>
      </div>

      {/* Form Area */}
      <div className="p-6">
        {(state?.error || state?.success) && (
          <div className={`mb-5 p-3.5 rounded-xl text-xs flex items-start gap-2.5 shadow-xs ${
            state.success
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className={`font-medium leading-relaxed ${state.success ? 'text-emerald-700' : ''}`}>
              {state.success || state.error}
            </span>
          </div>
        )}

        <form action={isRegister ? registerFormAction : loginFormAction} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  name="nama"
                  type="text"
                  required
                  value={namaInput}
                  onChange={(e) => setNamaInput(e.target.value)}
                  disabled={isPending}
                  placeholder="Nama lengkap mahasiswa"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    NIM
                  </label>
                  <input
                    name="nim"
                    type="text"
                    required
                    value={nimInput}
                    onChange={(e) => setNimInput(e.target.value)}
                    disabled={isPending}
                    placeholder="Nomor induk mahasiswa"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Instansi / Kampus
                  </label>
                  <input
                    name="instansi"
                    type="text"
                    required
                    value={instansiInput}
                    onChange={(e) => setInstansiInput(e.target.value)}
                    disabled={isPending}
                    placeholder="Nama kampus"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              {activeTab === 'admin' ? 'Email Pembimbing / Admin' : 'Email Mahasiswa Magang'}
            </label>
            <input
              name="email"
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              disabled={isPending}
              placeholder={activeTab === 'admin' ? 'admin@magang.com' : 'nama@email.com'}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Kata Sandi
            </label>
            <input
              name="password"
              type="password"
              required
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              disabled={isPending}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className={`w-full text-white py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-80 disabled:cursor-not-allowed mt-2 ${
              activeTab === 'admin'
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
            }`}
          >
            {isPending ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span className="tracking-wide">Memverifikasi & Masuk...</span>
              </>
            ) : (
              <>
                {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                <span>{isRegister ? 'Buat Akun Mahasiswa' : `Masuk sebagai ${activeTab === 'admin' ? 'Admin' : 'Mahasiswa'}`}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        {activeTab === 'magang' && (
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => setMode(isRegister ? 'login' : 'register')}
              disabled={isPending}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {isRegister ? 'Sudah punya akun? Masuk di sini' : 'Belum punya akun mahasiswa? Daftar di sini'}
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Portal resmi absensi Bakesbangpol Ponorogo. Pendaftaran mandiri hanya tersedia untuk mahasiswa.
          </p>
        </div>
      </div>
    </div>
  )
}
