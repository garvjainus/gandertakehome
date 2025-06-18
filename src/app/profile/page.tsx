'use client'

import { useAuth } from '@/contexts/auth-context'
import { PilotProfile } from '@/components/pilot/pilot-profile'
import { AuthForm } from '@/components/auth/auth-form'
import { Loader2, Plane } from 'lucide-react'

export default function ProfilePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Plane className="h-12 w-12 animate-pulse text-blue-600 mx-auto mb-4" />
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <div className="text-lg font-medium text-gray-700">Loading Plane Jane...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return <PilotProfile />
} 