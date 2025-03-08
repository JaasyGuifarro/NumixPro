import { supabase, supabaseAdmin } from "./supabase"
import type { Ticket } from "@/types"
import { generateUUID } from "./uuid-utils"

// Modificar la declaración de mapTicketFromSupabase para exportarla
export const mapTicketFromSupabase = (ticket: any): Ticket => ({
  id: ticket.id,
  clientName: ticket.client_name,
  amount: ticket.amount,
  numbers: ticket.numbers || "",
  vendorEmail: ticket.vendor_email,
  rows: Array.isArray(ticket.rows) ? ticket.rows : JSON.parse(ticket.rows || "[]"),
})

// Convertir de formato de la aplicación a formato Supabase
const mapTicketToSupabase = (ticket: Ticket, eventId: string) => ({
  id: ticket.id,
  event_id: eventId,
  client_name: ticket.clientName,
  amount: ticket.amount,
  numbers: ticket.numbers,
  vendor_email: ticket.vendorEmail || "unknown", // Asegurar que siempre haya un valor
  rows: ticket.rows,
})

// Modificar la función getTickets para que solo obtenga datos de Supabase
export async function getTickets(eventId: string): Promise<Ticket[]> {
  try {
    // Obtener el email del vendedor actual
    const currentVendorEmail = localStorage.getItem("currentVendorEmail")

    if (!currentVendorEmail) {
      console.error("No se encontró email de vendedor actual")
      return []
    }

    // Consultar tickets del evento específico para el vendedor actual
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("event_id", eventId)
      .eq("vendor_email", currentVendorEmail)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching tickets:", error)
      return []
    }

    return data.map(mapTicketFromSupabase)
  } catch (error) {
    console.error("Error in getTickets:", error)
    return []
  }
}

// Verificar si un ticket es duplicado
async function isTicketDuplicate(ticket: Ticket, eventId: string): Promise<boolean> {
  try {
    // Verificar si ya existe un ticket con la misma información
    const { data, error } = await supabase
      .from("tickets")
      .select("id")
      .eq("event_id", eventId)
      .eq("client_name", ticket.clientName)
      .eq("vendor_email", ticket.vendorEmail)

    if (error) {
      console.error("Error checking for duplicate ticket:", error)
      return false
    }

    // Si encontramos algún ticket (excluyendo el actual en caso de actualización)
    return data.some((t) => t.id !== ticket.id)
  } catch (error) {
    console.error("Error in isTicketDuplicate:", error)
    return false
  }
}

// Modificar la función createTicket para que solo guarde en Supabase
export async function createTicket(ticket: Omit<Ticket, "id">, eventId: string): Promise<Ticket | null> {
  try {
    // Asegurar que el ticket tenga un vendedor asociado
    const currentVendorEmail = localStorage.getItem("currentVendorEmail")
    if (!currentVendorEmail) {
      throw new Error("No se encontró email de vendedor actual")
    }

    // Generar un UUID válido
    const newTicket = {
      ...ticket,
      id: generateUUID(),
      vendorEmail: currentVendorEmail, // Asegurar que siempre tenga vendorEmail
    }

    // Verificar si es un duplicado
    const isDuplicate = await isTicketDuplicate(newTicket as Ticket, eventId)
    if (isDuplicate) {
      throw new Error("Ya existe un ticket similar para este cliente")
    }

    const supabaseTicket = mapTicketToSupabase(newTicket as Ticket, eventId)

    // Intentar crear en Supabase
    const { data, error } = await supabaseAdmin.from("tickets").insert([supabaseTicket]).select().single()

    if (error) {
      console.error("Error creating ticket in Supabase:", error)
      return null
    }

    return mapTicketFromSupabase(data)
  } catch (error) {
    console.error("Error in createTicket:", error)
    return null
  }
}

// Modificar la función updateTicket para que solo actualice en Supabase
export async function updateTicket(ticket: Ticket, eventId: string): Promise<Ticket | null> {
  try {
    // Asegurar que el ticket tenga un vendedor asociado
    const currentVendorEmail = localStorage.getItem("currentVendorEmail")
    if (!currentVendorEmail) {
      throw new Error("No se encontró email de vendedor actual")
    }

    // Asegurar que solo se puedan actualizar tickets propios
    if (ticket.vendorEmail && ticket.vendorEmail !== currentVendorEmail) {
      throw new Error("No puedes modificar tickets de otros vendedores")
    }

    // Asegurar que el ticket tenga vendorEmail
    const updatedTicket = {
      ...ticket,
      vendorEmail: currentVendorEmail,
    }

    const supabaseTicket = mapTicketToSupabase(updatedTicket, eventId)

    // Actualizar en Supabase
    const { data, error } = await supabaseAdmin
      .from("tickets")
      .update(supabaseTicket)
      .eq("id", ticket.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating ticket in Supabase:", error)
      return null
    }

    return mapTicketFromSupabase(data)
  } catch (error) {
    console.error("Error in updateTicket:", error)
    return null
  }
}

