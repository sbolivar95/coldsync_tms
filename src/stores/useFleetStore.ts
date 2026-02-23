import { create } from "zustand";
import { vehiclesService } from "../services/database/vehicles.service";
import { driversService } from "../services/database/drivers.service";
import { trailersService } from "../services/database/trailers.service";
import { hardwareService } from "../services/database/hardware.service";
import { carriersService } from "../services/database/carriers.service";
import { fleetSetsService } from "../services/database";
import type { Vehicle, Driver, Carrier, TelematicsProvider, FleetSet } from "../types/database.types";

interface FleetState {
    // Vehicles
    vehicles: Vehicle[];
    vehiclesLoading: boolean;
    vehiclesLoadedOrgId: string | null;
    loadVehicles: (orgId: string, force?: boolean) => Promise<void>;

    // Drivers
    drivers: Driver[];
    driversLoading: boolean;
    driversLoadedOrgId: string | null;
    loadDrivers: (orgId: string, force?: boolean) => Promise<void>;

    // Trailers
    trailers: any[]; // With reefer specs
    trailersLoading: boolean;
    trailersLoadedOrgId: string | null;
    loadTrailers: (orgId: string, force?: boolean) => Promise<void>;

    // Hardware (Connection Devices)
    connectionDevices: any[];
    connectionDevicesLoading: boolean;
    connectionDevicesLoadedOrgId: string | null;
    loadConnectionDevices: (orgId: string, force?: boolean) => Promise<void>;

    // Assignments (Fleet Sets)
    assignments: FleetSet[];
    assignmentsLoading: boolean;
    assignmentsLoadedOrgId: string | null;
    loadAssignments: (orgId: string, force?: boolean) => Promise<void>;

    // Reference Data (Carriers, Providers, Hardware Devices)
    carriers: Carrier[];
    carriersLoading: boolean;
    carriersLoadedOrgId: string | null;
    loadCarriers: (orgId: string, force?: boolean) => Promise<void>;

    telematicsProviders: TelematicsProvider[];
    providersLoading: boolean;
    providersLoadedOrgId: string | null;
    loadTelematicsProviders: (orgId: string, force?: boolean) => Promise<void>;

    // Actions to invalidate data (force refresh next time)
    invalidateFleetData: () => void;
}

export const useFleetStore = create<FleetState>((set, get) => ({
    // Vehicles
    vehicles: [],
    vehiclesLoading: false,
    vehiclesLoadedOrgId: null,
    loadVehicles: async (orgId: string, force = false) => {
        const { vehicles, vehiclesLoadedOrgId } = get();
        if (!orgId) return;
        if (!force && vehiclesLoadedOrgId === orgId && vehicles.length > 0) return;

        set({ vehiclesLoading: true });
        try {
            const data = await vehiclesService.getAll(orgId);
            set({ vehicles: data, vehiclesLoadedOrgId: orgId });
        } catch (error) {
            console.error("Error loading vehicles:", error);
            // Don't toast on background refresh unless it's critical
        } finally {
            set({ vehiclesLoading: false });
        }
    },

    // Drivers
    drivers: [],
    driversLoading: false,
    driversLoadedOrgId: null,
    loadDrivers: async (orgId: string, force = false) => {
        const { drivers, driversLoadedOrgId } = get();
        if (!orgId) return;
        if (!force && driversLoadedOrgId === orgId && drivers.length > 0) return;

        set({ driversLoading: true });
        try {
            const data = await driversService.getAll(orgId);
            set({ drivers: data, driversLoadedOrgId: orgId });
        } catch (error) {
            console.error("Error loading drivers:", error);
        } finally {
            set({ driversLoading: false });
        }
    },

    // Trailers
    trailers: [],
    trailersLoading: false,
    trailersLoadedOrgId: null,
    loadTrailers: async (orgId: string, force = false) => {
        const { trailers, trailersLoadedOrgId } = get();
        if (!orgId) return;
        if (!force && trailersLoadedOrgId === orgId && trailers.length > 0) return;

        set({ trailersLoading: true });
        try {
            const data = await trailersService.getAllWithReeferSpecs(orgId);
            set({ trailers: data, trailersLoadedOrgId: orgId });
        } catch (error) {
            console.error("Error loading trailers:", error);
        } finally {
            set({ trailersLoading: false });
        }
    },

    // Hardware (Connection Devices)
    connectionDevices: [],
    connectionDevicesLoading: false,
    connectionDevicesLoadedOrgId: null,
    loadConnectionDevices: async (orgId: string, force = false) => {
        const { connectionDevices, connectionDevicesLoadedOrgId } = get();
        if (!orgId) return;
        if (!force && connectionDevicesLoadedOrgId === orgId && connectionDevices.length > 0) return;

        set({ connectionDevicesLoading: true });
        try {
            const data = await hardwareService.getAllConnectionDevices(orgId);
            set({ connectionDevices: data, connectionDevicesLoadedOrgId: orgId });
        } catch (error) {
            console.error("Error loading connection devices:", error);
        } finally {
            set({ connectionDevicesLoading: false });
        }
    },

    // Assignments
    assignments: [],
    assignmentsLoading: false,
    assignmentsLoadedOrgId: null,
    loadAssignments: async (orgId: string, force = false) => {
        const { assignments, assignmentsLoadedOrgId } = get();
        if (!orgId) return;
        if (!force && assignmentsLoadedOrgId === orgId && assignments.length > 0) return;

        set({ assignmentsLoading: true });
        try {
            const data = await fleetSetsService.getAll(orgId);
            set({ assignments: data, assignmentsLoadedOrgId: orgId });
        } catch (error) {
            console.error("Error loading assignments:", error);
        } finally {
            set({ assignmentsLoading: false });
        }
    },

    // Reference Data
    carriers: [],
    carriersLoading: false,
    carriersLoadedOrgId: null,
    loadCarriers: async (orgId: string, force = false) => {
        const { carriers, carriersLoadedOrgId } = get();
        if (!orgId) return;
        if (!force && carriersLoadedOrgId === orgId && carriers.length > 0) return;

        set({ carriersLoading: true });
        try {
            const data = await carriersService.getAll(orgId);
            set({ carriers: data, carriersLoadedOrgId: orgId });
        } catch (error) {
            console.error("Error loading carriers:", error);
        } finally {
            set({ carriersLoading: false });
        }
    },

    telematicsProviders: [],
    providersLoading: false,
    providersLoadedOrgId: null,
    loadTelematicsProviders: async (orgId: string, force = false) => {
        const { telematicsProviders, providersLoadedOrgId } = get();
        if (!orgId) return;
        if (!force && providersLoadedOrgId === orgId && telematicsProviders.length > 0) return;

        set({ providersLoading: true });
        try {
            const data = await hardwareService.getAllProviders();
            set({ telematicsProviders: data, providersLoadedOrgId: orgId });
        } catch (error) {
            console.error("Error loading providers:", error);
        } finally {
            set({ providersLoading: false });
        }
    },

    invalidateFleetData: () => {
        set({
            vehiclesLoadedOrgId: null,
            driversLoadedOrgId: null,
            trailersLoadedOrgId: null,
            connectionDevicesLoadedOrgId: null,
            assignmentsLoadedOrgId: null,
            carriersLoadedOrgId: null,
            providersLoadedOrgId: null,
        });
    }
}));

