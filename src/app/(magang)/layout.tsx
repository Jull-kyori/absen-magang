import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserProfile } from '@/types/database.types'
import { MagangHeader } from '@/components/layout/magang-header'
import { BottomNav } from '@/components/layout/bottom-nav'

export default async function MagangLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = (await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()) as { data: UserProfile | null }

  const isAdmin = user.email?.toLowerCase().includes('admin') || profile?.role === 'admin'

  const userProfile: UserProfile = profile || {
    id: user.id,
    nama: user.email?.split('@')[0] || 'Pengguna',
    email: user.email || '',
    role: isAdmin ? 'admin' : 'magang',
    instansi: 'Bakesbangpol Kabupaten Ponorogo',
    nim: null,
    aktif: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col pb-20 md:pb-8">
      <MagangHeader user={userProfile} isAdmin={isAdmin} />
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
