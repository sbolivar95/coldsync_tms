
import { Order, getThermalProfileNameById } from "../../../lib/mockData";
import { Package, CheckCircle2, Clock, MapPin, XCircle, AlertCircle, Send, Ban, Calendar } from "lucide-react";
import React from 'react';
import { CarrierOrder } from "../../../services/database/orders.service";



// Helper to calculate remaining TTL according to orders.md
export const getTTLRemaining = (tenderCreatedAt: string, pickupDate: string, pickupTime: string, responseDeadline?: string): string => {
    const now = new Date(); 
    
    let ttlExpiresAt: Date;

    if (responseDeadline) {
        ttlExpiresAt = new Date(responseDeadline);
    } else {
        const tenderCreated = new Date(tenderCreatedAt);
        const pickup = new Date(`${pickupDate}T${pickupTime}`);

        // Calculate TTL according to orders.md policy (Fallback Logic)
        const pickupDiffMs = pickup.getTime() - tenderCreated.getTime();
        const pickupDiffDays = pickupDiffMs / (1000 * 60 * 60 * 24); // Use float for accuracy? No, logic was originally integer days.
        // Replicating new logic roughly or keeping old fallback:
        // New logic:
        // <= 1 day: 90 mins from tender
        // <= 3 days: 24h from tender
        // <= 7 days: 48h from tender
        // > 7 days: 72h from tender
        
        let ttlDurationMs: number;
        if (pickupDiffDays <= 1) {
            ttlDurationMs = 90 * 60 * 1000; // 90 minutos
        } else if (pickupDiffDays <= 3) {
            ttlDurationMs = 24 * 60 * 60 * 1000; // 24 horas
        } else if (pickupDiffDays <= 7) {
            ttlDurationMs = 48 * 60 * 60 * 1000; // 48 horas
        } else {
            ttlDurationMs = 72 * 60 * 60 * 1000; // 72 horas
        }
        ttlExpiresAt = new Date(tenderCreated.getTime() + ttlDurationMs);
    }

    const remainingMs = ttlExpiresAt.getTime() - now.getTime();

    if (remainingMs <= 0) {
        return "Expirado";
    }

    const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
    const remainingHours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    if (remainingDays > 0) {
        return `${remainingDays}d ${remainingHours}h`;
    } else if (remainingHours > 0) {
        return `${remainingHours}h ${remainingMinutes}min`;
    } else {
        return `${remainingMinutes}min`;
    }
};

// Helper to get time since decision (for completed states)
export const getTimeSinceDecision = (decisionTimestamp: string): string => {
    const now = new Date();
    const decision = new Date(decisionTimestamp);
    const diffMs = now.getTime() - decision.getTime();

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
        return `hace ${diffDays}d`;
    } else if (diffHours > 0) {
        return `hace ${diffHours}h`;
    } else {
        return `hace ${diffMinutes}min`;
    }
};

// Helper to format date and time
export const formatDateAndTime = (dateStr?: string, timeStr?: string): string => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);

    // Obtener día de la semana en español
    const dayOfWeek = date.toLocaleDateString("es-ES", { weekday: "short" });
    // Capitalizar primera letra
    const dayCapitalized = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1); // Sáb

    const day = date.getDate();
    const month = date.toLocaleDateString("es-ES", { month: "short" }); // feb

    // Extract time from date if timeStr is not provided
    let time = timeStr;
    if (!time || time === "-") {
        time = date.toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    return `${dayCapitalized}, ${day} ${month} ${time}`;
};

// Helper to detect if an order is hybrid
export const isOrderHybrid = (order: Order | CarrierOrder): boolean => {
    // Check if it's CarrierOrder with items
    if ('items' in order && order.items && order.items.length > 0) {
        // Collect all unique thermal profile names
        const profiles = new Set(
            order.items
                .map(i => i.thermal_profile?.name)
                .filter(name => name && name !== "-")
        );
        // If there are 2 or more DIFFERENT profiles, it's hybrid
        if (profiles.size > 1) {
            return true;
        }
        return false;
    }

    const o = order as Order;
    return (
        o.configuration === "hibrido" ||
        o.configuration === "hybrid" ||
        o.configuracion === "hibrido" ||
        o.esHibrida === true ||
        o.isHybrid === true
    );
};

