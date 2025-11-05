'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Heart, Mail, Lock, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (signInError) throw signInError

      if (data.user) {
        // Cek apakah profil sudah lengkap
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (!profile) {
          // Profil belum lengkap, redirect ke lengkapi profil
          router.push('/lengkapi-profil')
        } else {
          // Profil sudah lengkap, redirect ke dashboard
          router.push('/dashboard')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Email atau password salah')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
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
            Selamat Datang Kembali!
          </h1>
          <p className="text-gray-600">
            Masuk untuk melanjutkan tracking gizi Anda
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-emerald-100 p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-800" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  placeholder="nama@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-800" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  placeholder="Masukkan password"
                  required
                />
              </div>
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
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                'Masuk...'
              ) : (
                <>
                  Masuk
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 text-center">
            <span className="text-gray-600">
              Belum punya akun?{' '}
              <a href="/register" className="text-emerald-600 font-semibold hover:text-emerald-700">
                Daftar gratis
              </a>
            </span>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <a href="/" className="text-gray-600 hover:text-gray-900 transition">
            ← Kembali ke Beranda
          </a>
        </div>
      </div>
    </div>
  )
}