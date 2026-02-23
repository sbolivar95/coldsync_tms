import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { StatusTab } from "./drawer/StatusTab";
import { ReeferTab } from "./drawer/ReeferTab";
import { InfoTab } from "./drawer/InfoTab";

import { TrackingUnit } from "../types";

interface UnitDetailsDrawerProps {
  unit: TrackingUnit;
  nowMs: number;
  onClose: () => void;
}

type DrawerState = "minimized" | "half" | "full";

export function UnitDetailsDrawer({
  unit,
  nowMs,
  onClose,
}: UnitDetailsDrawerProps) {
  const [drawerState, setDrawerState] =
    useState<DrawerState>("half");
  const [activeTab, setActiveTab] = useState<"status" | "reefer" | "info">("status");

  const tabs = useMemo(() => {
    const baseTabs: Array<{ id: "status" | "info"; label: string }> = [
      { id: "status", label: "Estado" },
      { id: "info", label: "Info" },
    ];
    return unit.hasCan
      ? [
        ...baseTabs.slice(0, 1),
        { id: "reefer" as const, label: "Reefer" },
        ...baseTabs.slice(1),
      ]
      : baseTabs;
  }, [unit.hasCan]);

  useEffect(() => {
    setActiveTab("status");
  }, [unit.id]);

  useEffect(() => {
    if (activeTab === "reefer" && !unit.hasCan) {
      setActiveTab("status");
    }
  }, [activeTab, unit.hasCan]);

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
      {/* Header Bar with Tabs */}
      <div className="h-14 flex items-center justify-between px-6 shrink-0 bg-white border-b border-gray-100">
        {/* Tabs - Only visible when not minimized */}
        {drawerState !== "minimized" ? (
          <nav className="flex gap-6 h-full items-center">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(tab.id as typeof activeTab)
                }
                className={`relative text-xs font-normal px-1 transition-colors h-full flex items-center gap-1.5 ${activeTab === tab.id
                  ? "text-primary font-medium"
                  : "text-gray-500 hover:text-gray-900"
                  }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </nav>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-900 font-medium">
              Unidad seleccionada:
            </span>
            <span className="text-xs text-primary font-medium">
              {unit.unit}
            </span>
          </div>
        )}

        {/* Control buttons */}
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

      {/* Content - Only visible when not minimized */}
      {drawerState !== "minimized" && (
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "status" && (
            <StatusTab unit={unit} nowMs={nowMs} />
          )}

          {activeTab === "reefer" && (
            <ReeferTab unit={unit} />
          )}

          {activeTab === "info" && (
            <InfoTab
              driver={unit.driver}
              driverId={unit.driverId}
              driverPhone={unit.driverPhone}
              driverEmail={unit.driverEmail}
              driverLicenseNumber={unit.driverLicenseNumber}
            />
          )}
        </div>
      )}
    </div>
  );
}
