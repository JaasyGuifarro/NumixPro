"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Check, Trash2 } from "lucide-react"
import { PRICE_PER_TIME } from "@/lib/constants"
import { AccessibleFormField } from "@/components/ui/accessible-form"
import { useFocusTrap } from "@/hooks/useFocusTrap"

interface TicketRow {
  id: string
  times: string
  actions: string
  value: number
}

interface TicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientName: string
  onClientNameChange: (name: string) => void
  ticketRows: TicketRow[]
  onInputChange: (rowId: string, field: "times" | "actions", value: string) => void
  onAddRow: () => void
  onComplete: () => void
  onDelete?: () => void
  isReadOnly?: boolean
  title?: string
  selectedTicket?: any
}

// Exportar como función nombrada Y como exportación por defecto
export function TicketDialog({
  open,
  onOpenChange,
  clientName,
  onClientNameChange,
  ticketRows,
  onInputChange,
  onAddRow,
  onComplete,
  onDelete,
  isReadOnly = false,
  title = "Nuevo ticket",
  selectedTicket,
}: TicketDialogProps) {
  // Calculate totals
  const totalTimes = ticketRows.reduce((sum, row) => sum + (Number(row.times) || 0), 0)
  const totalPurchase = totalTimes * PRICE_PER_TIME

  // Modificar cómo se usa el hook useFocusTrap
  const focusTrapRef = useFocusTrap(open)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-black/95 text-white border-gray-800 max-w-md w-[95%] mx-auto"
        ref={focusTrapRef}
        id="ticket-dialog-content"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">{title}</DialogTitle>
          <DialogDescription className="text-center text-sm text-gray-400">
            {isReadOnly
              ? "Detalles del ticket seleccionado"
              : selectedTicket
                ? "Modifica los datos del ticket"
                : "Ingresa los datos para crear un nuevo ticket"}
          </DialogDescription>
        </DialogHeader>

        {/* Mostrar botón de eliminar solo si hay un ticket seleccionado y no es de solo lectura */}
        {selectedTicket && !isReadOnly && onDelete && (
          <div className="flex justify-end">
            <Button
              variant="destructive"
              onClick={() => {
                onOpenChange(false)
                onDelete()
              }}
              className="bg-red-500 hover:bg-red-600"
              aria-label="Eliminar ticket"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )}

        <div className="space-y-4">
          <AccessibleFormField id="client-name" label="Nombre del cliente" required={!isReadOnly}>
            <Input
              value={clientName}
              onChange={(e) => onClientNameChange(e.target.value)}
              className="bg-white/10 border-0 text-white"
              placeholder="Nombre del cliente"
              required
              disabled={isReadOnly}
              aria-invalid={!clientName && !isReadOnly ? "true" : undefined}
            />
          </AccessibleFormField>

          <div className="bg-gradient-to-r from-[#FF6B6B]/10 to-[#4ECDC4]/10 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-2 mb-2 text-sm font-medium text-gray-400 text-center">
              <div id="column-times">Tiempos</div>
              <div id="column-actions">Acciones</div>
              <div id="column-value">Valor</div>
            </div>

            {ticketRows.map((row, index) => (
              <div key={row.id} className="grid grid-cols-3 gap-2 mb-2">
                <div className="flex items-center justify-center text-white">
                  {isReadOnly ? (
                    <span className="text-center">{row.times}</span>
                  ) : (
                    <Input
                      type="number"
                      min="0"
                      value={row.times}
                      onChange={(e) => onInputChange(row.id, "times", e.target.value)}
                      className="bg-white/10 border-0 text-white text-center"
                      aria-labelledby="column-times"
                      aria-label={`Tiempos para fila ${index + 1}`}
                    />
                  )}
                </div>
                <div className="flex items-center justify-center text-white">
                  {isReadOnly ? (
                    <span className="text-center">{row.actions}</span>
                  ) : (
                    <Input
                      type="number"
                      min="0"
                      max="99"
                      value={row.actions}
                      onChange={(e) => onInputChange(row.id, "actions", e.target.value)}
                      className="bg-white/10 border-0 text-white text-center"
                      aria-labelledby="column-actions"
                      aria-label={`Acciones para fila ${index + 1}`}
                    />
                  )}
                </div>
                <div
                  className="flex items-center justify-center text-[#4ECDC4] font-bold"
                  aria-labelledby="column-value"
                  aria-label={`Valor para fila ${index + 1}: $${row.value.toFixed(2)}`}
                >
                  ${row.value.toFixed(2)}
                </div>
              </div>
            ))}

            {!isReadOnly && (
              <Button
                onClick={onAddRow}
                className="w-full mt-4 bg-gradient-to-r from-[#FF6B6B]/20 to-[#4ECDC4]/20 text-white hover:from-[#FF6B6B]/30 hover:to-[#4ECDC4]/30"
                aria-label="Añadir otra fila"
              >
                Añadir otra fila +
              </Button>
            )}
          </div>
        </div>

        {/* Summary Section */}
        <div className="mt-4 bg-gradient-to-r from-[#FF6B6B]/10 to-[#4ECDC4]/10 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#4ECDC4]" aria-label={`Total tiempos: ${totalTimes}`}>
                {totalTimes}
              </div>
              <div className="text-sm text-gray-400">Total tiempos</div>
            </div>
            <div className="text-center">
              <div
                className="text-2xl font-bold text-[#4ECDC4]"
                aria-label={`Precio por tiempo: $${PRICE_PER_TIME.toFixed(2)}`}
              >
                ${PRICE_PER_TIME.toFixed(2)}
              </div>
              <div className="text-sm text-gray-400">Precio x tiempo</div>
            </div>
            <div className="text-center">
              <div
                className="text-2xl font-bold text-[#4ECDC4]"
                aria-label={`Compra total: $${totalPurchase.toFixed(2)}`}
              >
                ${totalPurchase.toFixed(2)}
              </div>
              <div className="text-sm text-gray-400">Compra total</div>
            </div>
          </div>

          <Separator className="my-4 bg-white/10" />

          <div className="grid grid-cols-1 gap-4">
            {isReadOnly ? (
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-12 bg-gradient-to-r from-[#FF6B6B]/20 to-[#4ECDC4]/20 hover:from-[#FF6B6B]/30 hover:to-[#4ECDC4]/30 border-0 text-white"
              >
                Cerrar
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="h-12 bg-gradient-to-r from-[#FF6B6B]/20 to-[#4ECDC4]/20 hover:from-[#FF6B6B]/30 hover:to-[#4ECDC4]/30 border-0 text-white"
                >
                  Volver
                </Button>
                <Button
                  onClick={onComplete}
                  disabled={!clientName || totalTimes === 0}
                  className="h-12 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] hover:opacity-90 text-black font-medium"
                  aria-label={selectedTicket ? "Actualizar ticket" : "Completar ticket"}
                >
                  {selectedTicket ? "Actualizar" : "Completar"} <Check className="ml-2 h-5 w-5" aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Exportar también como default para permitir ambos tipos de importación
export default TicketDialog

