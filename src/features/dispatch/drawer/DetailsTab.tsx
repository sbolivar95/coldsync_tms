import {
  Info,
  Truck,
} from "lucide-react";
import { Alert, AlertDescription } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Textarea } from "../../../components/ui/Textarea";
import {
  StaticField,
  EditableField,
  EditableDropdownField,
} from "../../../components/widgets/EditableFields";
import {
  type Order,
  getProductNameById,
  getThermalProfileNameById,
  getRouteNameById,
  timeWindowOptions,
  getTimeWindowLabel,
  formatWeight,
  productOptions,
  thermalProfileOptions,
} from "../../../lib/mockData";

interface DetailsTabProps {
  orderData: Order;
  onUpdate?: (data: any) => void;
  onAssign?: () => void;
  isEditable?: boolean;
}

// Helper para renderizar ruta con flecha azul
const getRutaLabel = (id: string) => {
  if (!id) return "-";
  const routeName = getRouteNameById(id);
  if (routeName === id) return id; // Si no se encontró, devolver el ID

  // Renderizar con flecha azul
  const parts = routeName.split(" → ");
  if (parts.length === 2) {
    return (
      <span className="flex items-center flex-wrap">
        {parts[0]}
        <span className="text-[#004ef0] mx-1 font-bold">→</span>
        {parts[1]}
      </span>
    );
  }
  return routeName;
};

