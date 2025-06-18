'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { PilotProfile } from '@/types'

interface AuthContextType {
  user: User | null
  profile: PilotProfile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<PilotProfile>) => Promise<PilotProfile>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<PilotProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session with timeout protection
    const getInitialSession = async () => {
      try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        )
        
        // Race between getSession and timeout
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ])
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Fire-and-forget profile fetch so loading spinner stops quicker
          fetchProfile(session.user.id)
        }
      } catch (error) {
        console.warn('Session initialization failed:', error)
        // Continue without session - user can still sign in
        setSession(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // fetch profile but don't block UI
          fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        
        // Ensure we don't keep splash longer than 150 ms
        setTimeout(() => setLoading(false), 150)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('pilot_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle() // Use maybeSingle instead of single to handle missing profiles

      if (error) {
        console.error('Error fetching profile:', error)
        console.error('Error details:', { error, userId })
        
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
          await createProfileForUser(userId)
          return
        }
        return
      }

      if (data) {
        setProfile(data)
      } else {
        // Profile doesn't exist, create it
        console.log('Profile not found, creating new profile for user:', userId)
        await createProfileForUser(userId)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const createProfileForUser = async (userId: string) => {
    try {
      if (!user?.email) return

      const { data, error } = await supabase
        .from('pilot_profiles')
        .insert([{
          id: userId,
          email: user.email,
          first_name: user.user_metadata?.first_name || user.email.split('@')[0],
          last_name: user.user_metadata?.last_name || '',
          role: 'pilot'
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        return
      }

      if (data) {
        setProfile(data)
        console.log('Profile created successfully:', data)
      }
    } catch (error) {
      console.error('Error creating profile:', error)
    }
  }

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    })

    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const updateProfile = async (updates: Partial<PilotProfile>) => {
    if (!user) throw new Error('No user logged in')

    try {
      // Clean the updates object and add updated_at timestamp
      const cleanUpdates = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      // Remove any undefined values and ensure proper data types
      Object.keys(cleanUpdates).forEach(key => {
        if (cleanUpdates[key as keyof typeof cleanUpdates] === undefined) {
          delete cleanUpdates[key as keyof typeof cleanUpdates]
        }
      })

      // Ensure numeric fields are properly typed
      if (cleanUpdates.total_hours !== undefined) {
        cleanUpdates.total_hours = Number(cleanUpdates.total_hours) || 0
      }
      if (cleanUpdates.pic_hours !== undefined) {
        cleanUpdates.pic_hours = Number(cleanUpdates.pic_hours) || 0
      }
      if (cleanUpdates.instrument_hours !== undefined) {
        cleanUpdates.instrument_hours = Number(cleanUpdates.instrument_hours) || 0
      }

      console.log('Updating profile with:', cleanUpdates)

      const { data, error } = await supabase
        .from('pilot_profiles')
        .update(cleanUpdates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Profile update error:', error)
        
        // Provide more specific error messages
        if (error.code === '23505') {
          if (error.message.includes('certificate_number')) {
            throw new Error('Certificate number already exists. Please use a different certificate number.')
          }
          if (error.message.includes('email')) {
            throw new Error('Email address already exists. Please use a different email.')
          }
          throw new Error('A unique constraint was violated. Please check your data.')
        }
        
        if (error.code === '23514') {
          throw new Error('Invalid data provided. Please check your license type and role selections.')
        }
        
        throw new Error(`Failed to update profile: ${error.message}`)
      }
      
      setProfile(data)
      return data
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 