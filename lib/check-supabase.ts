import { supabase } from "./supabase"

export async function checkSupabaseConnection() {
  try {
    // Intentar una consulta simple para verificar la conexión
    const { data, error } = await supabase.from("events").select("count").limit(1)

    if (error) {
      console.error("Error de conexión a Supabase:", error)
      return {
        connected: false,
        error: error.message,
      }
    }

    return {
      connected: true,
      data,
    }
  } catch (error) {
    console.error("Error al verificar conexión a Supabase:", error)
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

