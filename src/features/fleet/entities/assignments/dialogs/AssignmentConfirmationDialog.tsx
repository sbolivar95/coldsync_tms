import { ConfirmDialog } from '@/components/widgets/ConfirmDialog'
import type { FleetSetValidationResult } from '@/services/database/fleetSets.service'

interface AssignmentConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  validationResult: FleetSetValidationResult | null
  onConfirm: () => void
  onCancel: () => void
}

export function AssignmentConfirmationDialog({
  open,
  onOpenChange,
  validationResult,
  onConfirm,
  onCancel,
}: AssignmentConfirmationDialogProps) {
  if (!validationResult) return null

  const reassignments = validationResult.reassignments
  const driverReassignment = reassignments?.driver
  const vehicleReassignment = reassignments?.vehicle
  const trailerReassignment = reassignments?.trailer

  const isDropAndHook = trailerReassignment?.hasConflict && trailerReassignment.isDropAndHook

  // Construir mensaje unificado condicional
  // Construir mensaje unificado condicional
  const getUnifiedMessage = () => {
    const messages: string[] = []

    // Caso especial: Doble reasignación (Conductor + Remolque) - Mensaje simplificado con contexto
    if (driverReassignment?.hasConflict && trailerReassignment?.hasConflict) {
      const driverPlate = driverReassignment.currentVehiclePlate || 'desconocido'
      const trailerPlate = trailerReassignment.currentVehiclePlate || 'desconocido'
      const sameOrigin = driverReassignment.currentVehicleId === trailerReassignment.currentVehicleId

      if (sameOrigin) {
        messages.push(
          `Desvincular al conductor y al remolque del vehículo ${driverPlate} y vincularlos al vehículo seleccionado.`
        )
      } else {
        messages.push(
          `Desvincular al conductor del vehículo ${driverPlate} y al remolque del vehículo ${trailerPlate}, y vincularlos al vehículo seleccionado.`
        )
      }
    } else {
      // Casos individuales
      if (driverReassignment?.hasConflict) {
        messages.push(driverReassignment.message)
      }
      if (trailerReassignment?.hasConflict) {
        messages.push(trailerReassignment.message)
      }
    }

    // El conflicto del vehículo (el destino ya está ocupado) se añade siempre si existe
    if (vehicleReassignment?.hasConflict) {
      messages.push(vehicleReassignment.message)
    }

    return messages.join(' ')
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isDropAndHook ? 'Confirmar Reasignación' : 'Confirmar Reasignación'}
      variant="default" // Azul por defecto
      confirmText="Sí, confirmar"
      cancelText="Cancelar"
      onConfirm={onConfirm}
      onCancel={onCancel}
      description={
        <div className="py-2">
          <p className="text-xs text-gray-700 text-left">
            {getUnifiedMessage()}
          </p>
        </div>
      }
    />
  )
}