// Helper to get status circle color
export const getStatusDotColor = (status?: string, hasActiveTrip?: boolean): string => {
    if (!hasActiveTrip) {
        return "fill-none stroke-gray-400 stroke-[1.5]";
    }

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

// Substatus configuration according to orders.md
export const getStatusConfig = (substatus?: string) => {
    const normalizedSubstatus = substatus?.toUpperCase() || "PENDING";

    const statusConfig: Record<string, {
        label: string;
        badgeClassName: string;
        icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
        iconColor: string;
        urgencyLevel?: 'normal' | 'high' | 'critical';
    }> = {
        // TENDERS substatus
        "PENDING": {
            label: "Pendiente",
            badgeClassName: "bg-blue-50 text-blue-700",
            icon: Clock,
            iconColor: "#3b82f6",
            urgencyLevel: 'normal',
        },
        "ACCEPTED": {
            label: "Aceptada",
            badgeClassName: "bg-green-50 text-green-700",
            icon: CheckCircle2,
            iconColor: "#10b981",
        },
        "REJECTED": {
            label: "Rechazada",
            badgeClassName: "bg-gray-100 text-gray-600",
            icon: XCircle,
            iconColor: "#6b7280",
        },
        "EXPIRED": {
            label: "Expirada",
            badgeClassName: "bg-gray-100 text-gray-600",
            icon: Clock,
            iconColor: "#6b7280",
        },
        // SCHEDULED substatus
        "PROGRAMMED": {
            label: "Programada",
            badgeClassName: "bg-blue-50 text-blue-700",
            icon: Calendar,
            iconColor: "#3b82f6",
        },
        "DISPATCHED": {
            label: "Despachada",
            badgeClassName: "bg-green-50 text-green-700",
            icon: Send,
            iconColor: "#10b981",
        },
        "EN_ROUTE_TO_ORIGIN": {
            label: "En Ruta a Origen",
            badgeClassName: "bg-blue-50 text-blue-700",
            icon: MapPin,
            iconColor: "#3b82f6",
        },
        "AT_ORIGIN": {
            label: "En Origen",
            badgeClassName: "bg-blue-50 text-blue-700",
            icon: MapPin,
            iconColor: "#3b82f6",
        },
        "LOADING": {
            label: "Cargando",
            badgeClassName: "bg-blue-50 text-blue-700",
            icon: Package,
            iconColor: "#3b82f6",
        },
        "OBSERVED": {
            label: "Observada",
            badgeClassName: "bg-amber-50 text-amber-700",
            icon: AlertCircle,
            iconColor: "#f59e0b",
        },
        // Cross-cutting
        "CANCELED": {
            label: "Cancelada",
            badgeClassName: "bg-gray-100 text-gray-600",
            icon: Ban,
            iconColor: "#6b7280",
        },
    };

    return statusConfig[normalizedSubstatus] || statusConfig["PENDING"];
};

// Helper to determine TTL urgency
export const getTTLUrgency = (ttlRemaining: string): 'normal' | 'high' | 'critical' => {
    if (ttlRemaining === "Expirado") return 'critical';

    // Extraer minutos totales del string
    let totalMinutes = 0;

    const dayMatch = ttlRemaining.match(/(\d+)d/);
    const hourMatch = ttlRemaining.match(/(\d+)h/);
    const minMatch = ttlRemaining.match(/(\d+)min/);

    if (dayMatch) totalMinutes += parseInt(dayMatch[1]) * 24 * 60;
    if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
    if (minMatch) totalMinutes += parseInt(minMatch[1]);

    if (totalMinutes <= 30) return 'critical';
    if (totalMinutes <= 120) return 'high';
    return 'normal';
};

// Helper to get complete status information
export const getOrderStatusDisplay = (
    order: Order | CarrierOrder,
    tenderCreatedAt?: string,
    decisionTimestamp?: string
): {
    label: string;
    timeInfo: string;
    urgency: 'normal' | 'high' | 'critical';
    dotColor: string;
} => {
    // Read substatus from CarrierOrder
    const substatus = ('substatus' in order ? order.substatus : null) || "PENDING";
    const normalizedSubstatus = substatus.toUpperCase();
    
    const statusConfig = getStatusConfig(normalizedSubstatus);

    // States that require TTL (pending tender)
    if (normalizedSubstatus === "PENDING") {
        let expectedDate: string | undefined;
        let expectedTime: string | undefined;

        if ('planned_start_at' in order && order.planned_start_at) {
            const d = new Date(order.planned_start_at);
            expectedDate = d.toISOString().split('T')[0];
            expectedTime = d.toTimeString().split(' ')[0].substring(0, 5);
        } else if ('expectedDate' in order) {
            // @ts-ignore
            expectedDate = order.expectedDate;
            // @ts-ignore
            expectedTime = order.expectedTime;
        }

        if (tenderCreatedAt && expectedDate && expectedTime) {
            // @ts-ignore
            const responseDeadline = order.response_deadline;
            const ttlRemaining = getTTLRemaining(tenderCreatedAt, expectedDate, expectedTime, responseDeadline);
            const urgency = getTTLUrgency(ttlRemaining);

            return {
                label: statusConfig.label,
                timeInfo: ttlRemaining === "Expirado" ? "Expiró" : `Vence en ${ttlRemaining}`,
                urgency,
                dotColor: urgency === 'critical' ? '#ef4444' : urgency === 'high' ? '#f59e0b' : '#3b82f6'
            };
        }
    }

    // Completed states with decision timestamp
    if ((normalizedSubstatus === "REJECTED" || normalizedSubstatus === "EXPIRED") && decisionTimestamp) {
        return {
            label: statusConfig.label,
            timeInfo: getTimeSinceDecision(decisionTimestamp),
            urgency: 'normal',
            dotColor: '#6b7280'
        };
    }

    if (normalizedSubstatus === "OBSERVED" && decisionTimestamp) {
        return {
            label: statusConfig.label,
            timeInfo: getTimeSinceDecision(decisionTimestamp),
            urgency: 'normal',
            dotColor: '#f59e0b'
        };
    }

    // States without temporal information
    return {
        label: statusConfig.label,
        timeInfo: "",
        urgency: 'normal',
        dotColor: statusConfig.iconColor
    };
};

// Helper to get required equipment type (thermal profile)
export const getEquipmentType = (order: Order | CarrierOrder): string => {
    const isHybrid = isOrderHybrid(order);

    if (isHybrid) {
        // @ts-ignore
        const compartments = order.compartments || order.compartimientos || [];

        if (compartments.length > 0) {
            const uniqueProfiles = Array.from(
                new Set(
                    compartments
                        .map((comp: any) => {
                            const profileId = comp.thermalProfileId || comp.perfil || "";
                            return getThermalProfileNameById(profileId);
                        })
                        .filter((name: string) => name !== "-")
                )
            );
            if (uniqueProfiles.length > 0) {
                return uniqueProfiles.join(", ");
            }
        }

        // Fallback: Check items if compartments are missing
        if ('items' in order && order.items && order.items.length > 0) {
            const profiles = new Set(
                order.items
                    .map(i => i.thermal_profile?.name)
                    .filter(Boolean)
            );
            if (profiles.size > 0) {
                return Array.from(profiles).join(", ");
            }
        }

        return "-";
    }

    if ('items' in order && order.items && order.items.length > 0) {
        // Attempt to get thermal profile from items for CarrierOrder
        const profiles = order.items.map(i => i.thermal_profile?.name).filter(Boolean);
        if (profiles.length > 0) return Array.from(new Set(profiles)).join(", ");
    }

    // @ts-ignore
    const thermalProfileId = order.thermalProfileId || order.perfil;
    if (thermalProfileId) {
        return getThermalProfileNameById(thermalProfileId);
    }

    return "-";
};


// Helper to calculate response deadline (Planned Start - 24h)
export const getDeadline = (plannedStart: string): Date => {
    // If no planned_start, use now (or handle as error/default case)
    const startDate = plannedStart ? new Date(plannedStart) : new Date();
    // Subtract 24 hours
    return new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
};


