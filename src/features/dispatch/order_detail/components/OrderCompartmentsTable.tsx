import { Input } from "../../../../components/ui/Input";
import { useFormContext } from "react-hook-form";
import { DataTable } from "../../../../components/widgets/DataTable/DataTable";
import type { DataTableColumn, DataTableAction } from "../../../../components/widgets/DataTable/types";
import { SmartSelect, type SmartOption } from "../../../../components/widgets/SmartSelect";
import { X } from "lucide-react";
import type { CompartmentState } from "../hooks/useOrderCompartments";
import type { CompartmentFormData } from "../../schemas/dispatchOrder.schema";
import type { Product, ThermalProfile } from "../../../../types/database.types";
import { productThermalProfilesService } from "../../../../services/database/products.service";
import { useAppStore } from "../../../../stores/useAppStore";

interface OrderCompartmentsTableProps {
    compartments: CompartmentState[];
    products: Product[];
    thermalProfiles: ThermalProfile[];
    productThermalProfileMap: Map<number, number[]>;
    onRemove: (index: number) => void;
    onChange: (index: number, field: keyof CompartmentFormData, value: number) => void;
    canRemove: boolean;
    isStandard: boolean;
}

export function OrderCompartmentsTable({
    compartments,
    products,
    thermalProfiles,
    productThermalProfileMap,
    onRemove,
    onChange,
    canRemove,
    isStandard
}: OrderCompartmentsTableProps) {
    const { watch } = useFormContext();
    const organizationId = useAppStore((state) => state.organization?.id);

    const productOptions: SmartOption[] = products.map(product => ({
        value: product.id.toString(),
        label: product.name
    }));

    // Get thermal profile options for a specific product
    const getThermalProfileOptionsForProduct = (productId: number | undefined) => {
        if (!productId) {
            return [];
        }

        const allowedProfileIds = productThermalProfileMap.get(productId) || [];
        return thermalProfiles
            .filter((profile) => allowedProfileIds.includes(profile.id))
            .map((profile) => ({
                value: profile.id.toString(),
                label: `${profile.name} (${profile.temp_min_c}°C - ${profile.temp_max_c}°C)`
            }));
    };

    // Handle product change with auto-select thermal profile
    const handleProductChange = async (index: number, productId: number) => {
        onChange(index, "product_id", productId);

        // Auto-select first thermal profile for this product
        if (productId && organizationId) {
            try {
                const productProfiles = await productThermalProfilesService.getByProductId(productId, organizationId);
                if (productProfiles.length > 0) {
                    onChange(index, "thermal_profile_id", productProfiles[0].thermal_profile_id);
                } else {
                    onChange(index, "thermal_profile_id", 0);
                }
            } catch (error) {
                console.error('Error fetching thermal profiles for product:', error);
                onChange(index, "thermal_profile_id", 0);
            }
        } else {
            onChange(index, "thermal_profile_id", 0);
        }
    };

    type CompartmentRow = CompartmentState & {
        originalIndex: number;
        id: string;
    };

    const dataWithIndex: CompartmentRow[] = compartments.map((comp, index) => ({
        ...comp,
        originalIndex: index,
        id: comp.id
    }));

    const columns: DataTableColumn<CompartmentRow>[] = [
        {
            key: "order",
            header: "#",
            width: "60px",
            align: "center",
            render: (item) => (
                <div className="flex items-center justify-center">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full border border-gray-200 bg-white">
                        <span className="text-xs font-medium text-gray-700">{item.originalIndex + 1}</span>
                    </div>
                </div>
            )
        },
        {
            key: "product",
            header: "PRODUCTO",
            width: "35%",
            render: (item) => (
                <SmartSelect
                    value={item.product_id?.toString() || ""}
                    onChange={(val) => {
                        const stringValue = Array.isArray(val) ? val[0] : val;
                        handleProductChange(item.originalIndex, parseInt(stringValue) || 0);
                    }}
                    options={productOptions}
                    placeholder="Seleccionar producto..."
                    searchable={true}
                />
            )
        },
        {
            key: "profile",
            header: "PERFIL TÉRMICO",
            width: "35%",
            render: (item) => {
                const compartmentProductId = watch(`compartments.${item.originalIndex}.product_id`);
                const thermalOptions = getThermalProfileOptionsForProduct(compartmentProductId);

                return (
                    <SmartSelect
                        value={item.thermal_profile_id?.toString() || ""}
                        onChange={(val) => {
                            const stringValue = Array.isArray(val) ? val[0] : val;
                            onChange(item.originalIndex, "thermal_profile_id", parseInt(stringValue) || 0);
                        }}
                        options={thermalOptions}
                        placeholder={compartmentProductId ? "Seleccionar perfil..." : "Selecciona un producto primero"}
                        searchable={true}
                        disabled={!compartmentProductId}
                    />
                );
            }
        },
        {
            key: "weight",
            header: "PESO",
            width: "120px",
            render: (item) => (
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        className="h-9 text-sm w-20 border-gray-200 shadow-none"
                        placeholder="25.5"
                        step="0.01"
                        value={item.weight_tn || ""}
                        onChange={(e) => onChange(item.originalIndex, "weight_tn", parseFloat(e.target.value) || 0)}
                    />
                    <span className="text-xs text-gray-500">TN</span>
                </div>
            )
        }
    ];

    const actions: DataTableAction<CompartmentRow>[] = [
        {
            icon: <X className="w-4 h-4 text-red-500" />,
            onClick: (item) => onRemove(item.originalIndex),
            title: "Eliminar",
            variant: "destructive",
            hidden: () => !canRemove || isStandard
        }
    ];

    const emptyMessage = isStandard
        ? "Configuración Standard: 1 compartimiento por defecto."
        : "Configuración Híbrido: Mínimo 2 compartimientos requeridos.";

    return (
        <div className="space-y-2">
            <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                <DataTable
                    data={dataWithIndex}
                    columns={columns}
                    getRowId={(item) => item.id}
                    actions={actions}
                    showSelection={false}
                    showPagination={false}
                    allowOverflow={true}
                    emptyMessage={emptyMessage}
                />
            </div>
        </div>
    );
}
