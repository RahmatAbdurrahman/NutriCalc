// =====================================================
// SUPABASE CLIENT CONFIGURATION
// File: lib/supabase.ts
// =====================================================

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// =====================================================
// CLIENT-SIDE SUPABASE CLIENT
// Untuk digunakan di Client Components
// =====================================================
export const supabase = createClientComponentClient()

// =====================================================
// BROWSER CLIENT (Alternative)
// =====================================================
export const createBrowserClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// =====================================================
// SUPABASE TYPES (Database Types)
// =====================================================

export type Profile = {
  id: string
  tgl_lahir: string
  gender: 'pria' | 'wanita'
  tinggi_cm: number
  berat_kg: number
  level_aktivitas: number
  created_at?: string
  updated_at?: string
}

export type Food = {
  food_id: string
  food_name: string
  food_category: string
  energy_kcal: number
  protein_g: number
  fat_g: number
  carbs_g: number
  fiber_g?: number
  sodium_mg?: number
}

export type URTConversion = {
  urt_id: string
  food_id: string
  urt_name: string
  equivalent_grams: number
}

export type DailyLog = {
  log_id: number
  user_id: string
  food_id: string
  quantity_grams: number
  meal_type?: 'sarapan' | 'makan_siang' | 'makan_malam' | 'snack'
  consumed_at: string
  created_at?: string
}

export type Article = {
  article_id: string
  title: string
  thumbnail_url?: string
  external_url: string
  category?: string
  description?: string
  published_at?: string
}

export type NutritionTarget = {
  target_id: string
  user_id: string
  tdee_kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  sugar_limit_g?: number
  salt_limit_g?: number
  fat_limit_g?: number
  is_active: boolean
  calculation_method?: string
  created_at?: string
}

// =====================================================
// ACTIVITY LEVELS
// =====================================================
export const activityLevels = [
  { value: 1.2, label: 'Sangat Ringan', description: 'Tidak berolahraga, kerja kantoran' },
  { value: 1.375, label: 'Ringan', description: 'Olahraga ringan 1-3x/minggu' },
  { value: 1.55, label: 'Sedang', description: 'Olahraga sedang 3-5x/minggu' },
  { value: 1.725, label: 'Berat', description: 'Olahraga berat 6-7x/minggu' },
  { value: 1.9, label: 'Sangat Berat', description: 'Atlet, kerja fisik berat' },
]

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Menghitung usia dari tanggal lahir
 */
export function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

/**
 * Memanggil Edge Function untuk kalkulasi gizi
 */
