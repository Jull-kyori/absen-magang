'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Attendance, LocationSetting, WorkSetting } from '@/types/database.types'
import { formatIndonesianDate, formatTimeShort, calculateHaversineDistance } from '@/lib/utils/time'
import { submitAttendanceAction } from './actions'
import {
  MapPin,
  Clock,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
  RefreshCw,
  Building,
  Info,
  Calendar,
} from 'lucide-react'

interface Props {
  initialAttendance: Attendance | null
  location: LocationSetting | null
  workSetting: WorkSetting | null
  todayDate: string
}

export function AttendanceClient({
  initialAttendance,
  location,
  workSetting,
  todayDate,
}: Props) {
  const router = useRouter()
  const [attendance, setAttendance] = useState<Attendance | null>(initialAttendance)
  const [currentTime, setCurrentTime] = useState<string>('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Camera State
  const [showCamera, setShowCamera] = useState<boolean>(false)
  const [activeAction, setActiveAction] = useState<'masuk' | 'pulang' | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Realtime Clock WIB
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const timeStr = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now)
      setCurrentTime(timeStr)
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Geolocation Detection (Read-Only untuk Mahasiswa Magang)
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Browser atau perangkat Anda tidak mendukung fitur Geolocation GPS.')
      return
    }

    setIsLocating(true)
    setGeoError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude
        const userLng = position.coords.longitude
        setCoords({ lat: userLat, lng: userLng })

        if (location) {
          const dist = calculateHaversineDistance(userLat, userLng, location.lat, location.lng)
          setDistance(dist)
        }
        setIsLocating(false)
      },
      (error) => {
        navigator.geolocation.getCurrentPosition(
          (fallbackPos) => {
            const userLat = fallbackPos.coords.latitude
            const userLng = fallbackPos.coords.longitude
            setCoords({ lat: userLat, lng: userLng })
            if (location) {
              const dist = calculateHaversineDistance(userLat, userLng, location.lat, location.lng)
              setDistance(dist)
            }
            setIsLocating(false)
          },
          (finalErr) => {
            setIsLocating(false)
            if (finalErr.code === finalErr.PERMISSION_DENIED) {
              setGeoError(
                'Izin lokasi diblokir oleh browser. Klik ikon gembok di sebelah URL browser dan ubah Location menjadi Allow.'
              )
            } else {
              setGeoError('Gagal mendeteksi koordinat GPS. Pastikan GPS HP/laptop Anda aktif.')
            }
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
        )
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
    )
  }

  const refreshLocationData = () => {
    router.refresh()
    detectLocation()
  }

  useEffect(() => {
    detectLocation()
  }, [])

  useEffect(() => {
    if (coords && location) {
      const dist = calculateHaversineDistance(coords.lat, coords.lng, location.lat, location.lng)
      setDistance(dist)
    }
  }, [coords, location])

  // Camera handlers
  const openCamera = async (type: 'masuk' | 'pulang') => {
    setActiveAction(type)
    setShowCamera(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      stopCamera()
      if (confirm('Kamera tidak dapat diakses atau diizinkan. Lanjutkan absen tanpa foto selfie?')) {
        proceedSubmit(type, null)
      }
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setShowCamera(false)
  }

  const takeSnapshot = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75)
      stopCamera()
      if (activeAction) {
        proceedSubmit(activeAction, dataUrl)
      }
    }
  }

  const proceedSubmit = async (jenis: 'masuk' | 'pulang', photoBase64: string | null) => {
    if (!coords) {
      setFeedback({ type: 'error', message: 'Koordinat GPS belum terdeteksi. Silakan klik Perbarui GPS.' })
      return
    }

    setIsSubmitting(true)
    setFeedback(null)

    const result = await submitAttendanceAction({
      lat: coords.lat,
      lng: coords.lng,
      fotoBase64: photoBase64,
      jenis,
    })

    setIsSubmitting(false)

    if (result.success) {
      setFeedback({ type: 'success', message: result.message })
      if (result.data) {
        setAttendance(result.data)
      }
    } else {
      setFeedback({ type: 'error', message: result.message })
    }
  }

  const isWithinRadius = distance !== null && !!location && (location.gunakan_radius === false || distance <= location.radius_meter)
  const hasCheckedIn = !!attendance?.jam_masuk
  const hasCheckedOut = !!attendance?.jam_pulang

  return (
    <div className="liquid-page space-y-6">
      {/* Banner Identitas Bakesbangpol Ponorogo */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Bakesbangpol Kabupaten Ponorogo
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Pemerintah Kab. Ponorogo
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Portal Presensi Digital Mahasiswa Magang / Praktik Kerja Lapangan (PKL)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
          <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-semibold">{formatIndonesianDate(todayDate)}</span>
        </div>
      </div>

      {/* Grid Responsif (Desktop Windows 2 Kolom, Mobile 1 Kolom) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Jam Digital & Informasi Instansi */}
        <div className="md:col-span-5 space-y-5">
          {/* Jam Digital Realtime WIB Card */}
          <div className="liquid-hero-card bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-blue-100 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                Waktu Indonesia Barat (WIB)
              </span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
                Server Sinkron
              </span>
            </div>

            <div className="my-5 text-center">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono drop-shadow-sm">
                {currentTime || '--:--:--'}
              </h1>
              <p className="text-xs text-blue-200 mt-1 font-medium">
                Asia/Jakarta (Waktu Resmi Presensi)
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/15 text-center text-[11px]">
              <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
                <p className="text-blue-200">Jam Masuk</p>
                <p className="font-bold text-white mt-0.5 text-xs">
                  {formatTimeShort(workSetting?.jam_masuk || '08:00:00')}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
                <p className="text-blue-200">Toleransi</p>
                <p className="font-bold text-amber-300 mt-0.5 text-xs">
                  {formatTimeShort(workSetting?.batas_terlambat || '08:30:00')}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
                <p className="text-blue-200">Jam Pulang</p>
                <p className="font-bold text-white mt-0.5 text-xs">
                  {formatTimeShort(workSetting?.jam_pulang || '17:00:00')}
                </p>
              </div>
            </div>
          </div>

          {/* Info Kantor & Ketentuan Bakesbangpol */}
          <div className="liquid-interactive-card bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              Titik Instansi Bakesbangpol
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">
                    {location?.nama || 'Bakesbangpol Kabupaten Ponorogo'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Area radius presensi: <span className="font-bold text-blue-600">{location?.gunakan_radius === false ? 'Tanpa batas' : `${location?.radius_meter || 350} meter`}</span>
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-[11px]">
                <p className="font-semibold text-slate-700">Ketentuan Presensi:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-500">
                  <li>{location?.gunakan_radius === false ? 'Batas radius sedang dinonaktifkan oleh admin.' : 'Presensi wajib dilakukan di dalam area kantor instansi.'}</li>
                  <li>Absen masuk lewat pukul 08:30 WIB otomatis ditandai <b>Terlambat</b>.</li>
                  <li>Absen pulang dapat dilakukan mulai pukul 17:00 WIB.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: GPS Geofencing, Status Hari Ini & Tombol Aksi */}
        <div className="md:col-span-7 space-y-5">
          {/* Alert Feedback */}
          {feedback && (
            <div
              className={`p-4 rounded-2xl text-sm flex items-start gap-3 border transition-all ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm'
                  : 'bg-rose-50 border-rose-200 text-rose-800 shadow-sm'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="font-semibold text-xs sm:text-sm leading-relaxed">
                {feedback.message}
              </span>
            </div>
          )}

          {/* Status Geofencing GPS Card (Read-Only) */}
          <div className="liquid-interactive-card bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Geofencing GPS Lokasi
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {location?.nama || 'Bakesbangpol Kab. Ponorogo'}
                  </p>
                </div>
              </div>

              <button
                onClick={refreshLocationData}
                disabled={isLocating}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 px-3 py-2 rounded-xl active:scale-95 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Mencari...' : 'Perbarui GPS'}</span>
              </button>
            </div>

            {geoError ? (
              <div className="bg-rose-50 border border-rose-200/70 rounded-xl p-3.5 text-xs text-rose-700 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{geoError}</span>
              </div>
            ) : coords && distance !== null ? (
              <div
                className={`rounded-xl p-4 border flex items-center justify-between text-xs transition-all ${
                  isWithinRadius
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50/80 border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isWithinRadius ? (
                        <div className="liquid-gps-pulse w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-sm">
                      {isWithinRadius
                        ? 'Lokasi Anda Valid (Dalam Area Bakesbangpol)'
                        : 'Di Luar Jangkauan Instansi'}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Jarak terdeteksi: <span className="font-bold">{distance} meter</span> ({location?.gunakan_radius === false ? 'Tanpa batas radius' : `Batas radius: ${location?.radius_meter || 350} m`})
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                    isWithinRadius
                      ? 'bg-emerald-200/80 text-emerald-900'
                      : 'bg-amber-200/80 text-amber-900'
                  }`}
                >
                  {isWithinRadius ? 'Valid' : 'Di Luar Area'}
                </span>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-xs text-slate-500 flex items-center justify-center gap-2.5">
                <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-slate-800 animate-spin" />
                <span>Mendeteksi koordinat GPS perangkat Anda...</span>
              </div>
            )}
          </div>

          {/* Kartu Status Presensi Hari Ini */}
          <div className="liquid-interactive-card bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500">
              Status Presensi Hari Ini
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70">
                <span className="text-xs text-slate-500 font-medium">Absen Masuk</span>
                <p className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                  {formatTimeShort(attendance?.jam_masuk ?? null)}
                </p>
                {attendance?.status && (
                  <span
                    className={`inline-block mt-2 text-xs font-bold px-2.5 py-0.5 rounded-md ${
                      attendance.status === 'hadir'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {attendance.status === 'hadir' ? 'Tepat Waktu' : 'Terlambat'}
                  </span>
                )}
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70">
                <span className="text-xs text-slate-500 font-medium">Absen Pulang</span>
                <p className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                  {formatTimeShort(attendance?.jam_pulang ?? null)}
                </p>
                <span
                  className={`inline-block mt-2 text-xs font-bold px-2.5 py-0.5 rounded-md ${
                    hasCheckedOut
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {hasCheckedOut ? 'Selesai' : 'Belum Pulang'}
                </span>
              </div>
            </div>
          </div>

          {/* Tombol Utama Presensi */}
          <div className="space-y-3">
            {!hasCheckedIn ? (
              <button
                onClick={() => openCamera('masuk')}
                disabled={!isWithinRadius || isSubmitting}
                className="liquid-action-button w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white py-4 px-6 rounded-2xl font-bold text-base shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Memproses Absen Masuk...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    <span>Absen Masuk Sekarang</span>
                    <ArrowRight className="w-5 h-5 ml-auto" />
                  </>
                )}
              </button>
            ) : !hasCheckedOut ? (
              <button
                onClick={() => openCamera('pulang')}
                disabled={!isWithinRadius || isSubmitting}
                className="liquid-action-button w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 active:scale-[0.99] text-white py-4 px-6 rounded-2xl font-bold text-base shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Memproses Absen Pulang...</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5" />
                    <span>Absen Pulang Sekarang</span>
                    <ArrowRight className="w-5 h-5 ml-auto" />
                  </>
                )}
              </button>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center shadow-xs">
                <CheckCircle2 className="w-9 h-9 text-emerald-600 mx-auto mb-2" />
                <h4 className="font-extrabold text-emerald-950 text-sm sm:text-base">
                  Presensi Hari Ini Lengkap!
                </h4>
                <p className="text-xs text-emerald-700 mt-1">
                  Catatan absensi masuk dan pulang Anda telah tersimpan dengan aman di server Bakesbangpol.
                </p>
              </div>
            )}

            {!isWithinRadius && !hasCheckedOut && (
              <p className="text-xs text-center text-amber-800 bg-amber-50/90 py-2.5 px-4 rounded-xl border border-amber-200/80 leading-relaxed">
                ⚠️ {location?.gunakan_radius === false ? 'Batas radius dinonaktifkan. Pastikan GPS tetap aktif untuk mencatat lokasi presensi.' : `Tombol absen akan otomatis aktif saat GPS Anda berada dalam radius ${location?.radius_meter || 350} meter dari kantor Bakesbangpol Ponorogo.`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal Kamera Selfie */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl relative border border-slate-800">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" />
                Foto Selfie Presensi {activeAction === 'masuk' ? 'Masuk' : 'Pulang'}
              </span>
              <button
                onClick={stopCamera}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-black aspect-4/3 flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <div className="absolute inset-0 border-2 border-white/20 pointer-events-none rounded-2xl m-6" />
            </div>

            <div className="p-5 bg-white flex flex-col items-center gap-3">
              <p className="text-xs text-slate-500 text-center font-medium">
                Posisikan wajah Anda dengan jelas di dalam bingkai sebelum mengambil foto
              </p>

              <button
                onClick={takeSnapshot}
                className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 border-4 border-white transition-all"
              >
                <Camera className="w-7 h-7" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
