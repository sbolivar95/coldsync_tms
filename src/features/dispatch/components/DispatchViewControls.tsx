import { ChevronLeft, ChevronRight, Calendar, ChevronDown, List, GanttChartSquare } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { Calendar as CalendarComponent } from '@/components/ui/Calendar'
import { cn } from '@/lib/utils'
import React from 'react'

// Modos de densidad visual (solo para Gantt)
export type ViewDensityMode = 'compact' | 'normal' | 'detailed'

// Modos de visualización
export type DisplayMode = 'list' | 'gantt'

interface DispatchViewControlsProps {
  densityMode?: ViewDensityMode
  onDensityModeChange?: (mode: ViewDensityMode) => void
  displayMode?: DisplayMode
  onDisplayModeChange?: (mode: DisplayMode) => void
  calendarRangeLabel: string
  onPreviousClick: () => void
  onNextClick: () => void
  onDateSelect: (date: Date | undefined) => void
  selectedDate: Date
  showDensityControls?: boolean // Solo mostrar en vista Gantt
}

export function DispatchViewControls({
  densityMode = 'normal',
  onDensityModeChange,
  displayMode = 'gantt',
  onDisplayModeChange,
  calendarRangeLabel,
  onPreviousClick,
  onNextClick,
  onDateSelect,
  selectedDate,
  showDensityControls = false,
}: DispatchViewControlsProps) {
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateSelect(date)
      setIsCalendarOpen(false)
    }
  }

  return (
    <div className='flex items-center gap-2'>
      {/* Grupo: Navegación + Date Picker */}
      <div className='flex items-center gap-1'>
        <Button
          variant='outline'
          size='sm'
          className='h-8 w-8 p-0'
          onClick={onPreviousClick}
          title='Período anterior'
        >
          <ChevronLeft className='h-4 w-4' />
        </Button>

        {/* Date Picker con rango */}
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              className='h-8 gap-2 px-3 font-medium text-gray-700'
            >
              <Calendar className='h-4 w-4' />
              {calendarRangeLabel}
              <ChevronDown className='h-3.5 w-3.5 text-gray-500' />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0' align='start'>
            <CalendarComponent
              mode='single'
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Button
          variant='outline'
          size='sm'
          className='h-8 w-8 p-0'
          onClick={onNextClick}
          title='Período siguiente'
        >
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>

      {/* Selector de densidad visual (solo en Gantt) */}
      {showDensityControls && onDensityModeChange && (
        <div className='flex items-center gap-0.5 bg-gray-100 rounded-md p-1'>
          <Button
            variant='ghost'
            size='sm'
            className={cn(
              'h-7 px-4 rounded transition-all',
              densityMode === 'compact'
                ? 'bg-white text-primary shadow-sm hover:bg-white font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-transparent'
            )}
            onClick={() => onDensityModeChange('compact')}
          >
            Compacto
          </Button>

          <Button
            variant='ghost'
            size='sm'
            className={cn(
              'h-7 px-4 rounded transition-all',
              densityMode === 'normal'
                ? 'bg-white text-primary shadow-sm hover:bg-white font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-transparent'
            )}
            onClick={() => onDensityModeChange('normal')}
          >
            Normal
          </Button>

          <Button
            variant='ghost'
            size='sm'
            className={cn(
              'h-7 px-4 rounded transition-all',
              densityMode === 'detailed'
                ? 'bg-white text-primary shadow-sm hover:bg-white font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-transparent'
            )}
            onClick={() => onDensityModeChange('detailed')}
          >
            Detallado
          </Button>
        </div>
      )}

      {/* Selector de tipo de visualización (Lista/Gantt) */}
      {onDisplayModeChange && (
        <div className='flex items-center gap-0.5 bg-gray-100 rounded-md p-1'>
          <Button
            variant='ghost'
            size='sm'
            className={cn(
              'h-7 px-3 rounded transition-all',
              displayMode === 'list'
                ? 'bg-white text-primary shadow-sm hover:bg-white font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-transparent'
            )}
            onClick={() => onDisplayModeChange('list')}
          >
            <List className='h-4 w-4' />
          </Button>

          <Button
            variant='ghost'
            size='sm'
            className={cn(
              'h-7 px-3 rounded transition-all',
              displayMode === 'gantt'
                ? 'bg-white text-primary shadow-sm hover:bg-white font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-transparent'
            )}
            onClick={() => onDisplayModeChange('gantt')}
          >
            <GanttChartSquare className='h-4 w-4' />
          </Button>
        </div>
      )}
    </div>
  )
}
