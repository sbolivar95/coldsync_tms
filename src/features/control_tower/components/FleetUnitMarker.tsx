import { memo } from "react";
import { TrackingUnit } from "../utils/mock-data";

interface FleetUnitMarkerProps {
    unit: TrackingUnit;
    isSelected: boolean;
}

/**
 * FleetUnitMarker - ColdSync "Thermal Spectrum" Edition
 * 
 * Replaces generic Green with ColdSync Primary Blue for optimal cold.
 * Spectrum:
 * - Blue (Primary): Optimal Cold / In Range
 * - Amber: Thermal Deviation (Warning)
 * - Red: Excursion (Critical)
 */
const FleetUnitMarkerComponent = memo(({ unit, isSelected }: FleetUnitMarkerProps) => {

    // ColdSync Professional Palette
    const tokens = {
        primaryCold: "var(--color-blue-600)",    // Brand Blue = Safe Cold
        warning: "var(--color-orange-500)",     // Approaching boundary
        critical: "var(--color-red-600)",       // Excursion
        neutral: "var(--color-gray-400)",        // Stopped / Inactive
        surface: "var(--color-white)",
        textPrimary: "var(--color-gray-900)",
        border: "var(--border)"
    };

    // Thermal Health Logic
    const isThermalAlert = unit.status === "Excursión Térmica" || !!unit.reeferError;
    // Mocking a warning state if temperature is not "perfect" (based on status or values)
    const isWarning = unit.status === "Retrasado" || (unit.reeferError?.severity === "warning");

    const getThermalColor = () => {
        if (isThermalAlert) return tokens.critical;
        if (isWarning) return tokens.warning;
        if (unit.status === "Detenido") return tokens.neutral;
        return tokens.primaryCold; // Blue as the new "Success" color
    };

    const activeColor = getThermalColor();

    return (
        <div
            style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                // No more manual translate(-50%, -100%): AdvancedMarker anchors 
                // to bottom-center of the custom content by default.
            }}
            className={isSelected ? "z-100" : "z-10"}
        >
            {/* INNER CONTENT WRAPPER (Handles Scale without affecting Anchor) */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: isSelected ? 'scale(1.1)' : 'scale(1)',
            }}>
                {/* COMPACT PRECISION BAR */}
                <div
                    style={{
                        backgroundColor: tokens.surface,
                        display: 'flex',
                        alignItems: 'center',
                        height: '30px',
                        borderRadius: '6px',
                        padding: '2px',
                        border: `1px solid ${tokens.border}`,
                        boxShadow: isSelected
                            ? `0 12px 24px -10px ${activeColor}44`
                            : '0 4px 10px rgba(0, 0, 0, 0.08)',
                        overflow: 'hidden',
                        minWidth: '100px',
                        gap: '8px'
                    }}
                >
                    {/* STATUS STRIPE (Now reflects Thermal Health) */}
                    <div style={{
                        width: '6px',
                        height: '100%',
                        backgroundColor: activeColor,
                        borderRadius: '4px',
                        flexShrink: 0
                    }} />

                    {/* DATA PAYLOAD */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        flex: 1,
                        paddingRight: '6px'
                    }}>
                        {/* Unit ID */}
                        <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: tokens.textPrimary,
                            letterSpacing: '-0.3px',
                            whiteSpace: 'nowrap'
                        }}>
                            {unit.unit}
                        </span>

                        {/* Technical Divider */}
                        <div style={{
                            width: '1px',
                            height: '14px',
                            backgroundColor: tokens.border,
                            opacity: 0.8
                        }} />

                        {/* Temperature (The Master Metric) */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            flex: 1
                        }}>
                            <span style={{
                                fontSize: '13px',
                                fontWeight: 800,
                                color: activeColor, // Temperature text matches health color
                                fontVariantNumeric: 'tabular-nums',
                                letterSpacing: '-0.5px'
                            }}>
                                {unit.temperature}
                            </span>
                        </div>

                        {/* Blinking dot for alerts */}
                        {(isThermalAlert || isWarning || unit.status === "En Ruta") && (
                            <div style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: activeColor,
                                flexShrink: 0,
                                animation: (isThermalAlert || isWarning) ? 'pulse 1.5s infinite' : 'none'
                            }} />
                        )}
                    </div>
                </div>

                {/* INTEGRATED POINTER */}
                <div style={{
                    width: 0,
                    height: 0,
                    borderLeft: '7px solid transparent',
                    borderRight: '7px solid transparent',
                    borderTop: `7px solid ${tokens.surface}`,
                    marginTop: '-1px',
                    filter: isSelected ? 'none' : 'drop-shadow(0 2px 1px rgba(0,0,0,0.05))'
                }} />
            </div> {/* End of Scale Wrapper */}
        </div>
    );
});

export default FleetUnitMarkerComponent;
