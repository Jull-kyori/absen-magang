import { ReactNode } from 'react'

export const metadata = {
  title: 'Login - Absensi Magang',
  description: 'Portal Masuk Absensi Mahasiswa Magang',
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
