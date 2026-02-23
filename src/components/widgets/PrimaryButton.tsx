import { Button } from "../ui/Button";
import { LucideIcon } from "lucide-react";

interface PrimaryButtonProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

export function PrimaryButton({
  children,
  icon: Icon,
  onClick,
  disabled = false,
  type = "button",
  className = "",
  size = "default",
}: PrimaryButtonProps) {
  return (
    <Button
      type={type}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={`gap-2 hover:opacity-90 transition-opacity ${className}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </Button>
  );
}
