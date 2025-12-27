import { EntityDialog } from "../../../../components/widgets/EntityDialog";
import { InputField } from "../../../../components/widgets/FormField";
import { useState, useEffect } from "react";
import { Badge } from "../../../../components/ui/Badge";
import { Compartment } from "../../../../lib/mockData";

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
  const [id, setId] = useState(compartimento?.id || "");
  const [tempMin, setTempMin] = useState(compartimento?.tempMin || "");
  const [tempMax, setTempMax] = useState(compartimento?.tempMax || "");
  const [maxWeight, setMaxWeight] = useState(compartimento?.maxWeight || "");
  const [maxVolume, setMaxVolume] = useState(compartimento?.maxVolume || "");
  const [maxUnits, setMaxUnits] = useState(compartimento?.maxUnits || "");

  // Reset form when compartimento changes
  useEffect(() => {
    if (open) {
      setId(compartimento?.id || "");
      setTempMin(compartimento?.tempMin || "");
      setTempMax(compartimento?.tempMax || "");
      setMaxWeight(compartimento?.maxWeight || "");
      setMaxVolume(compartimento?.maxVolume || "");
      setMaxUnits(compartimento?.maxUnits || "");
    }
  }, [open, compartimento]);

  // Detectar perfiles automáticamente basado en rango de temperatura
  const perfilesDetectados = tempMin && tempMax 
    ? detectarPerfilesCompatibles(Number(tempMin), Number(tempMax))
    : [];

  const handleSave = () => {
    onSave({
      id,
      tempMin,
      tempMax,
      thermalProfileIds: perfilesDetectados,
      maxWeight,
      maxVolume,
      maxUnits,
    });
  };

  const isFormValid = id && tempMin && tempMax && maxWeight && maxVolume && maxUnits;

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
      {/* ID Compartimento */}
      <InputField
        label="ID Compartimento"
        id="id-compartimento"
        required
        value={id}
        onChange={(e) => setId(e.target.value)}
        placeholder="C1, C2, C3..."
      />

      {/* Rango Térmico */}
      <div>
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Rango Térmico
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="T. Mínima (°C)"
            id="rango-temp-min"
            required
            type="number"
            value={tempMin}
            onChange={(e) => setTempMin(e.target.value)}
            placeholder="-20"
          />

          <InputField
            label="T. Máxima (°C)"
            id="rango-temp-max"
            required
            type="number"
            value={tempMax}
            onChange={(e) => setTempMax(e.target.value)}
            placeholder="5"
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
          <InputField
            label="Peso Máx (Tn)"
            id="peso-maximo"
            required
            type="number"
            step="0.1"
            value={maxWeight}
            onChange={(e) => setMaxWeight(e.target.value)}
            placeholder="12"
          />

          <InputField
            label="Volumen (m³)"
            id="volumen-maximo"
            required
            type="number"
            value={maxVolume}
            onChange={(e) => setMaxVolume(e.target.value)}
            placeholder="40"
          />

          <InputField
            label="Unidades"
            id="unidades-maximas"
            required
            type="number"
            value={maxUnits}
            onChange={(e) => setMaxUnits(e.target.value)}
            placeholder="320"
          />
        </div>
      </div>
    </EntityDialog>
  );
}

