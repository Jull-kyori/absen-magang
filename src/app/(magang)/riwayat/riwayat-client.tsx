'use client'

import { useState } from 'react'
import { Attendance } from '@/types/database.types'
import { formatIndonesianDate, formatTimeShort } from '@/lib/utils/time'
import {
  History,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  Eye,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'

interface Props {
  attendances: Attendance[]
  currentMonth: string // "YYYY-MM"
}

export function RiwayatClient({ attendances: initialAttendances, currentMonth: initialMonth }: Props) {
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth)
  const [selectedPhoto, setSelectedPhoto] = useState<{
    url: string
    title: string
    time: string
  } | null>(null)

  // Filter attendance berdasarkan bulan yang dipilih (YYYY-MM)
  const filteredAttendances = initialAttendances.filter((a) =>
    a.tanggal.startsWith(selectedMonth)
  )

  // Hitung ringkasan statistik pribadi
  const totalHadir = filteredAttendances.length
  const tepatWaktu = filteredAttendances.filter((a) => a.status === 'hadir').length
  const terlambat = filteredAttendances.filter((a) => a.status === 'terlambat').length
  const rateTepatWaktu = totalHadir > 0 ? Math.round((tepatWaktu / totalHadir) * 100) : 100

  // Format Nama Bulan Indonesia (misal: November 2026)
  const [yearStr, monthStr] = selectedMonth.split('-')
  const monthDate = new Date(Number(yearStr), Number(monthStr) - 1, 1)
  const monthLabel = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(monthDate)

  // Handler Ganti Bulan (Next / Prev)
  const handleChangeMonth = (delta: number) => {
    const d = new Date(Number(yearStr), Number(monthStr) - 1 + delta, 1)
    const newYear = d.getFullYear()
    const newMonth = String(d.getMonth() + 1).padStart(2, '0')
    setSelectedMonth(`${newYear}-${newMonth}`)
  }

  return (
    <div className="liquid-page space-y-6">
      {/* Header Riwayat & Filter Bulan */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Riwayat Absensi Pribadi
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Bakesbangpol
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar catatan kehadiran Anda selama masa magang.
          </p>
        </div>

        {/* Pengatur Bulan (Bulan Sebelumnya - Bulan Sekarang - Bulan Berikutnya) */}
        <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/70 self-start sm:self-auto">
          <button
            onClick={() => handleChangeMonth(-1)}
            title="Bulan sebelumnya"
            className="p-1.5 rounded-xl hover:bg-white text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 text-xs font-bold text-slate-800 min-w-[130px] text-center">
            {monthLabel}
          </span>
          <button
            onClick={() => handleChangeMonth(1)}
            title="Bulan berikutnya"
            className="p-1.5 rounded-xl hover:bg-white text-slate-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ringkasan Metrik Kehadiran Bulan Ini */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Kehadiran</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">{totalHadir}</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Hari tercatat</span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Tepat Waktu</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2 font-mono">{tepatWaktu}</p>
          <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">Sebelum 08:30 WIB</span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Terlambat</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-2 font-mono">{terlambat}</p>
          <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">Lewat 08:30 WIB</span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Kedisiplinan</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-indigo-600 mt-2 font-mono">{rateTepatWaktu}%</p>
          <span className="text-[10px] text-indigo-600 font-medium mt-0.5 block">Rasio tepat waktu</span>
        </div>
      </div>

      {/* Tabel / Kartu Daftar Riwayat Presensi */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500">
            Daftar Presensi {monthLabel}
          </h2>
          <span className="text-xs font-semibold text-slate-400">
            {filteredAttendances.length} catatan
          </span>
        </div>

        {filteredAttendances.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredAttendances.map((att) => {
              const hasPhotoMasuk = !!att.foto_masuk_url
              const hasPhotoPulang = !!att.foto_pulang_url

              return (
                <div
                  key={att.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Tanggal & Status */}
                  <div className="flex items-start gap-3.5">
                    {/* Foto Selfie Masuk Preview */}
                    {hasPhotoMasuk ? (
                      <button
                        onClick={() =>
                          setSelectedPhoto({
                            url: att.foto_masuk_url!,
                            title: 'Bukti Foto Selfie Masuk',
                            time: `${att.jam_masuk?.slice(0, 5) || ''} WIB`,
                          })
                        }
                        className="group relative w-12 h-12 rounded-xl overflow-hidden border-2 border-blue-200 hover:border-blue-600 transition-all shrink-0 shadow-xs"
                      >
                        <img
                          src={att.foto_masuk_url!}
                          alt="Selfie"
                          className="w-full h-full object-cover scale-x-[-1] group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                        <Camera className="w-5 h-5" />
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {formatIndonesianDate(att.tanggal)}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                            att.status === 'hadir'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {att.status === 'hadir' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Tepat Waktu
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              Terlambat
                            </>
                          )}
                        </span>

                        {att.lat_masuk && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            GPS Valid
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Jam Masuk & Jam Pulang */}
                  <div className="flex items-center gap-6 self-end sm:self-center font-mono">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-sans font-semibold">
                        Masuk
                      </p>
                      <p className="text-sm font-bold text-slate-800">
                        {formatTimeShort(att.jam_masuk)} WIB
                      </p>
                    </div>

                    <div className="h-7 w-px bg-slate-200" />

                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-sans font-semibold">
                        Pulang
                      </p>
                      <p className="text-sm font-bold text-slate-800">
                        {att.jam_pulang ? `${formatTimeShort(att.jam_pulang)} WIB` : '--:--'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-10 text-center space-y-2">
            <History className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-sm">Tidak Ada Catatan Presensi</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Belum ada data kehadiran Anda yang tercatat untuk bulan {monthLabel}.
            </p>
          </div>
        )}
      </div>

      {/* Modal Zoom Foto Selfie */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden max-w-sm w-full shadow-2xl relative border border-slate-800">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold">{selectedPhoto.title}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{selectedPhoto.time}</p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-black aspect-4/3 flex items-center justify-center overflow-hidden">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="w-full h-full object-cover scale-x-[-1]"
              />
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="text-[11px] text-slate-400">Bukti tersimpan di server</span>
              <a
                href={selectedPhoto.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 text-[11px]"
              >
                <span>Buka Ukuran Asli</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
