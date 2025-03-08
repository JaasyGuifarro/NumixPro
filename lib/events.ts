import { supabase, supabaseAdmin } from "./supabase"
import type { Event } from "@/types"

// Convertir de formato Supabase a formato de la aplicación
const mapEventFromSupabase = (event: any): Event => ({
  id: event.id,
  name: event.name,
  startDate: event.start_date,
  endDate: event.end_date,
  startTime: event.start_time,
  endTime: event.end_time,
  active: event.active,
  repeatDaily: event.repeat_daily,
  status: event.status,
  awardedNumbers: event.first_prize
    ? {
        firstPrize: event.first_prize,
        secondPrize: event.second_prize,
        thirdPrize: event.third_prize,
        awardedAt: event.awarded_at,
      }
    : undefined,
  // Estos campos se calculan en la aplicación, no se almacenan en Supabase
  endDateTime: `${event.end_date} ${event.end_time}`,
  totalSold: 0,
  sellerTimes: 0,
  tickets: [],
  prize: 0,
  profit: 0,
})

// Convertir de formato de la aplicación a formato Supabase
const mapEventToSupabase = (event: Event) => ({
  name: event.name,
  start_date: event.startDate,
  end_date: event.endDate,
  start_time: event.startTime,
  end_time: event.endTime,
  active: event.active,
  repeat_daily: event.repeatDaily,
  status: event.status,
  first_prize: event.awardedNumbers?.firstPrize,
  second_prize: event.awardedNumbers?.secondPrize,
  third_prize: event.awardedNumbers?.thirdPrize,
  awarded_at: event.awardedNumbers?.awardedAt,
})

// Obtener todos los eventos
export async function getEvents(): Promise<Event[]> {
  try {
    const { data, error } = await supabase.from("events").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching events:", error)
      // Intentar obtener de localStorage como fallback
      if (typeof window !== "undefined") {
        const localEvents = localStorage.getItem("events")
        if (localEvents) {
          return JSON.parse(localEvents)
        }
      }
      return []
    }

    const events = data.map(mapEventFromSupabase)

    // Actualizar localStorage para tener una copia local
    if (typeof window !== "undefined") {
      localStorage.setItem("events", JSON.stringify(events))
    }

    return events
  } catch (error) {
    console.error("Error in getEvents:", error)
    // Intentar obtener de localStorage como fallback
    if (typeof window !== "undefined") {
      const localEvents = localStorage.getItem("events")
      if (localEvents) {
        return JSON.parse(localEvents)
      }
    }
    return []
  }
}

// Crear un nuevo evento
export async function createEvent(
  event: Omit<Event, "id" | "endDateTime" | "totalSold" | "sellerTimes" | "tickets" | "prize" | "profit">,
): Promise<Event | null> {
  try {
    const supabaseEvent = {
      name: event.name,
      start_date: event.startDate,
      end_date: event.endDate,
      start_time: event.startTime,
      end_time: event.endTime,
      active: event.active ?? true,
      repeat_daily: event.repeatDaily ?? false,
      status: event.status ?? "active",
    }

    // Usar supabaseAdmin en lugar de supabase
    const { data, error } = await supabaseAdmin.from("events").insert([supabaseEvent]).select().single()

    if (error) {
      console.error("Error creating event:", error)
      return null
    }

    const newEvent = mapEventFromSupabase(data)

    // Actualizar localStorage
    const localEvents = JSON.parse(localStorage.getItem("events") || "[]")
    localStorage.setItem("events", JSON.stringify([...localEvents, newEvent]))

    return newEvent
  } catch (error) {
    console.error("Error in createEvent:", error)
    return null
  }
}

