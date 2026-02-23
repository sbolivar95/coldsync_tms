import { memo } from "react";
import { TriangleAlert } from "lucide-react";
import { TrackingUnit } from "../types";
import { MobilityIndicator } from "./MobilityIndicator";

interface FleetUnitMarkerProps {
    unit: TrackingUnit;
    isSelected: boolean;
}

const TOKENS = {
    primaryCold: "var(--color-blue-600)",
    neutral: "var(--color-gray-400)",
    surface: "var(--color-white)",
    textPrimary: "var(--color-gray-900)",
    border: "var(--border)"
} as const;

const FleetUnitMarkerComponent = memo(({ unit, isSelected }: FleetUnitMarkerProps) => {
    const showNeutralThermal = unit.signalStatus === "OFFLINE" || unit.signalStatus === "STALE" || !unit.hasKnownMessage;
    const activeColor = showNeutralThermal ? TOKENS.neutral : TOKENS.primaryCold;
    const tempColor = "var(--color-gray-700)";

    const tempEntries = unit.tempMode === "MULTI"
        ? [
            {
                value: unit.temperatureChannel1 ?? "--",
                hasError: Boolean(unit.hasTemperatureChannel1Error),
                errorTitle: "Error en sensor de temperatura 1",
            },
            {
                value: unit.temperatureChannel2 ?? "--",
                hasError: Boolean(unit.hasTemperatureChannel2Error),
                errorTitle: "Error en sensor de temperatura 2",
            },
        ]
        : [
            {
                value: unit.temperature ?? "--",
                hasError: Boolean(unit.hasTemperatureError),
                errorTitle: "Error de sensor de temperatura",
            },
        ];
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
                        backgroundColor: TOKENS.surface,
                        display: 'flex',
                        alignItems: 'center',
                        height: '32px',
                        borderRadius: '6px',
                        padding: '2px',
                        border: `1px solid ${TOKENS.border}`,
                        boxShadow: isSelected
                            ? `0 12px 24px -10px ${activeColor}44`
                            : '0 4px 10px rgba(0, 0, 0, 0.08)',
                        overflow: 'hidden',
                        minWidth: '112px',
                        gap: '8px'
                    }}
                >
                    <div style={{ marginLeft: '2px', display: 'flex', alignItems: 'center' }}>
                        <MobilityIndicator unit={unit} arrowSize={13} shapeSize={10} />
                    </div>

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
                            fontSize: '12.5px',
                            fontWeight: 800,
                            color: TOKENS.textPrimary,
                            letterSpacing: '-0.2px',
                            whiteSpace: 'nowrap',
                            maxWidth: '86px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {unit.unit}
                        </span>

                        {/* Technical Divider */}
                        <div style={{
                            width: '1px',
                            height: '12px',
                            backgroundColor: TOKENS.border,
                            opacity: 0.8
                        }} />

                        {/* Temperature by compartment:
                            Standard -> [T]
                            Hybrid -> [T1] | [T2]
                            Error channel -> [--] [ErrorIcon]
                        */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            flex: 1,
                            gap: '6px'
                        }}>
                            {tempEntries.map((entry, index) => (
                                <div
                                    key={`temp-${index}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}
                                >
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        color: tempColor,
                                        fontVariantNumeric: 'tabular-nums',
                                        letterSpacing: '-0.2px',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {entry.value}
                                    </span>
                                    {entry.hasError ? (
                                        <span title={entry.errorTitle}>
                                            <TriangleAlert
                                                size={11}
                                                color="var(--color-orange-500)"
                                            />
                                        </span>
                                    ) : null}
                                    {index < tempEntries.length - 1 && (
                                        <span style={{
                                            color: TOKENS.border,
                                            fontWeight: 600,
                                            fontSize: '11px'
                                        }}>
                                            |
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* INTEGRATED POINTER */}
                <div style={{
                    width: 0,
                    height: 0,
                    borderLeft: '7px solid transparent',
                    borderRight: '7px solid transparent',
                    borderTop: `7px solid ${TOKENS.surface}`,
                    marginTop: '-1px',
                    filter: isSelected ? 'none' : 'drop-shadow(0 2px 1px rgba(0,0,0,0.05))'
                }} />
            </div> {/* End of Scale Wrapper */}
        </div>
    );
});

export default FleetUnitMarkerComponent;
