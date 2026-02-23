import { useFormContext } from "react-hook-form";
import { Card } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { Plus } from "lucide-react";
import type { CreateDispatchOrderFormData } from "../../schemas/dispatchOrder.schema";
import { useAppStore } from "../../../../stores/useAppStore";
import { useLanes } from "../../../lanes/hooks/useLanes";
import { useThermalProfiles } from "../../../settings/hooks/useThermalProfiles";
import { useOrderCompartments } from "../hooks/useOrderCompartments";
import { OrderConfigurationForm, OrderCompartmentsTable, OrderSummary } from "../components";
import { useEffect, useState } from "react";
import { productsService } from "../../../../services/database/products.service";
import type { Product, ThermalProfile } from "../../../../types/database.types";

/** Product with nested thermal profile relations from Supabase join query */
interface ProductWithProfiles extends Product {
  product_thermal_profiles?: {
    thermal_profile: ThermalProfile | null;
    thermal_profile_id: number;
  }[];
}

/**
 * InformationTab - Tab de información para CREAR nuevas órdenes
 * 
 * NOTA: Este componente es solo para creación. La edición se maneja en el DispatchDrawer.
 */
export function InformationTab() {
  const form = useFormContext<CreateDispatchOrderFormData>();
  const organizationId = useAppStore((state) => state.organization?.id);

  const { lanes } = useLanes();
  const { thermalProfiles } = useThermalProfiles(organizationId || "");

  const [productThermalProfileMap, setProductThermalProfileMap] = useState<Map<number, number[]>>(new Map());
  const [products, setProducts] = useState<ProductWithProfiles[]>([]);

  const configuration = form.watch("configuration");

  // Load products with thermal profiles mapping
  useEffect(() => {
    if (organizationId) {
      productsService.getAllWithThermalProfiles(organizationId)
        .then((productsData) => {
          const activeProducts = (productsData as ProductWithProfiles[]).filter((p) => p.is_active);
          setProducts(activeProducts);

          // Build product-thermal profile mapping
          const map = new Map<number, number[]>();
          activeProducts.forEach((product) => {
            if (product.product_thermal_profiles && Array.isArray(product.product_thermal_profiles)) {
              const profileIds = product.product_thermal_profiles.map(
                (ptp) => ptp.thermal_profile?.id || ptp.thermal_profile_id
              ).filter(Boolean);
              if (profileIds.length > 0) {
                map.set(product.id, profileIds);
              }
            }
          });
          setProductThermalProfileMap(map);
        })
        .catch((error) => {
          console.error('Error loading products with thermal profiles:', error);
        });
    }
  }, [organizationId]);

  const {
    compartments,
    handleAddCompartment,
    handleRemoveCompartment,
    handleCompartmentChange,
  } = useOrderCompartments();

  const minCompartments = configuration === 'standard' ? 1 : 2;
  const canRemove = compartments.length > minCompartments;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <OrderConfigurationForm
          form={form as any}
          lanes={lanes}
        />

        <Card className="p-6 shadow-none">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Configuración de Carga</h3>
            {configuration === 'hybrid' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddCompartment}
                className="text-primary hover:text-primary hover:bg-gray-100 text-xs h-7 px-2 font-medium"
              >
                <Plus className="w-3.5 h-3.5 mr-0.5" />
                Agregar
              </Button>
            )}
          </div>

          <OrderCompartmentsTable
            compartments={compartments}
            products={products}
            thermalProfiles={thermalProfiles}
            productThermalProfileMap={productThermalProfileMap}
            onRemove={handleRemoveCompartment}
            onChange={handleCompartmentChange}
            canRemove={canRemove}
            isStandard={configuration === 'standard'}
          />
        </Card>

        <OrderSummary form={form as any} compartments={compartments} />
      </div>
    </div>
  );
}
