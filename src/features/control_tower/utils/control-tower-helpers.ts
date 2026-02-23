import { ControlTowerFleetSetLiveRowWithCapabilities } from "../../../services/database/controlTowerRealtime.service";
import { TrackingUnit, UnitStatus } from "../types";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

export const getTelematicsValue = (
    telematics: ControlTowerFleetSetLiveRowWithCapabilities["telematics"],
    keys: string[]
): string | null => {
    if (!isRecord(telematics)) return null;
    for (const key of keys) {
        const value = telematics[key];
        if (value === null || value === undefined) continue;
        if (typeof value === "string" && value.trim()) return value.trim();
        if (typeof value === "number" && Number.isFinite(value)) return String(value);
        if (typeof value === "boolean") return value ? "true" : "false";
    }
    return null;
};

export const getStatusFromRow = (
    row: ControlTowerFleetSetLiveRowWithCapabilities
): UnitStatus => {
    const parseBoolean = (value: unknown): boolean | null => {
        if (typeof value === "boolean") return value;
        if (typeof value === "number") return value !== 0;
        if (typeof value === "string") {
            const normalized = value.trim().toLowerCase();
            if (["true", "1", "on", "yes"].includes(normalized)) return true;
            if (["false", "0", "off", "no"].includes(normalized)) return false;
        }
        return null;
    };

    const ignitionRaw = isRecord(row.telematics)
        ? row.telematics["engine.ignition.status"] ??
        row.telematics["ignition"] ??
        row.telematics["can.engine.ignition.status"]
        : null;
    const ignitionOn = parseBoolean(ignitionRaw);

    if (!row.message_ts) return "OFFLINE";
    if (row.signal_status === "OFFLINE") return "OFFLINE";
    if (row.signal_status === "STALE") return "STALE";
    if (row.is_moving === true) return "DRIVING";
    if ((row.speed_kph ?? 0) > 2) return "DRIVING";
    if (ignitionOn === true) return "IDLE";
    return "STOPPED";
};

export const formatLastUpdate = (timestamp: string | null): string => {
    if (!timestamp) return "Sin señal";
    const ts = new Date(timestamp).getTime();
    if (Number.isNaN(ts)) return "-";
    const diffMin = Math.max(0, Math.floor((Date.now() - ts) / 60000));
    if (diffMin < 1) return "Online";
    return `${diffMin} min`;
};

export const resolveTemperature = (
    row: ControlTowerFleetSetLiveRowWithCapabilities
): {
    label: string;
    hasError: boolean;
    channel1Label: string;
    channel2Label: string | null;
    channel1Error: boolean;
    channel2Error: boolean;
} => {
    const MIN_VALID_TEMP_C = -60;
    const MAX_VALID_TEMP_C = 130;

    const formatCelsius = (value: string | null): string | null => {
        if (!value) return null;
        const n = Number(value);
        if (Number.isFinite(n)) return `${n.toFixed(1)}°C`;
        return value.includes("°C") ? value : `${value}°C`;
    };

    const hasChannelError = (channel: 1 | 2): boolean => {
        const rawError = getTelematicsValue(row.telematics, [
            `sensor.temperature.error.${channel}`,
            `sensor.temperature.error.code.${channel}`,
            `ble.sensor.temperature.error.${channel}`,
            `ble.sensor.temperature.error.code.${channel}`,
        ]);
        if (!rawError) return false;
        const normalized = rawError.trim().toLowerCase();
        return !["0", "ok", "none", "no_error"].includes(normalized);
    };

    const getChannelDisplay = (
        channel: 1 | 2,
        value: string | null
    ): { label: string; hasError: boolean } => {
        if (value) {
            const numeric = Number(value);
            if (Number.isFinite(numeric) && (numeric < MIN_VALID_TEMP_C || numeric > MAX_VALID_TEMP_C)) {
                return { label: "--", hasError: true };
            }
            const formatted = formatCelsius(value);
            if (formatted) return { label: formatted, hasError: false };
        }

        if (hasChannelError(channel)) return { label: "--", hasError: true };
        return { label: "--", hasError: true };
    };

    if (row.temp_mode === "NONE") {
        return {
            label: "-",
            hasError: false,
            channel1Label: "-",
            channel2Label: null,
            channel1Error: false,
            channel2Error: false,
        };
    }

    const temp1 =
        (row.temp_1_c !== null && row.temp_1_c !== undefined ? String(row.temp_1_c) : null) ??
        getTelematicsValue(row.telematics, [
            "sensor.temperature.1",
            "ble.sensor.temperature.1",
            "temperature.1",
            "temp1",
        ]);
    const temp2 =
        (row.temp_2_c !== null && row.temp_2_c !== undefined ? String(row.temp_2_c) : null) ??
        getTelematicsValue(row.telematics, [
            "sensor.temperature.2",
            "ble.sensor.temperature.2",
            "temperature.2",
            "temp2",
        ]);

    if (row.temp_mode === "MULTI") {
        const c1 = getChannelDisplay(1, temp1);
        const c2 = getChannelDisplay(2, temp2);
        return {
            label: `${c1.label} | ${c2.label}`,
            hasError: c1.hasError || c2.hasError,
            channel1Label: c1.label,
            channel2Label: c2.label,
            channel1Error: c1.hasError,
            channel2Error: c2.hasError,
        };
    }

    const tempSingle =
        temp1 ??
        (row.temperature_c !== null && row.temperature_c !== undefined ? String(row.temperature_c) : null);
    const c1 = getChannelDisplay(1, tempSingle);
    return {
        label: c1.label,
        hasError: c1.hasError,
        channel1Label: c1.label,
        channel2Label: null,
        channel1Error: c1.hasError,
        channel2Error: false,
    };
};

export const toRecord = (value: unknown): Record<string, unknown> | null => {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }
    return null;
};

export const readValue = (
    telematics: Record<string, unknown> | null | undefined,
    keys: string[],
): unknown => {
    if (!telematics) return undefined;
    for (const key of keys) {
        const value = telematics[key];
        if (value !== undefined && value !== null) return value;
    }
    return undefined;
};

export const toNumber = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return null;
};

export const filterUnits = (
    units: TrackingUnit[],
    activeTab: string,
    searchQuery: string
) => {
    return units.filter((unit) => {
        // Filter by active tab
        const matchesTab = (() => {
            if (activeTab === "active-orders" || activeTab === "general") return unit.hasActiveTrip;
            // Tracking shows the full tracking universe (ONLINE/STALE/OFFLINE).
            if (activeTab === "live-tracking" || activeTab === "status") return true;
            if (activeTab === "in-transit") return unit.executionSubstatus === "IN_TRANSIT";
            if (activeTab === "at-destination") return unit.executionSubstatus === "AT_DESTINATION";
            if (activeTab === "delivered") return unit.executionSubstatus === "DELIVERED";
            return true;
        })();

        if (!matchesTab) return false;

        // Filter by search query
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            unit.unit.toLowerCase().includes(query) ||
            unit.trailer.toLowerCase().includes(query) ||
            unit.driver.toLowerCase().includes(query) ||
            unit.location.toLowerCase().includes(query) ||
            unit.carrier.toLowerCase().includes(query)
        );
    });
};

export const getStatusCounts = (units: TrackingUnit[]) => {
    return {
        activeOrders: units.filter(u => u.hasActiveTrip).length,
        liveTracking: units.length,
        inTransit: units.filter(u => u.executionSubstatus === "IN_TRANSIT").length,
        atDestination: units.filter(u => u.executionSubstatus === "AT_DESTINATION").length,
        delivered: units.filter(u => u.executionSubstatus === "DELIVERED").length,
    };
};
