import Link from 'next/link'
import { FileText, PlusCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Pengajuan Izin / Sakit - Presensi Magang',
}

export default function IzinPage() {
  return (
    <div className="liquid-page space-y-4">
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Perizinan & Sakit</h2>
          <p className="text-xs text-slate-500 mt-0.5">Kelola dan ajukan surat izin/sakit</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <FileText className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">Belum Ada Pengajuan Izin</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Fitur formulir pengajuan izin dan riwayat status persetujuan pembimbing akan aktif di Tahap (c).
          </p>
        </div>
      </div>
    </div>
  )
}
