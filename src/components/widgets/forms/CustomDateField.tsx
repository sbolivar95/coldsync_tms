
import { UseFormReturn, FieldValues, Path } from "react-hook-form";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../../ui/Form";
import { Input } from "../../ui/Input";

interface CustomDateFieldProps<T extends FieldValues> {
    form: UseFormReturn<T>;
    name: Path<T>;
    label: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    placeholder?: string;
    helperText?: React.ReactNode;
}

export function CustomDateField<T extends FieldValues>({
    form,
    name,
    label,
    disabled,
    required,
    className,
    placeholder,
    helperText,
}: CustomDateFieldProps<T>) {
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
                            type="date"
                            {...field}
                            value={field.value || ""}
                            disabled={disabled}
                            placeholder={placeholder}
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
