# Tech Stack Rules – Required Libraries

## Librerías Obligatorias del Proyecto

Este proyecto utiliza un stack tecnológico específico y **DEBES usar estas librerías** en lugar de alternativas o implementaciones desde cero.

### ⚠️ Estándar de Estilos: Tailwind CSS v4 (CSS-First)
El proyecto usa **Tailwind CSS v4**. A diferencia de v3, la configuración es **CSS-First**:
- ❌ NO existe `tailwind.config.js`.
- ✅ Toda la configuración (temas, colores, variables) está en `src/styles/globals.css` usando `@theme`.
- ✅ Usa variables CSS nativas (`var(--primary)`) para interoperabilidad.

---

## 🎨 Componentes UI: shadcn/ui

### ✅ SIEMPRE usar componentes de shadcn/ui

**shadcn/ui** es la librería de componentes UI base del proyecto. Todos los componentes UI deben provenir de shadcn/ui.

### Componentes Disponibles

- **Form Components**: `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`, `FormDescription`
- **Input Components**: `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`
- **Layout Components**: `Card`, `Dialog`, `Sheet`, `Popover`, `DropdownMenu`, `Tabs`, `Accordion`
- **Feedback Components**: `Alert`, `AlertDialog`, `Toast` (via Sonner), `Progress`, `Skeleton`
- **Navigation Components**: `Breadcrumb`, `NavigationMenu`
- **Data Display**: `Table`, `Badge`, `Avatar`, `Separator`

### ✅ CORRECTO: Usar componentes shadcn
```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Título</CardTitle>
      </CardHeader>
      <CardContent>
        <Input placeholder="Escribe algo..." />
        <Button>Enviar</Button>
      </CardContent>
    </Card>
  );
}
```

### ❌ INCORRECTO: Crear componentes desde cero
```tsx
// ❌ NO hacer esto
function MyComponent() {
  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-xl font-bold">Título</h2>
      <input type="text" className="border p-2" />
      <button className="bg-blue-500 text-white px-4 py-2">Enviar</button>
    </div>
  );
}
```

### Instalación de Nuevos Componentes

Si necesitas un componente que no está instalado:
```bash
npx shadcn@latest add [component-name]
```

---

## 📝 Formularios: React Hook Form + Zod

### ✅ SIEMPRE usar React Hook Form para formularios

**React Hook Form** es obligatorio para todos los formularios. **Zod** es obligatorio para validación de esquemas.

### Estructura Requerida

1. **Definir schema con Zod**
2. **Usar `useForm` de React Hook Form**
3. **Integrar con `zodResolver`**
4. **Usar componentes Form de shadcn/ui**

### ✅ CORRECTO: Formulario completo
```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// 1. Definir schema con Zod
const userSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("El correo no es válido"),
});

type UserFormData = z.infer<typeof userSchema>;

function UserForm() {
  // 2. Usar useForm con zodResolver
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const onSubmit = (data: UserFormData) => {
    console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Guardar</Button>
      </form>
    </Form>
  );
}
```

### ❌ INCORRECTO: Usar useState o validación manual
```tsx
// ❌ NO hacer esto
function UserForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (name.length < 2) newErrors.name = "Nombre muy corto";
    if (!email.includes("@")) newErrors.email = "Email inválido";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // submit
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      {errors.name && <span>{errors.name}</span>}
      {/* ... */}
    </form>
  );
}
```

### Reglas de Validación

- **SIEMPRE** definir schemas con Zod antes de usar `useForm`
- **SIEMPRE** usar `zodResolver` para integrar Zod con React Hook Form
- **SIEMPRE** usar componentes `Form*` de shadcn/ui para campos de formulario
- **NUNCA** usar `useState` para manejar estado de formularios
- **NUNCA** hacer validación manual sin Zod

---

## 🗄️ Estado Global: Zustand

### ✅ SIEMPRE usar Zustand para estado compartido

**Zustand** es obligatorio para estado global que necesita ser compartido entre múltiples componentes.

### Cuándo Usar Zustand

