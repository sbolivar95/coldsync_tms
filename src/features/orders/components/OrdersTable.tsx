
import { CarrierOrder } from "../../../services/database/orders.service";
import { DataTable } from "../../../components/widgets/DataTable/DataTable";
import { DataTableColumn, DataTableBulkAction, DataTableAction } from "../../../components/widgets/DataTable/types";
import { CheckCircle2, XCircle, Eye, MoreVertical, Check, X, AlertTriangle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../../../components/ui/DropdownMenu";
import { Button } from "../../../components/ui/Button";
import {
    formatDateAndTime,
    isOrderHybrid,
    getEquipmentType,
    getOrderStatusDisplay
} from "../utils/orders-helpers";
import { OrderStatusCell } from "./OrderStatusCell";

interface OrdersTableProps {
    orders: CarrierOrder[];
    onRowClick: (order: CarrierOrder) => void;
    onQuickAccept?: (orderIds: string[]) => void;
    onQuickReject?: (orderIds: string[]) => void;
    onAcceptOrder?: (order: CarrierOrder) => void;
    onRejectOrder?: (order: CarrierOrder) => void;
    onFailAfterAccept?: (order: CarrierOrder) => void;
    activeTab?: string;
}

export function OrdersTable({
    orders,
    onRowClick,
    onQuickAccept,
    onQuickReject,
    onAcceptOrder,
    onRejectOrder,
    onFailAfterAccept,
    activeTab
}: OrdersTableProps) {

    const columns: DataTableColumn<CarrierOrder>[] = [
        {
            key: "lane",
            header: "Pasillo Logístico (Secuencia)",
            width: "300px",
            render: (item) => {
                if (!item.lane) {
                    return (
                        <div className="flex flex-col gap-0.5 py-2">
                            <span className="text-sm font-semibold text-gray-400 leading-none">-</span>
                        </div>
                    );
                }

                const laneStops = item.lane.lane_stops || [];
                const sortedStops = [...laneStops].sort((a, b) => a.stop_order - b.stop_order);
                const stops = sortedStops.map(s => ({ name: s.location.name }));
                const distance = item.lane.distance ? `${item.lane.distance} km` : "-";

                // Si hay más de 3 stops, mostrar versión condensada
                if (stops.length > 3) {
                    const first = stops[0];
                    const last = stops[stops.length - 1];
                    const middleCount = stops.length - 2;

                    return (
                        <div className="flex flex-col gap-0.5 py-2">
                            {/* Row 1: Origin -> Dest (Condensed) */}
                            <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-sm font-semibold text-gray-900 leading-none">{first.name}</span>
                                <span className="text-gray-400 text-sm leading-none">→</span>
                                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full font-medium">
                                    +{middleCount} ubicaciones
                                </span>
                                <span className="text-gray-400 text-sm leading-none">→</span>
                                <span className="text-sm font-semibold text-gray-900 leading-none">{last.name}</span>
                            </div>
                            {/* Row 2: Date + Distance */}
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs text-gray-500 font-medium">
                                    {formatDateAndTime(item.planned_start_at)}
                                </span>
                                <span className="text-xs text-primary font-bold">{distance}</span>
                            </div>
                        </div>
                    );
                }

                // Vista normal para 2-3 stops
                return (
                    <div className="flex flex-col gap-0.5 py-2">
                        {/* Row 1: Origin -> Destination */}
                        <div className="flex items-center gap-1 flex-wrap">
                            {stops.map((stop, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                    <span className="text-sm font-semibold text-gray-900 leading-none">
                                        {stop.name}
                                    </span>
                                    {idx < stops.length - 1 && (
                                        <span className="text-gray-400 text-sm leading-none">→</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        {/* Row 2: Date + Distance */}
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-gray-500 font-medium">
                                {formatDateAndTime(item.planned_start_at)}
                            </span>
                            <span className="text-xs text-primary font-bold">{distance}</span>
                        </div>
                    </div>
                );
            },
        },
        {
            key: "equipment",
            header: "Equipo",
            width: "130px",
            render: (item) => {
                // @ts-ignore - helpers need update
                const isHybrid = isOrderHybrid(item);
                // @ts-ignore - helpers need update
                const thermalProfile = getEquipmentType(item);

                return (
                    <div className="flex flex-col gap-0.5 py-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-900">
                                {isHybrid ? "Híbrido" : "Estándar"}
                            </span>
                            {isHybrid && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700">
                                    HYB
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-gray-500">{thermalProfile}</span>
                    </div>
                );
            },
        },
        {
            key: "cargo",
            header: "Carga",
            width: "120px",
            render: (item) => {
                // @ts-ignore
                const isHybrid = isOrderHybrid(item);
                // Use default weight or calculate from items if available
                let totalWeight = "0";

                if (item.items && item.items.length > 0) {
                    // Calculate total weight from items
                    const totalQ = item.items.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
                    totalWeight = totalQ > 0 ? totalQ.toString() : "0";
                }

                let productName = "-";
                // logic to get product name
                if (item.items && item.items.length > 0) {
                    productName = item.items.map(i => i.product?.name || i.item_name).join(", ");
                }


                return (
                    <div className="flex flex-col gap-0.5 py-2">
                        <span className="text-xs font-semibold text-gray-900">
                            {totalWeight === "-" ? "-" : `${totalWeight} Tn`}
                        </span>
                        <span className="text-xs text-gray-500">
                            {productName}
                        </span>
                    </div>
                );
            },
        },
        {
            key: "vehicle",
            header: "Vehículo",
            width: "180px",
            render: (item) => {
                const unit = item.fleet_set?.vehicle?.unit_code || "";
                const trailer = item.fleet_set?.trailer?.plate || "";
                const driver = item.fleet_set?.driver?.name || "";

                if (!unit && !trailer && !driver) {
                    return (
                        <span className="text-xs text-gray-400 py-2 block">
                            Sin asignar
                        </span>
                    );
                }

                // Construir línea secundaria (remolque + conductor)
                const secondaryParts = [];
                if (trailer) secondaryParts.push(trailer);
                if (driver) secondaryParts.push(driver);
                const secondaryText = secondaryParts.join(" · ");

                return (
                    <div className="flex flex-col gap-0.5 py-2">
                        <span className="text-xs font-semibold text-gray-900">
                            {unit}
                        </span>
                        {secondaryText && (
                            <span className="text-xs text-gray-500">
                                {secondaryText}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            key: "status",
            header: "Estado",
            width: "140px",
            render: (item) => {
                // Validación de seguridad
                if (!item) {
                    return (
                        <div className="flex flex-col gap-0.5 py-2">
                            <span className="text-xs text-gray-400">-</span>
                        </div>
                    );
                }

                const tenderCreatedAt = item.carrier_assigned_at || item.created_at;
                const decisionTimestamp = item.updated_at || undefined; // Use updated_at as proxy for decision time if not available elsewhere

                // @ts-ignore - helpers need update
                const statusDisplay = getOrderStatusDisplay(
                    item,
                    tenderCreatedAt,
                    decisionTimestamp
                );

                return (
                    <OrderStatusCell
                        order={item}
                        tenderCreatedAt={tenderCreatedAt}
                        decisionTimestamp={decisionTimestamp}
                    />
                );
            },
        },
    ];

    // Definir acciones de fila (menú contextual)
    const actions: DataTableAction<CarrierOrder>[] = [
        {
            icon: <Eye className="w-3.5 h-3.5 text-gray-600" />,
            onClick: (order) => onRowClick(order),
            title: "Ver detalles",
        },
    ];

    // Agregar menú contextual
    if (onAcceptOrder || onRejectOrder || (onFailAfterAccept && activeTab === 'compromisos')) {
        actions.push({
            icon: (order) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                            <MoreVertical className="h-4 w-4 text-gray-600" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        {/* Acciones para Solicitudes (Aceptar/Rechazar) */}
                        {activeTab === 'solicitudes' && (
                            <>
                                {onAcceptOrder && (
                                    <DropdownMenuItem
                                        onClick={() => onAcceptOrder(order)}
                                        className="cursor-pointer"
                                    >
                                        <Check className="mr-2 h-4 w-4 text-green-600" />
                                        Aceptar
                                    </DropdownMenuItem>
                                )}
                                {onRejectOrder && (
                                    <DropdownMenuItem
                                        onClick={() => onRejectOrder(order)}
                                        className="cursor-pointer"
                                    >
                                        <X className="mr-2 h-4 w-4 text-red-600" />
                                        Rechazar
                                    </DropdownMenuItem>
                                )}
                            </>
                        )}

                        {/* Acciones para Compromisos (Falla Post-Aceptación) */}
                        {activeTab === 'compromisos' && onFailAfterAccept && (
                            <DropdownMenuItem
                                onClick={() => onFailAfterAccept(order)}
                                className="cursor-pointer group hover:bg-red-50"
                            >
                                <AlertTriangle className="mr-2 h-4 w-4 text-red-600 group-hover:text-red-700" />
                                <span className="text-red-700 group-hover:text-red-800 font-medium">
                                    Declarar Falla Post-Aceptación
                                </span>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            onClick: () => { }, // No-op, el dropdown maneja sus propios clicks
            title: "Más acciones",
        });
    }

    // Definir acciones masivas contextuales
    const bulkActions: DataTableBulkAction[] = [];

    // Solo mostrar acciones masivas si las funciones están disponibles
    // Aceptar aparece primero
    if (onQuickAccept) {
        bulkActions.push({
            label: "Aceptar",
            icon: <CheckCircle2 className="w-4 h-4" />,
            onClick: (selectedIds) => onQuickAccept(selectedIds),
            variant: "default",
        });
    }

    // Rechazar aparece después
    if (onQuickReject) {
        bulkActions.push({
            label: "Rechazar",
            icon: <XCircle className="w-4 h-4" />,
            onClick: (selectedIds) => onQuickReject(selectedIds),
            variant: "destructive",
        });
    }

    return (
        <DataTable
            data={orders}
            columns={columns}
            getRowId={(item) => item.id || ''}
            onRowClick={onRowClick}
            actions={actions}
            bulkActions={bulkActions.length > 0 ? bulkActions : undefined}
            itemsPerPage={10}
            emptyMessage="No hay órdenes para mostrar"
        />
    );
}
