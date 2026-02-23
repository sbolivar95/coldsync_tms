import {
  LayoutDashboard,
  Truck,
  MapPin,
  Package2,
  Radio,
  DollarSign,
  ClipboardCheck,
  AlertTriangle,
  Settings,
  Menu,
  UserCircle,
  ArrowLeftRight
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAppStore } from "../stores/useAppStore";
import { canAccessRoute } from "../lib/permissions";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ activeView, onViewChange, collapsed, onToggle }: SidebarProps) {
  const { organizationMember, isPlatformUser } = useAppStore();
  const userRole = organizationMember?.role;

  // Define all menu items with their route identifiers
  // The route field maps to AppRoute type for permission checking
  const allMenuItems = [
    { id: "/dashboard", icon: LayoutDashboard, label: "Dashboard", route: 'dashboard' as const },
    { id: "/dispatch", icon: Package2, label: "Despacho", route: 'dispatch' as const },
    { id: "/control-tower", icon: Radio, label: "Torre de Control", route: 'control-tower' as const },
    { id: "/financials", icon: DollarSign, label: "Conciliación", route: 'financials' as const },
    { id: "/carriers", icon: Truck, label: "Transportistas", route: 'carriers' as const },
    { id: "/locations", icon: MapPin, label: "Ubicaciones", route: 'locations' as const },
    { id: "/lanes", icon: ArrowLeftRight, label: "Carriles (Lanes)", route: 'lanes' as const },
    { id: "/orders", icon: ClipboardCheck, label: "Órdenes", route: 'orders' as const },
  ];

  const allBottomMenuItems = [
    { id: "/alerts", icon: AlertTriangle, label: "Alertas", route: 'alerts' as const },
    { id: "/settings", icon: Settings, label: "Settings", route: 'settings' as const },
    { id: "/profile", icon: UserCircle, label: "Perfil de Usuario", route: 'profile' as const },
  ];

  // Filter menu items based on permissions
  const menuItems = allMenuItems.filter(item =>
    canAccessRoute(userRole, item.route, isPlatformUser || false)
  );

  const bottomMenuItems = allBottomMenuItems.filter(item =>
    canAccessRoute(userRole, item.route, isPlatformUser || false)
  );

  return (
    <div className={cn(
      "h-screen bg-[#1a1d2e] text-white flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header con Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700/50">
        {!collapsed ? (
          <div className="flex items-center">
            <img
              src="/assets/images/logo/coldsync_bg_black.png"
              alt="ColdSync"
              className="h-11 w-auto"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center w-full">
            <img
              src="/assets/images/logo/isotype.png"
              alt="ColdSync"
              className="h-8 w-8"
            />
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-700/50 rounded transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all relative group",
              activeView === item.id
                ? "text-white bg-gray-700/30"
                : "text-gray-400 hover:bg-gray-700/20 hover:text-white"
            )}
            title={collapsed ? item.label : undefined}
          >
            {/* Underline izquierdo cuando está activo */}
            {activeView === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r bg-primary" />
            )}

            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-sm">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Separador */}
      <div className="px-4 py-2">
        <div className="border-t border-gray-700/50"></div>
      </div>

      {/* Navegación inferior */}
      <nav className="pb-4 space-y-1 px-2">
        {bottomMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all relative group",
              activeView === item.id
                ? "text-white bg-gray-700/30"
                : "text-gray-400 hover:bg-gray-700/20 hover:text-white"
            )}
            title={collapsed ? item.label : undefined}
          >
            {/* Underline izquierdo cuando está activo */}
            {activeView === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r bg-primary" />
            )}

            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-sm">{item.label}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
}