import { Loader2 } from 'lucide-react'

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 border border-slate-100 max-w-xs w-full text-center">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <Loader2 className="w-6 h-6 text-blue-600 absolute inset-0 m-auto animate-pulse" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">Memuat Data...</h3>
          <p className="text-xs text-slate-500 mt-0.5">Mohon tunggu sebentar</p>
        </div>
      </div>
    </div>
  )
}
