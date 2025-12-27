import * as React from "react";
import { ChevronDownIcon, Check } from "lucide-react";
import { Button } from "../ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownSelectProps {
  id?: string;
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DropdownSelect({
  id,
  options,
  value,
  onChange,
  placeholder = "Seleccionar",
  className,
  disabled = false,
}: DropdownSelectProps) {
  const [open, setOpen] = React.useState(false);

  // Encontrar la opción seleccionada
  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          id={id}
          disabled={disabled}
          className={`h-9 w-full justify-between font-normal text-xs bg-input-background hover:bg-input-background ${className}`}
        >
          <span className={selectedOption ? "text-gray-900" : "text-gray-500"}>
            {displayText}
          </span>
          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className="text-xs cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span>{option.label}</span>
              {value === option.value && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
