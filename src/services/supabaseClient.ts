import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  // ช่วยดีบักตอนลืมตั้งค่า .env — ไม่ throw error เพื่อไม่ให้แอปพังทั้งหน้า
  console.error(
    'Supabase env vars ไม่ครบ: ตรวจสอบ VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY ใน .env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
