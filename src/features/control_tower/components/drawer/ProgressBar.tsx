interface ProgressBarProps {
  label: string;
  value: string;
  percentage: number;
  color?: string;
  showMarkers?: boolean;
}

export function ProgressBar({
  label,
  value,
  percentage,
  color = "var(--primary)",
  showMarkers = false,
}: ProgressBarProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-[11px]">{label}</span>
        <span className="text-gray-900 text-[13px] font-normal">{value}</span>
      </div>
      <div className="relative w-full bg-gray-200 rounded-full h-1">
        <div
          className="h-1 rounded-full transition-all"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />

        {showMarkers && (
          <div className="absolute left-0 right-0" style={{ top: "50%" }}>
            {/* Origen - cuadrado azul (visitado) */}
            <div
              className="absolute w-2.5 h-2.5 border-2 bg-white"
              style={{
                left: "-5px",
                top: "-5px",
                borderColor: color,
                backgroundColor: color,
              }}
            />
            {/* Destino - cuadrado gris (sin visitar) */}
            <div
              className="absolute w-2.5 h-2.5 border-2 border-gray-400 bg-white"
              style={{ right: "-5px", top: "-5px" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
