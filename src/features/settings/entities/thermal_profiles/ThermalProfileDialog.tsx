import { EntityDialog } from "../../../../components/widgets/EntityDialog";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "../../../../components/ui/Badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../../../components/ui/Form";
import { Input } from "../../../../components/ui/Input";
import type { ThermalProfile, Product } from "../../../../types/database.types";

// Zod schema for validation
const thermalProfileSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  temp_min_c: z.number(),
  temp_max_c: z.number(),
});

type ThermalProfileFormData = z.infer<typeof thermalProfileSchema>

interface ThermalProfileDialogProps {
  open: boolean;
  onClose: () => void;
  profile?: ThermalProfile;
  products?: Product[];
  onSave: (profile: Omit<ThermalProfile, 'id' | 'org_id' | 'created_at' | 'updated_at'>) => void;
}

/**
 * ThermalProfileDialog - Form dialog for creating/editing thermal profiles
 * Uses React Hook Form + Zod for validation as per project rules
 */
export function ThermalProfileDialog({
  open,
  onClose,
  profile,
  products = [],
  onSave,
}: ThermalProfileDialogProps) {
  const form = useForm<ThermalProfileFormData>({
    resolver: zodResolver(thermalProfileSchema),
    defaultValues: {
      name: '',
      description: '',
      temp_min_c: 0,
      temp_max_c: 0,
    },
  })

  // Reset form when profile changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        name: profile?.name || '',
        description: profile?.description || '',
        temp_min_c: profile?.temp_min_c || 0,
        temp_max_c: profile?.temp_max_c || 0,
      })
    }
  }, [open, profile, form])

  // Watch form values for compatible products detection
  const watchedValues = form.watch()

  // Detect compatible products based on temperature range
  const detectCompatibleProducts = (): Product[] => {
    const { temp_min_c, temp_max_c } = watchedValues

    if (!temp_min_c && temp_min_c !== 0 || !temp_max_c && temp_max_c !== 0 || products.length === 0) return []

    // Filter active products only
    return products.filter((product) => product.is_active)
  }

  const compatibleProducts = detectCompatibleProducts()

  const handleSave = (data: ThermalProfileFormData) => {
    onSave({
      name: data.name,
      description: data.description || null,
      temp_min_c: data.temp_min_c,
      temp_max_c: data.temp_max_c,
      is_active: profile?.is_active ?? true,
    })
    onClose()
  }

  return (
    <EntityDialog
      open={open}
      onClose={onClose}
      title={profile ? "Editar Perfil Térmico" : "Crear Perfil"}
      description={profile
        ? "Modifica los detalles del perfil térmico existente"
        : "Define un nuevo perfil de temperatura para gestionar la cadena de frío"}
      onSave={form.handleSubmit(handleSave)}
      disableSave={!form.formState.isValid}
      isEdit={!!profile}
    >
      <Form {...form}>
        <div className="space-y-4">
          {/* Nombre del Perfil */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-700">
                  Nombre del Perfil <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Refrigeración Farmacéutica"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Descripción */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-700">
                  Descripción <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    placeholder="Describe el propósito y uso de este perfil térmico..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary min-h-[80px] resize-none"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Rango Térmico */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Rango Térmico
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="temp_min_c"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-700">
                      T. Mínima (°C) <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="-20"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="temp_max_c"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-700">
                      T. Máxima (°C) <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="5"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Productos Compatibles Detectados */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Productos Compatibles Detectados
            </h4>
            <div className="flex flex-wrap gap-2 min-h-[36px] items-center">
              {compatibleProducts.length > 0 ? (
                compatibleProducts.slice(0, 5).map((product) => (
                  <Badge
                    key={product.id}
                    variant="secondary"
                    className="bg-primary-light text-primary hover:bg-primary-light text-xs"
                  >
                    {product.name}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-gray-400 italic">
                  {products.length === 0
                    ? "No hay productos disponibles. Crea productos primero."
                    : "Ingresa el rango térmico para ver productos activos"}
                </span>
              )}
              {compatibleProducts.length > 5 && (
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-600 hover:bg-gray-100 text-xs"
                >
                  +{compatibleProducts.length - 5} más
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {products.length > 0
                ? "Productos activos disponibles. Los productos se pueden asociar a este perfil térmico desde el formulario de productos."
                : "Crea productos primero para poder asociarlos a este perfil térmico"}
            </p>
          </div>
        </div>
      </Form>
    </EntityDialog>
  );
}
