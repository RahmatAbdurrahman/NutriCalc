'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getArticles, type Article } from '@/lib/supabase'
import { Heart, LogOut, BookOpen, ExternalLink } from 'lucide-react'

export default function ArtikelPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua')

  useEffect(() => {
    const checkUserAndLoadArticles = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const articlesData = await getArticles()
      setArticles(articlesData)
      setLoading(false)
    }

    checkUserAndLoadArticles()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const categories = ['Semua', 'Edukasi', 'Panduan', 'Resep']
  
  const filteredArticles = selectedCategory === 'Semua' 
    ? articles 
    : articles.filter(a => a.category === selectedCategory)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat artikel...</p>
        </div>
      </div>
    )
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
              <a href="/kalkulator" className="text-gray-700 hover:text-emerald-600">Kalkulator</a>
              <a href="/artikel" className="text-emerald-600 font-semibold">Artikel</a>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-3 bg-emerald-100 rounded-2xl mb-4">
            <BookOpen className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Artikel & Edukasi Gizi
          </h1>
          <p className="text-xl text-gray-600">
            Pelajari lebih dalam tentang nutrisi dan gaya hidup sehat
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.map((article) => (
            <a
              key={article.article_id}
              href={article.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2"
            >
              {/* Thumbnail */}
              <div className="relative h-48 bg-gradient-to-br from-emerald-100 to-teal-100 overflow-hidden">
                {article.thumbnail_url ? (
                  <img
                    src={article.thumbnail_url}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-emerald-600 opacity-50" />
                  </div>
                )}
                
                {/* Category Badge */}
                {article.category && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-emerald-600">
                    {article.category}
                  </div>
                )}

                {/* External Link Icon */}
                <div className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                  <ExternalLink className="w-5 h-5 text-emerald-600" />
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
                  {article.title}
                </h3>
                
                {article.description && (
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {article.description}
                  </p>
                )}

                {/* Read More */}
                <div className="mt-4 flex items-center gap-2 text-emerald-600 font-medium text-sm">
                  Baca Selengkapnya
                  <ExternalLink className="w-4 h-4" />
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Empty State */}
        {filteredArticles.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Tidak ada artikel di kategori ini</p>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-16 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border-2 border-blue-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            💡 Tahukah Anda?
          </h3>
          <p className="text-gray-700 mb-4">
            Artikel-artikel di NutriCalc+ dikurasi dari sumber terpercaya seperti Kementerian Kesehatan RI, 
            WHO, dan media kesehatan yang kredibel. Kami berkomitmen untuk memberikan informasi gizi yang 
            akurat dan berbasis ilmiah.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700">
              ✅ Terverifikasi
            </span>
            <span className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700">
              📚 Berbasis Riset
            </span>
            <span className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700">
              🇮🇩 Untuk Indonesia
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}