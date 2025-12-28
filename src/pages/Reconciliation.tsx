import { PageHeader } from "../layouts/PageHeader";
import { Button } from "../components/ui/Button";
import { Filter, Calendar, ChevronDown, Pencil, Trash2, FileText, DollarSign } from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/Badge";
import { DataTable } from "../components/widgets/DataTable/DataTable";
import { DataTableColumn } from "../components/widgets/DataTable/types";

const mockConciliaciones = [
  {
    id: "CONC-001",
    transportista: "Transportes Fríos S.A.",
    ruc: "20123456789",
    viajes: 28,
    montoTotal: 45680.50,
    periodo: "01/11 - 15/11/2024",
    fechaSolicitud: "16/11/2024",
    estado: "Pendiente",
    documentos: 28,
    auditor: "María González",
    tempCompliance: "99%"
  },
  {
    id: "CONC-002",
    transportista: "LogiCold Express",
    ruc: "20987654321",
    viajes: 15,
    montoTotal: 22340.00,
    periodo: "01/11 - 15/11/2024",
    fechaSolicitud: "16/11/2024",
    estado: "Pendiente",
    documentos: 15,
    auditor: "Juan Pérez",
    tempCompliance: "98%"
  },
  {
    id: "CONC-003",
    transportista: "Refrigerados del Norte",
    ruc: "20456789123",
    viajes: 42,
    montoTotal: 68950.75,
    periodo: "01/11 - 15/11/2024",
    fechaSolicitud: "15/11/2024",
    estado: "En Auditoría",
    documentos: 42,
    auditor: "María González",
    tempCompliance: "97%"
  },
  {
    id: "CONC-004",
    transportista: "Cadena Fría Perú",
    ruc: "20789123456",
    viajes: 19,
    montoTotal: 31250.00,
    periodo: "01/11 - 15/11/2024",
    fechaSolicitud: "17/11/2024",
    estado: "Pendiente",
    documentos: 19,
    auditor: "Carlos Ruiz",
    tempCompliance: "100%"
  },
  {
    id: "CONC-005",
    transportista: "TransCool Logistics",
    ruc: "20321654987",
    viajes: 35,
    montoTotal: 54820.25,
    periodo: "16/10 - 31/10/2024",
    fechaSolicitud: "01/11/2024",
    estado: "Observado",
    documentos: 35,
    auditor: "Ana Torres",
    tempCompliance: "96%"
  },
  {
    id: "CONC-006",
    transportista: "Frigorífico Express SAC",
    ruc: "20147258369",
    viajes: 52,
    montoTotal: 87640.00,
    periodo: "16/10 - 31/10/2024",
    fechaSolicitud: "01/11/2024",
    estado: "Aprobado",
    documentos: 52,
    auditor: "María González",
    tempCompliance: "100%"
  },
  {
    id: "CONC-007",
    transportista: "Polar Express Logistics",
    ruc: "20234567890",
    viajes: 31,
    montoTotal: 49320.00,
    periodo: "01/11 - 15/11/2024",
    fechaSolicitud: "16/11/2024",
    estado: "Pendiente",
    documentos: 31,
    auditor: "Juan Pérez",
    tempCompliance: "98%"
  },
  {
    id: "CONC-008",
    transportista: "IceRoad Transport",
    ruc: "20345678901",
    viajes: 24,
    montoTotal: 38450.50,
    periodo: "01/11 - 15/11/2024",
    fechaSolicitud: "17/11/2024",
    estado: "Pendiente",
    documentos: 24,
    auditor: "Carlos Ruiz",
    tempCompliance: "95%"
  },
  {
    id: "CONC-009",
    transportista: "FreezeFleet Services",
    ruc: "20456789012",
    viajes: 38,
    montoTotal: 61280.00,
    periodo: "16/10 - 31/10/2024",
    fechaSolicitud: "02/11/2024",
    estado: "Aprobado",
    documentos: 38,
    auditor: "Ana Torres",
    tempCompliance: "97%"
  },
  {
    id: "CONC-010",
    transportista: "CryoLogistics Group",
    ruc: "20567890123",
    viajes: 45,
    montoTotal: 72150.75,
    periodo: "16/10 - 31/10/2024",
    fechaSolicitud: "01/11/2024",
    estado: "Aprobado",
    documentos: 45,
    auditor: "María González",
    tempCompliance: "99%"
  },
  {
    id: "CONC-011",
    transportista: "Arctic Transport Inc",
    ruc: "20678901234",
    viajes: 29,
    montoTotal: 46890.00,
    periodo: "01/11 - 15/11/2024",
    fechaSolicitud: "16/11/2024",
    estado: "Pendiente",
    documentos: 29,
    auditor: "Juan Pérez",
    tempCompliance: "97%"
  },
  {
    id: "CONC-012",
    transportista: "TempGuard Freight",
    ruc: "20789012345",
    viajes: 36,
    montoTotal: 58240.25,
    periodo: "01/11 - 15/11/2024",
    fechaSolicitud: "17/11/2024",
    estado: "Pendiente",
    documentos: 36,
    auditor: "Carlos Ruiz",
    tempCompliance: "100%"
  },
  {
    id: "CONC-013",
    transportista: "Glacier Hauling Co",
    ruc: "20890123456",
    viajes: 27,
    montoTotal: 42670.50,
    periodo: "01/11 - 15/11/2024",
    fechaSolicitud: "18/11/2024",
    estado: "Pendiente",
    documentos: 27,
    auditor: "Ana Torres",
    tempCompliance: "96%"
  },
  {
    id: "CONC-014",
    transportista: "ChillStream Carriers",
    ruc: "20901234567",
    viajes: 33,
    montoTotal: 53120.00,
    periodo: "16/10 - 31/10/2024",
    fechaSolicitud: "03/11/2024",
    estado: "Observado",
    documentos: 33,
    auditor: "María González",
    tempCompliance: "94%"
  },
  {
    id: "CONC-015",
    transportista: "FrostLine Logistics",
    ruc: "20012345678",
    viajes: 41,
    montoTotal: 65830.75,
    periodo: "16/10 - 31/10/2024",
    fechaSolicitud: "02/11/2024",
    estado: "Aprobado",
    documentos: 41,
    auditor: "Juan Pérez",
    tempCompliance: "98%"
  },
  {
    id: "CONC-016",
    transportista: "ColdChain Express LLC",
    ruc: "20123450987",
    viajes: 48,
    montoTotal: 77280.00,
    periodo: "16/10 - 31/10/2024",
    fechaSolicitud: "01/11/2024",
    estado: "Aprobado",
    documentos: 48,
    auditor: "Carlos Ruiz",
    tempCompliance: "98%"
  },
  {
    id: "CONC-017",
    transportista: "Transportes Fríos S.A.",
    ruc: "20123456789",
    viajes: 39,
    montoTotal: 62570.25,
    periodo: "16/10 - 31/10/2024",
    fechaSolicitud: "02/11/2024",
    estado: "Aprobado",
    documentos: 39,
    auditor: "Ana Torres",
    tempCompliance: "99%"
  },
  {
    id: "CONC-018",
    transportista: "LogiCold Express",
    ruc: "20987654321",
    viajes: 22,
    montoTotal: 35480.50,
    periodo: "16/10 - 31/10/2024",
    fechaSolicitud: "03/11/2024",
    estado: "Aprobado",
    documentos: 22,
    auditor: "María González",
    tempCompliance: "98%"
  },
  {
    id: "CONC-019",
    transportista: "Refrigerados del Norte",
    ruc: "20456789123",
    viajes: 34,
    montoTotal: 54760.00,
    periodo: "01/11 - 15/11/2024",
    fechaSolicitud: "18/11/2024",
    estado: "Pendiente",
    documentos: 34,
    auditor: "Juan Pérez",
    tempCompliance: "97%"
  },
  {
    id: "CONC-020",
    transportista: "Cadena Fría Perú",
    ruc: "20789123456",
    viajes: 26,
    montoTotal: 41890.75,
    periodo: "16/10 - 31/10/2024",
    fechaSolicitud: "04/11/2024",
    estado: "En Auditoría",
    documentos: 26,
    auditor: "Carlos Ruiz",
    tempCompliance: "100%"
  },
  {
    id: "CONC-021",
    transportista: "TransCool Logistics",
    ruc: "20321654987",
    viajes: 30,
    montoTotal: 48320.00,
    periodo: "01/11 - 15/11/2024",
    fechaSolicitud: "19/11/2024",
    estado: "Pendiente",
    documentos: 30,
    auditor: "Ana Torres",
    tempCompliance: "96%"
  },
  {
    id: "CONC-022",
    transportista: "Frigorífico Express SAC",
    ruc: "20147258369",
    viajes: 37,
    montoTotal: 59680.50,
    periodo: "01/11 - 15/11/2024",
    fechaSolicitud: "17/11/2024",
    estado: "Pendiente",
    documentos: 37,
    auditor: "María González",
    tempCompliance: "100%"
  },
  {
    id: "CONC-023",
    transportista: "Polar Express Logistics",
    ruc: "20234567890",
    viajes: 43,
    montoTotal: 69230.25,
    periodo: "16/10 - 31/10/2024",
    fechaSolicitud: "02/11/2024",
    estado: "Aprobado",
    documentos: 43,
    auditor: "Juan Pérez",
    tempCompliance: "98%"
  },
  {
    id: "CONC-024",
    transportista: "IceRoad Transport",
    ruc: "20345678901",
    viajes: 25,
    montoTotal: 40150.00,
    periodo: "01/11 - 15/11/2024",
    fechaSolicitud: "20/11/2024",
    estado: "Pendiente",
    documentos: 25,
    auditor: "Carlos Ruiz",
    tempCompliance: "95%"
  },
  {
    id: "CONC-025",
    transportista: "FreezeFleet Services",
    ruc: "20456789012",
    viajes: 32,
    montoTotal: 51520.75,
    periodo: "16/10 - 31/10/2024",
    fechaSolicitud: "05/11/2024",
    estado: "Observado",
    documentos: 32,
    auditor: "Ana Torres",
    tempCompliance: "97%"
  }
];

