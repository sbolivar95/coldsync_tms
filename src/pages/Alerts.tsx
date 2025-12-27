import { PageHeader } from "../layouts/PageHeader";
import { Button } from "../components/ui/Button";
import { Filter } from "lucide-react";
import { useState } from "react";

export function Alerts() {
  const [activeTab, setActiveTab] = useState("activas");

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        tabs={[
          { id: "activas", label: "Activas", active: activeTab === "activas", onClick: () => setActiveTab("activas") },
          { id: "reconocidas", label: "Reconocidas", active: activeTab === "reconocidas", onClick: () => setActiveTab("reconocidas") },
          { id: "resueltas", label: "Resueltas", active: activeTab === "resueltas", onClick: () => setActiveTab("resueltas") },
        ]}
        showSearch
        searchPlaceholder="Buscar alertas..."
        filters={
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        }
      />
      
      <div className="flex-1 p-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-gray-900 mb-2">Alertas</h2>
            <p className="text-gray-600">Esta sección está en desarrollo</p>
          </div>
        </div>
      </div>
    </div>
  );
}