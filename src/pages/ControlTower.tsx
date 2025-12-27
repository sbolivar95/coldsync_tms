import { PageHeader } from "../layouts/PageHeader";
import { Button } from "../components/ui/Button";
import { Filter, ChevronDown } from "lucide-react";
import { useState } from "react";
import { TrackingView } from "../features/control-tower/TrackingView";

export function ControlTower() {
  const [activeTab, setActiveTab] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        tabs={[
          { 
            id: "todos", 
            label: "Todos", 
            active: activeTab === "todos", 
            onClick: () => setActiveTab("todos"),
            badge: 89 
          },
          { 
            id: "programado", 
            label: "Programado", 
            active: activeTab === "programado", 
            onClick: () => setActiveTab("programado"),
            badge: 12 
          },
          { 
            id: "excursion-termica", 
            label: "Excursión Térmica", 
            active: activeTab === "excursion-termica", 
            onClick: () => setActiveTab("excursion-termica"),
            badge: 3 
          },
          { 
            id: "en-origen", 
            label: "En Origen", 
            active: activeTab === "en-origen", 
            onClick: () => setActiveTab("en-origen"),
            badge: 8 
          },
          { 
            id: "en-ruta", 
            label: "En Ruta", 
            active: activeTab === "en-ruta", 
            onClick: () => setActiveTab("en-ruta"),
            badge: 45 
          },
          { 
            id: "en-destino", 
            label: "En Destino", 
            active: activeTab === "en-destino", 
            onClick: () => setActiveTab("en-destino"),
            badge: 6 
          },
          { 
            id: "retrasado", 
            label: "Retrasado", 
            active: activeTab === "retrasado", 
            onClick: () => setActiveTab("retrasado"),
            badge: 11 
          },
          { 
            id: "finalizado", 
            label: "Finalizado", 
            active: activeTab === "finalizado", 
            onClick: () => setActiveTab("finalizado"),
            badge: 4 
          },
        ]}
        showSearch
        searchPlaceholder="Buscar unidad, conductor, ubicación..."
        onSearch={setSearchQuery}
        filters={
          <>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Estado
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              Transportista
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              Tipo de Vehículo
              <ChevronDown className="w-4 h-4" />
            </Button>
          </>
        }
      />
      
      <div className="flex-1 overflow-hidden">
        <TrackingView searchQuery={searchQuery} />
      </div>
    </div>
  );
}