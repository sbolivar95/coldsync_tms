import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "../ui/Button";
import { Calendar } from "../ui/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/Popover";

interface DatePickerProps {
  id?: string;
  value?: string; // formato YYYY-MM-DD
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ id, value, onChange, placeholder = "Seleccionar fecha", className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  
  // Convertir string a Date
  const dateValue = value ? new Date(value + "T00:00:00") : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Convertir Date a string formato YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      onChange?.(`${year}-${month}-${day}`);
    }
    setOpen(false);
  };

  // Formatear fecha para mostrar
  const displayDate = dateValue 
    ? dateValue.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id={id}
          className={`h-9 w-full justify-between font-normal text-xs bg-input-background hover:bg-input-background ${className}`}
        >
          <span className={dateValue ? "text-gray-900" : "text-gray-500"}>
            {displayDate}
          </span>
          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          captionLayout="dropdown"
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}
