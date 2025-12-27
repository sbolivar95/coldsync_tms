import { Button } from "../ui/Button";
import { LucideIcon } from "lucide-react";

interface PrimaryButtonProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}

export function PrimaryButton({
  children,
  icon: Icon,
  onClick,
  disabled = false,
  type = "button",
  className = "",
}: PrimaryButtonProps) {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ backgroundColor: '#004ef0' }}
      className={`gap-2 hover:opacity-90 transition-opacity ${className}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </Button>
  );
}
