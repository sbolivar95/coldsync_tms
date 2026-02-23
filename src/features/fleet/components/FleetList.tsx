import { PageHeader } from "../../../layouts/PageHeader";
import { useState, useEffect, useMemo } from "react";

import { VehiclesList } from "../entities/vehicles/VehiclesList";
import { DriversList } from "../entities/drivers/DriversList";
import { TrailersList } from "../entities/trailers/TrailersList";
import { HardwareList } from "../entities/hardware/HardwareList";
import { useAppStore } from "../../../stores/useAppStore";
import { AssignmentDialog } from "../entities/assignments/dialogs/AssignmentDialog";
import { ConfirmDialog } from "../../../components/widgets/ConfirmDialog";
import { useFleetData } from "../hooks/useFleetData";
import { useAssignmentsLogic } from "../hooks/useAssignmentsLogic";
import { EntityStatusFilter } from "../../../components/ui/EntityStatusFilter";

interface FleetListProps {
  onSelectItem: (item: any, type: "vehiculo" | "conductor" | "remolque" | "hardware") => void;
  onTabChange?: (tab: string) => void;
  activeTab?: string; // Tab activo controlado desde el padre
  transportistaNombre?: string; // Filtro opcional por transportista
  carrierId?: number; // ID del transportista para filtrar
  refreshKey?: number; // Key to force refresh of lists
  onEditHardware?: (item: any) => void;
  onDeleteHardware?: (item: any) => void;
  onEditTrailer?: (item: any) => void;
}

