import { create } from 'zustand';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface AppState {
  // Autenticación
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;

  // UI
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  toggleSidebar: () => void;

  // Breadcrumbs
  breadcrumbsState: Record<string, BreadcrumbItem[]>;
  setBreadcrumbs: (view: string, breadcrumbs: BreadcrumbItem[]) => void;
  clearBreadcrumbs: (view: string) => void;

  // Reset trigger para resetear vistas
  resetTrigger: number;
  incrementResetTrigger: () => void;

  // Tabs activos
  transportistasActiveTab: string;
  setTransportistasActiveTab: (tab: string) => void;
  
  settingsActiveTab: string;
  setSettingsActiveTab: (tab: string) => void;

  // Handlers de creación por ruta
  createHandlers: Record<string, () => void>;
  registerCreateHandler: (route: string, handler: () => void) => void;
  triggerCreate: (route: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Autenticación
  isAuthenticated: true,
  setIsAuthenticated: (value) => set({ isAuthenticated: value }),

  // UI
  sidebarCollapsed: true,
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // Breadcrumbs
  breadcrumbsState: {},
  setBreadcrumbs: (view, breadcrumbs) =>
    set((state) => ({
      breadcrumbsState: { ...state.breadcrumbsState, [view]: breadcrumbs },
    })),
  clearBreadcrumbs: (view) =>
    set((state) => {
      const newState = { ...state.breadcrumbsState };
      delete newState[view];
      return { breadcrumbsState: newState };
    }),

  // Reset trigger
  resetTrigger: 0,
  incrementResetTrigger: () =>
    set((state) => ({ resetTrigger: state.resetTrigger + 1 })),

  // Tabs activos
  transportistasActiveTab: 'todos',
  setTransportistasActiveTab: (tab) => set({ transportistasActiveTab: tab }),

  settingsActiveTab: 'usuarios',
  setSettingsActiveTab: (tab) => set({ settingsActiveTab: tab }),

  // Handlers de creación
  createHandlers: {},
  registerCreateHandler: (route, handler) =>
    set((state) => ({
      createHandlers: { ...state.createHandlers, [route]: handler },
    })),
  triggerCreate: (route) => {
    const handler = useAppStore.getState().createHandlers[route];
    if (handler) {
      handler();
    }
  },
}));

