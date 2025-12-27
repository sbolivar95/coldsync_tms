import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '../stores/useAppStore';
import { PrimaryButton } from '../components/widgets/PrimaryButton';
import { SecondaryButton } from '../components/widgets/SecondaryButton';
import { Button } from '../components/ui/Button';
import { Plus, MoreHorizontal } from 'lucide-react';
import { DispatchRef } from '../pages/Dispatch';
import { SettingsRef } from '../pages/Settings';
import { LocationsRef } from '../pages/LocationsWrapper';
import { RoutesRef } from '../pages/RoutesWrapper';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

// Mapeo de rutas a configuración de vista
const viewConfig: Record<string, {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  dropdown?: { label: string };
  createLabel?: string;
  secondaryCreateLabel?: string;
}> = {
  '/dashboard': {
    title: 'Panel de Control',
    createLabel: 'Crear Reporte',
  },
  '/dispatch': {
    title: 'Despacho',
    createLabel: 'Importar Orden',
    secondaryCreateLabel: 'Crear Orden',
  },
  '/control-tower': {
    title: 'Torre de Control',
    createLabel: 'Crear Orden',
  },
  '/financials': {
    title: 'Conciliación',
    createLabel: 'Nueva Factura',
  },
  '/carriers': {
    title: 'Transportistas',
    createLabel: 'Agregar Transportista',
  },
  '/locations': {
    title: 'Ubicaciones',
    createLabel: 'Agregar Ubicación',
  },
  '/routes': {
    title: 'Rutas',
    createLabel: 'Crear Ruta',
  },
  '/alerts': {
    title: 'Alertas',
    createLabel: 'Configurar Alerta',
  },
  '/settings': {
    title: 'Configuración',
  },
  '/profile': {
    title: 'Perfil de Usuario',
  },
};

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    sidebarCollapsed,
    toggleSidebar,
    breadcrumbsState,
    incrementResetTrigger,
    transportistasActiveTab,
    settingsActiveTab,
  } = useAppStore();

  // Refs para componentes con métodos imperativos
  const despachoRef = useRef<DispatchRef>(null);
  const settingsRef = useRef<SettingsRef>(null);
  const ubicacionesRef = useRef<LocationsRef>(null);
  const rutasRef = useRef<RoutesRef>(null);

  // Obtener breadcrumbs dinámicos si existen
  const dynamicBreadcrumbs = breadcrumbsState[location.pathname] || [];

  // Obtener el label del botón según el contexto
  let createLabel = viewConfig[location.pathname]?.createLabel;
  if (location.pathname === '/settings') {
    // Cambiar el label según el tab activo de Settings
    switch (settingsActiveTab) {
      case 'usuarios':
        createLabel = 'Agregar Usuario';
        break;
      case 'productos':
        createLabel = 'Agregar Producto';
        break;
      case 'perfil-termico':
        createLabel = 'Crear Perfil';
        break;
      case 'peso-capacidad':
        createLabel = 'Agregar Peso/Capacidad';
        break;
    }
  }

  if (location.pathname === '/carriers') {
    // Cambiar el label según el tab activo de Transportistas (cuando está en Fleet)
    switch (transportistasActiveTab) {
      case 'vehiculos':
        createLabel = 'Nuevo Vehículo';
        break;
      case 'conductores':
        createLabel = 'Nuevo Conductor';
        break;
      case 'remolques':
        createLabel = 'Nuevo Remolque';
        break;
      case 'hardware':
        createLabel = 'Nueva Conexión';
        break;
      case 'asignaciones':
        createLabel = 'Nueva Asignación';
        break;
      case 'todos':
      case 'activos':
      case 'inactivos':
        createLabel = 'Agregar Transportista';
        break;
    }
  }

  const config = {
    ...viewConfig[location.pathname],
    createLabel,
    breadcrumbs: dynamicBreadcrumbs.length > 0 ? dynamicBreadcrumbs : viewConfig[location.pathname]?.breadcrumbs,
  };

  const handleTitleClick = () => {
    // Limpiar breadcrumbs y volver a la lista
    useAppStore.getState().setBreadcrumbs(location.pathname, []);
    // Incrementar el trigger para notificar al wrapper
    incrementResetTrigger();
  };

  const handleViewChange = (view: string) => {
    // Limpiar breadcrumbs de la vista anterior
    useAppStore.getState().setBreadcrumbs(location.pathname, []);
    // Incrementar el trigger para resetear al nivel principal
    incrementResetTrigger();
    // Navegar a la nueva vista (asegurar que empiece con /)
    const route = view.startsWith('/') ? view : `/${view}`;
    navigate(route);
  };

  const handleCreateClick = () => {
    const { triggerCreate } = useAppStore.getState();
    triggerCreate(location.pathname);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        activeView={location.pathname}
        onViewChange={handleViewChange}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={config.title || 'ColdSync'}
          breadcrumbs={config.breadcrumbs}
          dropdown={config.dropdown}
          onTitleClick={config.breadcrumbs && config.breadcrumbs.length > 0 ? handleTitleClick : undefined}
          actions={
            <>
              {config.createLabel && !config.secondaryCreateLabel && (
                <PrimaryButton icon={Plus} onClick={handleCreateClick}>
                  {config.createLabel}
                </PrimaryButton>
              )}
              {config.createLabel && config.secondaryCreateLabel && (
                <SecondaryButton icon={Plus} onClick={handleCreateClick}>
                  {config.createLabel}
                </SecondaryButton>
              )}
              {config.secondaryCreateLabel && (
                <PrimaryButton icon={Plus} onClick={handleCreateClick}>
                  {config.secondaryCreateLabel}
                </PrimaryButton>
              )}
              {(config.createLabel || config.secondaryCreateLabel) && (
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              )}
            </>
          }
        />

        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

