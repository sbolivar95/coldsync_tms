
export type ReeferErrorSeverity = "warning" | "critical";
export type TrackingSignalStatus = "ONLINE" | "STALE" | "OFFLINE";
export type UnitStatus =
    | "DRIVING"
    | "IDLE"
    | "STOPPED"
    | "STALE"
    | "OFFLINE";

export interface TrackingUnit {
    id: string;
    fleetSetId: string | null;
    unit: string;
    trailer: string;
    isHybridTrailer?: boolean;
    driver: string;
    driverId?: number | null;
    driverPhone?: string | null;
    driverEmail?: string | null;
    driverLicenseNumber?: string | null;
    location: string;
    coordinates: { lat: number; lng: number } | null;
    status: UnitStatus;
    speed: string;
    temperature: string;
    hasTemperatureError?: boolean;
    temperatureChannel1?: string;
    temperatureChannel2?: string;
    hasTemperatureChannel1Error?: boolean;
    hasTemperatureChannel2Error?: boolean;
    lastUpdate: string;
    carrier: string;
    reeferMode: string;
    reeferSetpoint: string;
    hasActiveTrip: boolean;
    hasLiveTracking?: boolean;
    signalStatus: TrackingSignalStatus;
    hasKnownMessage?: boolean;
    signalAgeSec?: number | null;
    signalAgeCapturedAtMs?: number | null;
    sourceDeviceType?: "VEHICLE" | "TRAILER" | null;
    hasCan: boolean;
    tempMode: "NONE" | "SINGLE" | "MULTI";
    executionSubstatus?: "IN_TRANSIT" | "AT_DESTINATION" | "DELIVERED" | null;
    reeferError?: {
        code: string;
        severity: ReeferErrorSeverity;
    };
    telematics?: Record<string, unknown> | null;
}