// Modificar la función deleteTicket para que solo elimine de Supabase
export async function deleteTicket(id: string, eventId: string): Promise<boolean> {
  try {
    // Asegurar que el ticket tenga un vendedor asociado
    const currentVendorEmail = localStorage.getItem("currentVendorEmail")
    if (!currentVendorEmail) {
      throw new Error("No se encontró email de vendedor actual")
    }

    // Verificar que el ticket pertenezca al vendedor actual
    const { data, error } = await supabase.from("tickets").select("vendor_email").eq("id", id).single()

    if (error) {
      console.error("Error checking ticket ownership:", error)
      return false
    }

    if (data.vendor_email && data.vendor_email !== currentVendorEmail) {
      throw new Error("No puedes eliminar tickets de otros vendedores")
    }

    // Eliminar de Supabase
    const { error: deleteError } = await supabaseAdmin.from("tickets").delete().eq("id", id)

    if (deleteError) {
      console.error("Error deleting ticket from Supabase:", deleteError)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteTicket:", error)
    return false
  }
}

// Eliminar la función updateLocalTickets ya que no la necesitamos más
// function updateLocalTickets(eventId: string, vendorEmail: string, updateFn: (tickets: Ticket[]) => Ticket[]) {
//   ...
// }

// Modificar la función migrateTicketsWithoutVendor para mantenerla funcional
export async function migrateTicketsWithoutVendor(eventId: string): Promise<boolean> {
  try {
    const currentVendorEmail = localStorage.getItem("currentVendorEmail")
    if (!currentVendorEmail) return false

    // Obtener tickets sin vendedor
    const { data, error } = await supabase.from("tickets").select("*").eq("event_id", eventId).is("vendor_email", null)

    if (error) {
      console.error("Error fetching tickets without vendor:", error)
      return false
    }

    if (!data || data.length === 0) return true

    // Actualizar tickets sin vendedor
    const updates = data.map((ticket) => ({
      id: ticket.id,
      vendor_email: currentVendorEmail,
    }))

    const { error: updateError } = await supabaseAdmin.from("tickets").upsert(updates)

    if (updateError) {
      console.error("Error updating tickets without vendor:", updateError)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in migrateTicketsWithoutVendor:", error)
    return false
  }
}

// Modificar la función subscribeToTickets para mantenerla funcional
export function subscribeToTickets(eventId: string, callback: (tickets: Ticket[]) => void): () => void {
  // Verificar si estamos en el navegador
  if (typeof window === "undefined") {
    console.log("No se puede suscribir a tickets en el servidor")
    return () => {} // Retornar función vacía en el servidor
  }

  // Obtener el email del vendedor actual
  const currentVendorEmail = localStorage.getItem("currentVendorEmail")
  if (!currentVendorEmail) {
    console.error("No se encontró email de vendedor actual")
    return () => {}
  }

  try {
    // Crear un canal con un ID único para evitar conflictos
    const channelId = `tickets-changes-${eventId}-${currentVendorEmail}-${Date.now()}`

    console.log(`Creando canal de suscripción para tickets: ${channelId}`)

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
          table: "tickets",
          filter: `event_id=eq.${eventId} AND vendor_email=eq.${currentVendorEmail}`, // Solo tickets del vendedor actual
        },
        async (payload) => {
          try {
            console.log("Cambio detectado en tickets:", payload)
            // Cuando hay un cambio, obtener todos los tickets actualizados
            const tickets = await getTickets(eventId)
            callback(tickets)
          } catch (error) {
            console.error("Error al procesar cambio en tickets:", error)
          }
        },
      )
      .subscribe((status, error) => {
        console.log(`Estado de suscripción a tickets (${channelId}):`, status)

        if (error) {
          console.error(`Error en la suscripción a tickets (${channelId}):`, error)
        }
      })

    // Devolver función para cancelar la suscripción
    return () => {
      console.log(`Cancelando suscripción al canal de tickets ${channelId}`)
      supabase.removeChannel(channel)
    }
  } catch (error) {
    console.error("Error al crear suscripción a tickets:", error)
    // Retornar una función vacía en caso de error
    return () => {
      console.log("Limpieza de suscripción a tickets fallida")
    }
  }
}

// Eliminar o simplificar la función migrateTicketsFormat ya que no la necesitamos más
export async function migrateTicketsFormat(): Promise<boolean> {
  // Ya no necesitamos migrar tickets de localStorage a Supabase
  return true
}

