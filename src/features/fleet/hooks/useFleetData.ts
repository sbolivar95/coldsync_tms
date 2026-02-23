import { useEffect, useMemo } from "react";
import { useFleetStore } from "../../../stores/useFleetStore";
import type { TrailerWithDetails } from "../entities/trailers/TrailersList";

interface UseFleetDataProps {
    organizationId: string | undefined;
    carrierId?: number;
    refreshKey?: number;
}

export function useFleetData({ organizationId, carrierId, refreshKey }: UseFleetDataProps) {
    // Access Global Store
    const vehicles = useFleetStore((state) => state.vehicles);
    const drivers = useFleetStore((state) => state.drivers);
    const trailers = useFleetStore((state) => state.trailers);
    const connectionDevices = useFleetStore((state) => state.connectionDevices);
    const assignments = useFleetStore((state) => state.assignments);
    const carriers = useFleetStore((state) => state.carriers);
    const telematicsProviders = useFleetStore((state) => state.telematicsProviders);

    // Load Actions
    const loadVehicles = useFleetStore((state) => state.loadVehicles);
    const loadDrivers = useFleetStore((state) => state.loadDrivers);
    const loadTrailers = useFleetStore((state) => state.loadTrailers);
    const loadConnectionDevices = useFleetStore((state) => state.loadConnectionDevices);
    const loadAssignments = useFleetStore((state) => state.loadAssignments);
    const loadCarriers = useFleetStore((state) => state.loadCarriers);
    const loadTelematicsProviders = useFleetStore((state) => state.loadTelematicsProviders);

    // Initial Load & Organization Change
    useEffect(() => {
        if (!organizationId) return;

        const loadAll = async () => {
            // Load cached or fetch new
            Promise.all([
                loadVehicles(organizationId),
                loadDrivers(organizationId),
                loadTrailers(organizationId),
                loadConnectionDevices(organizationId),
                loadAssignments(organizationId),
                loadCarriers(organizationId),
                loadTelematicsProviders(organizationId),
            ]);
        };

        loadAll();
    }, [organizationId, loadVehicles, loadDrivers, loadTrailers, loadConnectionDevices, loadAssignments, loadCarriers, loadTelematicsProviders]);

    // Explicit Refresh (Force Reload)
    useEffect(() => {
        if (!organizationId || !refreshKey) return;

        const refreshAll = async () => {
            Promise.all([
                loadVehicles(organizationId, true),
                loadDrivers(organizationId, true),
                loadTrailers(organizationId, true),
                loadConnectionDevices(organizationId, true),
                loadAssignments(organizationId, true),
                loadCarriers(organizationId, true),
                loadTelematicsProviders(organizationId, true),
            ]);
        };

        refreshAll();
    }, [refreshKey, organizationId, loadVehicles, loadDrivers, loadTrailers, loadConnectionDevices, loadAssignments, loadCarriers, loadTelematicsProviders]);

    // Apply carrier filtering locally
    const filteredDrivers = useMemo(() => {
        if (!carrierId) return drivers;
        return drivers.filter(d => d.carrier_id === carrierId);
    }, [drivers, carrierId]);

    const filteredTrailers = useMemo(() => {
        if (!carrierId) return trailers;
        return trailers.filter((t: any) => t.carrier_id === carrierId);
    }, [trailers, carrierId]);

    // Process vehicles data
    const processedVehicles = useMemo(() => {
        const carriersMap = new Map(carriers.map(c => [c.id, c]));
        const driversMap = new Map(drivers.map(d => [d.id, d]));
        const trailersMap = new Map(trailers.map(t => [t.id, t]));

        // Map assignments by vehicle_id to enrich vehicle data
        // Filter only ACTIVE assignments
        const activeAssignmentsMap = new Map();
        assignments.forEach((a: any) => {
            if (a.is_active && a.vehicle_id) {
                activeAssignmentsMap.set(a.vehicle_id, a);
            }
        });

        // Filter vehicles if carrierId is present
        const relevantVehicles = carrierId
            ? vehicles.filter(v => v.carrier_id === carrierId)
            : vehicles;

        return relevantVehicles.map((vehicle: any) => {
            const assignment = activeAssignmentsMap.get(vehicle.id) || null;
            return {
                ...vehicle,
                carrier: carriersMap.get(vehicle.carrier_id),
                active_assignment: assignment,
                assigned_driver: assignment?.driver_id ? driversMap.get(assignment.driver_id) : null,
                assigned_trailer: assignment?.trailer_id ? trailersMap.get(assignment.trailer_id) : null
            };
        });
    }, [vehicles, carriers, carrierId, assignments, drivers, trailers]);

    // Process drivers data
    const processedDrivers = useMemo(() => {
        const carriersMap = new Map(carriers.map(c => [c.id, c]));
        return filteredDrivers.map((driver: any) => ({
            ...driver,
            carrier: carriersMap.get(driver.carrier_id)
        }));
    }, [filteredDrivers, carriers]);

    // Process trailers data
    const processedTrailers = useMemo(() => {
        const carriersMap = new Map(carriers.map(c => [c.id, c]));
        return filteredTrailers.map((trailer: any): TrailerWithDetails => ({
            ...trailer,
            carrier: carriersMap.get(trailer.carrier_id),
            reeferSpecs: Array.isArray(trailer.trailer_reefer_specs)
                ? trailer.trailer_reefer_specs[0] || null
                : trailer.trailer_reefer_specs || null
        }));
    }, [filteredTrailers, carriers]);

    // Process hardware data
    const processedHardware = useMemo(() => {
        // Filter connection devices
        const relevantDevices = carrierId
            ? connectionDevices.filter(d => d.carrier_id === carrierId)
            : connectionDevices;

        const carriersMap = new Map(carriers.map(c => [c.id, c]));
        const providersMap = new Map(telematicsProviders.map(p => [p.id, p]));
        const vehiclesMap = new Map(vehicles.map(v => [v.id, v]));
        const trailersMap = new Map(trailers.map(t => [t.id, t]));

        return relevantDevices.map((device: any) => {
            let assignedVehicle = null;
            let assignedTrailer = null;

            if (device.tracked_entity_type === 'VEHICLE') {
                assignedVehicle = vehiclesMap.get(device.tracked_entity_id) || Array.from(vehiclesMap.values()).find(v => v.connection_device_id === device.id) || null;
            } else {
                assignedTrailer = trailersMap.get(device.tracked_entity_id) || Array.from(trailersMap.values()).find(t => t.connection_device_id === device.id) || null;
            }

            return {
                ...device,
                telematicsProvider: device.provider ? providersMap.get(device.provider) : null,
                hardwareDevice: null,
                carrier: carriersMap.get(device.carrier_id),
                assignedVehicle,
                assignedTrailer
            };
        });
    }, [connectionDevices, carriers, telematicsProviders, vehicles, trailers, carrierId]);

    // Process assignments
    const processedAssignments = useMemo(() => {
        if (!carrierId) return assignments;
        return assignments.filter((a: any) => !carrierId || a.carrier_id === carrierId);
    }, [assignments, carrierId]);


    const badgeCounts = {
        vehiculos: processedVehicles.length,
        conductores: processedDrivers.length,
        remolques: processedTrailers.length,
        asignaciones: processedAssignments.length,
        hardware: processedHardware.length,
    };

    const refreshData = async () => {
        if (!organizationId) return;
        await Promise.all([
            loadVehicles(organizationId, true),
            loadDrivers(organizationId, true),
            loadTrailers(organizationId, true),
            loadConnectionDevices(organizationId, true),
            loadAssignments(organizationId, true),
            loadCarriers(organizationId, true),
            loadTelematicsProviders(organizationId, true),
        ]);
    };

    return {
        vehicles: processedVehicles,
        drivers: processedDrivers,
        trailers: processedTrailers,
        hardware: processedHardware,
        assignments: processedAssignments,
        badgeCounts,
        refreshData
    };
}