- ✅ Estado compartido entre múltiples componentes
- ✅ Estado de UI global (sidebar, modals, etc.)
- ✅ Estado que persiste entre navegaciones
- ✅ Estado que necesita ser accedido desde diferentes features
- ✅ **Datos de entidades que se cargan desde servicios (cualquier useXxx hook)**
  - **RAZÓN**: Evita recargas innecesarias al navegar entre páginas
  - **RAZÓN**: Permite compartir datos entre múltiples componentes
  - **RAZÓN**: Mantiene una sola fuente de verdad

### Cuándo NO Usar Zustand

- ❌ Estado local a un componente → usar `useState`
- ❌ Estado de formularios → usar React Hook Form
- ❌ Estado de servidor → usar React Query o similar
- ❌ Estado de URL → usar React Router
- ❌ **Datos que solo se usan en un componente específico** → `useState` local

### ⚠️ REGLA CRÍTICA: Prevención de Re-renders y Recargas Innecesarias

**PRINCIPIO FUNDAMENTAL**: Los datos cargados deben persistir entre navegaciones y no recargarse innecesariamente. Esto aplica a TODA la aplicación, no solo a entidades específicas.

**SIEMPRE usar Zustand para hooks que:**
- Carguen datos desde servicios
- Se usen en múltiples componentes
- Necesiten persistir entre navegaciones

**Patrón universal requerido (aplicable a cualquier tipo de datos):**
```typescript
// ✅ CORRECTO: Hook con Zustand y cacheo inteligente (patrón universal)
export function useData(dependency: string) {
  // 1. Usar Zustand store (estado compartido y persistente)
  const data = useAppStore((state) => state.data)
  const isLoading = useAppStore((state) => state.dataLoading)
  const dataLoadedDependency = useAppStore((state) => state.dataLoadedDependency)
  const setData = useAppStore((state) => state.setData)
  const setDataLoading = useAppStore((state) => state.setDataLoading)
  const setDataLoadedDependency = useAppStore((state) => state.setDataLoadedDependency)

  // 2. Función de carga con cacheo inteligente
  const loadData = async (force = false) => {
    if (!dependency) {
      setData([])
      setDataLoadedDependency(null)
      return
    }

    // CACHEO: Solo recargar si la dependencia cambió o se fuerza
    if (!force && dataLoadedDependency === dependency && data.length > 0) {
      return // Ya cargado para esta dependencia, no recargar
    }

    try {
      setDataLoading(true)
      const result = await dataService.getAll(dependency)
      setData(result)
      setDataLoadedDependency(dependency) // Guardar dependencia cargada
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar los datos')
      setData([])
      setDataLoadedDependency(null)
    } finally {
      setDataLoading(false)
    }
  }

  // 3. Solo cargar si la dependencia cambió o no hay datos
  useEffect(() => {
    if (dependency && (dataLoadedDependency !== dependency || data.length === 0)) {
      loadData()
    } else if (!dependency) {
      setData([])
      setDataLoadedDependency(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependency, dataLoadedDependency, data.length])

  return { data, isLoading, loadData, ... }
}
```

**Pasos para implementar un nuevo hook con cacheo:**
1. Agregar estado en `useAppStore.ts`: `data`, `dataLoading`, `dataLoadedDependency`
2. Agregar setters: `setData`, `setDataLoading`, `setDataLoadedDependency`
3. Seguir el patrón de código mostrado arriba
4. **Implementar cacheo con `loadedDependency`** para evitar recargas innecesarias
5. **Verificar dependencia antes de recargar** (solo recargar si cambió o se fuerza)

**Nota**: `dependency` puede ser `orgId`, `userId`, `carrierId`, o cualquier identificador que determine qué datos cargar. El patrón es universal.

### ✅ CORRECTO: Usar Zustand store
```tsx
// stores/useAppStore.ts
import { create } from "zustand";

interface AppState {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: true,
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));

// En un componente
import { useAppStore } from "@/stores/useAppStore";

function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  
  return (
    <button onClick={toggleSidebar}>
      {sidebarCollapsed ? "Expandir" : "Colapsar"}
    </button>
  );
}
```

