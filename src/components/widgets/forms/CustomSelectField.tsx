
import { UseFormReturn, FieldValues, Path } from "react-hook-form";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../../ui/Form";
import { SmartSelect, SmartOption } from "../SmartSelect";

interface CustomSelectFieldProps<T extends FieldValues> {
    form: UseFormReturn<T>;
    name: Path<T>;
    label: string;
    options: SmartOption[] | { value: string; label: string }[];
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    searchable?: boolean;
    className?: string;
    helperText?: React.ReactNode;
    onValueChange?: (value: any) => void;
}

export function CustomSelectField<T extends FieldValues>({
    form,
    name,
    label,
    options,
    placeholder = "Seleccionar...",
    disabled,
    required,
    searchable = false,
    className,
    helperText,
    onValueChange,
}: CustomSelectFieldProps<T>) {
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
                        <SmartSelect
                            value={field.value?.toString()}
                            onChange={(value) => {
                                field.onChange(value);
                                if (onValueChange) {
                                    onValueChange(value);
                                }
                            }}
                            options={options}
                            placeholder={placeholder}
                            searchable={searchable}
                            disabled={disabled}
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
