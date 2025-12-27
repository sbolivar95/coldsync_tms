import { EntityDialog } from "../../components/widgets/EntityDialog";
import { InputField } from "../../components/widgets/FormField";
import { useState, useEffect } from "react";
import { Badge } from "../../components/ui/Badge";
import { Checkbox } from "../../components/ui/Checkbox";
import { type Product, type ThermalProfile } from "../../lib/mockData";

interface ProductDialogProps {
  open: boolean;
  onClose: () => void;
  product?: Product;
  thermalProfiles: ThermalProfile[];
  onSave: (product: Product) => void;
}

export function ProductDialog({
  open,
  onClose,
  product,
  thermalProfiles,
  onSave,
}: ProductDialogProps) {
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>(
    product?.thermalProfileIds || []
  );

  // Reset form when product changes or dialog opens
  useEffect(() => {
    if (open) {
      setName(product?.name || "");
      setDescription(product?.description || "");
      setSelectedProfiles(product?.thermalProfileIds || []);
    }
  }, [open, product]);

  const handleProfileToggle = (profileId: string) => {
    setSelectedProfiles((prev) =>
      prev.includes(profileId)
        ? prev.filter((id) => id !== profileId)
        : [...prev, profileId]
    );
  };

  const handleSave = () => {
    onSave({
      id: product?.id || `PROD-${Date.now()}`,
      name,
      description,
      thermalProfileIds: selectedProfiles,
      status: product?.status || "Activo",
    });
    onClose();
  };

  const isFormValid = name && description && selectedProfiles.length > 0;

  return (
    <EntityDialog
      open={open}
      onClose={onClose}
      title={product ? "Editar Producto" : "Agregar Producto"}
      description={product 
        ? "Modifica los detalles del producto existente" 
        : "Define un nuevo producto para gestionar en la cadena de frío"}
      onSave={handleSave}
      disableSave={!isFormValid}
      isEdit={!!product}
      maxWidth="max-w-xl"
    >
      {/* Nombre del Producto */}
      <InputField
        label="Nombre del Producto"
        id="nombre-producto"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ej: Vacuna COVID-19 Pfizer"
      />

      {/* Descripción */}
      <div>
        <label htmlFor="descripcion" className="block text-xs font-medium text-gray-700 mb-1.5">
          Descripción <span className="text-red-500">*</span>
        </label>
        <textarea
          id="descripcion"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe las características del producto..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-h-[70px] resize-none"
        />
      </div>

      {/* Perfiles Térmicos */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Perfiles Térmicos <span className="text-red-500">*</span>
        </label>
        <div className="border border-gray-300 rounded-md max-h-[200px] overflow-y-auto">
          {thermalProfiles.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {thermalProfiles.map((perfil) => (
                <label
                  key={perfil.id}
                  className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedProfiles.includes(perfil.id)}
                    onCheckedChange={() => handleProfileToggle(perfil.id)}
                    className="mt-0.5 data-[state=checked]:bg-[#004ef0] data-[state=checked]:border-[#004ef0]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-gray-900">
                        {perfil.name}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className="bg-blue-50 text-blue-700 hover:bg-blue-50 text-xs"
                      >
                        {perfil.tempMin}°C a {perfil.tempMax}°C
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {perfil.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-xs text-gray-400 italic">
                No hay perfiles térmicos disponibles. Crea uno primero.
              </p>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1.5">
          Selecciona uno o más perfiles térmicos compatibles con este producto
        </p>
      </div>
    </EntityDialog>
  );
}