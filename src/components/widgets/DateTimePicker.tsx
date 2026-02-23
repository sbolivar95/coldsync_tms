import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Calendar } from '@/components/ui/Calendar'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronDown } from 'lucide-react'

interface DateTimePickerProps {
  date?: Date
  onDateChange: (date: Date | undefined) => void
  time?: string
  onTimeChange: (time: string) => void
  dateLabel?: string
  timeLabel?: string
  required?: boolean
  error?: string
  disabled?: boolean
}

export function DateTimePicker({
  date,
  onDateChange,
  time,
  onTimeChange,
  dateLabel = 'Fecha',
  timeLabel = 'Hora',
  required = false,
  error,
  disabled = false,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false)
  const showTime = timeLabel !== '' // Only show time input if timeLabel is provided

  return (
    <div className="space-y-4">
      <div className={`grid grid-cols-1 ${showTime ? 'md:grid-cols-2' : ''} gap-4`}>
        {/* Date Picker */}
        <div>
          <Label htmlFor="date-picker" className="text-sm text-gray-700 mb-2 block">
            {dateLabel}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                id="date-picker"
                className="w-full justify-between font-normal h-9"
                disabled={disabled}
              >
                {date ? format(date, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                captionLayout="dropdown"
                defaultMonth={date}
                onSelect={(selectedDate) => {
                  onDateChange(selectedDate)
                  setOpen(false)
                }}
                disabled={disabled}
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Picker - Only show if timeLabel is provided */}
        {showTime && (
          <div>
            <Label htmlFor="time-picker" className="text-sm text-gray-700 mb-2 block">
              {timeLabel}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type="time"
              id="time-picker"
              value={time || ''}
              onChange={(e) => onTimeChange(e.target.value)}
              className="h-9 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              disabled={disabled}
            />
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
