import { supabase } from './supabase'

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return { user, profile }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const requireAuth = async (requiredRole = null) => {
  const userData = await getCurrentUser()
  
  if (!userData) {
    throw new Error('Authentication required')
  }
  
  if (requiredRole && userData.profile?.user_type !== requiredRole) {
    throw new Error('Insufficient permissions')
  }
  
  return userData
}