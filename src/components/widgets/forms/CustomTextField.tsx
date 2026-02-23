
import { UseFormReturn, FieldValues, Path } from "react-hook-form";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../../ui/Form";
import { Input } from "../../ui/Input";

interface CustomTextFieldProps<T extends FieldValues> {
    form: UseFormReturn<T>;
    name: Path<T>;
    label: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    type?: string;
    className?: string;
    helperText?: React.ReactNode;
    min?: number | string;
    max?: number | string;
    maxLength?: number;
}

export function CustomTextField<T extends FieldValues>({
    form,
    name,
    label,
    placeholder,
    disabled,
    required,
    type = "text",
    className,
    helperText,
    min,
    max,
    maxLength,
}: CustomTextFieldProps<T>) {
    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem className={className}>
                    <FormLabel className="text-xs text-gray-600">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </FormLabel>
                    <FormControl>
                        <Input
                            {...field}
                            type={type}
                            value={field.value || ""}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (type === "number") {
                                    field.onChange(value === "" ? "" : parseFloat(value));
                                } else {
                                    field.onChange(value);
                                }
                            }}
                            placeholder={placeholder}
                            disabled={disabled}
                            min={min}
                            max={max}
                            maxLength={maxLength}
                        />
                    </FormControl>
                    {helperText && (
                        <div className="text-xs text-gray-500 mt-1">{helperText}</div>
                    )}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
