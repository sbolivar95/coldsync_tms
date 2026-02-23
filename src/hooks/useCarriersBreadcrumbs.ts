import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { carriersService } from '../services/database/carriers.service';
import { trailersService } from '../services/database/trailers.service';
import { vehiclesService } from '../services/database/vehicles.service';
import { driversService } from '../services/database/drivers.service';
import { hardwareService } from '../services/database/hardware.service';

interface BreadcrumbItem {
    label: string;
    onClick?: () => void;
}

// Simple in-memory cache to prevent flickering when navigating between pages
const carrierNameCache: Record<string, string> = {};
const trailerPlateCache: Record<string, string> = {};
const vehiclePlateCache: Record<string, string> = {};
const driverNameCache: Record<string, string> = {};
const hardwareIdentCache: Record<string, string> = {};

/**
 * Hook to automatically generate breadcrumbs from the current URL
 * for the carriers and fleet routes
 */
// Update hook signature to accept optional overrides
export function useCarriersBreadcrumbs(overrides?: { trailerPlate?: string; vehiclePlate?: string; driverName?: string; hardwareIdent?: string }) {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams<{ carrierId?: string; vehicleId?: string; driverId?: string; trailerId?: string; hardwareId?: string }>();
    const { setBreadcrumbs } = useAppStore();
    const organization = useAppStore((state) => state.organization);


    const [carrierName, setCarrierName] = useState<string>(() => {
        if (params.carrierId) {
            // 1. Check local cache first (fastest)
            if (carrierNameCache[params.carrierId]) {
                return carrierNameCache[params.carrierId];
            }

            const carrierIdNum = parseInt(params.carrierId);
            const cachedCarrier = useAppStore.getState().carriers.find(c => c.id === carrierIdNum);

            if (cachedCarrier?.commercial_name) {
                carrierNameCache[params.carrierId] = cachedCarrier.commercial_name;
                return cachedCarrier.commercial_name;
            }
            return cachedCarrier?.commercial_name || '';
        }
        return '';
    });

    const [trailerPlate, setTrailerPlate] = useState<string>(() => {
        if (params.trailerId) {
            if (overrides?.trailerPlate) return overrides.trailerPlate;
            if (trailerPlateCache[params.trailerId]) {
                return trailerPlateCache[params.trailerId];
            }
        }
        return '';
    });

    const [vehiclePlate, setVehiclePlate] = useState<string>(() => {
        if (params.vehicleId) {
            if (overrides?.vehiclePlate) return overrides.vehiclePlate;
            if (vehiclePlateCache[params.vehicleId]) {
                return vehiclePlateCache[params.vehicleId];
            }
        }
        return '';
    });

    const [driverName, setDriverName] = useState<string>(() => {
        if (params.driverId) {
            if (overrides?.driverName) return overrides.driverName;
            if (driverNameCache[params.driverId]) {
                return driverNameCache[params.driverId];
            }
        }
        return '';
    });

    const [hardwareIdent, setHardwareIdent] = useState<string>(() => {
        if (params.hardwareId) {
            if (overrides?.hardwareIdent) return overrides.hardwareIdent;
            if (hardwareIdentCache[params.hardwareId]) {
                return hardwareIdentCache[params.hardwareId];
            }
        }
        return '';
    });

    // Load carrier name if we have a carrierId
    useEffect(() => {
        if (params.carrierId && organization?.id) {
            const carrierIdNum = parseInt(params.carrierId);
            const cacheKey = params.carrierId;

            // Re-check store in case it was updated since mount (unlikely but safe)
            const cachedCarrier = useAppStore.getState().carriers.find(c => c.id === carrierIdNum);
            if (cachedCarrier?.commercial_name) {
                if (cachedCarrier.commercial_name !== carrierName) {
                    carrierNameCache[cacheKey] = cachedCarrier.commercial_name;
                    setCarrierName(cachedCarrier.commercial_name);
                }
                return;
            }

            // If not in store/cache, fetch from API
            if (!carrierNameCache[cacheKey]) {
                carriersService.getById(carrierIdNum, organization.id)
                    .then(carrier => {
                        if (carrier?.commercial_name) {
                            carrierNameCache[cacheKey] = carrier.commercial_name;
                            setCarrierName(carrier.commercial_name);
                        }
                    })
                    .catch(console.error);
            }
        }
    }, [params.carrierId, organization?.id, carrierName]);

    // Load trailer plate if we have a trailerId
    useEffect(() => {
        // If plate is provided from parent, use it directly
        if (overrides?.trailerPlate && params.trailerId) {
            const cacheKey = params.trailerId;
            trailerPlateCache[cacheKey] = overrides.trailerPlate;
            setTrailerPlate(overrides.trailerPlate);
            return;
        }

        if (params.trailerId && organization?.id) {
            const cacheKey = params.trailerId;

            // If not in cache, fetch from API
            if (!trailerPlateCache[cacheKey]) {
                trailersService.getById(params.trailerId, organization.id)
                    .then(trailer => {
                        if (trailer?.plate) {
                            trailerPlateCache[cacheKey] = trailer.plate;
                            setTrailerPlate(trailer.plate);
                        }
                    })
                    .catch(console.error);
            } else {
                setTrailerPlate(trailerPlateCache[cacheKey]);
            }
        }
    }, [params.trailerId, organization?.id, overrides?.trailerPlate]);

    // Load vehicle plate if we have a vehicleId
    useEffect(() => {
        // If plate is provided from parent, use it directly
        if (overrides?.vehiclePlate && params.vehicleId) {
            const cacheKey = params.vehicleId;
            vehiclePlateCache[cacheKey] = overrides.vehiclePlate;
            setVehiclePlate(overrides.vehiclePlate);
            return;
        }

        if (params.vehicleId && organization?.id) {
            const cacheKey = params.vehicleId;

            // If not in cache, fetch from API
            if (!vehiclePlateCache[cacheKey]) {
                vehiclesService.getById(params.vehicleId, organization.id)
                    .then(vehicle => {
                        if (vehicle?.plate) {
                            vehiclePlateCache[cacheKey] = vehicle.plate;
                            setVehiclePlate(vehicle.plate);
                        }
                    })
                    .catch(console.error);
            } else {
                setVehiclePlate(vehiclePlateCache[cacheKey]);
            }
        }
    }, [params.vehicleId, organization?.id, overrides?.vehiclePlate]);

    // Load driver name if we have a driverId
    useEffect(() => {
        // If name is provided from parent, use it directly
        if (overrides?.driverName && params.driverId) {
            const cacheKey = params.driverId;
            driverNameCache[cacheKey] = overrides.driverName;
            setDriverName(overrides.driverName);
            return;
        }

        if (params.driverId && organization?.id) {
            const cacheKey = params.driverId;

            // If not in cache, fetch from API
            if (!driverNameCache[cacheKey]) {
                driversService.getById(parseInt(params.driverId), organization.id)
                    .then(driver => {
                        if (driver?.name) {
                            driverNameCache[cacheKey] = driver.name;
                            setDriverName(driver.name);
                        }
                    })
                    .catch(console.error);
            } else {
                setDriverName(driverNameCache[cacheKey]);
            }
        }
    }, [params.driverId, organization?.id, overrides?.driverName]);

    // Load hardware ident if we have a hardwareId
    useEffect(() => {
        // If ident is provided from parent, use it directly
        if (overrides?.hardwareIdent && params.hardwareId) {
            const cacheKey = params.hardwareId;
            hardwareIdentCache[cacheKey] = overrides.hardwareIdent;
            setHardwareIdent(overrides.hardwareIdent);
            return;
        }

        if (params.hardwareId && organization?.id) {
            const cacheKey = params.hardwareId;

            // If not in cache, fetch from API
            if (!hardwareIdentCache[cacheKey]) {
                hardwareService.getConnectionDeviceById(params.hardwareId, organization.id)
                    .then(device => {
                        if (device?.ident) {
                            hardwareIdentCache[cacheKey] = device.ident;
                            setHardwareIdent(device.ident);
                        }
                    })
                    .catch(console.error);
            } else {
                setHardwareIdent(hardwareIdentCache[cacheKey]);
            }
        }
    }, [params.hardwareId, organization?.id, overrides?.hardwareIdent]);

    useEffect(() => {
        const path = location.pathname;
        const breadcrumbs: BreadcrumbItem[] = [];

        // /carriers/:carrierId
        if (params.carrierId) {
            // Always add "Transportistas" breadcrumb first when viewing a specific carrier
            breadcrumbs.push({
                label: 'Transportistas',
                onClick: () => navigate('/carriers')
            });

            // Add Carrier breadcrumb
            breadcrumbs.push({
                label: carrierName || '...',
                onClick: () => navigate(`/carriers/${params.carrierId}/fleet/vehicles`)
            });

            // /carriers/:carrierId/fleet/*
            if (path.includes('/fleet')) {
                // Fleet section
                if (path.includes('/vehicles')) {
                    breadcrumbs.push({
                        label: 'Vehículos',
                        onClick: params.vehicleId ? () => navigate(`/carriers/${params.carrierId}/fleet/vehicles`) : undefined
                    });

                    // Vehicle detail
                    if (params.vehicleId) {
                        breadcrumbs.push({
                            label: vehiclePlate || '...',
                            onClick: undefined
                        });
                    }
                } else if (path.includes('/drivers')) {
                    breadcrumbs.push({
                        label: 'Conductores',
                        onClick: params.driverId ? () => navigate(`/carriers/${params.carrierId}/fleet/drivers`) : undefined
                    });

                    // Driver detail
                    if (params.driverId) {
                        breadcrumbs.push({
                            label: driverName || '...',
                            onClick: undefined
                        });
                    }
                } else if (path.includes('/trailers')) {
                    breadcrumbs.push({
                        label: 'Remolques',
                        onClick: params.trailerId ? () => navigate(`/carriers/${params.carrierId}/fleet/trailers`) : undefined
                    });

                    // Trailer detail
                    if (params.trailerId) {
                        breadcrumbs.push({
                            label: trailerPlate || '...',
                            onClick: undefined
                        });
                    }
                } else if (path.includes('/hardware')) {
                    breadcrumbs.push({
                        label: 'Dispositivos',
                        onClick: params.hardwareId ? () => navigate(`/carriers/${params.carrierId}/fleet/hardware`) : undefined
                    });

                    // Hardware detail
                    if (params.hardwareId) {
                        breadcrumbs.push({
                            label: hardwareIdent || '...',
                            onClick: undefined
                        });
                    }
                }
            } else if (path.includes('/assignments')) {
                breadcrumbs.push({
                    label: 'Asignaciones',
                    onClick: undefined
                });
            }
        }

        // Only update if breadcrumbs content changed
        const currentBreadcrumbsJson = JSON.stringify(breadcrumbs.map(b => b.label));
        const prevBreadcrumbs = useAppStore.getState().breadcrumbsState[path];
        const prevBreadcrumbsJson = prevBreadcrumbs ? JSON.stringify(prevBreadcrumbs.map(b => b.label)) : '';

        if (currentBreadcrumbsJson !== prevBreadcrumbsJson) {
            setBreadcrumbs(path, breadcrumbs);
        }
    }, [location.pathname, params, carrierName, trailerPlate, vehiclePlate, driverName, hardwareIdent, navigate, setBreadcrumbs]);
}
