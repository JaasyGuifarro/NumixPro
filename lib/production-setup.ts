/**
 * Configuración para entornos de producción
 */

import { setupGlobalErrorHandling } from "./error-logger"
import { initPerformanceMonitoring } from "./performance-monitor"
import { enhancedSyncManager } from "./enhanced-sync-manager"
import { cleanupStorage, initStorageMetadata } from "./storage-manager"

/**
 * Inicializa todas las mejoras para producción
 */
export function initProductionEnhancements(): void {
  if (typeof window === "undefined") return

  // Configurar manejo global de errores
  setupGlobalErrorHandling()

  // Inicializar monitoreo de rendimiento
  initPerformanceMonitoring()

  // Inicializar metadatos de almacenamiento
  initStorageMetadata()

  // Programar limpieza periódica de almacenamiento
  scheduleStorageCleanup()

  // Registrar eventos de ciclo de vida de la aplicación
  registerAppLifecycleEvents()

  console.log("Production enhancements initialized")
}

/**
 * Programa limpieza periódica de almacenamiento
 */
function scheduleStorageCleanup(): void {
  // Ejecutar limpieza inicial después de 5 minutos
  setTimeout(
    () => {
      cleanupStorage()

      // Programar limpieza periódica cada 24 horas
      setInterval(
        () => {
          cleanupStorage()
        },
        24 * 60 * 60 * 1000,
      )
    },
    5 * 60 * 1000,
  )
}

/**
 * Registra eventos del ciclo de vida de la aplicación
 */
function registerAppLifecycleEvents(): void {
  // Sincronizar al cerrar la página
  window.addEventListener("beforeunload", () => {
    if (enhancedSyncManager && enhancedSyncManager.hasPendingOperations()) {
      enhancedSyncManager.forceSyncNow()
    }
  })

  // Sincronizar cuando la página vuelve a estar visible
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && enhancedSyncManager) {
      enhancedSyncManager.forceSyncNow()
    }
  })
}

/**
 * Verifica si la aplicación está en modo de producción
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production"
}

/**
 * Verifica si la aplicación está en modo de desarrollo
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development"
}

