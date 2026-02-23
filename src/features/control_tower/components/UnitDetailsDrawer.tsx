import { useState } from "react";
import { ChevronDown, ChevronUp, X, AlertCircle } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { GeneralTab } from "./drawer/GeneralTab";
import { TemperaturaTab } from "./drawer/TemperaturaTab";
import { ReeferTab } from "./drawer/ReeferTab";
import { InfoTab } from "./drawer/InfoTab";
import { AlertsTab } from "./drawer/AlertsTab";


import { TrackingUnit } from "../utils/mock-data";

interface UnitDetailsDrawerProps {
  unit: TrackingUnit;
  onClose: () => void;
}

type DrawerState = "minimized" | "half" | "full";

export function UnitDetailsDrawer({
  unit,
  onClose,
}: UnitDetailsDrawerProps) {
  const [drawerState, setDrawerState] =
    useState<DrawerState>("half");
  const [activeTab, setActiveTab] = useState<
    | "general"
    | "temperatura"
    | "graficos"
    | "reefer"
    | "info"
    | "alertas"
  >("general");

  // Mock data - en producción vendría de props
  const activeAlertsCount = 2;
  // Mock data - en producción vendría de props

  const getHeightClass = () => {
    switch (drawerState) {
      case "minimized":
        return "h-14";
      case "half":
        return "h-[220px]";
      case "full":
        return "h-[360px]";
    }
  };

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl transition-all duration-300 ease-in-out ${getHeightClass()} flex flex-col z-50`}
    >
      {/* Header Bar con Tabs */}
      <div className="h-14 flex items-center justify-between px-6 shrink-0 bg-white border-b border-gray-100">
        {/* Tabs - Solo visible cuando no está minimizado */}
        {drawerState !== "minimized" ? (
          <nav className="flex gap-6 h-full items-center">
            {[
              { id: "general", label: "General" },
              { id: "temperatura", label: "Temperatura" },
              { id: "graficos", label: "Gráficos" },
              { id: "reefer", label: "Reefer" },
              { id: "info", label: "Info" },
              { id: "alertas", label: "Alertas", badge: activeAlertsCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(tab.id as typeof activeTab)
                }
                className={`relative text-sm px-1 transition-colors h-full flex items-center gap-1.5 ${activeTab === tab.id
                  ? "text-primary"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                {tab.label}
                {tab.id === "alertas" && activeAlertsCount > 0 && (
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                )}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </nav>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-900 font-medium">
              Unidad seleccionada:
            </span>
            <span className="text-sm text-primary">
              {unit.unit}
            </span>
          </div>
        )}

        {/* Botones de control */}
        <div className="flex items-center gap-2">
          {drawerState === "minimized" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDrawerState("half");
              }}
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setDrawerState(
                    drawerState === "full" ? "half" : "full",
                  );
                }}
              >
                {drawerState === "full" ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setDrawerState("minimized");
                }}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content - Solo visible cuando no está minimizado */}
      {drawerState !== "minimized" && (
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "general" && (
            <GeneralTab carrier={unit.carrier} />
          )}

          {activeTab === "temperatura" && (
            <TemperaturaTab />
          )}

          {activeTab === "graficos" && (
            <div className="space-y-4">
              {/* Contenido vacío - Para futuros gráficos */}
            </div>
          )}

          {activeTab === "reefer" && (
            <ReeferTab />
          )}

          {activeTab === "info" && (
            <InfoTab driver={unit.driver} />
          )}

          {activeTab === "alertas" && (
            <AlertsTab />
          )}
        </div>
      )}
    </div>
  );
}