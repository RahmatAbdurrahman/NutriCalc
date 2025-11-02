'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, calculateNutrition, activityLevels } from '@/lib/supabase'
import { Heart, LogOut, Calculator, Save } from 'lucide-react'

export default function KalkulatorPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    usia: '',
    gender: 'pria' as 'pria' | 'wanita',
    berat_kg: '',
    tinggi_cm: '',
    level_aktivitas: 1.55
  })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Load current profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        const birthDate = new Date(profile.tgl_lahir)
        const age = new Date().getFullYear() - birthDate.getFullYear()
        
        setFormData({
          usia: age.toString(),
          gender: profile.gender,
          berat_kg: profile.berat_kg.toString(),
          tinggi_cm: profile.tinggi_cm.toString(),
          level_aktivitas: profile.level_aktivitas
        })
      }
    }
    checkUser()
  }, [router])

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const data = {
        usia: parseInt(formData.usia),
        gender: formData.gender,
        berat_kg: parseFloat(formData.berat_kg),
        tinggi_cm: parseFloat(formData.tinggi_cm),
        level_aktivitas: formData.level_aktivitas
      }

      const response = await calculateNutrition(data)
      setResult(response.data)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAsNewTarget = async () => {
    if (!user || !result) return

    setSaving(true)

    try {
      // Update profile with new data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          berat_kg: parseFloat(formData.berat_kg),
          tinggi_cm: parseInt(formData.tinggi_cm),
          level_aktivitas: formData.level_aktivitas
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      alert('✅ Target baru berhasil disimpan!')
      router.push('/dashboard')
    } catch (err: any) {
      alert('❌ Gagal menyimpan: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* NAVBAR */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                NutriCalc+
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/dashboard" className="text-gray-700 hover:text-emerald-600">Dashboard</a>
              <a href="/kalkulator" className="text-emerald-600 font-semibold">Kalkulator</a>
              <a href="/artikel" className="text-gray-700 hover:text-emerald-600">Artikel</a>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 transition"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-emerald-100 rounded-2xl mb-4">
            <Calculator className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Kalkulator Gizi
          </h1>
          <p className="text-xl text-gray-600">
            Hitung ulang kebutuhan gizi Anda dengan data terbaru
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl shadow-emerald-100 p-8 md:p-12">
          <form onSubmit={handleCalculate} className="space-y-6">
            {/* Usia & Gender */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usia (tahun)
                </label>
                <input
                  type="number"
                  value={formData.usia}
                  onChange={(e) => setFormData({ ...formData, usia: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Kelamin
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'pria' | 'wanita' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                >
                  <option value="pria">Pria</option>
                  <option value="wanita">Wanita</option>
                </select>
              </div>
            </div>

            {/* Berat & Tinggi */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Berat Badan (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.berat_kg}
                  onChange={(e) => setFormData({ ...formData, berat_kg: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tinggi Badan (cm)
                </label>
                <input
                  type="number"
                  value={formData.tinggi_cm}
                  onChange={(e) => setFormData({ ...formData, tinggi_cm: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            {/* Level Aktivitas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level Aktivitas
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

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Menghitung...' : '🧮 Hitung Kebutuhan Gizi'}
            </button>
          </form>

          {/* RESULT */}
          {result && (
            <div className="mt-10 p-8 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                📊 Hasil Kalkulasi
              </h3>

              {/* Main Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl text-center">
                  <div className="text-3xl font-bold text-emerald-600">{result.tdee}</div>
                  <div className="text-sm text-gray-600">Kalori/Hari</div>
                </div>
                <div className="bg-white p-4 rounded-xl text-center">
                  <div className="text-3xl font-bold text-blue-600">{result.protein_g}g</div>
                  <div className="text-sm text-gray-600">Protein</div>
                </div>
                <div className="bg-white p-4 rounded-xl text-center">
                  <div className="text-3xl font-bold text-amber-600">{result.carbs_g}g</div>
                  <div className="text-sm text-gray-600">Karbohidrat</div>
                </div>
                <div className="bg-white p-4 rounded-xl text-center">
                  <div className="text-3xl font-bold text-purple-600">{result.fat_g}g</div>
                  <div className="text-sm text-gray-600">Lemak</div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl">
                  <div className="text-sm text-gray-600 mb-1">BMI</div>
                  <div className="text-xl font-bold text-gray-900">{result.bmi}</div>
                  <div className="text-sm text-emerald-600">{result.bmi_category}</div>
                </div>
                <div className="bg-white p-4 rounded-xl">
                  <div className="text-sm text-gray-600 mb-1">Metode Kalkulasi</div>
                  <div className="text-sm font-semibold text-gray-900">{result.calculation_method}</div>
                </div>
              </div>

              {/* GGL Limits */}
              <div className="bg-white p-4 rounded-xl mb-6">
                <div className="font-semibold text-gray-900 mb-3">Batasan GGL (Gula, Garam, Lemak)</div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Gula Maks</div>
                    <div className="font-bold text-amber-600">{result.sugar_limit_g}g/hari</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Garam Maks</div>
                    <div className="font-bold text-red-600">{result.salt_limit_g}g/hari</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Lemak Maks</div>
                    <div className="font-bold text-purple-600">{result.fat_limit_g}g/hari</div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveAsNewTarget}
                disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Menyimpan...' : 'Simpan Sebagai Target Baru'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}