export function DetailsTab({
  orderData,
  onUpdate,
  onAssign,
  isEditable = true,
}: DetailsTabProps) {
  const isHibrido = orderData.configuration === "hibrido" || orderData.configuration === "hybrid" || orderData.configuracion === "hibrido";

  // Using centralized options from mockData.ts

  // Calcular peso total (depende de orderData)
  const calcularPesoTotal = () => {
    if (isHibrido && orderData.compartimientos) {
      const total = orderData.compartimientos.reduce(
        (sum, comp) => {
          // Support both English and Spanish field names
          const compAny = comp as any;
          const peso = parseFloat(compAny.weight || compAny.peso || "0") || 0;
          return sum + peso;
        },
        0,
      );
      return `${total.toFixed(2)} Tn`;
    }
    return formatWeight(orderData.peso);
  };

  return (
    <div className="space-y-6">
      {/* Sección: Información de la Orden */}
      <div>
        <div className="space-y-4">
          <StaticField
            label="Ruta"
            value={getRutaLabel(orderData.routeId || orderData.ruta || "")}
          />

          <div className="grid grid-cols-2 gap-4">
            <StaticField
              label="Configuración"
              value={isHibrido ? "Híbrido" : "Standard"}
            />
            <StaticField
              label="Transportista"
              value={orderData.carrier || "Sin asignar"}
            />
          </div>
        </div>
      </div>

      {/* Separador */}
      <div className="border-t border-gray-200" />

      {/* Sección: Asignación */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
            Asignación de Unidad
          </h3>
          {isEditable && (
            <Button
              size="icon"
              onClick={onAssign}
              className="h-6 w-6 bg-[#004ef0] text-white hover:bg-[#003bc4] shadow-sm"
              title="Asignar / Reasignar unidad"
            >
              <Truck className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StaticField
            label="Remolque"
            value={
              orderData.trailer ||
              orderData.plate || (
                <span className="text-gray-400 font-normal">
                  Sin asignar
                </span>
              )
            }
          />
          <StaticField
            label="Vehículo"
            value={
              orderData.unit ||
              orderData.vehicleId || (
                <span className="text-gray-400 font-normal">
                  Sin asignar
                </span>
              )
            }
          />
          <StaticField
            label="Conductor"
            value={
              orderData.driver || (
                <span className="text-gray-400 font-normal">
                  Sin asignar
                </span>
              )
            }
          />
        </div>
      </div>

      {/* Separador */}
      <div className="border-t border-gray-200" />

      {/* Sección: Detalles de Carga */}
      <div>
        <h3 className="text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wide">
          Detalles de Carga
        </h3>

        {isHibrido ? (
          // Configuración Híbrido - Compartimientos
          <div className="space-y-4">
            {(orderData.compartments || orderData.compartimientos)?.map((comp, index) => {
              // Support both English and Spanish field names for backward compatibility
              const compAny = comp as any;
              return (
                <div
                  key={comp.id}
                  className="bg-gray-50 rounded-lg p-4 space-y-3"
                >
                  <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    Compartimiento {index + 1}
                  </div>

                  <div className="space-y-3">
                    <StaticField
                      label="Producto"
                      value={getProductNameById(comp.productId || compAny.producto || "")}
                    />
                    <StaticField
                      label="Perfil Térmico"
                      value={getThermalProfileNameById(comp.thermalProfileId || compAny.perfil || "")}
                    />
                    <StaticField
                      label="Peso"
                      value={formatWeight(comp.weight || compAny.peso || "")}
                    />
                  </div>
                </div>
              );
            })}

            {/* Peso total */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <StaticField
                label="Peso Total"
                value={calcularPesoTotal()}
              />
            </div>
          </div>
        ) : (
          // Configuración Standard
          <div className="grid grid-cols-3 gap-4">
            <EditableDropdownField
              label="Producto"
              value={orderData.productId || orderData.producto || ""}
              displayValue={getProductNameById(
                orderData.productId || orderData.producto || "",
              )}
              options={productOptions}
              onEdit={(value) =>
                onUpdate?.({ ...orderData, productId: value, producto: value })
              }
              isEditable={isEditable}
              required
            />
            <EditableDropdownField
              label="Perfil Térmico"
              value={orderData.thermalProfileId || orderData.perfil || ""}
              displayValue={getThermalProfileNameById(
                orderData.thermalProfileId || orderData.perfil || "",
              )}
              options={thermalProfileOptions}
              onEdit={(value) =>
                onUpdate?.({ ...orderData, thermalProfileId: value, perfil: value })
              }
              isEditable={isEditable}
              required
            />
            <EditableField
              label="Peso (Tn)"
              value={orderData.weight || orderData.peso || ""}
              displayValue={formatWeight(orderData.weight || orderData.peso)}
              type="text"
              onEdit={(value) =>
                onUpdate?.({ ...orderData, weight: value, peso: value })
              }
              isEditable={isEditable}
              required
            />
          </div>
        )}
      </div>

      {/* Separador */}
      <div className="border-t border-gray-200" />

      {/* Sección: Programación */}
      <div>
        <h3 className="text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wide">
          Programación
        </h3>

        <div className="space-y-4">
          {/* Fecha Prevista - EDITABLE inline */}
          <EditableField
            label="Fecha Prevista"
            value={orderData.expectedDate || orderData.fechaPrevista || ""}
            displayValue={
              (orderData.expectedDate || orderData.fechaPrevista)
                ? new Date(
                    orderData.expectedDate || orderData.fechaPrevista || "",
                  ).toLocaleDateString("es-ES", {
                    weekday: "short",
                    day: "numeric",
                    month: "numeric",
                  })
                : undefined
            }
            type="date"
            onEdit={(value) =>
              onUpdate?.({ ...orderData, expectedDate: value, fechaPrevista: value })
            }
            isEditable={isEditable}
            required
          />

          {/* Ventana de Tiempo + Hora en una sola fila */}
          <div
            className={
              (orderData.timeWindow || orderData.ventanaTiempo) === "hora-especifica"
                ? "grid grid-cols-[1fr_140px] gap-3 items-start"
                : ""
            }
          >
            {/* Ventana de Tiempo - EDITABLE con lápiz */}
            <EditableDropdownField
              label="Ventana de Tiempo"
              value={
                orderData.timeWindow || orderData.ventanaTiempo || "sin-preferencia"
              }
              displayValue={getTimeWindowLabel(
                orderData.timeWindow || orderData.ventanaTiempo || "sin-preferencia",
              )}
              options={timeWindowOptions}
              onEdit={(value) =>
                onUpdate?.({
                  ...orderData,
                  timeWindow: value,
                  ventanaTiempo: value,
                })
              }
              isEditable={isEditable}
              required
            />

            {/* Hora - Solo visible si es "hora-especifica" */}
            {(orderData.timeWindow || orderData.ventanaTiempo) === "hora-especifica" && (
              <EditableField
                label="Hora Específica"
                value={orderData.expectedTime || orderData.horaPrevista || ""}
                type="time"
                onEdit={(value) =>
                  onUpdate?.({
                    ...orderData,
                    expectedTime: value,
                    horaPrevista: value,
                  })
                }
                isEditable={isEditable}
                required
              />
            )}
          </div>
        </div>
      </div>

      {/* Separador */}
      <div className="border-t border-gray-200" />

      {/* Sección: Notas */}
      <div>
        <h3 className="text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wide">
          Notas Adicionales
        </h3>

        {isEditable ? (
          <Textarea
            value={orderData.notes || (orderData as any).notas || ""}
            onChange={(e) =>
              onUpdate?.({
                ...orderData,
                notes: e.target.value,
                ...((orderData as any).notas !== undefined && { notas: e.target.value }),
              })
            }
            placeholder="Agrega información adicional sobre la orden..."
            className="text-xs min-h-[80px] resize-none"
          />
        ) : (
          <p className="text-xs text-gray-700 whitespace-pre-wrap">
            {orderData.notes || (orderData as any).notas || (
              <span className="text-gray-400 italic">
                Sin notas adicionales
              </span>
            )}
          </p>
        )}
      </div>

      {/* Mensaje informativo si no es editable */}
      {!isEditable && (
        <Alert
          variant="default"
          className="bg-blue-50 border-blue-200 text-blue-700"
        >
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Esta orden no puede ser editada en su estado actual.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}