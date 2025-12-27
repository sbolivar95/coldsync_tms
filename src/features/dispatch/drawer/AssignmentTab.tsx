import { Label } from "../../../components/ui/Label";
import { DropdownSelect } from "../../../components/widgets/DropdownSelect";
import { Truck, User, Building2, AlertCircle } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { 
  type Order,
  carrierOptions,
  vehicleOptions,
  trailerOptions,
  driverOptions,
} from "../../../lib/mockData";

interface AssignmentTabProps {
  orderData: Order;
  onUpdate?: (data: any) => void;
  isEditable?: boolean;
}

export function AssignmentTab({ orderData, onUpdate, isEditable = true }: AssignmentTabProps) {
  const isAssigned = !!orderData.vehicleId;

  return (
    <div className="space-y-6">
      {/* Estado de asignación */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-md ${isAssigned ? 'bg-blue-100' : 'bg-gray-200'}`}>
            <Truck className={`w-4 h-4 ${isAssigned ? 'text-blue-600' : 'text-gray-500'}`} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">
              {isAssigned ? "Orden Asignada" : "Sin Asignación"}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              {isAssigned 
                ? "Esta orden ya tiene recursos asignados. Puedes modificar la asignación si es necesario."
                : "Selecciona el transportista, vehículo, remolque y conductor para esta orden."
              }
            </p>
          </div>
          {isAssigned && (
            <Badge className="bg-blue-50 text-blue-700 text-[10px]">
              Asignada
            </Badge>
          )}
        </div>
      </div>

      {/* Formulario de asignación */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400" />
            Transportista
          </h3>
          <div>
            <Label htmlFor="carrier" className="text-xs text-gray-600 mb-1.5 block">
              Seleccionar Transportista <span className="text-red-500">*</span>
            </Label>
            <DropdownSelect
              id="carrier"
              options={carrierOptions}
              value={orderData.carrier || ""}
              onChange={(value) => onUpdate?.({ ...orderData, carrier: value })}
              placeholder="Seleccionar transportista"
              disabled={!isEditable}
            />
          </div>
        </div>

        <div className="h-px bg-gray-200" />

        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-gray-400" />
            Vehículo y Remolque
          </h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="vehicle" className="text-xs text-gray-600 mb-1.5 block">
                Unidad Tractora <span className="text-red-500">*</span>
              </Label>
              <DropdownSelect
                id="vehicle"
                options={vehicleOptions}
                value={orderData.unit || ""}
                onChange={(value) => onUpdate?.({ ...orderData, unit: value, vehicleId: value })}
                placeholder="Seleccionar vehículo"
                disabled={!isEditable || !orderData.carrier}
              />
              {!orderData.carrier && (
                <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Primero selecciona un transportista
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="trailer" className="text-xs text-gray-600 mb-1.5 block">
                Remolque <span className="text-red-500">*</span>
              </Label>
              <DropdownSelect
                id="trailer"
                options={trailerOptions}
                value={orderData.trailer || ""}
                onChange={(value) => onUpdate?.({ ...orderData, trailer: value })}
                placeholder="Seleccionar remolque"
                disabled={!isEditable || !orderData.unit}
              />
              {!orderData.unit && (
                <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Primero selecciona un vehículo
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-200" />

        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            Conductor
          </h3>
          <div>
            <Label htmlFor="driver" className="text-xs text-gray-600 mb-1.5 block">
              Asignar Conductor <span className="text-red-500">*</span>
            </Label>
            <DropdownSelect
              id="driver"
              options={driverOptions}
              value={orderData.driver || ""}
              onChange={(value) => onUpdate?.({ ...orderData, driver: value })}
              placeholder="Seleccionar conductor"
              disabled={!isEditable || !orderData.trailer}
            />
            {!orderData.trailer && (
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Primero selecciona un remolque
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Resumen de asignación */}
      {isAssigned && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-xs font-medium text-blue-900 mb-2">Resumen de Asignación</h4>
          <div className="space-y-1.5 text-xs text-blue-700">
            <div className="flex justify-between">
              <span>Transportista:</span>
              <span className="font-medium">{orderData.carrier || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span>Vehículo:</span>
              <span className="font-medium">{orderData.unit || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span>Remolque:</span>
              <span className="font-medium">{orderData.trailer || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span>Conductor:</span>
              <span className="font-medium">{orderData.driver || "-"}</span>
            </div>
          </div>
        </div>
      )}

      {!isEditable && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-xs text-amber-800">
            No puedes modificar la asignación en el estado actual de la orden.
          </p>
        </div>
      )}
    </div>
  );
}
