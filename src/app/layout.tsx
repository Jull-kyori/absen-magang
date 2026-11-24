import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Presensi Magang - Sistem Absensi Mahasiswa',
  description: 'Aplikasi Absensi Mahasiswa Magang Berbasis GPS & Validasi Waktu Server',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const theme = localStorage.getItem('theme'); if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark'); } catch (_) {} })()`,
          }}
        />
        {children}
      </body>
    </html>
  )
}
