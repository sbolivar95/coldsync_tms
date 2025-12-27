import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/Dialog";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";
import { Textarea } from "../../../components/ui/Textarea";
import { DropdownSelect } from "../../../components/widgets/DropdownSelect";
import { DatePicker } from "../../../components/widgets/DatePicker";
import { TimePicker } from "../../../components/widgets/TimePicker";
import { DialogActions } from "../../../components/widgets/DialogActions";
import { useState, useEffect } from "react";
import { 
  type Order, 
  type OrderCompartment,
  productOptions,
  routeOptions,
  thermalProfileOptions,
  orderConfigurationOptions,
  timeWindowOptions,
} from "../../../lib/mockData";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";

interface OrderDialogProps {
  open: boolean;
  onClose: () => void;
  orden?: Order;
  onSave: (orden: Order) => void;
}

// Using centralized options from mockData.ts

export function OrderDialog({ open, onClose, orden, onSave }: OrderDialogProps) {
  const [formData, setFormData] = useState<Order>({
    configuration: "standard",
    routeId: "",
    productId: "",
    thermalProfileId: "",
    weight: "",
    quantity: "1",
    expectedDate: "",
    timeWindow: "sin-preferencia",
    expectedTime: "",
    notes: "",
    compartments: [],
  });

  useEffect(() => {
    if (orden) {
      setFormData(orden);
    } else {
      setFormData({
        configuration: "standard",
        routeId: "",
        productId: "",
        thermalProfileId: "",
        weight: "",
        quantity: "1",
        expectedDate: "",
        timeWindow: "sin-preferencia",
        expectedTime: "",
        notes: "",
        compartments: [],
      });
    }
  }, [orden, open]);

  const handleConfigurationChange = (value: string) => {
    if (value === "hibrido") {
      // Al cambiar a híbrido, inicializar con un compartimiento vacío
      setFormData({
        ...formData,
        configuration: value as "standard" | "hibrido" | "hybrid",
        productId: undefined,
        thermalProfileId: undefined,
        weight: undefined,
        compartments: [{
          id: Date.now().toString(),
          productId: "",
          thermalProfileId: "",
          weight: "",
        }],
      });
    } else {
      // Al cambiar a standard, limpiar compartimientos
      setFormData({
        ...formData,
        configuration: value as "standard" | "hibrido" | "hybrid",
        productId: "",
        thermalProfileId: "",
        weight: "",
        compartments: [],
      });
    }
  };

  const handleAddCompartment = () => {
    const newCompartment: OrderCompartment = {
      id: Date.now().toString(),
      productId: "",
      thermalProfileId: "",
      weight: "",
    };
    setFormData({
      ...formData,
      compartments: [...(formData.compartments || []), newCompartment],
    });
  };

  const handleRemoveCompartment = (id: string) => {
    setFormData({
      ...formData,
      compartments: formData.compartments?.filter(c => c.id !== id),
    });
  };

  const handleCompartmentChange = (id: string, field: keyof OrderCompartment, value: string) => {
    setFormData({
      ...formData,
      compartments: formData.compartments?.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      ),
    });
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const isHibrido = formData.configuration === "hibrido";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">
            {orden ? "Editar Orden" : "Nueva Orden de Despacho"}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            {orden 
              ? "Actualiza la información de la orden de despacho."
              : "Completa los datos para crear una nueva orden de despacho. Esta información se usará para planificar y asignar recursos."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3 overflow-y-auto pr-2">
          {/* Fila 1: Configuración | Ruta | Cant. */}
          <div className="grid gap-2.5" style={{ gridTemplateColumns: '130px 1fr 70px' }}>
            <div>
              <Label htmlFor="configuracion" className="text-xs text-gray-600 mb-1.5 block">
                Configuración <span className="text-red-500">*</span>
              </Label>
              <DropdownSelect
                id="configuracion"
                options={orderConfigurationOptions}
                value={formData.configuration}
                onChange={handleConfigurationChange}
                placeholder="Seleccionar"
              />
            </div>
            <div>
              <Label htmlFor="ruta" className="text-xs text-gray-600 mb-1.5 block">
                Ruta <span className="text-red-500">*</span>
              </Label>
              <DropdownSelect
                id="ruta"
                options={routeOptions}
                value={formData.routeId}
                onChange={(value) => setFormData({ ...formData, routeId: value })}
                placeholder="Seleccionar ruta"
              />
            </div>
            <div>
              <Label htmlFor="cantidad" className="text-xs text-gray-600 mb-1.5 block">
                Cant. <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cantidad"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="1"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Fila 2: Producto | Perfil Térmico | Peso */}
          {!isHibrido ? (
            <div className="grid gap-2.5" style={{ gridTemplateColumns: '130px 1fr 70px' }}>
              <div>
                <Label htmlFor="producto" className="text-xs text-gray-600 mb-1.5 block">
                  Producto <span className="text-red-500">*</span>
                </Label>
                <DropdownSelect
                  id="producto"
                  options={productOptions}
                  value={formData.productId}
                  onChange={(value) => setFormData({ ...formData, productId: value })}
                  placeholder="Seleccionar"
                />
              </div>
              <div>
                <Label htmlFor="perfil" className="text-xs text-gray-600 mb-1.5 block">
                  Perfil Térmico <span className="text-red-500">*</span>
                </Label>
                <DropdownSelect
                  id="perfil"
                  options={thermalProfileOptions}
                  value={formData.thermalProfileId}
                  onChange={(value) => setFormData({ ...formData, thermalProfileId: value })}
                  placeholder="Seleccionar"
                />
              </div>
              <div>
                <Label htmlFor="peso" className="text-xs text-gray-600 mb-1.5 block">
                  Peso (Tn) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="peso"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="0.00"
                  className="h-9 text-xs"
                />
              </div>
            </div>
          ) : (
            // HÍBRIDO: Compartimientos
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-600">
                  Compartimientos <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCompartment}
                  className="gap-1.5 h-7 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar
                </Button>
              </div>

              {formData.compartments && formData.compartments.length > 0 ? (
                <div className="space-y-2">
                  {formData.compartments.map((comp, index) => (
                    <div key={comp.id} className="border border-gray-200 rounded-md p-2.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">
                          Compartimiento {index + 1}
                        </span>
                        {formData.compartments!.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCompartment(comp.id)}
                            className="h-5 w-5 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-2.5" style={{ gridTemplateColumns: '130px 1fr 70px' }}>
                        <div>
                          <Label className="text-xs text-gray-600 mb-1 block">
                            Producto <span className="text-red-500">*</span>
                          </Label>
                          <DropdownSelect
                            options={productOptions}
                            value={comp.productId}
                            onChange={(value) => handleCompartmentChange(comp.id, "productId", value)}
                            placeholder="Seleccionar"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600 mb-1 block">
                            Perfil <span className="text-red-500">*</span>
                          </Label>
                          <DropdownSelect
                            options={thermalProfileOptions}
                            value={comp.thermalProfileId}
                            onChange={(value) => handleCompartmentChange(comp.id, "thermalProfileId", value)}
                            placeholder="Seleccionar"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600 mb-1 block">
                            Peso (Tn) <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={comp.weight}
                            onChange={(e) => handleCompartmentChange(comp.id, "weight", e.target.value)}
                            placeholder="0.00"
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-gray-400 border border-dashed border-gray-300 rounded-md">
                  No hay compartimientos
                </div>
              )}
            </div>
          )}

          {/* Fila 3: Fecha | Ventana de Tiempo | Hora */}
          <div className="grid gap-2.5" style={{ gridTemplateColumns: '130px 1fr 70px' }}>
            <div>
              <Label htmlFor="fecha" className="text-xs text-gray-600 mb-1.5 block">
                Fecha <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                id="fecha"
                value={formData.expectedDate}
                onChange={(value) => setFormData({ ...formData, expectedDate: value })}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="ventana" className="text-xs text-gray-600 mb-1.5 block">
                Ventana de Tiempo <span className="text-red-500">*</span>
              </Label>
              <DropdownSelect
                id="ventana"
                options={timeWindowOptions}
                value={formData.timeWindow}
                onChange={(value) => setFormData({ ...formData, timeWindow: value })}
                placeholder="Seleccionar"
              />
            </div>
            <div>
              <Label htmlFor="hora" className="text-xs text-gray-600 mb-1.5 block">
                Hora {formData.timeWindow === "hora-especifica" && <span className="text-red-500">*</span>}
              </Label>
              <TimePicker
                id="hora"
                value={formData.expectedTime}
                onChange={(value) => setFormData({ ...formData, expectedTime: value })}
                className="h-9 text-xs"
                disabled={formData.timeWindow !== "hora-especifica"}
              />
            </div>
          </div>

          {/* Fila 4: Notas Adicionales */}
          <div>
            <Label htmlFor="notas" className="text-xs text-gray-600 mb-1.5 block">
              Notas Adicionales
            </Label>
            <Textarea
              id="notas"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Agrega información adicional sobre la orden..."
              rows={2}
              className="resize-none text-xs"
            />
          </div>
        </div>

        <DialogActions
          onCancel={onClose}
          onSave={handleSave}
          saveLabel={orden ? "Guardar Cambios" : "Crear Orden"}
        />
      </DialogContent>
    </Dialog>
  );
}

