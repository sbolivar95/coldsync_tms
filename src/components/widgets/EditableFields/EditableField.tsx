import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { Input } from "../../ui/Input";
import { DatePicker } from "../DatePicker";
import { TimePicker } from "../TimePicker";

interface EditableFieldProps {
  label: string;
  value: string;
  displayValue?: string;
  onEdit?: (value: string) => void;
  type?: "text" | "date" | "time";
  isEditable?: boolean;
  required?: boolean;
}

/**
 * Componente para edición inline de campos de texto, fecha o hora
 * Permite editar haciendo clic en el valor mostrado
 */
export function EditableField({
  label,
  value,
  displayValue,
  onEdit,
  type = "text",
  isEditable = true,
  required = false,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  // Sincronizar estado local cuando cambia el prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleCommit = () => {
    if (onEdit && localValue !== value) {
      onEdit(localValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
  };

  if (!isEditable || !onEdit) {
    return (
      <div className="flex flex-col">
        <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">
          {label}{" "}
          {required && <span className="text-red-500">*</span>}
        </label>
        <div className="text-sm text-gray-900 font-medium min-h-[20px] flex items-center">
          {displayValue || value || "-"}
        </div>
      </div>
    );
  }

  // Si está en modo edición, mostrar campo
  if (isEditing) {
    return (
      <div className="flex flex-col">
        <label className="text-xs text-gray-600 mb-1">
          {label}{" "}
          {required && <span className="text-red-500">*</span>}
        </label>
        {type === "date" && (
          <DatePicker
            value={localValue}
            onChange={(newValue) => {
              onEdit(newValue);
              setIsEditing(false);
            }}
            className="h-9 text-xs"
          />
        )}
        {type === "time" && (
          <TimePicker
            value={localValue}
            onChange={(newValue) => {
              onEdit(newValue);
              setIsEditing(false);
            }}
            className="h-9 text-xs"
          />
        )}
        {type === "text" && (
          <Input
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleCommit}
            className="h-9 text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCommit();
              }
              if (e.key === "Escape") {
                handleCancel();
              }
            }}
          />
        )}
      </div>
    );
  }

  // Si no está editando, mostrar texto clickeable
  return (
    <div className="flex flex-col">
      <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">
        {label}{" "}
        {required && <span className="text-red-500">*</span>}
      </label>
      <button
        onClick={() => {
          setLocalValue(value); // Asegurar que empezamos con el valor actual
          setIsEditing(true);
        }}
        className="text-sm text-gray-900 font-medium hover:text-[#004ef0] text-left min-h-[20px] flex items-center gap-1.5 group"
      >
        <span className="group-hover:underline">
          {displayValue || value || "Click para editar"}
        </span>
        <Pencil className="w-3 h-3 text-gray-400 group-hover:text-[#004ef0] transition-colors" />
      </button>
    </div>
  );
}