### ❌ INCORRECTO: Usar Context API o prop drilling
```tsx
// ❌ NO hacer esto para estado global simple
const AppContext = createContext();

function AppProvider({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  return (
    <AppContext.Provider value={{ sidebarCollapsed, setSidebarCollapsed }}>
      {children}
    </AppContext.Provider>
  );
}

// ❌ NO hacer prop drilling
function App({ sidebarCollapsed, setSidebarCollapsed }) {
  return <Layout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />;
}
```

### Mejores Prácticas con Zustand

1. **Selectores específicos**: Usar selectores para evitar re-renders innecesarios
```tsx
// ✅ Mejor: selector específico
const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);

// ❌ Evitar: acceder a todo el store
const { sidebarCollapsed } = useAppStore();
```

2. **useShallow para múltiples valores**:
```tsx
import { useShallow } from "zustand/react/shallow";

const { sidebarCollapsed, toggleSidebar } = useAppStore(
  useShallow((state) => ({
    sidebarCollapsed: state.sidebarCollapsed,
    toggleSidebar: state.toggleSidebar,
  }))
);
```

---

## 🛠️ Estándares del Service Layer: Soft Delete

Para mantener la integridad referencial y el historial de datos, el proyecto utiliza un patrón de **Soft Delete** (Borrado Lógico) por defecto para entidades principales y catálogos.

### Reglas del Soft Delete:
1. **Columna de Estado**: La tabla debe tener una columna `status` (`'Active' | 'Inactive'`) o `is_active` (`boolean`).
2. **Método en el Servicio**: El servicio debe implementar un método `softDelete`.
3. **UX**: Al "eliminar", el usuario debe recibir una confirmación de que el elemento se marcará como inactivo, no que se borrará permanentemente.

### ✅ CORRECTO: Implementación de Soft Delete
```typescript
// services/database/example.service.ts
async softDelete(id: string, orgId: string): Promise<void> {
  const { error } = await supabase
    .from('my_table')
    .update({ 
      status: 'Inactive', 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .eq('org_id', orgId);

  if (error) throw error;
}
```

---

## 📋 Checklist de Desarrollo

Antes de escribir código, verifica:

### Componentes UI
- [ ] ¿Estoy usando componentes de shadcn/ui?
- [ ] ¿Necesito instalar un nuevo componente de shadcn?
- [ ] ¿Estoy evitando crear componentes UI desde cero?

### Formularios
- [ ] ¿He definido el schema con Zod?
- [ ] ¿Estoy usando `useForm` de React Hook Form?
- [ ] ¿He integrado `zodResolver`?
- [ ] ¿Estoy usando componentes `Form*` de shadcn/ui?

### Estado Global
- [ ] ¿Este estado necesita ser compartido entre componentes?
- [ ] ¿Estoy usando Zustand para estado compartido?
- [ ] ¿Estoy usando `useState` solo para estado local?
- [ ] ¿He usado selectores específicos para optimizar re-renders?

---

## 🚫 Prohibiciones Explícitas

### NO usar estas alternativas:

- ❌ **NO usar** Material-UI, Ant Design, Chakra UI u otras librerías de componentes
- ❌ **NO usar** Formik, React Final Form u otras librerías de formularios
- ❌ **NO usar** Redux, MobX, Jotai u otras librerías de estado global
- ❌ **NO usar** Yup, Joi u otras librerías de validación
- ❌ **NO crear** componentes UI desde cero si existe en shadcn/ui
- ❌ **NO usar** `useState` para formularios complejos
- ❌ **NO usar** Context API para estado global simple

---

## 📚 Referencias

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)

---

## 🎯 Resumen

| Necesidad | Librería a Usar |
|-----------|----------------|
| Componentes UI | **shadcn/ui** |
| Formularios | **React Hook Form** |
| Validación | **Zod** |
| Estado Global | **Zustand** |
| Estado Local | `useState` (React) |
| Estado de URL | React Router |

**Recuerda: Este stack es obligatorio. No uses alternativas sin justificación técnica clara y aprobación del equipo.**


