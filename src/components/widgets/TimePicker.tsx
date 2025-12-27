import * as React from "react";
import { Input } from "../ui/Input";

interface TimePickerProps {
  id?: string;
  value?: string; // formato HH:MM
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TimePicker({ id, value, onChange, placeholder, className, disabled }: TimePickerProps) {
  return (
    <Input
      type="time"
      id={id}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`h-9 text-xs bg-input-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none ${className}`}
    />
  );
}