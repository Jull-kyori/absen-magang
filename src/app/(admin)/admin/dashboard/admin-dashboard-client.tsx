'use client'

import { useState, useTransition } from 'react'
import { UserProfile, Attendance, LeaveRequest, LocationSetting, DailyLogbook } from '@/types/database.types'
import { formatIndonesianDate, formatTimeShort, calculateHaversineDistance } from '@/lib/utils/time'
import { calibrateOfficeLocationAction } from '@/app/(magang)/dashboard/actions'
import {
  Users,
  UserCheck,
  Clock,
  AlertCircle,
  FileText,
  Search,
  Filter,
  Eye,
  Camera,
  MapPin,
  X,
  ExternalLink,
  Building,
  CheckCircle2,
  Calendar,
  Save,
} from 'lucide-react'

export interface StudentAttendanceRow {
  student: UserProfile
  attendance: Attendance | null
  leave: LeaveRequest | null
  distanceMasuk: number | null
}

export interface WeeklyAttendanceStat {
  date: string
  label: string
  hadir: number
  terlambat: number
  izin: number
  belum: number
}

interface Props {
  rows: StudentAttendanceRow[]
  todayDate: string
  location: LocationSetting | null
  stats: {
    totalStudents: number
    hadirTepatWaktu: number
    terlambat: number
    izinSakit: number
    belumAbsen: number
  }
  weeklyStats: WeeklyAttendanceStat[]
  recentLogbooks: DailyLogbook[]
}

