import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Crear el cliente de Supabase usando variables de entorno con fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ngzyyhebrphetphtlesu.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nenl5aGVicnBoZXRwaHRsZXN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzgyNTEsImV4cCI6MjA1NjUxNDI1MX0.7c0yuKwzYoWqGMjKfZOWyT4D2LA4zw5LYRu54KLbclU"
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nenl5aGVicnBoZXRwaHRsZXN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDkzODI1MSwiZXhwIjoyMDU2NTE0MjUxfQ.8Tfv0yIt0GIQT7zO4vs_ZYsovK5x23UXUBZA7cu58Os"

// Advertencia en desarrollo si las variables no están definidas
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
    // Configuración mejorada para conexiones realtime
    heartbeatIntervalMs: 15000, // Reducir el intervalo de heartbeat a 15 segundos
    disconnectAfterMs: 60000, // Aumentar el tiempo antes de desconectar a 60 segundos
    reconnectAfterMs: (attempts) => {
      // Backoff exponencial con jitter para reconexiones
      const baseDelay = Math.min(1000 * Math.pow(2, attempts), 10000); // Máximo 10 segundos
      return baseDelay + Math.floor(Math.random() * 1000); // Añadir jitter
    },
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Accept': 'application/json, */*',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      'Accept-Profile': 'public',
      'Content-Profile': 'public'
    }
  }
})
// Configuración optimizada para mejorar la estabilidad de las conexiones realtime

// Cliente para operaciones del lado del servidor (con clave de servicio)
// Solo usar en Server Components o Server Actions
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Accept': 'application/json, */*',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      'Accept-Profile': 'public',
      'Content-Profile': 'public'
    }
  }
})

export async function checkRealtimeConnection() {
  try {
    const { error } = await supabase
      .channel("test")
      .on("system", { event: "connected" }, () => {})
      .subscribe()
    return !error
  } catch (error) {
    console.error("Error checking Realtime connection:", error)
    return false
  }
}

