import { useState, useEffect, useRef } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DetailFooter } from '../../components/widgets/DetailFooter'
import { ScrollArea } from '../../components/ui/ScrollArea'
import { toast } from 'sonner'
import { InformationTab } from './tabs';
import type { Lane } from '../../types/database.types'
import type { LaneWithRelations } from './hooks/useLanes'
import {
  laneSchema,
  type LaneFormData,
} from '../../lib/schemas/lane.schemas'
import { useAppStore } from '../../stores/useAppStore'
import { lanesService, laneStopsService } from '../../services/database/lanes.service'
import { useFormChanges } from '../../hooks/useFormChanges'

interface LaneDetailProps {
  lane?: LaneWithRelations | null;
  onBack: () => void;
  onSave?: (lane: Lane) => void;
  mode?: "view" | "edit" | "create";
}

export function LaneDetail({ lane, onBack, onSave, mode: propMode }: LaneDetailProps) {
  const organization = useAppStore((state) => state.organization)
  const organizationId = organization?.id
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  // Use provided mode or infer from lane
  const mode = propMode || (lane ? "edit" : "create");
  const [isEditing, setIsEditing] = useState(mode === "edit" || mode === "create");

  // Single form instance shared across all tabs
  const form = useForm<LaneFormData>({
    resolver: zodResolver(laneSchema) as any,
    defaultValues: {
      lane_id: '',
      name: '',
      distance: 0,
      is_active: true,
      operational_buffer: null,
      transit_time: null,
      lane_type_id: null,
      stops: [
        { location_id: '', stop_type: 'PICKUP', stop_order: 1, estimated_duration: 1, notes: '' },
        { location_id: '', stop_type: 'DROP_OFF', stop_order: 2, estimated_duration: 1, notes: '' },
      ],
    },
    mode: "onChange"
  })

  // Store original values to detect changes
  const [originalData, setOriginalData] = useState<LaneFormData | null>(null)

  // Use hook for change detection
  const { hasChanges } = useFormChanges(form as any, originalData, mode)

  // Use ref to prevent duplicate form resets
  const loadedLaneIdRef = useRef<string | undefined>(undefined);

  // Update isEditing when mode changes
  useEffect(() => {
    setIsEditing(mode === "edit" || mode === "create");
  }, [mode]);

  // Reset form when lane changes
  useEffect(() => {
    if (mode === "edit" && lane) {
      if (lane.id !== loadedLaneIdRef.current) {
        const newFormData: LaneFormData = {
          lane_id: lane.lane_id || '',
          name: lane.name || '',
          distance: lane.distance || 0,
          is_active: lane.is_active ?? true,
          operational_buffer: lane.operational_buffer ?? null,
          transit_time: lane.transit_time ?? null,
          lane_type_id: lane.lane_type_id ?? null,
          stops: lane.lane_stops?.map((s) => ({
            id: s.id,
            location_id: s.location_id.toString(),
            stop_type: s.stop_type || 'MANDATORY_WAYPOINT',
            stop_order: s.stop_order,
            estimated_duration: s.estimated_duration ?? 0,
            notes: s.notes || ''
          })) as LaneFormData['stops']
        }
        form.reset(newFormData)
        setOriginalData(newFormData)
        loadedLaneIdRef.current = lane.id
        setJustSaved(false)
      }
    } else if (mode === "create") {
      if (loadedLaneIdRef.current !== 'create-mode') {
        const defaultFormData: LaneFormData = {
          lane_id: '',
          name: '',
          distance: 0,
          is_active: true,
          operational_buffer: null,
          transit_time: null,
          lane_type_id: null,
          stops: [
            { location_id: '', stop_type: 'PICKUP', stop_order: 1, estimated_duration: 1, notes: '' },
            { location_id: '', stop_type: 'DROP_OFF', stop_order: 2, estimated_duration: 1, notes: '' },
          ]
        }
        form.reset(defaultFormData)
        setOriginalData(defaultFormData)
        loadedLaneIdRef.current = 'create-mode'
      }
    }
  }, [lane, form, mode])

  const handleSave = async () => {
    if (!organizationId) {
      toast.error('No hay organización seleccionada')
      return
    }

    // Validate form schema fields
    const isValid = await form.trigger()
    if (!isValid) {
      toast.error('Por favor corrige los errores en el formulario')
      return
    }

    setIsSubmitting(true)
    setJustSaved(false)

    try {
      const values = form.getValues()
      const { stops: rawStops, ...rawLaneData } = values

      // Clean lane data
      const laneData = {
        ...rawLaneData,
        distance: Number(rawLaneData.distance) || 0,
        transit_time: rawLaneData.transit_time ? Number(rawLaneData.transit_time) : null,
        operational_buffer: rawLaneData.operational_buffer ? Number(rawLaneData.operational_buffer) : null,
        lane_type_id: rawLaneData.lane_type_id ? Number(rawLaneData.lane_type_id) : null,
      }

      // Ensure correct format for backend
      const stops = rawStops.map((stop, index) => ({
        location_id: parseInt(stop.location_id, 10),
        stop_type: stop.stop_type,
        stop_order: index + 1,
        notes: stop.notes || '',
        estimated_duration: Number(stop.estimated_duration) || 0
      }))

      let result: Lane;

      if (mode === "create") {
        const createData = {
          ...laneData,
          org_id: organizationId
        }
        result = await lanesService.createWithStops(createData as any, stops)
        toast.success('Carril creado correctamente')
      } else if (lane?.id) {
        await lanesService.update(lane.id, organizationId, laneData)
        await laneStopsService.replaceForLane(lane.id, organizationId, stops)

        const updated = await lanesService.getById(lane.id, organizationId)
        if (!updated) throw new Error("Error retrieving updated lane");
        result = updated;

        toast.success('Carril actualizado correctamente')
      } else {
        throw new Error("Invalid state for save")
      }

      if (onSave) {
        await onSave(result);
      } else {
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving lane:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Error al guardar el carril'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    onBack()
  }

  const showFooter = isEditing || mode === "create" || hasChanges;

  return (
    <FormProvider {...form}>
      <div className='flex flex-col h-full'>
        <div className='flex-1 overflow-hidden'>
          <ScrollArea className="h-full">
            <div className='p-6 bg-gray-50 pb-24'>
              <div className='max-w-6xl mx-auto'>
                <InformationTab lane={lane} />
              </div>
            </div>
          </ScrollArea>
        </div>

        <DetailFooter
          onCancel={handleCancel}
          onSave={handleSave}
          isSubmitting={isSubmitting}
          hasChanges={hasChanges}
          justSaved={justSaved}
          saveLabel={mode === "create" ? 'Crear Carril' : 'Guardar'}
          showFooter={showFooter}
        />
      </div>
    </FormProvider>
  )
}