export function FleetList({
  onSelectItem,
  onTabChange,
  activeTab: externalActiveTab,
  transportistaNombre,
  carrierId,
  refreshKey,
  onEditHardware,
  onDeleteHardware,
  onEditTrailer
}: FleetListProps) {
  const organization = useAppStore((state) => state.organization);
  const [activeTab, setActiveTab] = useState(externalActiveTab || "vehiculos");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [assignmentContext, setAssignmentContext] = useState<{
    vehicleId?: string;
    carrierId?: number;
  } | null>(null);

  useEffect(() => {
    setSearchTerm("");
    setStatusFilter("all");
  }, [activeTab]);

  // Custom Hooks
  const {
    vehicles,
    drivers,
    trailers,
    hardware,

    badgeCounts,
    refreshData
  } = useFleetData({
    organizationId: organization?.id,
    carrierId,
    refreshKey
  });

  const {
    assignmentDialogOpen,
    setAssignmentDialogOpen,
    deleteAssignmentDialogOpen,
    setDeleteAssignmentDialogOpen,
    assignmentEditing,
    setAssignmentEditing,
    assignmentToDelete,
    handleSaveAssignment,
    handleDeleteAssignment
  } = useAssignmentsLogic({
    organizationId: organization?.id,
    onRefresh: refreshData
  });

  const handleAssignVehicle = (vehicle: any) => {
    setAssignmentContext({
      vehicleId: vehicle.id,
      carrierId: vehicle.carrier_id
    });
    // Set actual assignment if exists
    setAssignmentEditing(vehicle.active_assignment || null);
    setAssignmentDialogOpen(true);
  };

  const filteredTrailers = useMemo(() => {
    if (activeTab !== "remolques") return trailers;

    let result = trailers;

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter((t) => {
        const matchesCode = t.code?.toLowerCase().includes(term);
        const matchesPlate = t.plate?.toLowerCase().includes(term);
        // Capacidad checks
        const matchesCapacity =
          t.transport_capacity_weight_tn?.toString().includes(term) ||
          t.volume_m3?.toString().includes(term);

        // Config termica Check (Multi-zone / Standard)
        const typeTerm = t.supports_multi_zone ? "hibrido" : "standard";
        const matchesType = typeTerm.includes(term);

        // Reefer specs Check (Temps)
        const matchesReefer =
          t.reeferSpecs &&
          (t.reeferSpecs.temp_min_c?.toString().includes(term) ||
            t.reeferSpecs.temp_max_c?.toString().includes(term));

        return (
          matchesCode ||
          matchesPlate ||
          matchesCapacity ||
          matchesType ||
          matchesReefer
        );
      });
    }

    // Filter Status
    if (statusFilter !== "all") {
      result = result.filter((t) => t.operational_status === statusFilter);
    }

    return result;
  }, [trailers, searchTerm, statusFilter, activeTab]);

  const filteredVehicles = useMemo(() => {
    if (activeTab !== "vehiculos") return vehicles;

    let result = vehicles;

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter((v) => {
        const matchesCode = v.unit_code?.toLowerCase().includes(term);
        const matchesPlate = v.plate?.toLowerCase().includes(term);
        const matchesBrand = v.brand?.toLowerCase().includes(term);
        const matchesModel = v.model?.toLowerCase().includes(term);
        const matchesVin = v.vin?.toLowerCase().includes(term);

        return (
          matchesCode ||
          matchesPlate ||
          matchesBrand ||
          matchesModel ||
          matchesVin
        );
      });
    }

    // Filter Status
    if (statusFilter !== "all") {
      result = result.filter((v) => v.operational_status === statusFilter);
    }

    return result;
  }, [vehicles, searchTerm, statusFilter, activeTab]);

  const filteredDrivers = useMemo(() => {
    if (activeTab !== "conductores") return drivers;

    let result = drivers;

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter((d) => {
        const matchesName = d.name?.toLowerCase().includes(term);
        const matchesId = d.driver_id?.toLowerCase().includes(term);
        const matchesLicense = d.license_number?.toLowerCase().includes(term);
        const matchesPhone = d.phone_number?.toLowerCase().includes(term);

        return matchesName || matchesId || matchesLicense || matchesPhone;
      });
    }

    // Filter Status - Drivers rely on dedicated status enum, but if statusFilter maps to it
    if (statusFilter !== "all") {
      // Status filter values in UI are for Vehicle/Trailer (ACTIVE, IN_SERVICE...)
      // Driver status: AVAILABLE, INACTIVE, DRIVING
      // We might want to allow filtering if statusFilter matched driver statuses, but here 
      // the status filter UI is shared and might not match driver enums perfectly.
      // For now, only filter if the status technically matches
      result = result.filter((d) => d.status === statusFilter);
    }

    return result;
    return result;
  }, [drivers, searchTerm, statusFilter, activeTab]);

  const filteredHardware = useMemo(() => {
    if (activeTab !== "hardware") return hardware;

    let result = hardware;

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter((h: any) => {
        const matchesIdent = h.ident?.toLowerCase().includes(term);
        const matchesSerial = h.serial?.toLowerCase().includes(term);
        const matchesPhone = h.phone_number?.toLowerCase().includes(term);
        const matchesProvider = h.telematicsProvider?.name?.toLowerCase().includes(term);
        // Also search in assigned entity code if possible
        const matchesVehicle = h.assignedVehicle?.unit_code?.toLowerCase().includes(term);
        const matchesTrailer = h.assignedTrailer?.code?.toLowerCase().includes(term);

        return matchesIdent || matchesSerial || matchesPhone || matchesProvider || matchesVehicle || matchesTrailer;
      });
    }

    // Filter Status (Mapped to Assignment Type)
    if (statusFilter !== "all") {
      if (statusFilter === 'INVENTORY') {
        result = result.filter((h: any) => !h.tracked_entity_type);
      } else {
        result = result.filter((h: any) => h.tracked_entity_type === statusFilter);
      }
    }

    return result;
  }, [hardware, searchTerm, statusFilter, activeTab]);


  // Sincronizar el tab cuando cambie desde el padre
  useEffect(() => {
    if (externalActiveTab && externalActiveTab !== activeTab) {
      setActiveTab(externalActiveTab);
    }
  }, [externalActiveTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const renderContent = () => {
    if (activeTab === "vehiculos") {
      return (
        <VehiclesList
          data={filteredVehicles}
          onSelectItem={onSelectItem}
          transportistaNombre={transportistaNombre}
          carrierId={carrierId}
          onAssign={handleAssignVehicle}
        />
      );
    } else if (activeTab === "conductores") {
      return (
        <DriversList
          data={filteredDrivers}
          onSelectItem={onSelectItem}
          transportistaNombre={transportistaNombre}
          carrierId={carrierId}
        />
      );
    } else if (activeTab === "remolques") {
      return (
        <TrailersList
          data={filteredTrailers}
          onSelectItem={onSelectItem}
          onEditTrailer={onEditTrailer}
          transportistaNombre={transportistaNombre}
          carrierId={carrierId}
        />
      );
    } else if (activeTab === "hardware") {
      return (
        <HardwareList
          data={filteredHardware}
          onSelectItem={onSelectItem}
          transportistaNombre={transportistaNombre}
          carrierId={carrierId}
          onEdit={onEditHardware}
          onDelete={onDeleteHardware}
        />
      );

    }
  };

  // Determine if search is supported for current tab
  const isSearchSupported = activeTab === "remolques" || activeTab === "vehiculos" || activeTab === "conductores" || activeTab === "hardware";

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        tabs={[
          {
            id: "vehiculos",
            label: "Vehículos",
            badge: badgeCounts.vehiculos,
            active: activeTab === "vehiculos",
            onClick: () => handleTabChange("vehiculos")
          },
          {
            id: "remolques",
            label: "Remolques",
            badge: badgeCounts.remolques,
            active: activeTab === "remolques",
            onClick: () => handleTabChange("remolques")
          },
          {
            id: "conductores",
            label: "Conductores",
            badge: badgeCounts.conductores,
            active: activeTab === "conductores",
            onClick: () => handleTabChange("conductores")
          },

          {
            id: "hardware",
            label: "Dispositivos",
            badge: badgeCounts.hardware,
            active: activeTab === "hardware",
            onClick: () => handleTabChange("hardware")
          },
        ]}
        showSearch={isSearchSupported}
        searchPlaceholder={
          activeTab === "remolques" ? "Buscar remolques (código, placa, capacidad...)" :
            activeTab === "vehiculos" ? "Buscar vehículos (unidad, placa, marca...)" :
              activeTab === "conductores" ? "Buscar conductores (nombre, ID, licencia...)" :
                activeTab === "hardware" ? "Buscar dispositivos (IMEI, serie, asignación...)" :
                  "Buscar..."
        }
        searchValue={isSearchSupported ? searchTerm : undefined}
        onSearch={isSearchSupported ? setSearchTerm : undefined}
        filters={
          (activeTab === "remolques" || activeTab === "vehiculos" || activeTab === "conductores" || activeTab === "hardware") && (
            <EntityStatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={
                activeTab === "conductores"
                  ? [
                    { value: "AVAILABLE", label: "Disponible" },
                    { value: "DRIVING", label: "En Ruta" },
                    { value: "INACTIVE", label: "Inactivo" },
                  ]
                  : activeTab === "hardware"
                    ? [
                      { value: "INVENTORY", label: "En Inventario" },
                      { value: "VEHICLE", label: "Asignado a Vehículo" },
                      { value: "TRAILER", label: "Asignado a Remolque" },
                    ]
                    : [
                      { value: "ACTIVE", label: "Activo" },
                      { value: "IN_SERVICE", label: "En Servicio" },
                      { value: "IN_MAINTENANCE", label: "Mantenimiento" },
                      { value: "OUT_OF_SERVICE", label: "Fuera de Servicio" },
                      { value: "RETIRED", label: "Retirado" },
                      { value: "IN_TRANSIT", label: "En Tránsito" },
                    ]
              }
              label={activeTab === "hardware" ? "Asignación" : "Estado"}
            />
          )
        }
      />

      {renderContent()}

      <AssignmentDialog
        open={assignmentDialogOpen}
        onClose={() => {
          setAssignmentDialogOpen(false);
          setAssignmentEditing(null);
          setAssignmentContext(null);
        }}
        assignment={assignmentEditing}
        onSave={handleSaveAssignment}
        vehicleId={assignmentContext?.vehicleId}
        carrierId={assignmentContext?.carrierId || carrierId}
      />

      <ConfirmDialog
        open={deleteAssignmentDialogOpen}
        onOpenChange={setDeleteAssignmentDialogOpen}
        title={
          assignmentToDelete?.is_active && !assignmentToDelete?.ends_at
            ? 'Finalizar Asignación'
            : 'Eliminar Asignación'
        }
        description={
          assignmentToDelete?.is_active && !assignmentToDelete?.ends_at
            ? '¿Estás seguro de que deseas finalizar esta asignación? Esta acción finalizará la asignación pero mantendrá el historial.'
            : '¿Estás seguro de que deseas eliminar esta asignación? Esta acción no se puede deshacer.'
        }
        variant={
          assignmentToDelete?.is_active && !assignmentToDelete?.ends_at
            ? 'default'
            : 'destructive'
        }
        onConfirm={handleDeleteAssignment}
      />
    </div>
  );
}