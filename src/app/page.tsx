import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserProfile } from '@/types/database.types'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
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
    .maybeSingle()) as { data: UserProfile | null }

  const isAdmin = user.email?.toLowerCase().includes('admin') || profile?.role === 'admin'

  if (isAdmin) {
    redirect('/admin/dashboard')
  }

  redirect('/dashboard')
}
