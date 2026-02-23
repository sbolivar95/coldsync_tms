import { EntityDialog } from "../../../../../components/widgets/EntityDialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Badge } from "../../../../../components/ui/Badge";
import { Compartment } from "../../../../../lib/mockData";
import { compartmentSchema, type CompartmentFormData } from "../../../../../lib/schemas/compartment.schemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../../../components/ui/Form";
import { Input } from "../../../../../components/ui/Input";

interface CompartmentDialogProps {
  open: boolean;
  onClose: () => void;
  compartimento?: Compartment;
  onSave: (compartimento: Compartment) => void;
}

// Función para detectar perfiles térmicos compatibles según rango de temperatura
const detectarPerfilesCompatibles = (tempMin: number, tempMax: number): string[] => {
  const perfiles: string[] = [];
  
  // Frozen: -30°C a -10°C
  if (tempMin <= -10 || tempMax <= -10) {
    perfiles.push("Frozen");
  }
  
  // Refrigerated: -10°C a 8°C
  if ((tempMin >= -10 && tempMin <= 8) || (tempMax >= -10 && tempMax <= 8) || (tempMin <= 0 && tempMax >= 8)) {
    perfiles.push("Refrigerated");
  }
  
  // Fresh: 0°C a 15°C
  if ((tempMin >= 0 && tempMin <= 15) || (tempMax >= 0 && tempMax <= 15) || (tempMin <= 8 && tempMax >= 15)) {
    perfiles.push("Fresh");
  }
  
  // Ambient: 10°C a 30°C
  if (tempMin >= 10 || tempMax >= 15) {
    perfiles.push("Ambient");
  }
  
  return perfiles.length > 0 ? perfiles : ["Fresh"]; // Default a Fresh si no hay match
};

export function CompartmentDialog({
  open,
  onClose,
  compartimento,
  onSave,
}: CompartmentDialogProps) {
  const form = useForm<CompartmentFormData>({
    resolver: zodResolver(compartmentSchema),
    defaultValues: {
      id: compartimento?.id || "",
      tempMin: compartimento?.tempMin || "",
      tempMax: compartimento?.tempMax || "",
      maxWeight: compartimento?.maxWeight || "",
      maxVolume: compartimento?.maxVolume || "",
      maxUnits: compartimento?.maxUnits || "",
      thermalProfileIds: compartimento?.thermalProfileIds || [],
    },
  });

  // Reset form when compartimento changes
  useEffect(() => {
    if (open) {
      form.reset({
        id: compartimento?.id || "",
        tempMin: compartimento?.tempMin || "",
        tempMax: compartimento?.tempMax || "",
        maxWeight: compartimento?.maxWeight || "",
        maxVolume: compartimento?.maxVolume || "",
        maxUnits: compartimento?.maxUnits || "",
        thermalProfileIds: compartimento?.thermalProfileIds || [],
      });
    }
  }, [open, compartimento, form]);

  // Watch temperature values to detect thermal profiles
  const tempMin = form.watch("tempMin");
  const tempMax = form.watch("tempMax");

  // Detectar perfiles automáticamente basado en rango de temperatura
  const perfilesDetectados = tempMin && tempMax 
    ? detectarPerfilesCompatibles(Number(tempMin), Number(tempMax))
    : [];

  // Update thermalProfileIds when profiles are detected
  useEffect(() => {
    if (perfilesDetectados.length > 0) {
      form.setValue("thermalProfileIds", perfilesDetectados);
    }
  }, [perfilesDetectados, form]);

  const handleSave = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    const formData = form.getValues();
    onSave({
      id: formData.id,
      tempMin: formData.tempMin,
      tempMax: formData.tempMax,
      thermalProfileIds: formData.thermalProfileIds,
      maxWeight: formData.maxWeight,
      maxVolume: formData.maxVolume,
      maxUnits: formData.maxUnits,
    });
  };

  const isFormValid = form.formState.isValid;

  return (
    <EntityDialog
      open={open}
      onClose={onClose}
      title={compartimento ? "Editar Compartimento" : "Nuevo Compartimento"}
      description={compartimento 
        ? "Modifica los detalles del compartimento existente" 
        : "Añade un nuevo compartimento térmico al remolque"}
      onSave={handleSave}
      disableSave={!isFormValid}
      isEdit={!!compartimento}
    >
      <Form {...form}>
        <form className="space-y-6">
          {/* ID Compartimento */}
          <FormField
            control={form.control}
            name="id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID Compartimento *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="C1, C2, C3..." />
                </FormControl>
                <FormMessage />
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
                name="tempMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>T. Mínima (°C) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        placeholder="-20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tempMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>T. Máxima (°C) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        placeholder="5"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

      {/* Perfil Térmico Detectado - Solo lectura */}
      <div>
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Perfil Térmico Detectado
        </h4>
        <div className="flex flex-wrap gap-2 min-h-[36px] items-center">
          {perfilesDetectados.length > 0 ? (
            perfilesDetectados.map((perfil) => (
              <Badge
                key={perfil}
                variant="secondary"
                className="bg-gray-100 text-gray-700 hover:bg-gray-100 text-xs"
              >
                {perfil}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-gray-400 italic">
              Ingresa el rango térmico para detectar perfiles compatibles
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Perfiles compatibles detectados automáticamente según el rango térmico configurado
        </p>
      </div>

          {/* Capacidades */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Capacidades
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="maxWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso Máx (Tn) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        placeholder="12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxVolume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Volumen (m³) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        placeholder="40"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxUnits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidades *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        placeholder="320"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
      </Form>
    </EntityDialog>
  );
}

