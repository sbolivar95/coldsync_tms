export const ArrowUpIcon = ({ width, height, color, className }: { width: number; height: number; color?: string; className?: string }) => (
  <svg
    width={width}
    height={height}
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="m8 5c-1.10457 0-2 .89543-2 2s.89543 2 2 2h4.1716l-6.58581 6.5858c-.78105.781-.78105 2.0474 0 2.8284.78104.7811 2.04738.7811 2.82842 0l6.58579-6.5858v4.1716c0 1.1046.8954 2 2 2s2-.8954 2-2v-9c0-1.10457-.8954-2-2-2z"
      fill={color || "currentColor"}
    />
  </svg>
);