export function Reconciliation() {
  const [activeTab, setActiveTab] = useState("pendientes");

  const getFilteredData = () => {
    switch (activeTab) {
      case "pendientes":
        return mockConciliaciones.filter(item => item.estado === "Pendiente");
      case "auditoria":
        return mockConciliaciones.filter(item => item.estado === "En Auditoría");
      case "observados":
        return mockConciliaciones.filter(item => item.estado === "Observado");
      case "aprobados":
        return mockConciliaciones.filter(item => item.estado === "Aprobado");
      default:
        return mockConciliaciones;
    }
  };

  const filteredData = getFilteredData();

  // Definir columnas
  const columns: DataTableColumn<typeof mockConciliaciones[0]>[] = [
    {
      key: "id",
      header: "ID Conciliación",
      render: (item) => (
        <a href="#" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
          {item.id}
        </a>
      ),
    },
    {
      key: "transportista",
      header: "Transportista",
      render: (item) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-gray-900">{item.transportista}</span>
          <span className="text-xs text-gray-500">{item.documentos} documentos</span>
        </div>
      ),
    },
    {
      key: "ruc",
      header: "RUC",
      render: (item) => (
        <span className="text-xs text-gray-900">{item.ruc}</span>
      ),
    },
    {
      key: "viajes",
      header: "Viajes",
      render: (item) => (
        <div className="flex justify-center">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
            {item.viajes}
          </Badge>
        </div>
      ),
    },
    {
      key: "montoTotal",
      header: "Monto Total",
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <DollarSign className="w-3 h-3 text-green-600" />
          <span className="text-sm text-gray-900">
            {item.montoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      ),
    },
    {
      key: "periodo",
      header: "Período",
      render: (item) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-900">{item.periodo}</span>
          <span className="text-xs text-gray-500">Sol: {item.fechaSolicitud}</span>
        </div>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (item) => (
        <Badge 
          className={
            item.estado === "Pendiente" ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 text-xs" :
            item.estado === "En Auditoría" ? "bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs" :
            item.estado === "Observado" ? "bg-red-100 text-red-700 hover:bg-red-100 text-xs" :
            "bg-green-100 text-green-700 hover:bg-green-100 text-xs"
          }
        >
          {item.estado}
        </Badge>
      ),
    },
    {
      key: "auditor",
      header: "Auditor",
      render: (item) => (
        <span className="text-xs text-gray-900">{item.auditor}</span>
      ),
    },
    {
      key: "tempCompliance",
      header: "Temp",
      render: (item) => (
        <span className="text-xs text-gray-900">{item.tempCompliance}</span>
      ),
    },
  ];

  // Definir acciones individuales
  const actions = [
    {
      icon: <Pencil className="w-3.5 h-3.5 text-gray-600" />,
      title: "Editar",
      onClick: (item: typeof mockConciliaciones[0]) => console.log("Edit conciliación:", item.id),
    },
    {
      icon: <Trash2 className="w-3.5 h-3.5 text-red-600" />,
      title: "Eliminar",
      onClick: (item: typeof mockConciliaciones[0]) => console.log("Delete conciliación:", item.id),
    },
  ];

  // Definir acciones masivas
  const bulkActions = [
    {
      icon: <Trash2 className="w-4 h-4" />,
      label: "Eliminar",
      variant: "destructive" as const,
      onClick: (selectedIds: string[]) => {
        console.log("Delete conciliaciones:", selectedIds);
      },
    },
    ...(activeTab === "pendientes" ? [
      {
        icon: <FileText className="w-4 h-4" />,
        label: "Enviar a Auditoría",
        variant: "default" as const,
        onClick: (selectedIds: string[]) => {
          console.log("Enviar a Auditoría:", selectedIds);
        },
      },
    ] : []),
  ];

  const getFiltersForTab = () => {
    switch (activeTab) {
      case "pendientes":
        return (
          <>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="w-4 h-4" />
              Período
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              Transportista
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              Estado
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </>
        );
      case "auditoria":
        return (
          <>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="w-4 h-4" />
              Fecha
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              Auditor
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              Prioridad
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </>
        );
      case "observados":
        return (
          <>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="w-4 h-4" />
              Período
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              Tipo Observación
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              Responsable
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </>
        );
      case "aprobados":
        return (
          <>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="w-4 h-4" />
              Período
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              Transportista
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              Monto
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </>
        );
      default:
        return null;
    }
  };

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case "pendientes":
        return "Buscar pendientes...";
      case "auditoria":
        return "Buscar en auditoría...";
      case "observados":
        return "Buscar observados...";
      case "aprobados":
        return "Buscar aprobados...";
      default:
        return "Buscar...";
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        tabs={[
          { id: "pendientes", label: "Pendientes", active: activeTab === "pendientes", onClick: () => setActiveTab("pendientes"), badge: 24 },
          { id: "auditoria", label: "Auditoría", active: activeTab === "auditoria", onClick: () => setActiveTab("auditoria"), badge: 8 },
          { id: "observados", label: "Observados", active: activeTab === "observados", onClick: () => setActiveTab("observados"), badge: 5 },
          { id: "aprobados", label: "Aprobados", active: activeTab === "aprobados", onClick: () => setActiveTab("aprobados"), badge: 142 },
        ]}
        showSearch
        searchPlaceholder={getSearchPlaceholder()}
        filters={getFiltersForTab()}
      />
      
      <DataTable
        data={filteredData}
        columns={columns}
        getRowId={(item) => item.id}
        actions={actions}
        bulkActions={bulkActions}
        itemsPerPage={10}
        emptyMessage="No hay conciliaciones disponibles"
        totalLabel="conciliaciones"
      />
    </div>
  );
}
