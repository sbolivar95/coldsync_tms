import { Button } from "../ui/Button";
import { LucideIcon } from "lucide-react";

interface SecondaryButtonProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

export function SecondaryButton({
  children,
  icon: Icon,
  onClick,
  disabled = false,
  type = "button",
  className = "",
  size = "default",
}: SecondaryButtonProps) {
  return (
    <Button
      type={type}
      variant="outline"
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={`gap-2 ${className}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </Button>
  );
}
