'use client'

import { useState, useTransition } from 'react'
import { BookOpen, CheckCircle2, ClipboardList, ImagePlus, Save, Sparkles } from 'lucide-react'
import { DailyLogbook } from '@/types/database.types'
import { formatIndonesianDate } from '@/lib/utils/time'
import { saveLogbookAction } from './actions'

interface Props {
  logbooks: DailyLogbook[]
  today: string
}

const emptyForm = { kegiatan: '', hasil: '', kendala: '' }

export function LogbookClient({ logbooks: initialLogbooks, today }: Props) {
  const [logbooks, setLogbooks] = useState(initialLogbooks)
  const [selectedDate, setSelectedDate] = useState(today)
  const [form, setForm] = useState(emptyForm)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const loadDate = (date: string) => {
    setSelectedDate(date)
    const existing = logbooks.find((item) => item.tanggal === date)
    setForm(existing ? {
      kegiatan: existing.kegiatan,
      hasil: existing.hasil || '',
      kendala: existing.kendala || '',
    } : emptyForm)
    setPhotoPreview(existing?.bukti_url || null)
    setPhotoBase64(null)
    setMessage(null)
  }

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Pilih file gambar yang valid.' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ukuran foto maksimal 5 MB.' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result)
      setPhotoPreview(result)
      setPhotoBase64(result)
      setMessage(null)
    }
    reader.readAsDataURL(file)
  }

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    startTransition(async () => {
      const result = await saveLogbookAction({ tanggal: selectedDate, ...form, buktiBase64: photoBase64 })
      setMessage({ type: result.success ? 'success' : 'error', text: result.message })
      if (result.success && result.data) {
        setLogbooks((current) => [result.data!, ...current.filter((item) => item.tanggal !== selectedDate)].sort((a, b) => b.tanggal.localeCompare(a.tanggal)))
      }
    })
  }

  const recentLogbooks = logbooks.slice(0, 10)

  return (
    <div className="liquid-page space-y-5">
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs liquid-interactive-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Logbook Harian</h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Kegiatan Magang</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Catat kegiatan, hasil pekerjaan, dan rencana magang setiap hari.</p>
          </div>
          <div className="liquid-icon-bloom w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0"><BookOpen className="w-5 h-5" /></div>
        </div>
      </section>

      <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] gap-5 items-start">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="text-sm font-extrabold text-slate-900">Tulis Logbook</h2><p className="text-[11px] text-slate-500 mt-0.5">Satu catatan untuk satu tanggal.</p></div>
            <input type="date" value={selectedDate} onChange={(event) => loadDate(event.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
          </div>

          <label className="block"><span className="text-xs font-bold text-slate-700">Kegiatan hari ini <span className="text-rose-500">*</span></span><textarea value={form.kegiatan} onChange={(event) => updateField('kegiatan', event.target.value)} required minLength={5} rows={4} placeholder="Contoh: Membantu mengarsipkan surat masuk dan memperbarui data kegiatan..." className="mt-1.5 w-full rounded-2xl border border-slate-200 px-3.5 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y" /></label>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block"><span className="text-xs font-bold text-slate-700">Hasil yang diperoleh</span><textarea value={form.hasil} onChange={(event) => updateField('hasil', event.target.value)} rows={3} placeholder="Hasil atau output pekerjaan..." className="mt-1.5 w-full rounded-2xl border border-slate-200 px-3.5 py-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y" /></label>
            <label className="block"><span className="text-xs font-bold text-slate-700">Kendala</span><textarea value={form.kendala} onChange={(event) => updateField('kendala', event.target.value)} rows={3} placeholder="Tuliskan kendala, jika ada..." className="mt-1.5 w-full rounded-2xl border border-slate-200 px-3.5 py-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y" /></label>
          </div>

          <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-3.5">
            <div className="flex items-center justify-between gap-3 mb-2"><div><p className="text-xs font-bold text-slate-700">Foto bukti kegiatan</p><p className="text-[10px] text-slate-500 mt-0.5">JPG, PNG, atau WEBP. Maksimal 5 MB.</p></div><ImagePlus className="w-5 h-5 text-indigo-500" /></div>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} disabled={isPending} className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-indigo-700" />
            {photoPreview && <img src={photoPreview} alt="Preview bukti kegiatan" className="mt-3 h-32 w-full rounded-xl object-cover border border-white shadow-sm" />}
          </div>

          {message && <p className={`text-xs font-semibold ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>{message.text}</p>}
          <button type="submit" disabled={isPending} className="liquid-action-button w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 disabled:opacity-60">{isPending ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Save className="w-4 h-4" />}{isPending ? 'Menyimpan...' : 'Simpan Logbook'}</button>
        </form>

        <aside className="bg-gradient-to-br from-indigo-600 via-blue-600 to-slate-900 rounded-3xl p-5 text-white shadow-xl shadow-indigo-500/15"><div className="flex items-center gap-2 text-blue-100"><Sparkles className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-widest">Tips Logbook</span></div><h2 className="text-lg font-extrabold mt-4">Jadikan catatanmu bermakna.</h2><p className="text-xs text-blue-100 mt-2 leading-relaxed">Tuliskan kegiatan secara spesifik agar pembimbing dapat memahami progres dan kontribusimu selama magang.</p><div className="mt-5 space-y-3 text-xs text-blue-50"><div className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" /><span>Gunakan kata kerja yang jelas.</span></div><div className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" /><span>Catat hasil, bukan hanya aktivitas.</span></div><div className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" /><span>Perbarui sebelum hari kerja berakhir.</span></div></div></aside>
      </div>

      <section className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden"><div className="p-5 border-b border-slate-100 flex items-center justify-between"><div><h2 className="text-sm font-extrabold text-slate-900">Riwayat Logbook</h2><p className="text-[11px] text-slate-500 mt-0.5">Catatan terbaru selama kegiatan magang.</p></div><ClipboardList className="w-5 h-5 text-indigo-500" /></div>{recentLogbooks.length > 0 ? <div className="divide-y divide-slate-100">{recentLogbooks.map((item) => <button key={item.id} type="button" onClick={() => loadDate(item.tanggal)} className="w-full text-left p-4 sm:p-5 hover:bg-indigo-50/40 transition-colors"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3 min-w-0"><div className="min-w-0"><p className="text-xs font-bold text-indigo-600">{formatIndonesianDate(item.tanggal)}</p><p className="text-sm font-bold text-slate-900 mt-1 line-clamp-2">{item.kegiatan}</p><p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.hasil || 'Belum menambahkan hasil pekerjaan.'}</p></div>{item.bukti_url && <img src={item.bukti_url} alt="Bukti kegiatan" className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0" />}</div><span className="text-[10px] font-semibold text-slate-400 shrink-0">Edit</span></div></button>)}</div> : <div className="p-10 text-center text-slate-400"><BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" /><p className="text-xs">Belum ada logbook. Tulis catatan pertamamu hari ini.</p></div>}</section>
    </div>
  )
}