export async function calculateNutrition(data: {
  usia: number
  gender: 'pria' | 'wanita'
  berat_kg: number
  tinggi_cm: number
  level_aktivitas: number
}) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-nutrition-needs`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(data)
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Gagal menghitung kebutuhan gizi')
  }

  return await response.json()
}

/**
 * Mendapatkan profil user lengkap
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data as Profile
}

/**
 * Update profil user
 */
export async function updateUserProfile(userId: string, profile: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Mendapatkan total kalori hari ini
 */
export async function getTodayCalories(userId: string) {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .rpc('get_daily_calories', {
      p_user_id: userId,
      p_date: today
    })

  if (error) throw error
  return data[0] || { 
    total_calories: 0, 
    total_protein: 0, 
    total_carbs: 0, 
    total_fat: 0 
  }
}

/**
 * Menambahkan makanan ke jurnal harian
 */
export async function addFoodLog(log: Omit<DailyLog, 'log_id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('daily_logs')
    .insert(log)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Mendapatkan jurnal makanan hari ini
 */
export async function getTodayFoodLogs(userId: string) {
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

  const { data, error } = await supabase
    .from('daily_logs')
    .select(`
      *,
      foods (*)
    `)
    .eq('user_id', userId)
    .gte('consumed_at', startOfDay)
    .lte('consumed_at', endOfDay)
    .order('consumed_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Search makanan
 */
export async function searchFoods(query: string) {
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .ilike('food_name', `%${query}%`)
    .limit(10)

  if (error) throw error
  return data as Food[]
}

/**
 * Mendapatkan URT dengan Smart Detection berdasarkan Nama Makanan
 * Otomatis menyarankan satuan ukuran yang sesuai berdasarkan kategori makanan
 */
export async function getFoodURTs(foodId: string) {
  // 1. Ambil data makanan
  const { data: food } = await supabase
    .from('foods')
    .select('food_name')
    .eq('food_id', foodId)
    .single();
  
  // 2. Ambil URT manual dari DB (jika ada)
  const { data: dbURTs } = await supabase
    .from('urt_conversions')
    .select('*')
    .eq('food_id', foodId);

  // 3. LOGIKA CERDAS (Berdasarkan Nama)
  let smartDefaults: any[] = [];
  
  if (food) {
    const name = food.food_name.toLowerCase();
    
    // ========================================
    // MINUMAN
    // ========================================
    if (name.includes('susu') || name.includes('teh') || name.includes('kopi') || 
        name.includes('sirup') || name.includes('jus') || name.includes('es ') ||
        name.includes('bir') || name.includes('squash') || name.includes('lemonade') ||
        name.includes('hangop') || name.includes('air')) {
      smartDefaults.push({ 
        urt_id: `auto-gelas-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Gelas', 
        equivalent_grams: 250 
      });
      smartDefaults.push({ 
        urt_id: `auto-cangkir-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Cangkir', 
        equivalent_grams: 150 
      });
    }
    
    // ========================================
    // MAKANAN POKOK (Nasi, Bubur, Mie, dll)
    // ========================================
    else if (name.includes('nasi') || name.includes('bubur') || name.includes('beras') ||
             name.includes('mie') || name.includes('mi ') || name.includes('bihun') ||
             name.includes('kwetiau') || name.includes('makaroni') || name.includes('spaghetti') ||
             name.includes('ketupat') || name.includes('lontong') || name.includes('lopis')) {
      smartDefaults.push({ 
        urt_id: `auto-piring-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Piring', 
        equivalent_grams: 200 
      });
      smartDefaults.push({ 
        urt_id: `auto-centong-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Centong', 
        equivalent_grams: 50 
      });
      smartDefaults.push({ 
        urt_id: `auto-mangkok-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Mangkok', 
        equivalent_grams: 150 
      });
    }
    
    // ========================================
    // LAUK PAUK (Daging, Ayam, Ikan, Seafood)
    // ========================================
    else if (name.includes('daging') || name.includes('ayam') || name.includes('ikan') || 
             name.includes('bebek') || name.includes('udang') || name.includes('cumi') ||
             name.includes('sapi') || name.includes('kambing') || name.includes('domba') ||
             name.includes('babi') || name.includes('kerbau') || name.includes('belut') ||
             name.includes('lele') || name.includes('gurami') || name.includes('mujair') ||
             name.includes('bandeng') || name.includes('cakalang') || name.includes('tongkol') ||
             name.includes('kuda') || name.includes('kelinci') || name.includes('angsa') ||
             name.includes('burung') || name.includes('itik') || name.includes('katak') ||
             name.includes('kodok') || name.includes('kerang') || name.includes('kepiting') ||
             name.includes('dendeng') || name.includes('abon') || name.includes('gepuk') ||
             name.includes('empal') || name.includes('rendang') || name.includes('sate')) {
      smartDefaults.push({ 
        urt_id: `auto-potong-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Potong Sedang', 
        equivalent_grams: 40 
      });
      smartDefaults.push({ 
        urt_id: `auto-ekor-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Ekor', 
        equivalent_grams: 50 
      });
    }
    
    // ========================================
    // TELUR
    // ========================================
    else if (name.includes('telur')) {
      smartDefaults.push({ 
        urt_id: `auto-butir-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Butir', 
        equivalent_grams: 55 
      });
    }
    
    // ========================================
    // BUAH-BUAHAN
    // ========================================
    else if (name.includes('pisang') || name.includes('apel') || name.includes('jeruk') || 
             name.includes('mangga') || name.includes('pepaya') || name.includes('semangka') ||
             name.includes('melon') || name.includes('nanas') || name.includes('durian') ||
             name.includes('rambutan') || name.includes('manggis') || name.includes('salak') ||
             name.includes('jambu') || name.includes('anggur') || name.includes('belimbing') ||
             name.includes('kedondong') || name.includes('nangka') || name.includes('alpukat') ||
             name.includes('markisa') || name.includes('duku') || name.includes('langsat') ||
             name.includes('sawo') || name.includes('kesemek') || name.includes('buah ')) {
      smartDefaults.push({ 
        urt_id: `auto-buah-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Buah Sedang', 
        equivalent_grams: 100 
      });
      smartDefaults.push({ 
        urt_id: `auto-potong-buah-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Potong', 
        equivalent_grams: 50 
      });
    }
    
    // ========================================
    // SAYURAN
    // ========================================
    else if (name.includes('bayam') || name.includes('kangkung') || name.includes('sawi') ||
             name.includes('kol') || name.includes('kubis') || name.includes('brokoli') ||
             name.includes('wortel') || name.includes('tomat') || name.includes('timun') ||
             name.includes('ketimun') || name.includes('labu') || name.includes('terong') ||
             name.includes('buncis') || name.includes('kacang panjang') || name.includes('pare') ||
             name.includes('paria') || name.includes('oyong') || name.includes('gambas') ||
             name.includes('daun ') || name.includes('pakis') || name.includes('pakui') ||
             name.includes('genjer') || name.includes('kemangi') || name.includes('selada')) {
      smartDefaults.push({ 
        urt_id: `auto-mangkok-sayur-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Mangkok', 
        equivalent_grams: 100 
      });
      smartDefaults.push({ 
        urt_id: `auto-ikat-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Ikat Kecil', 
        equivalent_grams: 50 
      });
    }
    
    // ========================================
    // ROTI, KUE, SNACK
    // ========================================
    else if (name.includes('roti') || name.includes('kue') || name.includes('biskuit') ||
             name.includes('cake') || name.includes('pie') || name.includes('donat') ||
             name.includes('wafer') || name.includes('keripik') || name.includes('kerupuk') ||
             name.includes('emping') || name.includes('rempeyek') || name.includes('onde') ||
             name.includes('apem') || name.includes('lupis') || name.includes('lemper') ||
             name.includes('nagasari') || name.includes('bika') || name.includes('lapis') ||
             name.includes('dodol') || name.includes('wajik') || name.includes('geplak') ||
             name.includes('combro') || name.includes('misro') || name.includes('cireng') ||
             name.includes('bakwan') || name.includes('gorengan')) {
      smartDefaults.push({ 
        urt_id: `auto-potong-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Potong/Iris', 
        equivalent_grams: 30 
      });
      smartDefaults.push({ 
        urt_id: `auto-buah-kue-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Buah', 
        equivalent_grams: 50 
      });
      smartDefaults.push({ 
        urt_id: `auto-bungkus-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Bungkus', 
        equivalent_grams: 25 
      });
    }
    
    // ========================================
    // TAHU & TEMPE
    // ========================================
    else if (name.includes('tahu') || name.includes('tempe')) {
      smartDefaults.push({ 
        urt_id: `auto-potong-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Potong Sedang', 
        equivalent_grams: 50 
      });
      smartDefaults.push({ 
        urt_id: `auto-papan-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Papan', 
        equivalent_grams: 100 
      });
    }
    
    // ========================================
    // ONCOM
    // ========================================
    else if (name.includes('oncom')) {
      smartDefaults.push({ 
        urt_id: `auto-potong-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Potong', 
        equivalent_grams: 40 
      });
    }
    
    // ========================================
    // KACANG-KACANGAN
    // ========================================
    else if (name.includes('kacang') && !name.includes('daun kacang')) {
      smartDefaults.push({ 
        urt_id: `auto-sdm-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Sendok Makan', 
        equivalent_grams: 15 
      });
      smartDefaults.push({ 
        urt_id: `auto-genggam-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Genggam', 
        equivalent_grams: 40 
      });
    }
    
    // ========================================
    // UBI, SINGKONG, KENTANG
    // ========================================
    else if (name.includes('ubi') || name.includes('singkong') || name.includes('ketela') ||
             name.includes('kentang') || name.includes('talas') || name.includes('gembili') ||
             name.includes('gadung') || name.includes('ganyong') || name.includes('uwi')) {
      smartDefaults.push({ 
        urt_id: `auto-buah-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Buah Sedang', 
        equivalent_grams: 100 
      });
      smartDefaults.push({ 
        urt_id: `auto-potong-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Potong', 
        equivalent_grams: 50 
      });
    }
    
    // ========================================
    // BUMBU & PENYEDAP (Sendok)
    // ========================================
    else if (name.includes('gula') || name.includes('garam') || name.includes('minyak') || 
             name.includes('mentega') || name.includes('margarin') || name.includes('sambal') || 
             name.includes('kecap') || name.includes('madu') || name.includes('saus') ||
             name.includes('cabai') || name.includes('bawang') || name.includes('jahe') ||
             name.includes('kunyit') || name.includes('lengkuas') || name.includes('kemiri') ||
             name.includes('merica') || name.includes('pala') || name.includes('cuka') ||
             name.includes('terasi') || name.includes('petis')) {
      smartDefaults.push({ 
        urt_id: `auto-sdm-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Sendok Makan', 
        equivalent_grams: 15 
      });
      smartDefaults.push({ 
        urt_id: `auto-sdt-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Sendok Teh', 
        equivalent_grams: 5 
      });
    }
    
    // ========================================
    // KEJU, MENTEGA, CREAM
    // ========================================
    else if (name.includes('keju') || name.includes('cream') || name.includes('krim')) {
      smartDefaults.push({ 
        urt_id: `auto-iris-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Iris/Slice', 
        equivalent_grams: 20 
      });
      smartDefaults.push({ 
        urt_id: `auto-sdm-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Sendok Makan', 
        equivalent_grams: 15 
      });
    }
    
    // ========================================
    // TEPUNG
    // ========================================
    else if (name.includes('tepung') || name.includes('maizena') || name.includes('terigu') ||
             name.includes('tapioka') || name.includes('sagu') || name.includes('havermout')) {
      smartDefaults.push({ 
        urt_id: `auto-sdm-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Sendok Makan', 
        equivalent_grams: 10 
      });
      smartDefaults.push({ 
        urt_id: `auto-gelas-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Gelas', 
        equivalent_grams: 120 
      });
    }
    
    // ========================================
    // COKLAT & PERMEN
    // ========================================
    else if (name.includes('coklat') || name.includes('permen') || name.includes('cokelat')) {
      smartDefaults.push({ 
        urt_id: `auto-batang-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Batang', 
        equivalent_grams: 40 
      });
      smartDefaults.push({ 
        urt_id: `auto-buah-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Buah', 
        equivalent_grams: 5 
      });
    }
    
    // ========================================
    // JAMUR
    // ========================================
    else if (name.includes('jamur')) {
      smartDefaults.push({ 
        urt_id: `auto-buah-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Buah', 
        equivalent_grams: 20 
      });
      smartDefaults.push({ 
        urt_id: `auto-genggam-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Genggam', 
        equivalent_grams: 40 
      });
    }
    
    // ========================================
    // MAKANAN SIAP SAJI
    // ========================================
    else if (name.includes('bakso') || name.includes('soto') || name.includes('gado-gado') ||
             name.includes('sate') || name.includes('rendang') || name.includes('gulai') ||
             name.includes('opor') || name.includes('semur') || name.includes('pepes') ||
             name.includes('bakar') || name.includes('goreng') || name.includes('tumis') ||
             name.includes('rebus') || name.includes('kukus')) {
      smartDefaults.push({ 
        urt_id: `auto-porsi-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Porsi', 
        equivalent_grams: 150 
      });
      smartDefaults.push({ 
        urt_id: `auto-mangkok-${foodId}`, 
        food_id: foodId, 
        urt_name: 'Mangkok', 
        equivalent_grams: 200 
      });
    }
  }
  
  // 4. Gabungkan Semua: Default Gram + Smart Defaults + DB URTs
  const defaultGramURT = {
    urt_id: `default-gram-${foodId}`,
    food_id: foodId,
    urt_name: 'gram',
    equivalent_grams: 1,
  };
  
  const allURTs = [defaultGramURT, ...smartDefaults];
  
  if (dbURTs && dbURTs.length > 0) {
    allURTs.push(...dbURTs);
  }
  
  // 5. Hilangkan duplikat nama URT (prioritaskan yang dari DB jika ada nama sama)
  // Kita balik array dulu agar yang terakhir (DB) menimpa yang awal (Smart)
  const uniqueURTs = Array.from(
    new Map(allURTs.reverse().map(item => [item.urt_name.toLowerCase(), item])).values()
  ).reverse();
  
  return uniqueURTs as URTConversion[];
}

/**
 * Mendapatkan semua artikel
 */
export async function getArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('published_at', { ascending: false })

  if (error) throw error
  return data as Article[]
}