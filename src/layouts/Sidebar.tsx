import { 
  LayoutDashboard, 
  Truck, 
  MapPin, 
  Package2, 
  Radio, 
  DollarSign, 
  Map, 
  AlertTriangle, 
  Settings, 
  Menu,
  Snowflake,
  UserCircle
} from "lucide-react";
import { cn } from "../lib/utils";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ activeView, onViewChange, collapsed, onToggle }: SidebarProps) {
  const menuItems = [
    { id: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "/dispatch", icon: Package2, label: "Despacho" },
    { id: "/control-tower", icon: Radio, label: "Torre de Control" },
    { id: "/financials", icon: DollarSign, label: "Conciliación" },
    { id: "/carriers", icon: Truck, label: "Transportistas" },
    { id: "/locations", icon: MapPin, label: "Ubicaciones" },
    { id: "/routes", icon: Map, label: "Rutas" },
  ];

  const bottomMenuItems = [
    { id: "/alerts", icon: AlertTriangle, label: "Alertas" },
    { id: "/settings", icon: Settings, label: "Settings" },
    { id: "/profile", icon: UserCircle, label: "Perfil de Usuario" },
  ];

  return (
    <div className={cn(
      "h-screen bg-[#1a1d2e] text-white flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header con Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700/50">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#004ef0' }}>
              <Snowflake className="w-5 h-5 text-white" />
            </div>
            <span className="text-white">ColdSync</span>
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
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r" style={{ backgroundColor: '#004ef0' }} />
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
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r" style={{ backgroundColor: '#004ef0' }} />
            )}
            
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-sm">{item.label}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
}