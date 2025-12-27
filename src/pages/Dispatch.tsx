import {
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useEffect,
} from "react";
import { useLocation } from "react-router-dom";
import { useAppStore } from "../stores/useAppStore";
import {
  Calendar,
  ChevronDown,
  Plus,
  Inbox,
  SlidersHorizontal,
  Clock,
  Weight,
  ArrowRight,
  Package2,
  RefreshCw,
  Circle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Snowflake,
  Thermometer,
  Package,
  Filter,
  XCircle,
  Send,
  Zap,
} from "lucide-react";
import { PageHeader } from "../layouts/PageHeader";
import { OrderDialog } from "../features/dispatch/dialogs/OrderDialog";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { TripCard } from "../features/dispatch/components/TripCard";
import { OrderDrawer } from "../features/dispatch/dialogs/OrderDrawer";
import { Checkbox } from "../components/ui/Checkbox";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DraggableOrder } from "../features/dispatch/components/DraggableOrder";
import { DraggableTripCard } from "../features/dispatch/components/DraggableTripCard";
import { VehicleDropZone } from "../features/dispatch/components/VehicleDropZone";
import { mockRoutes } from "../lib/mockData";

export interface DispatchRef {
  openOrdenDialog: () => void;
}

// 🔥 CONSTANTES DE DISEÑO (Nuevas)
// Definimos anchos fijos para que el scroll funcione y no se aplasten los días
const UNIT_COL_WIDTH = 260; // Ancho de la columna de unidades
const DAY_COL_WIDTH = 160; // Ancho de cada día
const NUM_DAYS = 15; // Número de días a renderizar