export function AdminDashboardClient({ rows, todayDate, location, stats, weeklyStats, recentLogbooks }: Props) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [radius, setRadius] = useState(String(location?.radius_meter ?? 350))
  const [locationMessage, setLocationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSavingLocation, startSavingLocation] = useTransition()
  const [selectedPhoto, setSelectedPhoto] = useState<{
    url: string
    title: string
    studentName: string
    time: string
    coords?: { lat: number | null; lng: number | null }
  } | null>(null)

  const handleSaveRadius = () => {
    const radiusMeter = Number(radius)

    if (!Number.isInteger(radiusMeter) || radiusMeter < 50 || radiusMeter > 5000) {
      setLocationMessage({ type: 'error', text: 'Radius harus berupa angka bulat antara 50 sampai 5.000 meter.' })
      return
    }

    if (!location) {
      setLocationMessage({ type: 'error', text: 'Lokasi kantor belum tersedia.' })
      return
    }

    startSavingLocation(async () => {
      const result = await calibrateOfficeLocationAction({
        lat: location.lat,
        lng: location.lng,
        radius_meter: radiusMeter,
      })

      setLocationMessage({
        type: result.success ? 'success' : 'error',
        text: result.message,
      })
    })
  }

  // Filter rows
  const filteredRows = rows.filter((row) => {
    const matchSearch =
      row.student.nama.toLowerCase().includes(search.toLowerCase()) ||
      (row.student.nim && row.student.nim.toLowerCase().includes(search.toLowerCase())) ||
      (row.student.instansi && row.student.instansi.toLowerCase().includes(search.toLowerCase()))

    if (!matchSearch) return false

    if (filterStatus === 'all') return true
    if (filterStatus === 'hadir') return row.attendance?.status === 'hadir'
    if (filterStatus === 'terlambat') return row.attendance?.status === 'terlambat'
    if (filterStatus === 'izin') return !!row.leave
    if (filterStatus === 'belum') return !row.attendance && !row.leave
    return true
  })

  const chartMax = Math.max(stats.totalStudents, ...weeklyStats.map((item) => item.hadir + item.terlambat + item.izin), 1)
  const chartHeight = 150
  const chartTop = 18
  const chartBottom = 190
  const chartWidth = 700
  const groupWidth = chartWidth / Math.max(weeklyStats.length, 1)
  const todayProcessed = stats.hadirTepatWaktu + stats.terlambat + stats.izinSakit
  const todayRate = stats.totalStudents > 0 ? Math.round((todayProcessed / stats.totalStudents) * 100) : 0
  const peakDay = weeklyStats.reduce(
    (peak, item) => (item.hadir + item.terlambat > peak.total ? { label: item.label, total: item.hadir + item.terlambat } : peak),
    { label: '-', total: 0 }
  )

  return (
    <div className="liquid-page space-y-4">
      {/* Header Halaman Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Pemantauan Presensi Harian
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Live Monitoring
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Badan Kesatuan Bangsa dan Politik (Bakesbangpol) Kabupaten Ponorogo
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200/60 text-xs text-slate-600 font-semibold">
          <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{formatIndonesianDate(todayDate)}</span>
        </div>
      </div>

      {/* Pengaturan Radius GPS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Pengaturan Radius Presensi</h2>
            <p className="text-xs text-slate-500 mt-1">
              Tentukan jarak maksimum mahasiswa dari titik {location?.nama || 'kantor'} saat melakukan presensi.
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Titik kantor: {location?.lat.toFixed(6)}, {location?.lng.toFixed(6)}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-2">
            <div>
              <label htmlFor="radius-meter" className="block text-[11px] font-bold text-slate-600 mb-1.5">
                Radius dalam meter
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="radius-meter"
                  type="number"
                  min={50}
                  max={5000}
                  step={1}
                  value={radius}
                  onChange={(event) => setRadius(event.target.value)}
                  disabled={isSavingLocation}
                  className="w-32 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-50"
                />
                <span className="text-xs font-semibold text-slate-500">meter</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSaveRadius}
              disabled={isSavingLocation}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSavingLocation ? (
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Simpan Radius
            </button>
          </div>
        </div>

        {locationMessage && (
          <p className={`mt-3 text-xs font-semibold ${locationMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {locationMessage.text}
          </p>
        )}
      </div>

      {/* Kartu Ringkasan Metrik Statistik */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Magang</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">{stats.totalStudents}</p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Mahasiswa aktif</span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Tepat Waktu</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2 font-mono">{stats.hadirTepatWaktu}</p>
          <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">Sebelum 08:30 WIB</span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Terlambat</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-2 font-mono">{stats.terlambat}</p>
          <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">Lewat 08:30 WIB</span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Izin / Sakit</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-indigo-600 mt-2 font-mono">{stats.izinSakit}</p>
          <span className="text-[10px] text-indigo-600 font-medium mt-0.5 block">Dengan surat keterangan</span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Belum Absen</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-extrabold text-rose-600 mt-2 font-mono">{stats.belumAbsen}</p>
          <span className="text-[10px] text-rose-600 font-medium mt-0.5 block">Belum ada catatan</span>
        </div>
      </div>

      {/* Grafik Tren Presensi */}
      <section className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs animate-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Tren Presensi 7 Hari</h2>
            <p className="text-xs text-slate-500 mt-1">Perbandingan hadir, terlambat, izin/sakit, dan belum absen.</p>
          </div>
          <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Hadir</span>
            <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-amber-500" />Terlambat</span>
            <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-indigo-500" />Izin</span>
            <span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-slate-200" />Belum</span>
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_220px] gap-4 items-center">
          <div className="overflow-x-auto" role="img" aria-label="Grafik tren presensi tujuh hari terakhir">
          <svg viewBox="0 0 700 220" className="w-full min-w-[520px] h-44" preserveAspectRatio="none">
            {[0, 0.5, 1].map((ratio) => {
              const y = chartTop + chartHeight * (1 - ratio)
              return (
                <g key={ratio}>
                  <line x1="34" y1={y} x2="690" y2={y} stroke="currentColor" className="text-slate-200" strokeDasharray="3 5" />
                  <text x="24" y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px]">{Math.round(chartMax * ratio)}</text>
                </g>
              )
            })}
            {weeklyStats.map((item, index) => {
              const x = 34 + index * groupWidth + groupWidth * 0.25
              const width = groupWidth * 0.5
              const segments = [
                { value: item.hadir, color: 'fill-emerald-500', label: 'Hadir' },
                { value: item.terlambat, color: 'fill-amber-500', label: 'Terlambat' },
                { value: item.izin, color: 'fill-indigo-500', label: 'Izin/sakit' },
                { value: item.belum, color: 'fill-slate-200', label: 'Belum absen' },
              ]
              let currentY = chartBottom
              return (
                <g key={item.date}>
                  <title>{`${item.label}: ${item.hadir} hadir, ${item.terlambat} terlambat, ${item.izin} izin, ${item.belum} belum absen`}</title>
                  {segments.map((segment) => {
                    const height = (segment.value / chartMax) * chartHeight
                    currentY -= height
                    return height > 0 ? (
                      <rect key={segment.label} x={x} y={currentY} width={width} height={height} rx="7" className={`${segment.color} transition-all duration-500`} />
                    ) : null
                  })}
                  <text x={x + width / 2} y="210" textAnchor="middle" className="fill-slate-500 text-[10px] font-semibold">{item.label}</text>
                </g>
              )
            })}
          </svg>
          </div>
          <aside className="rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-slate-900 p-4 text-white shadow-lg shadow-indigo-500/15">
            <p className="text-[10px] uppercase tracking-widest text-blue-200 font-bold">Insight cepat</p>
            <p className="text-3xl font-extrabold font-mono mt-2">{todayRate}%</p>
            <p className="text-[11px] text-blue-100 mt-0.5">presensi tercatat hari ini</p>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mt-3">
              <div className="h-full rounded-full bg-emerald-300 transition-all duration-700" style={{ width: `${Math.min(todayRate, 100)}%` }} />
            </div>
            <div className="mt-4 pt-3 border-t border-white/15 text-[11px] text-blue-100 space-y-2">
              <div className="flex items-center justify-between gap-3"><span>Hari teraktif</span><strong className="text-white">{peakDay.label}</strong></div>
              <div className="flex items-center justify-between gap-3"><span>Radius aktif</span><strong className="text-white">{location?.radius_meter ?? 350} m</strong></div>
            </div>
          </aside>
        </div>
      </section>

      {/* Monitoring Logbook Mahasiswa */}
      <section className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden animate-fade-up">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Logbook Terbaru Mahasiswa</h2>
            <p className="text-xs text-slate-500 mt-1">Pantau kegiatan dan progres magang yang terakhir diperbarui.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 rounded-xl w-fit">
            <FileText className="w-3.5 h-3.5" /> {recentLogbooks.length} catatan terbaru
          </span>
        </div>
        {recentLogbooks.length > 0 ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
            {recentLogbooks.map((logbook) => (
              <article key={logbook.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">{logbook.users?.nama?.charAt(0).toUpperCase() || 'M'}</div>
                    <div className="min-w-0"><p className="text-xs font-bold text-slate-900 truncate">{logbook.users?.nama || 'Mahasiswa'}</p><p className="text-[10px] text-slate-400 truncate">{logbook.users?.nim || 'Tanpa NIM'}</p></div>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 whitespace-nowrap">{formatIndonesianDate(logbook.tanggal)}</span>
                </div>
                <p className="text-xs font-bold text-slate-800 mt-3 line-clamp-3">{logbook.kegiatan}</p>
                <div className="mt-3 pt-3 border-t border-slate-200/70 space-y-1.5 text-[11px] text-slate-500">
                  <p><span className="font-bold text-slate-700">Hasil:</span> {logbook.hasil || 'Belum diisi'}</p>
                  {logbook.kendala && <p><span className="font-bold text-slate-700">Kendala:</span> {logbook.kendala}</p>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400"><FileText className="w-7 h-7 mx-auto mb-2 text-slate-300" /><p className="text-xs">Belum ada logbook dari mahasiswa.</p></div>
        )}
      </section>

      {/* Filter & Pencarian Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, NIM, atau universitas..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'hadir', label: 'Tepat Waktu' },
            { id: 'terlambat', label: 'Terlambat' },
            { id: 'izin', label: 'Izin/Sakit' },
            { id: 'belum', label: 'Belum Absen' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilterStatus(btn.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterStatus === btn.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Data Presensi Mahasiswa Magang Lengkap */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Mahasiswa</th>
                <th className="py-3.5 px-4 text-center">Foto Selfie Masuk</th>
                <th className="py-3.5 px-4">Jam Masuk</th>
                <th className="py-3.5 px-4 text-center">Foto Selfie Pulang</th>
                <th className="py-3.5 px-4">Jam Pulang</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Validasi GPS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => {
                  const att = row.attendance
                  const hasPhotoMasuk = !!att?.foto_masuk_url
                  const hasPhotoPulang = !!att?.foto_pulang_url

                  return (
                    <tr key={row.student.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Mahasiswa Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                            {row.student.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">
                              {row.student.nama}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {row.student.nim || 'Tanpa NIM'} · {row.student.instansi || 'Universitas'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Foto Selfie Masuk */}
                      <td className="py-3.5 px-4 text-center">
                        {hasPhotoMasuk ? (
                          <button
                            onClick={() =>
                              setSelectedPhoto({
                                url: att.foto_masuk_url!,
                                title: 'Foto Selfie Absen Masuk',
                                studentName: row.student.nama,
                                time: `${att.jam_masuk?.slice(0, 5) || ''} WIB`,
                                coords: { lat: att.lat_masuk, lng: att.lng_masuk },
                              })
                            }
                            className="group relative inline-block rounded-xl overflow-hidden border-2 border-indigo-200 hover:border-indigo-600 transition-all shadow-xs"
                          >
                            <img
                              src={att.foto_masuk_url!}
                              alt="Selfie Masuk"
                              className="w-12 h-12 object-cover scale-x-[-1] group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="w-4 h-4" />
                            </div>
                          </button>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-dashed border-slate-200 flex items-center justify-center text-slate-300 mx-auto">
                            <Camera className="w-4 h-4" />
                          </div>
                        )}
                      </td>

                      {/* Jam Masuk */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        {att?.jam_masuk ? (
                          <span>{formatTimeShort(att.jam_masuk)} WIB</span>
                        ) : (
                          <span className="text-slate-300">--:--</span>
                        )}
                      </td>

                      {/* Foto Selfie Pulang */}
                      <td className="py-3.5 px-4 text-center">
                        {hasPhotoPulang ? (
                          <button
                            onClick={() =>
                              setSelectedPhoto({
                                url: att.foto_pulang_url!,
                                title: 'Foto Selfie Absen Pulang',
                                studentName: row.student.nama,
                                time: `${att.jam_pulang?.slice(0, 5) || ''} WIB`,
                                coords: { lat: att.lat_pulang, lng: att.lng_pulang },
                              })
                            }
                            className="group relative inline-block rounded-xl overflow-hidden border-2 border-amber-200 hover:border-amber-600 transition-all shadow-xs"
                          >
                            <img
                              src={att.foto_pulang_url!}
                              alt="Selfie Pulang"
                              className="w-12 h-12 object-cover scale-x-[-1] group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-amber-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="w-4 h-4" />
                            </div>
                          </button>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-dashed border-slate-200 flex items-center justify-center text-slate-300 mx-auto">
                            <Camera className="w-4 h-4" />
                          </div>
                        )}
                      </td>

                      {/* Jam Pulang */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        {att?.jam_pulang ? (
                          <span>{formatTimeShort(att.jam_pulang)} WIB</span>
                        ) : (
                          <span className="text-slate-300">--:--</span>
                        )}
                      </td>

                      {/* Status Kehadiran */}
                      <td className="py-3.5 px-4">
                        {row.leave ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {row.leave.jenis === 'izin' ? 'Izin' : 'Sakit'} ({row.leave.status})
                          </span>
                        ) : att?.status === 'hadir' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Tepat Waktu
                          </span>
                        ) : att?.status === 'terlambat' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Terlambat
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-500">
                            Belum Absen
                          </span>
                        )}
                      </td>

                      {/* Validasi GPS */}
                      <td className="py-3.5 px-4">
                        {att?.lat_masuk ? (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-mono text-[11px]">
                              {row.distanceMasuk !== null ? `${row.distanceMasuk} m` : 'Valid'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({att.lat_masuk.toFixed(3)}, {att.lng_masuk?.toFixed(3)})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                    Tidak ada data presensi yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL ZOOM PREVIEW FOTO SELFIE */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden max-w-sm sm:max-w-md w-full shadow-2xl relative border border-slate-800">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold">{selectedPhoto.title}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {selectedPhoto.studentName} · {selectedPhoto.time}
                </p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Foto Image */}
            <div className="relative bg-black aspect-4/3 flex items-center justify-center overflow-hidden">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="w-full h-full object-cover scale-x-[-1]"
              />
            </div>

            {/* Modal Footer info */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span className="font-mono text-[11px]">
                  {selectedPhoto.coords?.lat?.toFixed(5) || '-'}, {selectedPhoto.coords?.lng?.toFixed(5) || '-'}
                </span>
              </div>
              <a
                href={selectedPhoto.url}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 text-[11px]"
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
