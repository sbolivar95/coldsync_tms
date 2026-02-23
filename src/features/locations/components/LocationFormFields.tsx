import { useFormContext } from "react-hook-form";
import { SlidersHorizontal } from "lucide-react";
import { Input } from "../../../components/ui/Input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/ui/Form";
import { SmartSelect, type SmartOption } from "../../../components/widgets/SmartSelect";
import type { LocationFormDataWithString } from "../../../lib/schemas/location.schemas";
import { LabelActionButton } from "../../../components/widgets/buttons/LabelActionButton";

interface LocationFormFieldsProps {
  countries: SmartOption[];
  locationTypes: SmartOption[];
  loadingCountries: boolean;
  loadingLocationTypes: boolean;
  onShowLocationTypeManager: () => void;
}

export function LocationFormFields({
  countries,
  locationTypes,
  loadingCountries,
  loadingLocationTypes,
  onShowLocationTypeManager
}: LocationFormFieldsProps) {
  const { control } = useFormContext<LocationFormDataWithString>();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <div className="space-y-5">
        {/* Código */}
        <FormField
          control={control}
          name="code"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs text-gray-600">
                Código <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Ej: LOC-001"
                  className="h-9"
                />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />

        {/* País */}
        <FormField
          control={control}
          name="country_id"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs text-gray-600">
                País <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <SmartSelect
                  value={field.value || undefined}
                  onChange={field.onChange}
                  options={countries}
                  placeholder={loadingCountries ? "Cargando países..." : "Seleccionar país..."}
                  searchable={true}
                  disabled={loadingCountries}
                />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-5">
        {/* Nombre */}
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs text-gray-600">
                Nombre de la Ubicación <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Ej: CD Santiago Norte"
                  className="h-9"
                />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />

        {/* Ciudad */}
        <FormField
          control={control}
          name="city"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs text-gray-600">
                Ciudad <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Santiago"
                  className="h-9"
                />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-5">
        {/* Número de Muelles */}
        <FormField
          control={control}
          name="num_docks"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs text-gray-600">
                Número de Muelles <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? 0}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    field.onChange(isNaN(value) ? 0 : value);
                  }}
                  min={1}
                  className="h-9"
                />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />

        {/* Estado */}
        <FormField
          control={control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs text-gray-600">
                Estado <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <SmartSelect
                  value={field.value ? "true" : "false"}
                  onChange={(value) => field.onChange(value === "true")}
                  options={[
                    { value: "true", label: "Activo" },
                    { value: "false", label: "Inactivo" },
                  ]}
                  placeholder="Seleccionar estado"
                  searchable={false}
                />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-5">
        {/* Tipo de Ubicación */}
        <FormField
          control={control}
          name="type_location_id"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs text-gray-600 flex items-center justify-between">
                Tipo de Ubicación
                <LabelActionButton
                  icon={SlidersHorizontal}
                  title="Gestionar tipos de ubicación"
                  onClick={onShowLocationTypeManager}
                />
              </FormLabel>
              <FormControl>
                <SmartSelect
                  value={field.value || undefined}
                  onChange={field.onChange}
                  options={locationTypes}
                  placeholder={loadingLocationTypes ? "Cargando tipos..." : "Seleccionar tipo..."}
                  searchable={true}
                  disabled={loadingLocationTypes}
                />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />

        {/* Tiempo de Parada */}
        <FormField
          control={control}
          name="default_dwell_time_hours"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs text-gray-600">
                ~ Tiempo de Permanencia (Horas) <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  {...field}
                  value={field.value ?? 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    field.onChange(isNaN(value) ? 0 : value);
                  }}
                  placeholder="Ej: 2.5"
                  className="h-9"
                />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}