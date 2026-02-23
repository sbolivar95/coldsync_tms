import React from "react";
import { X, MoreVertical } from "lucide-react";
import { Button } from "../../ui/Button";
import { Badge } from "../../ui/Badge";
import { cn } from "../../../lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../../ui/DropdownMenu";

/**
 * DISPATCH SIDE DRAWER - ColdSync
 * 
 * Caparazón (Shell) reutilizable para el drawer lateral derecho.
 * Replica exactamente la UI/UX de ColdSync pero sin lógica de negocio.
 */

export interface SideDrawerTab {
    id: string;
    label: string;
    badge?: string | number;
}

export interface SideDrawerAction {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: "default" | "outline" | "ghost" | "destructive";
    disabled?: boolean;
}

export interface DispatchSideDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    /** Badge opcional junto al título */
    badge?: {
        label: string;
        color?: string;
        bgColor?: string;
        icon?: React.ReactNode;
    };
    /** Pestañas para la navegación interna */
    tabs?: SideDrawerTab[];
    activeTabId?: string;
    onTabChange?: (tabId: string) => void;
    /** Acciones del pie de página */
    footer?: {
        primary?: SideDrawerAction;
        secondary?: SideDrawerAction;
        customContent?: React.ReactNode;
    };
    /** Acciones del menú desplegable en el header */
    menuActions?: {
        label: string;
        onClick: () => void;
        icon?: React.ReactNode;
        isDestructive?: boolean;
    }[];
    children: React.ReactNode;
    /** Ancho personalizado (default: 520px) */
    width?: string | number;
    className?: string;
}

export function DispatchSideDrawer({
    isOpen,
    onClose,
    title,
    badge,
    tabs = [],
    activeTabId,
    onTabChange,
    footer,
    menuActions = [],
    children,
    width = "520px",
    className,
}: DispatchSideDrawerProps) {
    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/20 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={cn(
                    "fixed right-0 top-0 bottom-0 bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out",
                    className
                )}
                style={{ width: typeof width === "number" ? `${width}px` : width }}
            >
                {/* Header */}
                <div className="h-14 flex items-center justify-between px-6 shrink-0 bg-white border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <h2 className="text-base font-medium text-gray-900">{title}</h2>
                        {badge && (
                            <Badge
                                className={cn(
                                    "text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1",
                                    badge.bgColor || "bg-gray-100",
                                    badge.color || "text-gray-700"
                                )}
                            >
                                {badge.icon && <span className="w-3.5 h-3.5">{badge.icon}</span>}
                                {badge.label}
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {menuActions.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    {menuActions.map((action, idx) => (
                                        <DropdownMenuItem
                                            key={idx}
                                            onClick={action.onClick}
                                            className={cn(action.isDestructive && "text-red-600 focus:text-red-600")}
                                        >
                                            {action.icon && <span className="mr-2">{action.icon}</span>}
                                            <span className="text-xs">{action.label}</span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-8 w-8 p-0"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                {tabs.length > 0 && (
                    <div className="border-b border-gray-200 bg-white">
                        <nav className="flex px-6">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => onTabChange?.(tab.id)}
                                    className={cn(
                                        "relative text-xs px-4 py-3 transition-colors flex items-center gap-1.5",
                                        activeTabId === tab.id
                                            ? "text-[#004ef0]"
                                            : "text-gray-600 hover:text-gray-900"
                                    )}
                                >
                                    {tab.label}
                                    {tab.badge !== undefined && (
                                        <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                                            {tab.badge}
                                        </span>
                                    )}
                                    {activeTabId === tab.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#004ef0]" />
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>
                )}

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">{children}</div>

                {/* Footer */}
                {(footer?.primary || footer?.secondary || footer?.customContent) && (
                    <div className="border-t border-gray-200 px-6 py-4 bg-white flex gap-3">
                        {footer.customContent ? (
                            footer.customContent
                        ) : (
                            <>
                                {footer.secondary && (
                                    <Button
                                        variant={footer.secondary.variant || "outline"}
                                        className="flex-1 text-xs"
                                        onClick={footer.secondary.onClick}
                                        disabled={footer.secondary.disabled}
                                    >
                                        {footer.secondary.label}
                                    </Button>
                                )}
                                {footer.primary && (
                                    <Button
                                        variant={footer.primary.variant || "default"}
                                        className="flex-1 text-xs"
                                        style={
                                            footer.primary.variant !== "destructive"
                                                ? { backgroundColor: "#004ef0" }
                                                : {}
                                        }
                                        onClick={footer.primary.onClick}
                                        disabled={footer.primary.disabled}
                                    >
                                        {footer.primary.icon && (
                                            <span className="w-3.5 h-3.5 mr-1.5">{footer.primary.icon}</span>
                                        )}
                                        {footer.primary.label}
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
