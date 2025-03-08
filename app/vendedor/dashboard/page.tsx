"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { LogOut, DollarSign, Calendar, Users, FileText, BarChart3 } from "lucide-react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { subscribeToEvents } from "@/lib/events"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { supabase } from "@/lib/supabase-client"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"

// Importar los componentes reutilizables
import { PageHeader } from "@/components/ui/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ActionCard } from "@/components/ui/action-card"
import { SyncStatusIndicator } from "@/components/ui/sync-status-indicator"

// Componente memoizado para las estadísticas
const StatCard = React.memo(
  ({
    value,
    label,
    icon,
  }: {
    value: string | number
    label: string
    icon: React.ReactNode
  }) => {
    return (
      <Card className="bg-white/5 border-0 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{label}</p>
            <h3 className="text-2xl font-bold text-[#4ECDC4]">{value}</h3>
          </div>
          <div className="h-12 w-12 rounded-lg bg-[#4ECDC4]/10 flex items-center justify-center">{icon}</div>
        </div>
      </Card>
    )
  },
)
StatCard.displayName = "StatCard"

function VendorDashboardContent() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [stats, setStats] = useState({
    totalSales: 0,
    activeDraws: 0,
    totalCustomers: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Función para cargar estadísticas
  const fetchStats = useCallback(async () => {
    try {
      // Verificar que tenemos un usuario autenticado
      if (!user) {
        setError("Error: No hay usuario autenticado")
        setIsLoading(false)
        return
      }

      const events = JSON.parse(localStorage.getItem("events") || "[]")
      const activeDraws = events.filter((event: any) => event.active).length

      // Obtener tickets directamente de Supabase
      const { data: allTickets, error } = await supabase.from("tickets").select("*").eq("vendor_email", user.email)

      if (error) {
        console.error("Error fetching tickets:", error)
        setError("Error al cargar tickets")
        setIsLoading(false)
        return
      }

      // Calculate total sales and customers
      let totalSales = 0
      const customers = new Set()

      allTickets.forEach((ticket) => {
        totalSales += ticket.amount
        customers.add(ticket.client_name)
      })

      setStats({
        totalSales,
        activeDraws,
        totalCustomers: customers.size,
      })

      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching stats:", error)
      setError("Error al cargar estadísticas")
      setIsLoading(false)
    }
  }, [user])

  // Efecto para cargar estadísticas iniciales
  useEffect(() => {
    fetchStats()

    // Suscribirse a cambios en eventos con manejo de errores mejorado
    let unsubscribe = () => {}
    try {
      unsubscribe = subscribeToEvents((updatedEvents) => {
        console.log("Eventos actualizados, recargando estadísticas...")
        fetchStats()
      })
    } catch (subscriptionError) {
      console.error("Error al suscribirse a eventos:", subscriptionError)
    }

    // Limpiar suscripción al desmontar
    return () => {
      try {
        unsubscribe()
      } catch (cleanupError) {
        console.error("Error al limpiar suscripción:", cleanupError)
      }
    }
  }, [fetchStats])

  // Memoizar las acciones rápidas para evitar recreaciones innecesarias
  const quickActions = useMemo(
    () => [
      {
        title: "Gestionar Sorteos",
        description: "Ver y gestionar todos los sorteos activos",
        icon: <FileText className="h-5 w-5 text-gray-400" />,
        href: "/sorteos",
      },
      {
        title: "Reporte General",
        description: "Ver el reporte general de ventas",
        icon: <BarChart3 className="h-5 w-5 text-gray-400" />,
        href: "/vendedor/reportes",
      },
    ],
    [],
  )

  // Mostrar un indicador de carga durante la carga inicial
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-t-[#4ECDC4] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
          <p>Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  // Mostrar un mensaje de error si hay un error
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 max-w-md mx-auto">
          <h3 className="text-lg font-semibold mb-2">Error</h3>
          <p className="text-sm text-gray-300 mb-4">{error}</p>
          <Button onClick={fetchStats} className="w-full">
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/10">
        <PageHeader
          title={
            <span className="bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] bg-clip-text text-transparent">NUMIX</span>
          }
          rightContent={
            <div className="flex items-center gap-2">
              <SyncStatusIndicator />
              <Button onClick={signOut} variant="ghost" className="text-white hover:bg-white/10">
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Cerrar Sesión</span>
              </Button>
            </div>
          }
        />
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        <ErrorBoundary>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-8">
            <StatCard
              value={`$${stats.totalSales.toFixed(2)}`}
              label="Ventas Totales"
              icon={<DollarSign className="h-6 w-6 text-[#4ECDC4]" />}
            />
            <StatCard
              value={stats.activeDraws}
              label="Total Sorteos"
              icon={<Calendar className="h-6 w-6 text-[#4ECDC4]" />}
            />
            <StatCard
              value={stats.totalCustomers}
              label="Total Clientes"
              icon={<Users className="h-6 w-6 text-[#4ECDC4]" />}
            />
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-lg md:text-xl font-semibold text-white">Acciones Rápidas</h2>

            <div className="grid gap-4 md:grid-cols-2">
              {quickActions.map((action, index) => (
                <ActionCard
                  key={index}
                  title={action.title}
                  description={action.description}
                  icon={action.icon}
                  href={action.href}
                />
              ))}
            </div>
          </div>
        </ErrorBoundary>
      </main>
    </div>
  )
}

export default function VendorDashboard() {
  return (
    <ProtectedRoute requiredRole="vendor">
      <VendorDashboardContent />
    </ProtectedRoute>
  )
}

