import { useState } from "react";
import { Pencil } from "lucide-react";
import { DropdownSelect } from "../DropdownSelect";

interface EditableDropdownFieldProps {
  label: string;
  value: string;
  displayValue?: string;
  options: { value: string; label: string }[];
  onEdit?: (value: string) => void;
  isEditable?: boolean;
  required?: boolean;
}

/**
 * Componente para edición inline con dropdown
 * Permite editar haciendo clic en el valor mostrado y seleccionar de una lista
 */
export function EditableDropdownField({
  label,
  value,
  displayValue,
  options,
  onEdit,
  isEditable = true,
  required = false,
}: EditableDropdownFieldProps) {
  const [isEditing, setIsEditing] = useState(false);

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

  // Si está en modo edición, mostrar dropdown
  if (isEditing) {
    return (
      <div className="flex flex-col">
        <label className="text-xs text-gray-600 mb-1">
          {label}{" "}
          {required && <span className="text-red-500">*</span>}
        </label>
        <DropdownSelect
          options={options}
          value={value}
          onChange={(newValue) => {
            onEdit(newValue);
            setIsEditing(false);
          }}
          placeholder="Seleccionar"
        />
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
        onClick={() => setIsEditing(true)}
        className="text-sm text-gray-900 font-medium hover:text-primary text-left min-h-[20px] flex items-center gap-1.5 group"
      >
        <span className="group-hover:underline">
          {displayValue || value || "Click para editar"}
        </span>
        <Pencil className="w-3 h-3 text-gray-400 group-hover:text-primary transition-colors" />
      </button>
    </div>
  );
}

