import { PageHeader } from "../layouts/PageHeader";
import { Button } from "../components/ui/Button";
import { Filter } from "lucide-react";
import { useState } from "react";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("resumen");

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        tabs={[
          { id: "resumen", label: "Resumen", active: activeTab === "resumen", onClick: () => setActiveTab("resumen") },
          { id: "analytics", label: "Análisis", active: activeTab === "analytics", onClick: () => setActiveTab("analytics") },
          { id: "reportes", label: "Reportes", active: activeTab === "reportes", onClick: () => setActiveTab("reportes") },
        ]}
        showSearch
        searchPlaceholder="Buscar en panel..."
        filters={
          <>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </>
        }
      />
      
      <div className="flex-1 p-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-gray-900 mb-2">Panel de Control</h2>
            <p className="text-gray-600">Esta sección está en desarrollo</p>
          </div>
        </div>
      </div>
    </div>
  );
}