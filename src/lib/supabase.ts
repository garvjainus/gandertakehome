import { createClient } from '@supabase/supabase-js'
import { Aircraft, Flight } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database schema types for better type safety
export type Database = {
  public: {
    Tables: {
      aircraft: {
        Row: Aircraft
        Insert: Omit<Aircraft, 'id'>
        Update: Partial<Omit<Aircraft, 'id'>>
      }
      flights: {
        Row: Flight
        Insert: Omit<Flight, 'id'>
        Update: Partial<Omit<Flight, 'id'>>
      }
    }
  }
} 