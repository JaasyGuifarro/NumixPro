"use client"

import type React from "react"
import { useEffect } from "react"
import { initAsmJsEnvironment } from "@/lib/asm-js-initializer"
import { DynamicFavicon } from "@/components/dynamic-favicon"
import { ResourceOptimizer } from "@/components/resource-optimizer"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  // Inicializar el entorno asm.js cuando se carga la aplicación
  useEffect(() => {
    // Inicializar el entorno asm.js
    initAsmJsEnvironment()

    // Manejar errores de asm.js
    const originalConsoleError = console.error
    console.error = (...args) => {
      // Verificar si es un error de asm.js
      const errorString = args.join(" ")
      if (errorString.includes("Invalid asm.js") || errorString.includes("Undefined global variable")) {
        console.warn("Detectado error de asm.js:", errorString)

        // Reinicializar el entorno asm.js
        initAsmJsEnvironment()

        // No mostrar el error original para evitar confusión
        return
      }

      // Para otros errores, usar el comportamiento normal
      originalConsoleError.apply(console, args)
    }

    // Restaurar console.error original al desmontar
    return () => {
      console.error = originalConsoleError
    }
  }, [])

  return (
    <>
      {/* Script inline para inicializar asm.js lo antes posible */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
          // Definir variables globales necesarias para asm.js
          if (typeof window.Math === 'undefined') window.Math = Math;
          if (typeof window.NaN === 'undefined') window.NaN = Number.NaN;
          if (typeof window.Infinity === 'undefined') window.Infinity = Number.POSITIVE_INFINITY;
          
          // Asegurarse de que las funciones matemáticas específicas estén definidas
          if (typeof Math.fround === 'undefined') {
            Math.fround = function(x) { return new Float32Array([x])[0]; };
          }
          if (typeof Math.imul === 'undefined') {
            Math.imul = function(a, b) {
              return ((a & 0xffff) * (b & 0xffff) + ((((a >>> 16) & 0xffff) * (b & 0xffff) + (a & 0xffff) * ((b >>> 16) & 0xffff)) << 16) >>> 0) | 0;
            };
          }
          if (typeof Math.clz32 === 'undefined') {
            Math.clz32 = function(x) {
              if (x === 0) return 32;
              return 31 - Math.floor(Math.log(x >>> 0) / Math.LN2);
            };
          }
          
          // Definir tipos de arrays si no existen
          if (typeof window.Int8Array === 'undefined') window.Int8Array = Int8Array;
          if (typeof window.Uint8Array === 'undefined') window.Uint8Array = Uint8Array;
          if (typeof window.Int16Array === 'undefined') window.Int16Array = Int16Array;
          if (typeof window.Uint16Array === 'undefined') window.Uint16Array = Uint16Array;
          if (typeof window.Int32Array === 'undefined') window.Int32Array = Int32Array;
          if (typeof window.Uint32Array === 'undefined') window.Uint32Array = Uint32Array;
          if (typeof window.Float32Array === 'undefined') window.Float32Array = Float32Array;
          if (typeof window.Float64Array === 'undefined') window.Float64Array = Float64Array;
          
          // Definir global si no existe
          if (typeof window.global === 'undefined') window.global = window;
        `,
        }}
      />

      {/* Incluir ResourceOptimizer y DynamicFavicon */}
      <ResourceOptimizer />
      <DynamicFavicon />

      {children}
    </>
  )
}