// Actualizar un evento existente
export async function updateEvent(event: Event): Promise<Event | null> {
  try {
    const supabaseEvent = mapEventToSupabase(event)

    // Usar supabaseAdmin en lugar de supabase
    const { data, error } = await supabaseAdmin
      .from("events")
      .update(supabaseEvent)
      .eq("id", event.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating event:", error)
      return null
    }

    const updatedEvent = mapEventFromSupabase(data)

    // Actualizar localStorage
    const localEvents = JSON.parse(localStorage.getItem("events") || "[]")
    const updatedLocalEvents = localEvents.map((e: Event) => (e.id === event.id ? updatedEvent : e))
    localStorage.setItem("events", JSON.stringify(updatedLocalEvents))

    return updatedEvent
  } catch (error) {
    console.error("Error in updateEvent:", error)
    return null
  }
}

// Eliminar un evento
export async function deleteEvent(id: string): Promise<boolean> {
  try {
    // Usar supabaseAdmin en lugar de supabase
    const { error } = await supabaseAdmin.from("events").delete().eq("id", id)

    if (error) {
      console.error("Error deleting event:", error)
      return false
    }

    // Actualizar localStorage
    const localEvents = JSON.parse(localStorage.getItem("events") || "[]")
    const filteredEvents = localEvents.filter((e: Event) => e.id !== id)
    localStorage.setItem("events", JSON.stringify(filteredEvents))

    return true
  } catch (error) {
    console.error("Error in deleteEvent:", error)
    return false
  }
}

// Premiar un evento
export async function awardEvent(
  id: string,
  numbers: { firstPrize: string; secondPrize: string; thirdPrize: string },
): Promise<Event | null> {
  try {
    const now = new Date().toISOString()

    // Usar supabaseAdmin en lugar de supabase
    const { data, error } = await supabaseAdmin
      .from("events")
      .update({
        status: "closed_awarded",
        first_prize: numbers.firstPrize,
        second_prize: numbers.secondPrize,
        third_prize: numbers.thirdPrize,
        awarded_at: now,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error awarding event:", error)
      return null
    }

    const updatedEvent = mapEventFromSupabase(data)

    // Actualizar localStorage
    const localEvents = JSON.parse(localStorage.getItem("events") || "[]")
    const updatedLocalEvents = localEvents.map((e: Event) => (e.id === id ? updatedEvent : e))
    localStorage.setItem("events", JSON.stringify(updatedLocalEvents))

    return updatedEvent
  } catch (error) {
    console.error("Error in awardEvent:", error)
    return null
  }
}

// Suscribirse a cambios en eventos (tiempo real)
export function subscribeToEvents(callback: (events: Event[]) => void): () => void {
  // Verificar si estamos en el navegador
  if (typeof window === "undefined") {
    console.log("No se puede suscribir a eventos en el servidor")
    return () => {} // Retornar función vacía en el servidor
  }

  try {
    // Crear un canal con un ID único para evitar conflictos
    const channelId = `events-changes-${Date.now()}`

    console.log(`Creando canal de suscripción: ${channelId}`)

    const channel = supabase.channel(channelId, {
      config: {
        broadcast: { self: true },
        presence: { key: "" },
      },
    })

    // Configurar la suscripción con manejo de errores mejorado
    const subscription = channel
      .on(
        "postgres_changes",
        {
          event: "*", // Escuchar todos los eventos (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "events",
        },
        async (payload) => {
          try {
            console.log("Cambio detectado en events:", payload)
            // Cuando hay un cambio, obtener todos los eventos actualizados
            const events = await getEvents()
            callback(events)
          } catch (error) {
            console.error("Error al procesar cambio en events:", error)
          }
        },
      )
      .subscribe((status, error) => {
        console.log(`Estado de suscripción (${channelId}):`, status)

        if (error) {
          console.error(`Error en la suscripción (${channelId}):`, error)
        }
      })

    // Devolver función para cancelar la suscripción
    return () => {
      console.log(`Cancelando suscripción al canal ${channelId}`)
      supabase.removeChannel(channel)
    }
  } catch (error) {
    console.error("Error al crear suscripción a events:", error)
    // Retornar una función vacía en caso de error
    return () => {
      console.log("Limpieza de suscripción fallida")
    }
  }
}

