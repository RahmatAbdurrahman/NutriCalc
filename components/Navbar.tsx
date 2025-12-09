'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation' // Untuk mengetahui page aktif
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Menu, X, LogOut } from 'lucide-react'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname() // Mengambil URL saat ini (misal: '/dashboard')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Fungsi helper untuk mengecek link aktif
  const isActive = (path: string) => pathname === path

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Riwayat', href: '/riwayat' },
    { name: 'Database Pangan', href: '/kalkulator' },
    { name: 'Artikel', href: '/artikel' },
  ]

  return (
    <motion.nav 
      initial={{ y: -100 }} animate={{ y: 0 }}
      className="sticky top-0 z-40 bg-white/40 backdrop-blur-xl border-b border-white/50 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Area */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/dashboard')}>
            <motion.img 
              src="/logo.png" 
              alt="Logo" 
              whileHover={{ rotate: 10, scale: 1.1 }} 
              className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-emerald-500/20" 
            />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-gray-800 to-emerald-800">
              NutriCalc<span className="text-emerald-500">+</span>
            </span>
          </div>

          {/* Desktop Menu (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex gap-6 text-sm font-medium text-gray-600">
              {navLinks.map((link) => (
                <a 
                  key={link.href}
                  href={link.href}
                  className={`transition pb-1 border-b-2 ${
                    isActive(link.href) 
                      ? 'text-emerald-700 font-bold border-emerald-500' 
                      : 'border-transparent hover:text-emerald-600 hover:border-emerald-200'
                  }`}
                >
                  {link.name}
                </a>
              ))}
            </div>
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-full border border-transparent hover:border-red-200 transition-all text-sm font-bold"
            >
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </div>

          {/* Mobile Menu Button (Hamburger) */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-gray-600 hover:bg-white/50 transition"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu (Animated) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-white/90 backdrop-blur-xl border-t border-white/50 shadow-lg"
          >
            <div className="px-4 pt-4 pb-6 space-y-2">
              {navLinks.map((link) => (
                <a 
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-3 rounded-xl transition font-medium ${
                    isActive(link.href)
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'hover:bg-white/50 text-gray-600'
                  }`}
                >
                  {link.name}
                </a>
              ))}
              
              <div className="pt-4 mt-4 border-t border-gray-100">
                <button 
                  onClick={handleLogout} 
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition"
                >
                  <LogOut className="w-4 h-4" /> Keluar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}