import { EntityDialog } from "../../components/widgets/EntityDialog";
import { InputField } from "../../components/widgets/FormField";
import { useState, useEffect } from "react";
import { Badge } from "../../components/ui/Badge";
import { type ThermalProfile } from "../../lib/mockData";

interface ThermalProfileDialogProps {
  open: boolean;
  onClose: () => void;
  profile?: ThermalProfile;
  onSave: (profile: ThermalProfile) => void;
}

// Productos disponibles para asociar al perfil térmico
const availableProducts = [
  "Vacuna COVID-19 Pfizer",
  "Vacuna mRNA Moderna",
  "Salmón Atlántico Fresco",
  "Insulina Humana",
  "Carne de Res Congelada",
  "Helado Premium",
  "Productos Lácteos Mix",
  "Vegetales Orgánicos",
  "Frutas Tropicales",
  "Chocolates Artesanales",
  "Mariscos Congelados",
  "Plasma Sanguíneo",
];

export function ThermalProfileDialog({
  open,
  onClose,
  profile,
  onSave,
}: ThermalProfileDialogProps) {
  const [nombre, setNombre] = useState(profile?.name || "");
  const [descripcion, setDescripcion] = useState(profile?.description || "");
  const [tempMin, setTempMin] = useState(profile?.tempMin?.toString() || "");
  const [tempMax, setTempMax] = useState(profile?.tempMax?.toString() || "");

  // Reset form when profile changes
  useEffect(() => {
    if (open) {
      setNombre(profile?.name || "");
      setDescripcion(profile?.description || "");
      setTempMin(profile?.tempMin?.toString() || "");
      setTempMax(profile?.tempMax?.toString() || "");
    }
  }, [open, profile]);

  // Detect compatible products based on temperature range
  const detectCompatibleProducts = (): string[] => {
    if (!tempMin || !tempMax) return [];
    
    const min = Number(tempMin);
    const max = Number(tempMax);
    
    // Lógica simplificada de detección (se puede mejorar según las reglas de negocio)
    const compatibles: string[] = [];
    
    // Ultra congelado: -70 a -60
    if (min <= -60 && max <= -50) {
      compatibles.push("Vacuna COVID-19 Pfizer", "Vacuna mRNA Moderna");
    }
    
    // Refrigeración farmacéutica: 2 a 8
    if (min >= 0 && min <= 4 && max >= 6 && max <= 10) {
      compatibles.push("Insulina Humana", "Vacuna COVID-19 Pfizer");
    }
    
    // Congelado estándar: -18 a -12
    if (min >= -20 && min <= -15 && max >= -15 && max <= -10) {
      compatibles.push("Carne de Res Congelada", "Helado Premium", "Mariscos Congelados");
    }
    
    // Pescado fresco: -2 a 2
    if (min >= -5 && min <= 0 && max >= 0 && max <= 5) {
      compatibles.push("Salmón Atlántico Fresco");
    }
    
    // Lácteos: 2 a 6
    if (min >= 0 && min <= 3 && max >= 4 && max <= 8) {
      compatibles.push("Productos Lácteos Mix");
    }
    
    // Vegetales: 1 a 4
    if (min >= 0 && min <= 2 && max >= 2 && max <= 6) {
      compatibles.push("Vegetales Orgánicos");
    }
    
    // Frutas tropicales: 8 a 13
    if (min >= 6 && min <= 10 && max >= 10 && max <= 15) {
      compatibles.push("Frutas Tropicales");
    }
    
    // Chocolate: 15 a 18
    if (min >= 13 && min <= 16 && max >= 16 && max <= 20) {
      compatibles.push("Chocolates Artesanales");
    }
    
    // Plasma: -25 a -18
    if (min >= -30 && min <= -20 && max >= -20 && max <= -15) {
      compatibles.push("Plasma Sanguíneo");
    }
    
    return compatibles;
  };

  const compatibleProducts = detectCompatibleProducts();

  const handleSave = () => {
    onSave({
      id: profile?.id || `PT-${Date.now()}`,
      name: nombre,
      description: descripcion,
      tempMin: Number(tempMin),
      tempMax: Number(tempMax),
      products: compatibleProducts,
      status: profile?.status || "Activo",
      compatibility: profile?.compatibility || "Media",
    });
    onClose();
  };

  const isFormValid = nombre && descripcion && tempMin && tempMax;

  return (
    <EntityDialog
      open={open}
      onClose={onClose}
      title={profile ? "Editar Perfil Térmico" : "Crear Perfil"}
      description={profile
        ? "Modifica los detalles del perfil térmico existente"
        : "Define un nuevo perfil de temperatura para gestionar la cadena de frío"}
      onSave={handleSave}
      disableSave={!isFormValid}
      isEdit={!!profile}
    >
      {/* Nombre del Perfil */}
      <InputField
        label="Nombre del Perfil"
        id="nombre-perfil"
        required
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Ej: Refrigeración Farmacéutica"
      />

      {/* Descripción */}
      <div>
        <label htmlFor="descripcion" className="block text-xs font-medium text-gray-700 mb-1.5">
          Descripción <span className="text-red-500">*</span>
        </label>
        <textarea
          id="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Describe el propósito y uso de este perfil térmico..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-h-[80px] resize-none"
        />
      </div>

      {/* Rango Térmico */}
      <div>
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Rango Térmico
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="T. Mínima (°C)"
            id="temp-min"
            required
            type="number"
            value={tempMin}
            onChange={(e) => setTempMin(e.target.value)}
            placeholder="-20"
          />

          <InputField
            label="T. Máxima (°C)"
            id="temp-max"
            required
            type="number"
            value={tempMax}
            onChange={(e) => setTempMax(e.target.value)}
            placeholder="5"
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
            compatibleProducts.map((productName) => (
              <Badge
                key={productName}
                variant="secondary"
                className="bg-blue-50 text-blue-700 hover:bg-blue-50 text-xs"
              >
                {productName}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-gray-400 italic">
              Ingresa el rango térmico para detectar productos compatibles
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Productos compatibles detectados automáticamente según el rango térmico configurado
        </p>
      </div>
    </EntityDialog>
  );
}