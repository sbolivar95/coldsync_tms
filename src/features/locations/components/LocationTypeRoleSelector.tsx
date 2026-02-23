import { useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import { Badge } from '../../../components/ui/Badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "../../../components/ui/Command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/Popover"
import { type StopType } from './locationType.types'

const STOP_TYPE_LABELS: Record<StopType, string> = {
  PICKUP: 'Recogida',
  DROP_OFF: 'Entrega',
  MANDATORY_WAYPOINT: 'Punto Obligatorio',
  OPTIONAL_WAYPOINT: 'Punto Opcional'
}

interface LocationTypeRoleSelectorProps {
  selectedRoles: StopType[]
  availableRoles: StopType[]
  onToggleRole: (role: StopType) => void
  placeholder?: string
}

export function LocationTypeRoleSelector({
  selectedRoles,
  availableRoles,
  onToggleRole,
  placeholder = "Seleccionar roles..."
}: LocationTypeRoleSelectorProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className="flex w-full min-w-0 rounded-md border border-input bg-input-background dark:bg-input/30 px-3 py-1 text-base transition-[color,box-shadow] outline-none md:text-sm focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] h-auto min-h-[36px] gap-1 items-center flex-wrap cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          {selectedRoles.filter(role => role && STOP_TYPE_LABELS[role]).map((role) => (
            <Badge
              key={role}
              className="rounded-sm px-1.5 font-medium h-6 bg-white text-foreground border shadow-sm hover:bg-white"
            >
              {STOP_TYPE_LABELS[role]}
              <button
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onToggleRole(role);
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleRole(role);
                }}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ))}
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground h-6 min-w-[120px]"
            placeholder={selectedRoles.length === 0 ? placeholder : ""}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
        align="start"
        sideOffset={4}
      >
        <Command>
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {availableRoles.filter(role =>
                role && STOP_TYPE_LABELS[role] && STOP_TYPE_LABELS[role].toLowerCase().includes(inputValue.toLowerCase())
              ).map((role) => {
                const isSelected = selectedRoles.includes(role);
                return (
                  <CommandItem
                    key={role}
                    onSelect={() => {
                      onToggleRole(role);
                      setInputValue("");
                    }}
                  >
                    <span>{STOP_TYPE_LABELS[role]}</span>
                    {isSelected && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
