import { Control, FieldErrors } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { Label } from '../../../components/ui/Label'
import { DateTimePicker } from '../../../components/widgets/DateTimePicker'
import { TimePicker } from '../../../components/widgets/TimePicker'
import { DropdownSelect } from '../../../components/widgets/DropdownSelect'
import type { CreateDispatchOrderFormData } from '../schemas/dispatchOrder.schema'

interface SchedulingSectionProps {
  control: Control<CreateDispatchOrderFormData>
  timePreference: 'no-preference' | 'specific-time' | 'time-window'
  specificTime: string
  onTimePreferenceChange: (value: string) => void
  onSpecificTimeChange: (time: string) => void
  errors: FieldErrors<CreateDispatchOrderFormData>
}

// Time preference options
const timePreferenceOptions = [
  { value: 'no-preference', label: 'Sin preferencia' },
  { value: 'specific-time', label: 'Hora específica' },
  { value: 'time-window', label: 'Rango horario' },
]

export function SchedulingSection({
  control,
  timePreference,
  specificTime,
  onTimePreferenceChange,
  onSpecificTimeChange,
  errors,
}: SchedulingSectionProps) {
  return (
    <div className="space-y-4">
      {/* Date & Time Picker */}
      <Controller
        name="planned_date"
        control={control}
        render={({ field }) => (
          <DateTimePicker
            date={field.value}
            onDateChange={field.onChange}
            time={timePreference === 'specific-time' ? specificTime : ''}
            onTimeChange={onSpecificTimeChange}
            dateLabel="Fecha Prevista"
            timeLabel={timePreference === 'specific-time' ? 'Hora' : ''}
            required
            error={errors.planned_date?.message}
          />
        )}
      />

      {/* Time Preference */}
      <div>
        <Label className="text-sm text-gray-700 mb-2 block">
          Ventana de Tiempo
        </Label>
        <DropdownSelect
          options={timePreferenceOptions}
          value={timePreference}
          onChange={onTimePreferenceChange}
          placeholder="Seleccionar"
          className="w-48"
        />
      </div>

      {/* Time Window (only shown when time-window is selected) */}
      {timePreference === 'time-window' && (
        <div>
          <Label className="text-sm text-gray-700 mb-2 block">
            Inicio <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-500 mb-2 block">Inicio</Label>
              <Controller
                name="pickup_window_start"
                control={control}
                render={({ field }) => (
                  <TimePicker
                    value={field.value || ''}
                    onChange={field.onChange}
                    className="h-9 w-full"
                  />
                )}
              />
            </div>
            <div>
              <Label className="text-sm text-gray-500 mb-2 block">Fin</Label>
              <Controller
                name="pickup_window_end"
                control={control}
                render={({ field }) => (
                  <TimePicker
                    value={field.value || ''}
                    onChange={field.onChange}
                    className="h-9 w-full"
                  />
                )}
              />
            </div>
          </div>
          {errors.pickup_window_end && (
            <p className="text-xs text-red-500 mt-1">
              {errors.pickup_window_end.message}
            </p>
          )}
        </div>
      )}

      {/* No preference message */}
      {timePreference === 'no-preference' && (
        <div className="text-sm text-gray-500 italic">
          Cualquier hora del día
        </div>
      )}
    </div>
  )
}
