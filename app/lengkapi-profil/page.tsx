'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, activityLevels } from '@/lib/supabase'
import { Heart, Calendar, User, Ruler, Weight, Activity } from 'lucide-react'

export default function CompleteProfilePage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    tgl_lahir: '',
    gender: 'pria' as 'pria' | 'wanita',
    tinggi_cm: '',
    berat_kg: '',
    level_aktivitas: 1.55
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Check if user is authenticated
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

      // Check if profile already exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        // Profile already complete, redirect to dashboard
        router.push('/dashboard')
      }
    }

    checkUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!userId) {
      setError('User tidak ditemukan. Silakan login kembali.')
      setLoading(false)
      return
    }

    try {
      // Insert profile to database
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          tgl_lahir: formData.tgl_lahir,
          gender: formData.gender,
          tinggi_cm: parseInt(formData.tinggi_cm),
          berat_kg: parseFloat(formData.berat_kg),
          level_aktivitas: formData.level_aktivitas
        })

      if (insertError) throw insertError

      // Success! Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan profil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center gap-2">
              <img
                 src="/logo.png"
                  alt="NutriCalc+ Logo"
                  className="mb-1 w-10 h-10 rounded-xl object-cover"
                />
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                NutriCalc+
              </span>
            </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Lengkapi Profil Anda
          </h1>
          <p className="text-gray-600">
            Data ini akan digunakan untuk menghitung kebutuhan gizi personal Anda
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-emerald-100 p-8 md:p-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tanggal Lahir */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Tanggal Lahir
                </div>
              </label>
              <input
                type="date"
                value={formData.tgl_lahir}
                onChange={(e) => setFormData({ ...formData, tgl_lahir: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Jenis Kelamin
                </div>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'pria' })}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    formData.gender === 'pria'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold">👨 Pria</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'wanita' })}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    formData.gender === 'wanita'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold">👩 Wanita</div>
                </button>
              </div>
            </div>

            {/* Tinggi & Berat */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4" />
                    Tinggi Badan (cm)
                  </div>
                </label>
                <input
                  type="number"
                  value={formData.tinggi_cm}
                  onChange={(e) => setFormData({ ...formData, tinggi_cm: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  placeholder="170"
                  required
                  min="50"
                  max="250"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Weight className="w-4 h-4" />
                    Berat Badan (kg)
                  </div>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.berat_kg}
                  onChange={(e) => setFormData({ ...formData, berat_kg: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  placeholder="70"
                  required
                  min="10"
                  max="300"
                />
              </div>
            </div>

            {/* Level Aktivitas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Level Aktivitas Fisik
                </div>
              </label>
              <select
                value={formData.level_aktivitas}
                onChange={(e) => setFormData({ ...formData, level_aktivitas: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              >
                {activityLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label} - {level.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800">
                💡 <strong>Tips:</strong> Data ini akan digunakan untuk menghitung kebutuhan kalori, 
                protein, karbohidrat, dan lemak harian Anda secara akurat menggunakan metode ilmiah.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Menyimpan...' : '🚀 Lanjutkan ke Dashboard'}
            </button>
          </form>
        </div>

        {/* Privacy Note */}
        <div className="text-center mt-6 text-sm text-gray-600">
          🔒 Data Anda aman dan hanya digunakan untuk kalkulasi gizi personal
        </div>
      </div>
    </div>
  )
}