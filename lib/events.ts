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
  minNumber: event.min_number !== null ? event.min_number : 0,
  maxNumber: event.max_number !== null ? event.max_number : 99,
  excludedNumbers: event.excluded_numbers || "",
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
  min_number: event.minNumber,
  max_number: event.maxNumber,
  excluded_numbers: event.excludedNumbers,
  first_prize: event.awardedNumbers?.firstPrize,
  second_prize: event.awardedNumbers?.secondPrize,
  third_prize: event.awardedNumbers?.thirdPrize,
  awarded_at: event.awardedNumbers?.awardedAt,
})

// Obtener todos los eventos
export async function getEvents(): Promise<Event[]> {
  try {
    // Verificar la conexión a Supabase antes de realizar la consulta
    const { checkSupabaseConnection } = await import('./check-supabase')
    const connectionStatus = await checkSupabaseConnection()
    
    if (!connectionStatus.connected) {
      console.error(`Error de conexión a Supabase: ${connectionStatus.error}`)
      // Intentar obtener de localStorage como fallback
      if (typeof window !== "undefined") {
        const localEvents = localStorage.getItem("events")
        if (localEvents) {
          console.log("Usando datos de eventos desde localStorage debido a error de conexión")
          return JSON.parse(localEvents)
        }
      }
      return []
    }
    
    
    // Realizar la consulta con reintentos
    let attempts = 0
    const maxAttempts = 3
    let lastError = null
    
    while (attempts < maxAttempts) {
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .order("created_at", { ascending: false })
        
        if (error) {
          lastError = error
          console.error(`Error fetching events (intento ${attempts + 1}/${maxAttempts}):`, {
            message: error.message,
            details: error.details,
            code: error.code,
            hint: error.hint
          })
          attempts++
          if (attempts < maxAttempts) {
            // Esperar antes de reintentar (backoff exponencial)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)))
            continue
          }
          
          // Si llegamos aquí, se agotaron los reintentos
          // Intentar obtener de localStorage como fallback
          if (typeof window !== "undefined") {
            const localEvents = localStorage.getItem("events")
            if (localEvents) {
              console.log("Usando datos de eventos desde localStorage debido a error persistente")
              return JSON.parse(localEvents)
            }
          }
          return []
        }
        
        // Si llegamos aquí, la consulta fue exitosa
        const events = data.map(mapEventFromSupabase)
        
        // Actualizar localStorage para tener una copia local
        if (typeof window !== "undefined") {
          localStorage.setItem("events", JSON.stringify(events))
        }
        
        return events
      } catch (attemptError) {
        lastError = attemptError
        console.error(`Excepción al obtener eventos (intento ${attempts + 1}/${maxAttempts}):`, attemptError)
        attempts++
        if (attempts < maxAttempts) {
          // Esperar antes de reintentar
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)))
        }
      }
    }
    
    // Si llegamos aquí, se agotaron los reintentos
    console.error("Error persistente al obtener eventos después de múltiples intentos:", lastError)
    
    // Intentar obtener de localStorage como último recurso
    if (typeof window !== "undefined") {
      const localEvents = localStorage.getItem("events")
      if (localEvents) {
        console.log("Usando datos de eventos desde localStorage como último recurso")
        return JSON.parse(localEvents)
      }
    }
    return []
  } catch (error) {
    console.error("Error general en getEvents:", error instanceof Error ? {
      message: error.message,
      stack: error.stack
    } : error)
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
      min_number: event.minNumber ?? 0,
      max_number: event.maxNumber ?? 99,
      excluded_numbers: event.excludedNumbers ?? "",
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
      .update({
        ...supabaseEvent,
        status: supabaseEvent.status as "active" | "closed_awarded" | "closed_not_awarded"
      })
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
export async function subscribeToEvents(callback: (events: Event[]) => void): Promise<() => void> {
  // Verificar si estamos en el navegador
  if (typeof window === "undefined") {
    console.log("No se puede suscribir a eventos en el servidor")
    return () => {} // Retornar función vacía en el servidor
  }

  try {
    // Importar utilidades de fallback para manejar errores de RPC
    const { executeRPCWithFallback } = await import('./rpc-fallback-utils');
    
    // Crear un canal con un ID único para evitar conflictos
    const channelId = `events-changes-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    // Verificar si ya existe una suscripción activa y eliminarla
    const existingChannels = supabase.getChannels()
    existingChannels.forEach(channel => {
      if (channel.topic.startsWith('realtime:events-changes-')) {
        try {
          supabase.removeChannel(channel)
        } catch (removeError) {
          // Continuar con la operación incluso si hay error al eliminar
        }
      }
    })
    
    // Esperar un momento después de eliminar canales para evitar conflictos
    await new Promise(resolve => setTimeout(resolve, 300))

    // Contador de reconexiones para implementar backoff exponencial
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 20; // Aumentar el máximo de intentos
    
    // Crear un nuevo canal con configuración mejorada
    const channel = supabase.channel(channelId, {
      config: {
        broadcast: { self: true },
        presence: { key: "" },
        // Aumentar el tiempo de espera para evitar cierres prematuros
        timeout: 600000, // 600 segundos (10 minutos)
        retryIntervalMs: 3000, // 3 segundos entre reintentos (más rápido)
        retryMaxCount: 15 // Aumentar a 15 reintentos para mayor persistencia
      },
    })

    // Variable para rastrear si el canal está activo
    let isChannelActive = true;
    // Variable para rastrear si estamos procesando un evento
    let isProcessingEvent = false;
    // Variable para almacenar el último estado de error
    let lastErrorMessage = "";

    // Configurar la suscripción con manejo de errores mejorado
    channel
      .on(
        "postgres_changes",
        {
          event: "*", // Escuchar todos los eventos (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "events",
        },
        async (payload) => {
          // Evitar procesamiento si el canal ya no está activo
          if (!isChannelActive) return;
          
          // Implementar un sistema de cola simple para eventos concurrentes
          if (isProcessingEvent) {
            // Esperar a que termine el procesamiento actual antes de continuar
            let waitCount = 0;
            const maxWaits = 15; // Aumentar el máximo de intentos de espera
            
            while (isProcessingEvent && waitCount < maxWaits) {
              // Esperar antes de verificar nuevamente
              await new Promise(resolve => setTimeout(resolve, 200));
              waitCount++;
              
              // Verificar si el canal sigue activo después de cada espera
              if (!isChannelActive) return;
            }
            
            // Si después de esperar sigue procesando, salir para evitar bloqueo
            if (isProcessingEvent) return;
          }
          
          try {
            isProcessingEvent = true;
            
            // Usar executeRPCWithFallback para obtener eventos con manejo de errores mejorado
            const events = await executeRPCWithFallback<Event[], null>(
              'get_events',
              null,
              async () => await getEvents(),
              'subscribeToEvents-payload'
            );
            
            if (isChannelActive) {
              // Usar try/catch específico para el callback
              try {
                callback(events);
              } catch (callbackError) {
                console.error("Error en callback de eventos:", callbackError);
              }
            }
          } catch (error) {
            // El error ya se maneja en executeRPCWithFallback
          } finally {
            isProcessingEvent = false;
          }
        },
      )
      .subscribe(async (status, error) => {
        if (status === 'SUBSCRIBED') {
          // Resetear contador de intentos cuando se conecta exitosamente
          reconnectAttempts = 0;
          lastErrorMessage = "";
          
          try {
            // Usar executeRPCWithFallback para obtener eventos con manejo de errores mejorado
            const events = await executeRPCWithFallback<Event[], null>(
              'get_events',
              null,
              async () => await getEvents(),
              'subscribeToEvents-initial'
            );
            
            if (isChannelActive) {
              callback(events);
            }
          } catch (dataError) {
            // El error ya se maneja en executeRPCWithFallback
          }
        } else if (status === 'CHANNEL_ERROR') {
          // Evitar registrar el mismo error repetidamente
          const errorMessage = error ? (error instanceof Error ? error.message : String(error)) : "Error desconocido";
          if (errorMessage !== lastErrorMessage) {
            console.error(`Error en la suscripción (${channelId}):`, error);
            lastErrorMessage = errorMessage;
          }
          
          // Implementar backoff exponencial con jitter para evitar reconexiones simultáneas
          if (isChannelActive && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            // Calcular tiempo de espera con backoff exponencial y jitter
            const baseDelay = Math.min(1000 * Math.pow(1.5, reconnectAttempts - 1), 20000); // Máximo 20 segundos
            const jitter = Math.floor(Math.random() * 1000); // Añadir hasta 1 segundo de jitter
            const backoffTime = baseDelay + jitter;
            
            // Esperar antes de intentar reconectar
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            
            if (isChannelActive) {
              try {
                // Intentar reconectar el canal
                await channel.subscribe();
              } catch (reconnectError) {
                // Error ya manejado por el sistema de reintentos automáticos
              }
            }
          } else if (reconnectAttempts >= maxReconnectAttempts) {
            // Si se alcanzó el máximo de intentos, crear un nuevo canal
            isChannelActive = false;
            
            // Esperar un poco antes de intentar crear un nuevo canal
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Intentar crear una nueva suscripción recursivamente
            if (typeof window !== "undefined") {
              try {
                const newUnsubscribe = await subscribeToEvents(callback);
                return newUnsubscribe;
              } catch (renewError) {
                console.error("Error al renovar suscripción:", renewError);
              }
            }
          }
        } else if (error) {
          // Evitar registrar el mismo error repetidamente
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage !== lastErrorMessage) {
            console.error(`Error inesperado en la suscripción (${channelId}):`, error);
            lastErrorMessage = errorMessage;
          }
        }
      })

    // Devolver función para cancelar la suscripción
    return () => {
      isChannelActive = false;
      try {
        supabase.removeChannel(channel)
      } catch (cleanupError) {
        // Error ya manejado internamente
      }
    }
  } catch (error) {
    console.error("Error al crear suscripción a events:", error)
    
    // Implementar reintentos para la creación inicial de la suscripción
    return () => {}
  }
}

