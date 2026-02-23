import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, useMemo, useRef } from 'react'
import { EntityDialog } from '@/components/widgets/EntityDialog'
import { SmartSelect } from '@/components/widgets/SmartSelect'
import { useAuth } from '@/hooks/useAuth'
import { fleetSetsService, type FleetSetValidationResult } from '@/services/database'
import { createAssignmentSchema, type AssignmentFormData } from '@/lib/schemas/assignment.schemas'
import type { FleetSet } from '@/types/database.types'
import { toast } from 'sonner'
import { AssignmentConfirmationDialog } from './AssignmentConfirmationDialog'
import { useAssignmentOptions } from '../hooks/useAssignmentOptions'

interface AssignmentDialogProps {
  open: boolean
  onClose: () => void
  assignment?: FleetSet | null
  onSave: () => void
  // Props para pre-llenar contexto
  driverId?: number
  vehicleId?: string
  trailerId?: string
  carrierId?: number | null
}

export function AssignmentDialog({
  open,
  onClose,
  assignment,
  onSave,
  driverId,
  vehicleId,
  trailerId,
  carrierId,
}: AssignmentDialogProps) {
  const { organization } = useAuth()
  const orgId = organization?.id || ''

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedVehicleType, setSelectedVehicleType] = useState<string | null>(null)
  /* State for confirmation validation */
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [validationResult, setValidationResult] = useState<FleetSetValidationResult | null>(null)
  const [pendingSubmitData, setPendingSubmitData] = useState<AssignmentFormData | null>(null)

  // Load assignment options using custom hook (loads silently, no loading state)
  const {
    drivers,
    // vehicles, // Removed as not needed
    trailers,
    vehiclesData,
  } = useAssignmentOptions({
    orgId,
    carrierId: carrierId || undefined,
    open,
    currentDriverId: assignment?.driver_id || driverId,
    currentTrailerId: assignment?.trailer_id || trailerId,
  })

  // Create dynamic schema based on selected vehicle type
  const assignmentSchema = useMemo(
    () => createAssignmentSchema(selectedVehicleType),
    [selectedVehicleType]
  )

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    mode: 'onChange', // Enable real-time validation
    defaultValues: {
      carrier_id: assignment?.carrier_id || carrierId || undefined,
      driver_id: assignment?.driver_id || driverId || undefined,
      vehicle_id: assignment?.vehicle_id || vehicleId || '',
      trailer_id: assignment?.trailer_id || trailerId || '',
      starts_at: assignment?.starts_at
        ? new Date(assignment.starts_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      ends_at: assignment?.ends_at
        ? new Date(assignment.ends_at).toISOString().split('T')[0]
        : null,
    },
  })

  const normalizedVehicleType = (selectedVehicleType ?? '').toUpperCase()
  const trailerAllowed = normalizedVehicleType === 'TRACTOR'

  // Get current vehicle details for title and type logic
  const currentVehicle = useMemo(() => {
    return vehiclesData.find(v => v.id === vehicleId)
  }, [vehiclesData, vehicleId])

  // Update schema when vehicle type changes
  useEffect(() => {
    // If vehicle context exists, set type
    if (currentVehicle) {
      setSelectedVehicleType(currentVehicle.vehicle_type)
    }
  }, [currentVehicle])

  useEffect(() => {
    if (selectedVehicleType && selectedVehicleType !== 'TRACTOR') {
      form.setValue('trailer_id', null, { shouldValidate: true, shouldDirty: true })
    }
  }, [selectedVehicleType, form])

  // Ensure vehicle_id is set from props (Context is Immutable)
  useEffect(() => {
    if (vehicleId) {
      form.setValue('vehicle_id', vehicleId)
    }
  }, [vehicleId, form])

  // Reset form when assignment changes
  useEffect(() => {
    if (assignment) {
      form.reset({
        carrier_id: assignment.carrier_id,
        driver_id: assignment.driver_id,
        vehicle_id: assignment.vehicle_id,
        trailer_id: assignment.trailer_id,
        starts_at: new Date(assignment.starts_at).toISOString().split('T')[0],
        ends_at: assignment.ends_at
          ? new Date(assignment.ends_at).toISOString().split('T')[0]
          : null,
      })
    } else {
      // New Assignment defaults
      form.reset({
        carrier_id: carrierId || undefined,
        driver_id: driverId || undefined,
        vehicle_id: vehicleId || '', // Context vehicle
        trailer_id: trailerId || '',
        starts_at: new Date().toISOString().split('T')[0],
        ends_at: null,
      })
    }
  }, [assignment, driverId, vehicleId, trailerId, carrierId, form])

  const onSubmit = async (data: AssignmentFormData) => {
    if (!orgId) {
      toast.error('No hay organización seleccionada')
      return
    }

    try {
      setIsSubmitting(true)

      // Validate fleet set before saving (RF-02.1)
      const validation = await fleetSetsService.validateFleetSet(
        orgId,
        data.driver_id,
        data.vehicle_id,
        data.trailer_id || null
      )

      // Check if there are warnings/occupancy checks that require user confirmation
      const hasReassignments =
        validation.reassignments.driver?.hasConflict ||
        validation.reassignments.vehicle?.hasConflict ||
        validation.reassignments.trailer?.hasConflict

      if (hasReassignments) {
        // Store validation results and pending data
        setValidationResult(validation)
        setPendingSubmitData(data)
        setShowConfirmationDialog(true)
        setIsSubmitting(false)
        return
      }

      // No reassignments requiring confirmation, proceed with save
      await performSave(data)
    } catch (error) {
      console.error('Error validating assignment:', error)
      toast.error('Error al validar la asignación')
      setIsSubmitting(false)
    }
  }

  // Track component mount status to avoid state updates after closing
  const isMounted = useRef(true)
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  const performSave = async (data: AssignmentFormData) => {
    if (!orgId) {
      toast.error('No hay organización seleccionada')
      return
    }

    // Optimistic Close: Close dialog immediately for better UX
    onClose()

    // Also close conflict dialog if open
    setShowConfirmationDialog(false)

    try {
      if (isMounted.current) setIsSubmitting(true)

      const assignmentData = {
        ...data,
        trailer_id: trailerAllowed ? data.trailer_id || null : null,
        org_id: orgId,
        starts_at: new Date(data.starts_at).toISOString(),
        ends_at: data.ends_at ? new Date(data.ends_at).toISOString() : null,
      }

      const inferredCarrierId = carrierId || data.carrier_id

      if (!inferredCarrierId) {
        toast.error('No se pudo determinar el transportista')
        return
      }

      await fleetSetsService.create({
        org_id: orgId,
        carrier_id: inferredCarrierId,
        driver_id: data.driver_id ?? null,
        vehicle_id: data.vehicle_id,
        trailer_id: assignmentData.trailer_id,
        starts_at: assignmentData.starts_at,
        ends_at: assignmentData.ends_at,
        is_active: true,
      })
      toast.success('Asignación guardada correctamente')

      onSave()
      // Form reset and state cleanup not needed if component is unmounted
      if (isMounted.current) {
        form.reset()
        setValidationResult(null)
        setPendingSubmitData(null)
      }
    } catch (error) {
      console.error('Error saving assignment:', error)
      const errorMessage = error instanceof Error
        ? error.message
        : 'Error al guardar la asignación'
      toast.error(errorMessage)
    } finally {
      if (isMounted.current) setIsSubmitting(false)
    }
  }

  const handleConfirmReassignment = () => {
    if (pendingSubmitData) {
      performSave(pendingSubmitData)
    }
  }

  const handleCancelReassignment = () => {
    setShowConfirmationDialog(false)
    setValidationResult(null)
    setPendingSubmitData(null)
  }

  const { isValid: isFormValid, isDirty } = form.formState

  // Dynamic Title
  const dialogTitle = 'Configuración de Flota'

  return (
    <>
      <EntityDialog
        open={open && !showConfirmationDialog}
        onClose={onClose}
        title={dialogTitle}
        description={`Vincular/Desvincular Conductor y/o Remolque al vehículo ${currentVehicle?.plate}`}
        onSave={form.handleSubmit(onSubmit)}
        disableSave={!isFormValid || isSubmitting || !isDirty}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...form.register('starts_at')} />
          <input type="hidden" {...form.register('ends_at')} />
          {/* Always render hidden vehicle_id to ensure form state is valid */}
          <input type="hidden" {...form.register('vehicle_id')} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NO Vehicle Selector - Context is fixed */}

            <SmartSelect
              label="Conductor"
              id="driver_id"
              required={false}
              placeholder="Seleccionar Conductor"
              searchPlaceholder="Buscar conductor..."
              options={drivers}
              value={
                form.watch('driver_id') === null && (assignment?.driver_id || driverId)
                  ? 'unassign'
                  : form.watch('driver_id')?.toString() || ''
              }
              onChange={(value) => {
                // Handle unassign explicitly
                if (value === 'unassign') {
                  form.setValue('driver_id', null, { shouldValidate: true, shouldDirty: true })
                  return
                }
                // Handle clearing or selecting
                const intVal = value ? parseInt(value as string, 10) : null
                form.setValue('driver_id', intVal, { shouldValidate: true, shouldDirty: true })
              }}
              error={form.formState.errors.driver_id?.message}
            />

            <div className="space-y-1.5">
              <SmartSelect
                label="Remolque"
                id="trailer_id"
                required={false}
                placeholder={trailerAllowed ? 'Seleccionar remolque' : 'No aplica para este tipo de vehículo'}
                searchPlaceholder="Buscar remolque..."
                options={trailers}
                disabled={!trailerAllowed}
                value={
                  form.watch('trailer_id') === null && (assignment?.trailer_id || trailerId)
                    ? 'unassign'
                    : form.watch('trailer_id') || ''
                }
                onChange={(value) => {
                  if (value === 'unassign') {
                    form.setValue('trailer_id', null, { shouldValidate: true, shouldDirty: true })
                    return
                  }
                  form.setValue('trailer_id', value as string, { shouldValidate: true, shouldDirty: true })
                }}
                error={form.formState.errors.trailer_id?.message}
                helpText={
                  !trailerAllowed
                    ? 'Solo los vehículos TRACTOR pueden operar con remolque'
                    : undefined
                }
              />
            </div>
          </div>
        </form>
      </EntityDialog>

      {/* Confirmation Dialog - Outside EntityDialog */}
      <AssignmentConfirmationDialog
        open={showConfirmationDialog}
        onOpenChange={setShowConfirmationDialog}
        validationResult={validationResult}
        onConfirm={handleConfirmReassignment}
        onCancel={handleCancelReassignment}
      />
    </>
  )
}
