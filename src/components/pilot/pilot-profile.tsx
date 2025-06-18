'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  Phone, 
  Award, 
  Calendar, 
  Clock, 
  Plane, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  Edit3
} from 'lucide-react'
import { PilotProfileUpdate } from '@/types'

export function PilotProfile() {
  const { profile, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState<PilotProfileUpdate>({
    certificate_number: profile?.certificate_number || '',
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
    license_type: profile?.license_type || 'Commercial',
    medical_expiry: profile?.medical_expiry || '',
    flight_review_expiry: profile?.flight_review_expiry || '',
    total_hours: profile?.total_hours || 0,
    pic_hours: profile?.pic_hours || 0,
    instrument_hours: profile?.instrument_hours || 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Validate required fields
      if (!formData.first_name?.trim()) {
        throw new Error('First name is required')
      }
      if (!formData.last_name?.trim()) {
        throw new Error('Last name is required')
      }

      // Clean the form data
      const cleanedData = {
        ...formData,
        // Remove empty strings and convert to undefined for optional fields
        certificate_number: formData.certificate_number?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        medical_expiry: formData.medical_expiry || undefined,
        flight_review_expiry: formData.flight_review_expiry || undefined,
        // Ensure numeric fields are numbers
        total_hours: Number(formData.total_hours) || 0,
        pic_hours: Number(formData.pic_hours) || 0,
        instrument_hours: Number(formData.instrument_hours) || 0,
      }

      console.log('Submitting profile update:', cleanedData)
      await updateProfile(cleanedData)
      setSuccess('Profile updated successfully!')
      setIsEditing(false)
    } catch (err) {
      console.error('Profile update failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof PilotProfileUpdate, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'dispatcher': return 'bg-blue-100 text-blue-800'
      case 'captain': return 'bg-green-100 text-green-800'
      case 'first_officer': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLicenseColor = (license: string) => {
    switch (license) {
      case 'ATP': return 'bg-gold-100 text-yellow-800'
      case 'Commercial': return 'bg-blue-100 text-blue-800'
      case 'Private': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isExpiringSoon = (dateString?: string) => {
    if (!dateString) return false
    const date = new Date(dateString)
    const today = new Date()
    const monthsAway = (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)
    return monthsAway <= 3 && monthsAway >= 0
  }

  const isExpired = (dateString?: string) => {
    if (!dateString) return false
    const date = new Date(dateString)
    const today = new Date()
    return date < today
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center text-2xl">
                <User className="h-6 w-6 mr-2 text-blue-600" />
                {profile.first_name} {profile.last_name}
              </CardTitle>
              <CardDescription className="flex items-center mt-2">
                <Mail className="h-4 w-4 mr-1" />
                {profile.email}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={getRoleColor(profile.role)}>
                {profile.role.replace('_', ' ')}
              </Badge>
              {profile.license_type && (
                <Badge variant="outline" className={getLicenseColor(profile.license_type)}>
                  {profile.license_type}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Professional Information</CardTitle>
              <CardDescription>
                Manage your pilot credentials and contact information
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
              disabled={loading}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  First Name
                </Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  disabled={!isEditing || loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  disabled={!isEditing || loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  disabled={!isEditing || loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificate_number" className="flex items-center">
                  <Award className="h-4 w-4 mr-1" />
                  Certificate Number
                </Label>
                <Input
                  id="certificate_number"
                  value={formData.certificate_number}
                  onChange={(e) => handleChange('certificate_number', e.target.value)}
                  placeholder="e.g. 1234567890"
                  disabled={!isEditing || loading}
                />
              </div>
            </div>

            {/* License Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="license_type">License Type</Label>
                <Select 
                  value={formData.license_type} 
                  onValueChange={(value) => handleChange('license_type', value)}
                  disabled={!isEditing || loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATP">ATP</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                    <SelectItem value="Private">Private</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medical_expiry" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Medical Expiry
                  {isExpired(formData.medical_expiry) && (
                    <AlertCircle className="h-4 w-4 ml-1 text-red-500" />
                  )}
                  {isExpiringSoon(formData.medical_expiry) && !isExpired(formData.medical_expiry) && (
                    <AlertCircle className="h-4 w-4 ml-1 text-yellow-500" />
                  )}
                </Label>
                <Input
                  id="medical_expiry"
                  type="date"
                  value={formData.medical_expiry}
                  onChange={(e) => handleChange('medical_expiry', e.target.value)}
                  disabled={!isEditing || loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="flight_review_expiry" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Flight Review Expiry
                  {isExpired(formData.flight_review_expiry) && (
                    <AlertCircle className="h-4 w-4 ml-1 text-red-500" />
                  )}
                  {isExpiringSoon(formData.flight_review_expiry) && !isExpired(formData.flight_review_expiry) && (
                    <AlertCircle className="h-4 w-4 ml-1 text-yellow-500" />
                  )}
                </Label>
                <Input
                  id="flight_review_expiry"
                  type="date"
                  value={formData.flight_review_expiry}
                  onChange={(e) => handleChange('flight_review_expiry', e.target.value)}
                  disabled={!isEditing || loading}
                />
              </div>
            </div>

            {/* Flight Hours */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_hours" className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Total Hours
                </Label>
                <Input
                  id="total_hours"
                  type="number"
                  min="0"
                  value={formData.total_hours}
                  onChange={(e) => handleChange('total_hours', parseInt(e.target.value) || 0)}
                  disabled={!isEditing || loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pic_hours" className="flex items-center">
                  <Plane className="h-4 w-4 mr-1" />
                  PIC Hours
                </Label>
                <Input
                  id="pic_hours"
                  type="number"
                  min="0"
                  value={formData.pic_hours}
                  onChange={(e) => handleChange('pic_hours', parseInt(e.target.value) || 0)}
                  disabled={!isEditing || loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instrument_hours">Instrument Hours</Label>
                <Input
                  id="instrument_hours"
                  type="number"
                  min="0"
                  value={formData.instrument_hours}
                  onChange={(e) => handleChange('instrument_hours', parseInt(e.target.value) || 0)}
                  disabled={!isEditing || loading}
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 