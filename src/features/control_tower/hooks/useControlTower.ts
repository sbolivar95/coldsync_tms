import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../../stores/useAppStore";
import {
    getLiveUnits,
    getExecutionStatusByFleetSets,
    getDriversByIds,
    subscribeLive,
    type ControlTowerFleetSetLiveRowWithCapabilities
} from "../../../services/database/controlTowerRealtime.service";
import { TrackingUnit } from "../types";
import {
    filterUnits,
    getStatusCounts,
    isRecord,
    getTelematicsValue,
    getStatusFromRow,
    formatLastUpdate,
    resolveTemperature
} from "../utils/control-tower-helpers";

interface UseControlTowerProps {
    activeTab: string;
    searchQuery: string;
    unitId?: string;
}

interface UseControlTowerResult {
    units: TrackingUnit[];
    counts: ReturnType<typeof getStatusCounts>;
    selectedUnit: TrackingUnit | null;
    isLoading: boolean;
    handleUnitClick: (id: string) => void;
    closeDrawer: () => void;
}

export function useControlTower({ activeTab, searchQuery, unitId }: UseControlTowerProps): UseControlTowerResult {
    const navigate = useNavigate();
    const organization = useAppStore((state) => state.organization);

    // Zustand State
    const units = useAppStore((state) => state.controlTowerUnits);
    const setUnits = useAppStore((state) => state.setControlTowerUnits);
    const isLoading = useAppStore((state) => state.controlTowerLoading);
    const setIsLoading = useAppStore((state) => state.setControlTowerLoading);
    const loadedOrgId = useAppStore((state) => state.controlTowerLoadedOrgId);
    const setLoadedOrgId = useAppStore((state) => state.setControlTowerLoadedOrgId);

    const mapRowToTrackingUnit = (
        row: ControlTowerFleetSetLiveRowWithCapabilities,
        driverDetails: { name: string; phone_number: string | null; email: string | null; license_number: string | null } | null,
        executionSubstatus: string | null
    ): TrackingUnit => {
        const deriveSignalAgeFromMessageTs = (messageTs: string | null): number | null => {
            if (!messageTs) return null;
            const tsMs = new Date(messageTs).getTime();
            if (Number.isNaN(tsMs)) return null;
            return Math.max(0, Math.floor((Date.now() - tsMs) / 1000));
        };

        const deriveSignalStatusFromAge = (
            ageSec: number | null,
            fallback: TrackingUnit["signalStatus"]
        ): TrackingUnit["signalStatus"] => {
            if (ageSec === null) return fallback;
            if (ageSec <= 120) return "ONLINE";
            if (ageSec <= 900) return "STALE";
            return "OFFLINE";
        };

        const vehicleLabel = row.vehicle_plate || row.vehicle_unit_code || null;
        const trailerLabel = row.trailer_plate || row.trailer_code || null;
        const primaryUnitId = vehicleLabel || trailerLabel || "N/A";
        const trailerDisplay = trailerLabel || "";
        const isHybrid = Boolean(row.supports_multi_zone);
        const reeferMode = getTelematicsValue(row.telematics, ["reefer_mode", "mode", "can_reefer_mode"]) ?? "-";
        const reeferSetpointRaw = getTelematicsValue(row.telematics, ["setpoint", "reefer_setpoint", "can_setpoint"]) ?? "-";
        const reeferSetpoint = (() => {
            if (reeferSetpointRaw === "-") return "-";
            const n = Number(reeferSetpointRaw);
            if (Number.isFinite(n)) return `${n.toFixed(1)}°C`;
            return reeferSetpointRaw.includes("°C") ? reeferSetpointRaw : `${reeferSetpointRaw}°C`;
        })();
        const reeferErrorCode = getTelematicsValue(row.telematics, ["error_code", "reefer_error_code", "alarm_code"]);
        const hasKnownMessage = Boolean(row.message_ts);
        const signalAgeSecCanonical = deriveSignalAgeFromMessageTs(row.message_ts) ?? row.signal_age_sec ?? null;
        const signalStatusCanonical = deriveSignalStatusFromAge(signalAgeSecCanonical, row.signal_status);
        const hasLiveTracking = hasKnownMessage && signalStatusCanonical === "ONLINE";

        const coordinates =
            row.lat !== null && row.lng !== null
                ? { lat: row.lat, lng: row.lng }
                : null;
        const speedKph = Math.max(0, Math.round(row.speed_kph ?? 0));
        const addressText =
            row.address_text ??
            getTelematicsValue(row.telematics, ["wialon.address", "address"]);
        const locationLabel =
            addressText ??
            (coordinates
                ? `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`
                : "Sin ubicación");
        const hasActiveTrip = executionSubstatus !== null && executionSubstatus !== "DELIVERED";
        const status = getStatusFromRow(row);
        const temperatureState = hasKnownMessage
            ? resolveTemperature(row)
            : {
                label: "-",
                hasError: false,
                channel1Label: "-",
                channel2Label: null,
                channel1Error: false,
                channel2Error: false,
            };

        return {
            id: `${row.source_device_type}:${row.source_connection_device_id ?? row.vehicle_id ?? row.trailer_id ?? "unknown"}`,
            fleetSetId: row.fleet_set_id,
            unit: primaryUnitId,
            trailer: trailerDisplay,
            isHybridTrailer: isHybrid,
            driver: driverDetails?.name ?? row.driver_name ?? "Sin conductor",
            driverId: row.driver_id ?? null,
            driverPhone: driverDetails?.phone_number ?? null,
            driverEmail: driverDetails?.email ?? null,
            driverLicenseNumber: driverDetails?.license_number ?? null,
            location: locationLabel,
            coordinates,
            status,
            speed: hasKnownMessage ? `${speedKph} km/h` : "Sin señal",
            temperature: temperatureState.label,
            hasTemperatureError: temperatureState.hasError,
            temperatureChannel1: temperatureState.channel1Label,
            temperatureChannel2: temperatureState.channel2Label ?? undefined,
            hasTemperatureChannel1Error: temperatureState.channel1Error,
            hasTemperatureChannel2Error: temperatureState.channel2Error,
            lastUpdate: hasKnownMessage ? formatLastUpdate(row.message_ts) : "Nunca",
            carrier: row.carrier_name ?? "-",
            reeferMode: hasKnownMessage && row.has_can ? reeferMode : "-",
            reeferSetpoint: hasKnownMessage && row.has_can ? reeferSetpoint : "-",
            hasActiveTrip,
            hasLiveTracking,
            signalStatus: signalStatusCanonical,
            hasKnownMessage,
            signalAgeSec: signalAgeSecCanonical,
            signalAgeCapturedAtMs: Date.now(),
            sourceDeviceType: row.source_device_type,
            hasCan: row.has_can,
            tempMode: row.temp_mode,
            executionSubstatus: executionSubstatus as TrackingUnit["executionSubstatus"],
            reeferError: hasKnownMessage && row.has_can && reeferErrorCode
                ? { code: reeferErrorCode, severity: "warning" }
                : undefined,
            telematics: isRecord(row.telematics) ? row.telematics : null,
        };
    };

    const loadUnits = useCallback(async (force = false) => {
        if (!organization?.id) {
            setUnits([]);
            setLoadedOrgId(null);
            return;
        }

        // Cache: skip reload if already loaded for this org (even with 0 units) unless forced
        if (!force && loadedOrgId === organization.id) {
            return;
        }

        try {
            setIsLoading(true);
            const rows = await getLiveUnits(organization.id);
            const fleetSetIds = rows
                .map((row) => row.fleet_set_id)
                .filter((value): value is string => typeof value === "string");
            const executionStatusByFleetSet = await getExecutionStatusByFleetSets(
                organization.id,
                fleetSetIds
            );
            const driverIds = Array.from(
                new Set(
                    rows
                        .map((row) => row.driver_id)
                        .filter((value): value is number => typeof value === "number")
                )
            );
            const driversById = await getDriversByIds(organization.id, driverIds);

            setUnits(
                rows.map((row) =>
                    mapRowToTrackingUnit(
                        row,
                        row.driver_id ? (driversById.get(row.driver_id) ?? null) : null,
                        row.fleet_set_id ? (executionStatusByFleetSet.get(row.fleet_set_id) ?? null) : null
                    )
                )
            );
            setLoadedOrgId(organization.id);
        } catch (error) {
            console.error("Error loading Control Tower live units:", error);
            // Don't clear units on error if we already have some, but clear loaded status
            setLoadedOrgId(null);
        } finally {
            setIsLoading(false);
        }
    }, [organization?.id, loadedOrgId, setUnits, setIsLoading, setLoadedOrgId]);

    useEffect(() => {
        void loadUnits();
    }, [loadUnits]);

    useEffect(() => {
        if (!organization?.id) return undefined;

        const unsubscribe = subscribeLive(organization.id, () => {
            void loadUnits(true); // Always reload on realtime update
        });

        return () => unsubscribe();
    }, [organization?.id, loadUnits]);

    // Derive selected unit from URL
    const selectedUnit = useMemo(() => {
        return unitId ? units.find((u) => u.id === unitId) ?? null : null;
    }, [unitId, units]);

    // Filter units
    const filteredUnits = useMemo(() => {
        return filterUnits(units, activeTab, searchQuery);
    }, [units, activeTab, searchQuery]);

    // Tab counts
    const counts = useMemo(() => {
        return getStatusCounts(units);
    }, [units]);

    // Handlers
    const handleUnitClick = (id: string) => {
        const params = new URLSearchParams(window.location.search);
        navigate(`/control-tower/${id}?${params.toString()}`);
    };

    const closeDrawer = () => {
        const params = new URLSearchParams(window.location.search);
        navigate(`/control-tower?${params.toString()}`, { replace: true });
    };

    return {
        units: filteredUnits,
        counts,
        selectedUnit,
        isLoading,
        handleUnitClick,
        closeDrawer,
    };
}