export const Dispatch = forwardRef<DispatchRef, {}>(
  (_, ref) => {
    const location = useLocation();
    const { registerCreateHandler } = useAppStore();
    // Eliminar estado de activeTab ya que solo hay un tab
    const [ordenDialogOpen, setOrdenDialogOpen] =
      useState(false);

    // Estado para la ventana deslizante (rolling window)
    const [startDate, setStartDate] = useState(
      new Date(2025, 11, 2),
    ); // Lun 2 Dic 2025

    const openOrdenDialog = () => setOrdenDialogOpen(true);

    useImperativeHandle(ref, () => ({
      openOrdenDialog,
    }));

    // Registrar handler de creación
    useEffect(() => {
      registerCreateHandler(location.pathname, openOrdenDialog);
    }, [location.pathname]);

    const handleSaveOrden = (orden: any) => {
      console.log("Nueva orden:", orden);
      // Aquí se integraría con Supabase para guardar la orden
    };

    // 🆕 Helper para convertir ID de ruta a nombre
    const getRutaNombre = (rutaId: string) => {
      const ruta = mockRoutes.find((r) => r.id === rutaId);
      return ruta ? ruta.name : rutaId;
    };

    // Función para generar los días
    const getDaysArray = () => {
      const days = [];
      const dayNames = [
        "Dom",
        "Lun",
        "Mar",
        "Mié",
        "Jue",
        "Vie",
        "Sáb",
      ];
      const monthNames = [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic",
      ];

      for (let i = 0; i < NUM_DAYS; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        days.push({
          dayName: dayNames[date.getDay()],
          dayNumber: date.getDate(),
          month: monthNames[date.getMonth()],
          fullDate: date,
        });
      }
      return days;
    };

    const days = getDaysArray();

    // Navegación de la ventana
    const handlePreviousDay = () => {
      const newDate = new Date(startDate);
      newDate.setDate(startDate.getDate() - 1);
      setStartDate(newDate);
    };

    const handleNextDay = () => {
      const newDate = new Date(startDate);
      newDate.setDate(startDate.getDate() + 1);
      setStartDate(newDate);
    };

    // Mock data - unidades disponibles (vehículos/remolques)
    const availableUnits = 9; // Total de unidades disponibles

    // Mock data - unidades disponibles para asignar
    const mockUnits = [
      {
        id: "VEH-001",
        unit: "TRK-1024",
        trailer: "RMQ-456",
        driver: "Michael Johnson",
        status: "En Ruta",
        hasActiveTrip: true,
        carrier: "ColdChain Express",
      },
      {
        id: "VEH-002",
        unit: "TRK-7145",
        trailer: "RMQ-445",
        trailerEsHibrido: true, // ✅ Remolque híbrido
        driver: "Robert Brown",
        status: "Detenido",
        hasActiveTrip: false,
        carrier: "FrostLine Logistics",
        hasIssue: true,
      },
      {
        id: "VEH-003",
        unit: "TRK-6234",
        trailer: "RMQ-123",
        driver: "Emma Davis",
        status: "Detenido",
        hasActiveTrip: true,
        carrier: "Arctic Transport",
      },
      {
        id: "VEH-004",
        unit: "TRK-3012",
        trailer: "RMQ-234",
        driver: "Mike Chen",
        status: "En Planta",
        hasActiveTrip: false,
        carrier: "Arctic Transport",
      },
      {
        id: "VEH-005",
        unit: "TRK-5123",
        trailer: "RMQ-890",
        driver: "James Wilson",
        status: "En Planta",
        hasActiveTrip: false,
        carrier: "Glacier Hauling",
        hasIssue: true,
      },
      {
        id: "VEH-006",
        unit: "TRK-2051",
        trailer: "RMQ-789",
        driver: "Sarah Williams",
        status: "En Ruta",
        hasActiveTrip: true,
        carrier: "FrostLine Logistics",
      },
      {
        id: "VEH-007",
        unit: "TRK-4089",
        trailer: "RMQ-567",
        trailerEsHibrido: true, // ✅ Remolque híbrido
        driver: "Lisa Rodriguez",
        status: "En Ruta",
        hasActiveTrip: true,
        carrier: "TempGuard Freight",
      },
      {
        id: "VEH-008",
        unit: "TRK-8056",
        trailer: "RMQ-901",
        driver: "Sophia Martinez",
        status: "Detenido",
        hasActiveTrip: false,
        carrier: "FreezeFleet",
      },
      {
        id: "VEH-009",
        unit: "TRK-9201",
        trailer: "RMQ-345",
        driver: "Carlos Rodriguez",
        status: "En Planta",
        hasActiveTrip: false,
        carrier: "FrostLine Logistics",
      },
    ];

    const getStatusDotColor = (
      status: string,
      hasActiveTrip: boolean,
    ) => {
      // Si no tiene viaje activo, mostrar círculo outline gris
      if (!hasActiveTrip) {
        return "fill-none stroke-gray-400 stroke-[1.5]";
      }

      // Si tiene viaje activo, mostrar color según estado
      switch (status) {
        case "En Ruta":
          return "fill-tracking-driving text-tracking-driving";
        case "Detenido":
          return "fill-tracking-stopped text-tracking-stopped";
        case "En Planta":
          return "fill-tracking-idle text-tracking-idle";
        default:
          return "fill-tracking-offline text-tracking-offline";
      }
    };

    // Mock data - ordenes sin asignar (Tu data original intacta)
    const unassignedOrders = [
      {
        day: "Hoy",
        count: 4, // ✅ Actualizado de 3 a 4 (incluye la orden cancelada)
        orders: [
          {
            id: "ORD-1001",
            configuracion: "Refrigerado/Congelado", // ✅ Múltiples perfiles separados por /
            esHibrida: true, // ✅ Esta orden es híbrida
            ruta: "RUT-001",
            horaRecogida: "08:00",
            temperatura: "2-8°C / -18°C",
            peso: "12",
            producto: "PROD-001",
            perfil: "PT-001",
            fechaPrevista: "2025-12-11",
            horaPrevista: "08:00",
            ventanaTiempo: "hora-especifica",
          },
          {
            id: "ORD-1002",
            configuracion: "Congelado",
            ruta: "RUT-002",
            horaRecogida: "10:30",
            temperatura: "-18°C",
            peso: "8",
            producto: "PROD-004",
            perfil: "PT-002",
            fechaPrevista: "2025-12-11",
            horaPrevista: "10:30",
            ventanaTiempo: "manana",
          },
          {
            id: "ORD-1003",
            configuracion: "Seco",
            ruta: "RUT-001",
            horaRecogida: "14:00",
            temperatura: "Ambiente",
            peso: "15",
            producto: "PROD-003",
            perfil: "PT-003",
            fechaPrevista: "2025-12-11",
            horaPrevista: "14:00",
            ventanaTiempo: "tarde",
          },
          {
            id: "ORD-CANCEL-001",
            configuracion: "Seco",
            ruta: "RUT-002",
            horaRecogida: "16:00",
            temperatura: "Ambiente",
            peso: "5",
            producto: "PROD-003",
            perfil: "PT-003",
            fechaPrevista: "2025-12-11",
            horaPrevista: "16:00",
            ventanaTiempo: "tarde",
            estado: "cancelada",
          },
        ],
      },
      {
        day: "Mañana",
        count: 5,
        orders: [
          {
            id: "ORD-1004",
            configuracion: "Refrigerado",
            ruta: "RUT-002",
            horaRecogida: "06:00",
            temperatura: "2-8°C",
            peso: "10",
            producto: "PROD-002",
            perfil: "PT-001",
            fechaPrevista: "2025-12-12",
            horaPrevista: "06:00",
            ventanaTiempo: "hora-especifica",
          },
          {
            id: "ORD-1005",
            configuracion: "Congelado/Seco", // ✅ Híbrida
            esHibrida: true, // ✅ Badge HYB
            ruta: "RUT-001",
            horaRecogida: "09:00",
            temperatura: "-20°C / Ambiente",
            peso: "14",
            producto: "PROD-004",
            perfil: "PT-002",
            fechaPrevista: "2025-12-12",
            horaPrevista: "09:00",
            ventanaTiempo: "manana",
          },
          {
            id: "ORD-1006",
            configuracion: "Refrigerado",
            ruta: "RUT-002",
            horaRecogida: "11:30",
            temperatura: "5°C",
            peso: "9",
            producto: "PROD-001",
            perfil: "PT-001",
            fechaPrevista: "2025-12-12",
            horaPrevista: "11:30",
            ventanaTiempo: "manana",
          },
          {
            id: "ORD-1007",
            configuracion: "Seco/Refrigerado", // ✅ Híbrida
            esHibrida: true, // ✅ Badge HYB
            ruta: "RUT-001",
            horaRecogida: "13:00",
            temperatura: "Ambiente / 2-8°C",
            peso: "18",
            producto: "PROD-003",
            perfil: "PT-003",
            fechaPrevista: "2025-12-12",
            horaPrevista: "13:00",
            ventanaTiempo: "tarde",
          },
          {
            id: "ORD-1008",
            configuracion: "Congelado",
            ruta: "RUT-002",
            horaRecogida: "15:30",
            temperatura: "-15°C",
            peso: "11",
            producto: "PROD-004",
            perfil: "PT-002",
            fechaPrevista: "2025-12-12",
            horaPrevista: "15:30",
            ventanaTiempo: "tarde",
          },
        ],
      },
      {
        day: "Lun 9 Dic",
        count: 2,
        orders: [
          {
            id: "ORD-1009",
            configuracion: "Refrigerado",
            ruta: "RUT-001",
            horaRecogida: "07:00",
            temperatura: "3°C",
            peso: "13",
            producto: "PROD-002",
            perfil: "PT-001",
            fechaPrevista: "2025-12-15",
            horaPrevista: "07:00",
            ventanaTiempo: "hora-especifica",
          },
          {
            id: "ORD-1010",
            configuracion: "Congelado",
            ruta: "RUT-002",
            horaRecogida: "12:00",
            temperatura: "-18°C",
            peso: "7",
            producto: "PROD-004",
            perfil: "PT-002",
            fechaPrevista: "2025-12-15",
            horaPrevista: "12:00",
            ventanaTiempo: "manana",
          },
        ],
      },
    ];

    const totalUnassigned = unassignedOrders.reduce(
      (acc, group) => acc + group.count,
      0,
    );

    // Mock data - viajes asignados (convertir a estado)
    const [assignedTrips, setAssignedTrips] = useState([
      {
        vehicleId: "VEH-001",
        dayOffset: 0,
        orderId: "ORD-2001",
        client: "NESTLE",
        route: "Planta-PI → FR-10",
        configuracion: "Congelado",
        color: "#dc2626",
        duration: 2,
        hasRTA: true,
        rtaDuration: 1,
        estado: "despachada",
        producto: "PROD-004",
        perfil: "PT-002",
        peso: "12",
        fechaPrevista: "2025-12-02",
        horaPrevista: "08:00",
        ventanaTiempo: "hora-especifica",
      },
      {
        vehicleId: "VEH-002",
        dayOffset: 1,
        orderId: "ORD-2002",
        client: "ALDI",
        route: "D-12 → FR-10",
        configuracion: "Refrigerado/Congelado",
        esHibrida: true,
        color: "#22c55e",
        duration: 2,
        hasRTA: true,
        rtaDuration: 1,
        estado: "asignada",
        compartimientos: [
          { id: "c1", producto: "PROD-001", perfil: "PT-001", peso: "6" },
          { id: "c2", producto: "PROD-004", perfil: "PT-002", peso: "8" },
        ],
        fechaPrevista: "2025-12-03",
        horaPrevista: "10:00",
        ventanaTiempo: "manana",
      },
      {
        vehicleId: "VEH-003",
        dayOffset: 0,
        orderId: "ORD-2003",
        client: "ROCKWOOL",
        route: "D-12 → FR-10",
        configuracion: "Seco",
        color: "#ec4899",
        duration: 1,
        hasRTA: true,
        rtaDuration: 1,
        estado: "pendiente",
        producto: "PROD-003",
        perfil: "PT-003",
        peso: "15",
        fechaPrevista: "2025-12-02",
        horaPrevista: "14:00",
        ventanaTiempo: "tarde",
      },
      {
        vehicleId: "VEH-005",
        dayOffset: 1,
        orderId: "ORD-2006",
        client: "UNILEVER",
        route: "Planta-FAE → NCD-LPZ",
        configuracion: "Refrigerado",
        color: "#22c55e",
        duration: 2,
        hasRTA: true,
        rtaDuration: 1,
        estado: "programada",
        producto: "PROD-002",
        perfil: "PT-001",
        peso: "10",
        fechaPrevista: "2025-12-03",
        horaPrevista: "09:00",
        ventanaTiempo: "manana",
      },
      {
        vehicleId: "VEH-006",
        dayOffset: 2,
        orderId: "ORD-2004",
        client: "WEBER",
        route: "D-12 → FR-10",
        configuracion: "Refrigerado",
        color: "#3b82f6",
        duration: 3,
        hasRTA: true,
        rtaDuration: 2,
        estado: "rechazada",
        producto: "PROD-001",
        perfil: "PT-001",
        peso: "18",
        fechaPrevista: "2025-12-04",
        horaPrevista: "06:00",
        ventanaTiempo: "hora-especifica",
      },
      {
        vehicleId: "VEH-007",
        dayOffset: 4,
        orderId: "ORD-2005",
        client: "KNAUF",
        route: "D-12 → FR-10",
        configuracion: "Congelado/Seco",
        esHibrida: true,
        color: "#f97316",
        duration: 2,
        hasRTA: true,
        rtaDuration: 1,
        estado: "observada",
        compartimientos: [
          { id: "c1", producto: "PROD-004", perfil: "PT-002", peso: "5" },
          { id: "c2", producto: "PROD-003", perfil: "PT-003", peso: "7" },
        ],
        fechaPrevista: "2025-12-06",
        horaPrevista: "11:00",
        ventanaTiempo: "manana",
      },
      {
        vehicleId: "VEH-008",
        dayOffset: 1,
        orderId: "ORD-2007",
        client: "COCA-COLA",
        route: "Planta-PI → NCD-LPZ",
        configuracion: "Refrigerado",
        color: "#3b82f6",
        duration: 2,
        hasRTA: true,
        rtaDuration: 1,
        estado: "despachada",
        producto: "PROD-001",
        perfil: "PT-001",
        peso: "22",
        fechaPrevista: "2025-12-03",
        horaPrevista: "08:00",
        ventanaTiempo: "hora-especifica",
      },
      {
        vehicleId: "VEH-009",
        dayOffset: 0,
        orderId: "ORD-2008",
        client: "DANONE",
        route: "Planta-PI → FR-10",
        configuracion: "Congelado",
        color: "#091E42",
        duration: 2,
        hasRTA: true,
        rtaDuration: 1,
        estado: "en-destino",
        producto: "PROD-004",
        perfil: "PT-002",
        peso: "14",
        fechaPrevista: "2025-12-02",
        horaPrevista: "09:00",
        ventanaTiempo: "manana",
      },
    ]);

    const getTripsForVehicle = (vehicleId: string) => {
      return assignedTrips.filter(
        (trip) => trip.vehicleId === vehicleId,
      );
    };

    // Estado para el drawer de órdenes
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] =
      useState<any>(null);

    // 🆕 Estado para multiselección de órdenes sin asignar
    const [selectedOrders, setSelectedOrders] = useState<
      Set<string>
    >(new Set());

    // 🆕 Manejador para guardar cambios desde el Drawer
    const handleOrderEdit = (updatedOrder: any) => {
      setAssignedTrips((prev) =>
        prev.map((trip) => {
          if (trip.orderId === updatedOrder.id) {
            return {
              ...trip,
              configuracion: updatedOrder.configuracion,
              estado: updatedOrder.status,
              peso: updatedOrder.peso,
              producto: updatedOrder.producto,
              perfil: updatedOrder.perfil,
              fechaPrevista: updatedOrder.fechaPrevista,
              horaPrevista: updatedOrder.horaPrevista,
              ventanaTiempo: updatedOrder.ventanaTiempo,
              compartimientos: updatedOrder.compartimientos,
              // Update vehicle assignment if changed
              vehicleId: updatedOrder.vehicleId || trip.vehicleId,
              // Preservar datos de viaje que no se editan en el drawer
            };
          }
          return trip;
        })
      );
    };

    // Obtener todas las IDs de órdenes sin asignar (para select all)
    const allOrderIds = useMemo(() => {
      return unassignedOrders.flatMap((group) =>
        group.orders.map((order) => order.id),
      );
    }, []);

    // Verificar si todas están seleccionadas
    const allSelected =
      selectedOrders.size > 0 &&
      selectedOrders.size === allOrderIds.length;
    const someSelected =
      selectedOrders.size > 0 &&
      selectedOrders.size < allOrderIds.length;

    // Handlers de selección
    const handleSelectAll = (checked: boolean) => {
      if (checked) {
        setSelectedOrders(new Set(allOrderIds));
      } else {
        setSelectedOrders(new Set());
      }
    };

    const handleSelectOrder = (
      orderId: string,
      checked: boolean,
    ) => {
      const newSelected = new Set(selectedOrders);
      if (checked) {
        newSelected.add(orderId);
      } else {
        newSelected.delete(orderId);
      }
      setSelectedOrders(newSelected);
    };

    // Handler para cancelar órdenes seleccionadas
    const handleCancelSelectedOrders = () => {
      console.log(
        "Cancelando órdenes:",
        Array.from(selectedOrders),
      );
      // Aquí iría la lógica para cancelar las órdenes
      // Por ahora solo limpiamos la selección
      setSelectedOrders(new Set());
    };

    // 🆕 Handler para auto-asignar órdenes seleccionadas
    const handleAutoAssign = () => {
      console.log(
        "Auto-asignando órdenes:",
        Array.from(selectedOrders),
      );
      // Aquí iría la lógica de auto-asignación inteligente
      // Por ahora solo mostramos el log
      alert(`Auto-asignando ${selectedOrders.size} órdenes...`);
    };

    // 🆕 Agrupar unidades por transportista
    const groupedUnits = useMemo(() => {
      const groups: { [key: string]: typeof mockUnits } = {};
      mockUnits.forEach((unit) => {
        if (!groups[unit.carrier]) {
          groups[unit.carrier] = [];
        }
        groups[unit.carrier].push(unit);
      });
      return groups;
    }, []);

    // Calcular cupo para cada carrier (vehículos activos / total)
    const getCarrierQuota = (carrier: string) => {
      const units = groupedUnits[carrier];
      const activeUnits = units.filter(
        (u) => u.hasActiveTrip,
      ).length;
      return `${activeUnits}/${units.length}`;
    };

    // 🆕 Handler para drag and drop
    const handleDrop = (
      item: any,
      vehicleId: string,
      dayOffset: number,
    ) => {
      console.log(
        "Dropped",
        item,
        "on vehicle",
        vehicleId,
        "at day offset",
        dayOffset,
      );

      // Determinar el color basado en la configuración
      const getColorByConfig = (config: string) => {
        const colors = {
          Congelado: "#dc2626",
          Refrigerado: "#22c55e",
          Seco: "#ec4899",
        };
        return (
          colors[config as keyof typeof colors] || "#3b82f6"
        );
      };

      if (item.type === "ORDER") {
        // Crear nuevo viaje desde una orden sin asignar
        const newTrip = {
          vehicleId: vehicleId,
          dayOffset: dayOffset,
          orderId: item.order.id,
          client: item.order.producto || "Cliente",
          route: item.order.ruta,
          configuracion: item.order.configuracion,
          esHibrida: item.order.esHibrida, // ✅ Pasar esHibrida
          // Pasamos los datos específicos del producto
          producto: item.order.producto,
          perfil: item.order.perfil,
          peso: item.order.peso,
          compartimientos: item.order.compartimientos,
          fechaPrevista: item.order.fechaPrevista,
          horaPrevista: item.order.horaPrevista,
          ventanaTiempo: item.order.ventanaTiempo,
          color: getColorByConfig(item.order.configuracion),
          duration: 2, // Duración por defecto
          hasRTA: true,
          rtaDuration: 1, // RTA por defecto
          estado: "sin-asignar",
        };

        setAssignedTrips([...assignedTrips, newTrip]);
      } else if (item.type === "TRIP") {
        // Reasignar un viaje existente
        setAssignedTrips(
          assignedTrips.map((trip) =>
            trip.orderId === item.tripId
              ? {
                  ...trip,
                  vehicleId: vehicleId,
                  dayOffset: dayOffset,
                }
              : trip,
          ),
        );
      }
    };

    return (
      <DndProvider backend={HTML5Backend}>
        <div className="flex flex-col h-full">
          <PageHeader
            tabs={[
              {
                id: "tablero-despacho",
                label: "Tablero de Despacho",
                active: true,
                onClick: () => {},
                badge: 45,
              },
            ]}
            showSearch
            searchPlaceholder="Buscar por nombre de servicio"
            filters={
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                Filtros
              </Button>
            }
            actions={
              <>
                {/* Botón de Auto-Asignar - solo visible cuando hay órdenes seleccionadas */}
                {selectedOrders.size > 0 && (
                  <Button
                    size="sm"
                    className="gap-2 text-sm font-medium"
                    onClick={handleAutoAssign}
                  >
                    <Zap className="h-4 w-4" />
                    Auto-Asignar ({selectedOrders.size})
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-sm text-gray-700"
                >
                  <Send className="h-4 w-4" />
                  Enviar Despacho
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={handlePreviousDay}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={handleNextDay}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            }
          />

          {/* Layout Principal */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex">
              {/* Columna 1: Ordenes sin Asignar (Sin cambios en tu lógica) */}
              <div className="flex flex-col h-full border-r border-gray-200 overflow-hidden w-[20%] bg-white z-20">
                {/* Header Columna 1 */}
                <div className="px-4 py-3 border-b border-gray-300 bg-gray-50 h-[52px] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary"
                      {...(someSelected && !allSelected
                        ? {
                            "data-state":
                              "indeterminate" as any,
                          }
                        : {})}
                    />
                    <h3 className="text-sm font-medium text-gray-900">
                      Sin Asignar
                    </h3>
                    <span className="text-xs text-gray-500">
                      {selectedOrders.size > 0
                        ? `${selectedOrders.size} de ${totalUnassigned}`
                        : totalUnassigned}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Botón de cancelar - solo aparece cuando hay selecciones */}
                    {selectedOrders.size > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={handleCancelSelectedOrders}
                        title="Cancelar órdenes seleccionadas"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
                    {/* Botón de auto-asignar - solo aparece cuando hay selecciones */}
                    {selectedOrders.size > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={handleAutoAssign}
                        title="Auto-asignar órdenes seleccionadas"
                      >
                        <Zap className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                    >
                      <Filter className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {/* Contenido Columna 1 */}
                <div className="flex-1 overflow-y-auto bg-input-background">
                  {unassignedOrders.map((group) => (
                    <div key={group.day} className="mb-4">
                      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600 uppercase">
                            {group.day}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({group.count})
                          </span>
                        </div>
                      </div>
                      <div className="px-3 py-2 space-y-1.5">
                        {group.orders.map((order) => (
                          <DraggableOrder
                            key={order.id}
                            order={order}
                            isSelected={selectedOrders.has(
                              order.id,
                            )}
                            onSelect={handleSelectOrder}
                            onClick={() => {
                              setSelectedOrder({
                                ...order,
                                status: order.estado || "sin-asignar"
                              });
                              setDrawerOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 💥 CAMBIOS AQUI (Columna 2+3: Planner) 💥 
                  Reemplazamos el contenedor flex estático por uno con overflow nativo y sticky positioning.
              */}
              <div
                className="flex-1 h-full overflow-hidden"
                style={{ width: "80%" }}
              >
                {/* Contenedor SCROLLABLE principal (Maneja X e Y) */}
                <div className="h-full w-full overflow-auto relative">
                  {/* Contenedor interno con ANCHO MÍNIMO CALCULADO (Fuerza el scroll horizontal si es necesario) */}
                  <div
                    className="flex flex-col min-h-full"
                    style={{
                      width: `${UNIT_COL_WIDTH + NUM_DAYS * DAY_COL_WIDTH}px`,
                    }}
                  >
                    {/* --- HEADER DEL GANTT (Sticky Top) --- */}
                    <div className="sticky top-0 z-40 bg-gray-50 border-b border-gray-300 flex h-[52px]">
                      {/* Esquina Superior Izquierda (Sticky Left + Top) */}
                      <div
                        className="sticky left-0 z-50 bg-gray-50 border-r border-gray-300 flex items-center justify-between"
                        style={{
                          width: `${UNIT_COL_WIDTH}px`,
                          paddingLeft: "12px",
                          paddingRight: "12px",
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            Unidades
                          </h3>
                          <span className="text-xs text-gray-500">
                            {availableUnits}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() =>
                              console.log("Filter")
                            }
                          >
                            <Filter className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Días del Calendario (Se mueven horizontalmente) */}
                      <div className="flex flex-1">
                        {days.map((item, index) => (
                          <div
                            key={item.dayNumber}
                            className={`flex items-center justify-center border-r border-gray-200 bg-gray-50 ${index === 0 ? "border-l" : ""}`}
                            style={{
                              width: `${DAY_COL_WIDTH}px`,
                              minWidth: `${DAY_COL_WIDTH}px`,
                            }}
                          >
                            <div className="text-center">
                              <span className="text-xs font-medium text-gray-900 block">
                                {item.dayName}
                              </span>
                              <span className="text-[10px] text-gray-500 block">
                                {item.dayNumber}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* --- CUERPO DEL GANTT (Filas de Unidades) --- */}
                    <div className="flex-1 bg-white">
                      {Object.entries(groupedUnits).map(
                        ([carrier, units], groupIndex) => (
                          <div key={carrier}>
                            {/* 🆕 Separador de Grupo (Header de Transportista) */}
                            <div className="flex h-[36px] border-b border-gray-200 bg-gray-50">
                              {/* Columna izquierda: Nombre del transportista (Sticky Left) */}
                              <div
                                className="sticky left-0 z-30 bg-gray-50 border-r border-gray-300 flex items-center justify-between"
                                style={{
                                  width: `${UNIT_COL_WIDTH}px`,
                                  padding: "0 12px",
                                }}
                              >
                                <span className="text-xs font-bold text-gray-700 uppercase">
                                  {carrier}
                                </span>
                                <span className="text-xs text-gray-600">
                                  {getCarrierQuota(carrier)}
                                </span>
                              </div>

                              {/* Columna derecha: Gantt (grid continua) */}
                              <div className="flex-1 relative">
                                {/* Grid de fondo para mantener continuidad visual */}
                                <div className="flex h-full absolute inset-0 pointer-events-none">
                                  {days.map((_, dayIndex) => (
                                    <div
                                      key={dayIndex}
                                      className="h-full border-r border-gray-100"
                                      style={{
                                        width: `${DAY_COL_WIDTH}px`,
                                        minWidth: `${DAY_COL_WIDTH}px`,
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Filas de Vehículos del Grupo */}
                            {units.map((unit) => {
                              const trips = getTripsForVehicle(
                                unit.id,
                              );

                              return (
                                <VehicleDropZone
                                  key={unit.id}
                                  unit={unit}
                                  getStatusDotColor={
                                    getStatusDotColor
                                  }
                                  onDrop={(
                                    item,
                                    vehicleId,
                                    dayOffset,
                                  ) =>
                                    handleDrop(
                                      item,
                                      vehicleId,
                                      dayOffset,
                                    )
                                  }
                                  existingTrips={trips}
                                  dayColWidth={DAY_COL_WIDTH}
                                >
                                  {/* Tarjetas de Viaje (Posicionamiento Absoluto en Píxeles) */}
                                  <div className="absolute inset-0 w-full h-full">
                                    {trips.map((trip) => {
                                      // Cálculos basados en PIXELES fijos, no porcentajes
                                      const leftPx =
                                        trip.dayOffset *
                                          DAY_COL_WIDTH +
                                        8; // +8px padding
                                      const tripDurationPx =
                                        trip.duration *
                                        DAY_COL_WIDTH;
                                      const rtaDurationPx =
                                        trip.hasRTA
                                          ? trip.rtaDuration *
                                            DAY_COL_WIDTH
                                          : 0;
                                      const totalWidthPx =
                                        tripDurationPx +
                                        rtaDurationPx -
                                        16; // -16px padding

                                      // Porcentajes internos del bloque
                                      const totalPx =
                                        tripDurationPx +
                                        rtaDurationPx;
                                      const tripPercent =
                                        (tripDurationPx /
                                          totalPx) *
                                        100;
                                      const rtaPercent =
                                        (rtaDurationPx /
                                          totalPx) *
                                        100;

                                      // Encontrar datos del vehiculo para la orden asignada
                                      const assignedUnit =
                                        mockUnits.find(
                                          (u) =>
                                            u.id ===
                                            trip.vehicleId,
                                        );

                                      return (
                                        <DraggableTripCard
                                          key={trip.orderId}
                                          trip={trip}
                                          style={{
                                            left: `${leftPx}px`,
                                            width: `${totalWidthPx}px`,
                                          }}
                                          tripPercent={
                                            tripPercent
                                          }
                                          rtaPercent={
                                            rtaPercent
                                          }
                                          onClick={() => {
                                            // Crear objeto de orden con datos asignados
                                            setSelectedOrder({
                                              id: trip.orderId,
                                              configuracion:
                                                trip.configuracion,
                                              ruta: trip.route,
                                              status: trip.estado,
                                              // Datos reales del trip enriquecido
                                              horaRecogida: trip.horaPrevista || "08:00",
                                              peso: trip.peso,
                                              producto: trip.producto,
                                              perfil: trip.perfil,
                                              fechaPrevista: trip.fechaPrevista,
                                              ventanaTiempo: trip.ventanaTiempo,
                                              horaPrevista: trip.horaPrevista,
                                              compartimientos: trip.compartimientos,
                                              // Datos de asignación
                                              vehicleId:
                                                trip.vehicleId,
                                              unit: assignedUnit?.unit,
                                              trailer:
                                                assignedUnit?.trailer,
                                              driver:
                                                assignedUnit?.driver,
                                              carrier:
                                                assignedUnit?.carrier,
                                            });
                                            setDrawerOpen(true);
                                          }}
                                        />
                                      );
                                    })}
                                  </div>
                                </VehicleDropZone>
                              );
                            })}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <OrderDialog
            open={ordenDialogOpen}
            onClose={() => setOrdenDialogOpen(false)}
            onSave={handleSaveOrden}
          />

          <OrderDrawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            orderData={selectedOrder}
            onEdit={handleOrderEdit}
          />
        </div>
      </DndProvider>
    );
  },
);

Dispatch.displayName = "Dispatch";