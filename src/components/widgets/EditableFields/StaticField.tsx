interface StaticFieldProps {
  label: string;
  value: string | React.ReactNode;
}

/**
 * Componente para mostrar un campo estático (solo lectura)
 * Útil para mostrar información que no necesita edición
 */
export function StaticField({ label, value }: StaticFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
        {label}
      </label>
      <div className="text-sm text-gray-900 font-medium">
        {typeof value === "string"
          ? value.split(/(->|→)/).map((part, index) =>
              part === "->" || part === "→" ? (
                <span
                  key={index}
                  className="text-[#004ef0] font-bold"
                >
                  →
                </span>
              ) : (
                part
              ),
            )
          : value || "-"}
      </div>
    </div>
  );
}

