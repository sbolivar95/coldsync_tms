interface AlertItemProps {
  title: string;
  time: string;
  description: string;
  footer?: string;
  isResolved?: boolean;
}

export function AlertItem({
  title,
  time,
  description,
  footer,
  isResolved = false,
}: AlertItemProps) {
  return (
    <div className="border-b border-gray-100 pb-2">
      <div className="flex items-start justify-between mb-1">
        <span
          className={`${isResolved ? "text-gray-400" : "text-gray-900"} text-[13px]`}
        >
          {title}
        </span>
        <span className="text-gray-500 text-[11px]">{time}</span>
      </div>
      <p
        className={`${isResolved ? "text-gray-500" : "text-gray-600"} text-[11px]${footer ? " mb-1" : ""}`}
      >
        {description}
      </p>
      {footer && <span className="text-gray-500 text-[11px]">{footer}</span>}
    </div>
  );
}
