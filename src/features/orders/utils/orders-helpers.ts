
import { Order, OrderStatus, getThermalProfileNameById, mapStatusToEnglish } from "../../../lib/mockData";
import { Package, CheckCircle2, Clock, MapPin, ClipboardCheck, XCircle, AlertCircle, Send, Ban } from "lucide-react";
import React from 'react';
import { CarrierOrder } from "../../../services/database/orders.service";



// Helper para calcular TTL restante según orders.md
export const getTTLRemaining = (tenderCreatedAt: string, pickupDate: string, pickupTime: string, responseDeadline?: string): string => {
    const now = new Date(); 
    
    let ttlExpiresAt: Date;

    if (responseDeadline) {
        ttlExpiresAt = new Date(responseDeadline);
    } else {
        const tenderCreated = new Date(tenderCreatedAt);
        const pickup = new Date(`${pickupDate}T${pickupTime}`);

        // Calcular TTL según política de orders.md (Fallback Logic)
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

// Helper para tiempo desde decisión (para estados finalizados)
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

// Helper para formatear fecha y hora
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

// Helper para detectar si una orden es híbrida
// Helper para detectar si una orden es híbrida
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

// Helper para obtener el color del círculo de estado
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

// Configuración de estados según orders.md
export const getStatusConfig = (status?: OrderStatus | string) => {
    let englishStatus: OrderStatus = "unassigned";

    if (status) {
        if (typeof status === 'string') {
            const validEnglishStatuses: OrderStatus[] = [
                "unassigned", "assigned", "pending", "scheduled", "rejected",
                "observed", "dispatched", "cancelled", "at-origin", "at-destination"
            ];

            if (validEnglishStatuses.includes(status.toLowerCase() as OrderStatus)) {
                englishStatus = status.toLowerCase() as OrderStatus;
            } else {
                englishStatus = mapStatusToEnglish(status.toLowerCase());
            }
        } else {
            englishStatus = status;
        }
    }

    const statusConfig: Record<string, {
        label: string;
        badgeClassName: string;
        icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
        iconColor: string;
        urgencyLevel?: 'normal' | 'high' | 'critical';
    }> = {
        "unassigned": {
            label: "Sin Asignar",
            badgeClassName: "bg-gray-100 text-gray-600",
            icon: Package,
            iconColor: "#6b7280",
        },
        "assigned": {
            label: "Asignada",
            badgeClassName: "bg-gray-100 text-gray-600",
            icon: CheckCircle2,
            iconColor: "#6b7280",
        },
        "pending": {
            label: "Pendiente",
            badgeClassName: "bg-blue-50 text-blue-700",
            icon: Clock,
            iconColor: "#3b82f6",
            urgencyLevel: 'normal',
        },
        "scheduled": {
            label: "Programada",
            badgeClassName: "bg-blue-50 text-blue-700",
            icon: CheckCircle2,
            iconColor: "#3b82f6",
        },
        "at-origin": {
            label: "En Origen",
            badgeClassName: "bg-blue-50 text-blue-700",
            icon: MapPin,
            iconColor: "#3b82f6",
        },
        "at-destination": {
            label: "En Destino",
            badgeClassName: "bg-gray-100 text-gray-700",
            icon: ClipboardCheck,
            iconColor: "#6b7280",
        },
        "rejected": {
            label: "Rechazada",
            badgeClassName: "bg-gray-100 text-gray-600",
            icon: XCircle,
            iconColor: "#6b7280",
        },
        "observed": {
            label: "Observada",
            badgeClassName: "bg-amber-50 text-amber-700",
            icon: AlertCircle,
            iconColor: "#f59e0b",
        },
        "dispatched": {
            label: "Despachada",
            badgeClassName: "bg-green-50 text-green-700",
            icon: Send,
            iconColor: "#10b981",
        },
        "cancelled": {
            label: "Cancelada",
            badgeClassName: "bg-gray-100 text-gray-600",
            icon: Ban,
            iconColor: "#6b7280",
        },
        "expired": {
            label: "Expirada",
            badgeClassName: "bg-gray-100 text-gray-600",
            icon: Clock,
            iconColor: "#6b7280",
        },
    };

    return statusConfig[englishStatus] || statusConfig["unassigned"];
};

// Helper para determinar urgencia de TTL
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

// Helper para obtener información completa del estado
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
    // @ts-ignore
    const rawStatus = order.status || order.estado || "pending";
    const status = rawStatus.toLowerCase();
    
    // Debug log
    console.log('getOrderStatusDisplay - rawStatus:', rawStatus, 'status:', status, 'tenderCreatedAt:', tenderCreatedAt);
    
    const statusConfig = getStatusConfig(status);

    // Estados que requieren TTL (tender pendiente)
    if (status === "pending" || status === "solicitado" || status === "solicitud") {
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

        console.log('Pending status - expectedDate:', expectedDate, 'expectedTime:', expectedTime, 'tenderCreatedAt:', tenderCreatedAt);

        if (tenderCreatedAt && expectedDate && expectedTime) {
            // @ts-ignore
            const responseDeadline = order.response_deadline;
            const ttlRemaining = getTTLRemaining(tenderCreatedAt, expectedDate, expectedTime, responseDeadline);
            const urgency = getTTLUrgency(ttlRemaining);

            console.log('TTL calculation - ttlRemaining:', ttlRemaining, 'urgency:', urgency);

            return {
                label: statusConfig.label,
                timeInfo: ttlRemaining === "Expirado" ? "Expiró" : `Vence en ${ttlRemaining}`,
                urgency,
                dotColor: urgency === 'critical' ? '#ef4444' : urgency === 'high' ? '#f59e0b' : '#3b82f6'
            };
        }
    }

    // Estados finalizados con timestamp de decisión
    if ((status === "rejected" || status === "rechazada") && decisionTimestamp) {
        return {
            label: statusConfig.label,
            timeInfo: getTimeSinceDecision(decisionTimestamp),
            urgency: 'normal',
            dotColor: '#6b7280'
        };
    }

    if (status === "expired" || status === "expirada") {
        return {
            label: "Expirada",
            timeInfo: decisionTimestamp ? getTimeSinceDecision(decisionTimestamp) : "",
            urgency: 'normal',
            dotColor: '#6b7280'
        };
    }

    // Nuevos estados según orders.md
    if (status === "accepted" || status === "aceptada") {
        return {
            label: "Aceptada",
            timeInfo: "",
            urgency: 'normal',
            dotColor: '#10b981'
        };
    }

    if (status === "observed" || status === "observada") {
        return {
            label: "Observada",
            timeInfo: decisionTimestamp ? getTimeSinceDecision(decisionTimestamp) : "",
            urgency: 'normal',
            dotColor: '#f59e0b'
        };
    }

    if (status === "fail_after_accept") {
        return {
            label: "Falla Post-Aceptación",
            timeInfo: decisionTimestamp ? getTimeSinceDecision(decisionTimestamp) : "",
            urgency: 'normal',
            dotColor: '#ef4444'
        };
    }

    if (status === "closed_by_handoff") {
        return {
            label: "Cerrada por Handoff",
            timeInfo: "",
            urgency: 'normal',
            dotColor: '#6b7280'
        };
    }

    console.log('Fallback - using statusConfig.iconColor:', statusConfig.iconColor);

    // Estados sin información temporal
    return {
        label: statusConfig.label,
        timeInfo: "",
        urgency: 'normal',
        dotColor: statusConfig.iconColor
    };
};

// Helper para obtener tipo de equipo requerido (perfil térmico)
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


// Helper para calcular la fecha límite de respuesta (Planned Start - 24h)
export const getDeadline = (plannedStart: string): Date => {
    // Si no hay planned_start, usar ahora (o manejar como caso de error/default)
    const startDate = plannedStart ? new Date(plannedStart) : new Date();
    // Restar 24 horas
    return new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
};


