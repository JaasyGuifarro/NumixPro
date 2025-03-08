import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Modificar la forma en que se accede a las variables de entorno
// Crear el cliente de Supabase usando variables de entorno con fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://eemrrmkfxfdrwphsbgbz.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlbXJybWtmeGZkcndwaHNiZ2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4Njc2MzgsImV4cCI6MjA1NjQ0MzYzOH0.NnFnIbCb6M3KmKsKpAnvSm2MgxGBhukFvbWMdlyJP2Y"
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlbXJybWtmeGZkcndwaHNiZ2J6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDg2NzYzOCwiZXhwIjoyMDU2NDQzNjM4fQ.GQ6BNQYkcRyx9CMRtX9NZjt6qlq5Ys5xvT2nlylyZtE"

// Agregar una advertencia en desarrollo si las variables no están definidas
if (process.env.NODE_ENV === "development") {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn("NEXT_PUBLIC_SUPABASE_URL no está definida. Usando valor por defecto.")
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn("NEXT_PUBLIC_SUPABASE_ANON_KEY no está definida. Usando valor por defecto.")
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY no está definida. Usando valor por defecto.")
  }
}

// Cliente para operaciones del lado del cliente (con clave anónima)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Cliente para operaciones del lado del servidor (con clave de servicio)
// Solo usar en Server Components o Server Actions
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
  },
})

export async function checkRealtimeConnection() {
  try {
    const { data, error } = await supabase
      .channel("test")
      .on("system", { event: "connected" }, () => {})
      .subscribe()
    return !error
  } catch (error) {
    console.error("Error checking Realtime connection:", error)
    return false
  }
}

