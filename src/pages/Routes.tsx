import { PageHeader } from "../layouts/PageHeader";
import { Button } from "../components/ui/Button";
import { Filter, ArrowRight, Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/Badge";
import { DataTable } from "../components/widgets/DataTable/DataTable";
import type { DataTableColumn, DataTableAction, DataTableBulkAction } from "../components/widgets/DataTable/types";

const mockRoutes = [
  {
    id: "RUT-001",
    name: "Planta-FAE → NCD-LPZ",
    origin: "Planta-FAE",
    destination: "NCD-LPZ",
    distance: "578 km",
    duration: "10h 15m",
    carrier: "ColdChain Express",
    frequency: "Diaria",
    status: "Activa",
    lastUpdate: "2025-11-27",
    stops: 0
  },
  {
    id: "RUT-002",
    name: "Planta-PI → NCD-LPZ",
    origin: "Planta-PI",
    destination: "NCD-LPZ",
    distance: "562 km",
    duration: "9h 45m",
    carrier: "Arctic Transport",
    frequency: "3x Semana",
    status: "Activa",
    lastUpdate: "2025-11-27",
    stops: 0
  }
];

export function Routes() {
  const [activeTab, setActiveTab] = useState("activas");

  // Definir columnas para DataTable
  const routesColumns: DataTableColumn<typeof mockRoutes[0]>[] = [
    {
      key: "name",
      header: "Ruta",
      render: (item) => (
        <div className="flex flex-col gap-0.5">
          <a href="#" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
            {item.name}
          </a>
          <span className="text-xs text-gray-500">{item.id}</span>
        </div>
      )
    },
    {
      key: "origin",
      header: "Origen → Destino",
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-900">{item.origin}</span>
          <ArrowRight className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-900">{item.destination}</span>
        </div>
      )
    },
    {
      key: "distance",
      header: "Distancia",
      render: (item) => (
        <span className="text-xs text-gray-900">{item.distance}</span>
      )
    },
    {
      key: "duration",
      header: "Duración",
      render: (item) => (
        <span className="text-xs text-gray-900">{item.duration}</span>
      )
    },
    {
      key: "carrier",
      header: "Transportista",
      render: (item) => (
        <span className="text-xs text-gray-900">{item.carrier}</span>
      )
    },
    {
      key: "frequency",
      header: "Frecuencia",
      render: (item) => (
        <span className="text-xs text-gray-900">{item.frequency}</span>
      )
    },
    {
      key: "status",
      header: "Estado",
      render: (item) => (
        <Badge 
          variant="default"
          className={
            item.status === "Activa" ? "bg-green-100 text-green-700 hover:bg-green-100 text-xs" :
            item.status === "Planeada" ? "bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs" :
            "bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs"
          }
        >
          {item.status}
        </Badge>
      )
    },
    {
      key: "stops",
      header: "Paradas",
      render: (item) => (
        <span className="text-xs text-gray-900">{item.stops}</span>
      )
    }
  ];

  const routesActions: DataTableAction<typeof mockRoutes[0]>[] = [
    {
      icon: <Pencil className="w-3.5 h-3.5 text-gray-600" />,
      onClick: (route) => console.log("Edit route:", route.id),
      title: "Editar"
    },
    {
      icon: <Trash2 className="w-3.5 h-3.5 text-red-600" />,
      onClick: (route) => console.log("Delete route:", route.id),
      variant: "destructive",
      title: "Eliminar"
    }
  ];

  const routesBulkActions: DataTableBulkAction[] = [
    {
      label: "Eliminar",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (selectedIds) => console.log("Delete routes:", selectedIds),
      variant: "destructive"
    }
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        tabs={[
          { id: "activas", label: "Activas", active: activeTab === "activas", onClick: () => setActiveTab("activas") },
          { id: "inactivas", label: "Inactivas", active: activeTab === "inactivas", onClick: () => setActiveTab("inactivas") },
        ]}
        showSearch
        searchPlaceholder="Buscar rutas..."
        filters={
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        }
      />
      
      <DataTable
        data={mockRoutes}
        columns={routesColumns}
        getRowId={(item) => item.id}
        actions={routesActions}
        bulkActions={routesBulkActions}
        itemsPerPage={10}
        emptyMessage="No hay rutas para mostrar"
      />
    </div>
  );
}