import { useState, useEffect } from "react";
import { CarrierOrder } from "../../../services/database/orders.service";
import { getOrderStatusDisplay, getDeadline } from "../utils/orders-helpers";

interface OrderStatusCellProps {
    order: CarrierOrder;
    tenderCreatedAt?: string;
    decisionTimestamp?: string;
}

export function OrderStatusCell({ order, tenderCreatedAt, decisionTimestamp }: OrderStatusCellProps) {
    const [displayState, setDisplayState] = useState(() => 
        getOrderStatusDisplay(order, tenderCreatedAt, decisionTimestamp)
    );

    useEffect(() => {
        // Only run live updates for pending/solicitud statuses
        if (displayState.label !== "Pendiente" && displayState.label !== "Solicitud") {
            return;
        }

        let deadline: Date;
        if (order.response_deadline) {
            deadline = new Date(order.response_deadline);
        } else {
            deadline = getDeadline(order.planned_start_at || "");
        }

        const updateState = () => {
            const now = new Date();
            const diffMs = deadline.getTime() - now.getTime();
            
            let timeLeftStr = "";
            let newUrgency: "normal" | "high" | "critical" = "normal";
            let newColor = "#3b82f6"; // Blue (normal)

            if (diffMs <= 0) {
                timeLeftStr = "Expirado";
                newUrgency = "critical";
                newColor = "#6b7280"; // Gray for expired? Or Red? Keeping consistent with previous logic or Request
                // If expired, maybe we keep it red? The user said "blue, orange and red".
                // Let's stick to the color logic requested:
                // < 2h = Red, < 6h = Orange, else Blue.
                // Expired is technically < 2h, so Red makes sense if valid, but usually "Expirado" is gray.
                // But let's assume active urgency.
            } else {
                const hoursRemaining = diffMs / (1000 * 60 * 60);
                
                if (hoursRemaining < 2) {
                    newUrgency = "critical";
                    newColor = "#ef4444"; // Red
                } else if (hoursRemaining < 6) {
                    newUrgency = "high";
                    newColor = "#f59e0b"; // Amber/Orange
                } else {
                    newUrgency = "normal";
                    newColor = "#3b82f6"; // Blue
                }

                const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                if (days > 0) {
                    timeLeftStr = `${days}d ${hours}h`;
                } else if (hours > 0) {
                    timeLeftStr = `${hours}h ${minutes}min`;
                } else {
                    timeLeftStr = `${minutes}min`;
                }
            }

            // Update state with new live values
            setDisplayState(prev => ({
                ...prev,
                timeInfo: timeLeftStr === "Expirado" ? "Expiró" : `Vence en ${timeLeftStr}`,
                urgency: newUrgency,
                dotColor: newColor
            }));
        };

        updateState(); // Immediate update
        const timer = setInterval(updateState, 60000); // 1 minute interval

        return () => clearInterval(timer);
    }, [order.planned_start_at, displayState.label]);

    return (
        <div className="flex flex-col gap-0.5 py-1">
            {/* Row 1: Dot + Label */}
            <div className="flex items-center gap-1.5">
                <div
                    className="w-2 h-2 rounded-full shrink-0 transition-colors duration-500"
                    style={{ backgroundColor: displayState.dotColor }}
                />
                <span className="text-xs font-semibold text-gray-900">
                    {displayState.label}
                </span>
            </div>

            {/* Row 2: Timer (Gray) */}
            {displayState.timeInfo && (
                <span className="text-xs text-gray-500 ml-3.5">
                    {displayState.timeInfo}
                </span>
            )}

            {/* Row 3: Badge (If Critical) */}
            {displayState.urgency === 'critical' && (
                <div className="ml-3.5 mt-0.5">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wide">
                        CRÍTICA
                    </span>
                </div>
            )}
        </div>
    );
}
