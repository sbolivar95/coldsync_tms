interface StaticFieldProps {
  label: string;
  value: string | React.ReactNode;
}

/**
 * Static field component (read-only).
 * Use for displaying information that does not require editing.
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
                  className="text-primary font-bold"
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

