import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Textarea } from "../ui/Textarea";

/**
 * ESTÁNDAR DE CAMPOS DE FORMULARIO - ColdSync
 * 
 * Componente estandarizado para mantener consistencia visual en toda la aplicación.
 * 
 * Características:
 * - Espaciado consistente: space-y-1.5 entre label e input
 * - Labels pequeños: text-xs text-gray-600
 * - Altura de inputs: h-9 (36px)
 * - Campos requeridos: asterisco rojo
 * - Campos deshabilitados: bg-gray-50 text-gray-500
 */

interface BaseFieldProps {
  label: string;
  id: string;
  required?: boolean;
  helpText?: string;
  error?: string;
  disabled?: boolean;
}

interface InputFieldProps extends BaseFieldProps {
  type?: "text" | "email" | "tel" | "number" | "url" | "password" | "date";
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  highlight?: "default" | "critical"; // Para campos críticos como teléfono 24/7
  step?: string; // Para inputs numéricos con decimales
}

interface SelectFieldProps extends BaseFieldProps {
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  options: { value: string; label: string }[];
}

interface TextareaFieldProps extends BaseFieldProps {
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
}

/**
 * Campo de Input estandarizado
 */
export function InputField({
  label,
  id,
  required = false,
  helpText,
  error,
  disabled = false,
  type = "text",
  placeholder,
  defaultValue,
  value,
  onChange,
  className,
  highlight = "default",
  step,
}: InputFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-gray-600">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {highlight === "critical" && (
          <span className="ml-2 text-xs text-red-600 font-medium">(Crítico)</span>
        )}
      </Label>
      <Input
        id={id}
        type={type}
        step={step}
        placeholder={placeholder}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={!!error}
        className={
          disabled
            ? "bg-gray-50 text-gray-500"
            : highlight === "critical"
            ? "border-orange-200 focus:border-orange-400 focus:ring-orange-400"
            : className
        }
      />
      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

/**
 * Campo de Select estandarizado
 */
export function SelectField({
  label,
  id,
  required = false,
  helpText,
  error,
  disabled = false,
  placeholder,
  defaultValue,
  value,
  onValueChange,
  options,
}: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-gray-600">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select
        defaultValue={defaultValue}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger id={id} aria-invalid={!!error}>
          <SelectValue placeholder={placeholder || "Seleccionar..."} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

/**
 * Campo de Textarea estandarizado
 */
export function TextareaField({
  label,
  id,
  required = false,
  helpText,
  error,
  disabled = false,
  placeholder,
  defaultValue,
  value,
  onChange,
  rows = 3,
}: TextareaFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-gray-600">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Textarea
        id={id}
        placeholder={placeholder}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={rows}
        aria-invalid={!!error}
        className={disabled ? "bg-gray-50 text-gray-500" : ""}
      />
      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

/**
 * Sección de formulario con título y separador
 */
export function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-gray-900 mb-5 pb-2 border-b border-gray-200">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/**
 * Grupo de campos en grid (para campos relacionados)
 */
export function FieldGroup({
  children,
  cols = 2,
}: {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
}) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  return (
    <div className={`grid ${gridCols[cols]} gap-3`}>
      {children}
    </div>
  );
}