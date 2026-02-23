# Navegación y Breadcrumbs

## Sistema de Breadcrumbs

El componente `Header.tsx` maneja los breadcrumbs con navegación tipo tabs.

**Características:**

- ✅ Nivel actual: negro, no clickeable
- ✅ Niveles anteriores: gris, clickeables
- ✅ Separador: `›`
- ✅ Título clickeable cuando hay breadcrumbs

**Interfaz:**

```tsx
interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface HeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  onTitleClick?: () => void;
}
```

## Tipos de Navegación

### Tipo A: Navegación Simple

**Sin breadcrumbs, sin navegación profunda**

**Secciones:** Dashboard, Alertas, Settings (con tabs), Perfil

**Características:**

- No hay breadcrumbs
- Todo el contenido se muestra en una sola vista
- Pueden tener tabs para organizar contenido

---

### Tipo B: Navegación con Detalle

**Lista → Detalle con breadcrumbs simples**

**Secciones:** Despacho, Conciliación

**Patrón:**

```
Lista → Detalle
Transportistas → ColdChain Express
```

**Implementación:**

```tsx
// Wrapper Component
export function SeccionWrapper({ onBreadcrumbChange }) {
  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedItem, setSelectedItem] = useState(null);

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setView("detail");
    onBreadcrumbChange?.([{ label: item.name }]);
  };

  const handleBack = () => {
    setView("list");
    onBreadcrumbChange?.([]);
  };

  if (view === "detail") {
    return <ItemDetail item={selectedItem} onBack={handleBack} />;
  }

  return <ItemList onSelectItem={handleSelectItem} />;
}
```

---

### Tipo C: Navegación Multi-Nivel

**Lista → Detalle → Sub-secciones con tabs**

**Secciones:** Transportistas, Ubicaciones, Rutas

**Patrón:**

```
Lista → Detalle → Tab
Transportistas → ColdChain Express → Documentos
```

**Breadcrumbs generados:**

```tsx
Transportistas › ColdChain Express › Documentos
    ↑ vuelve        ↑ vuelve          ↑ actual (tab)
```

**Implementación:**

```tsx
// Detail Component con Tabs
export function ItemDetail({ item, onBack }) {
  const [activeTab, setActiveTab] = useState("info");

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="docs">Documentos</TabsTrigger>
        </TabsList>
      </Tabs>
      <TabsContent value="info">...</TabsContent>
    </div>
  );
}
```

---

### Tipo D: Navegación Anidada Cross-Sección 🆕

**Navegación entre secciones diferentes con filtrado**

**Implementación actual:** Transportistas → Fleet (filtrado por transportista)

**Patrón:**

```
Sección A → Detalle A → Sección B (filtrada)
Transportistas → ColdChain Express → Fleet (vehículos de ColdChain)
```

**Breadcrumbs generados:**

```tsx
Transportistas › ColdChain Express › Vehículos
    ↑ vuelve        ↑ vuelve a detail  ↑ actual (tab de Fleet)
```

**Características clave:**

- ✅ Fleet **NO está en el Sidebar** (solo accesible vía Transportistas)
- ✅ Fleet se renderiza **filtrado automáticamente** por transportista
- ✅ Breadcrumbs combinados muestran la jerarquía completa
- ✅ Navegación bidireccional funcional

**Implementación paso a paso:**

Ver ejemplos completos en el código fuente. El patrón clave es:

1. Wrapper de Sección A maneja estado de vista (list/detail/fleet)
2. Wrapper de Sección B recibe prop de filtro opcional
3. Componente de Lista filtra datos según prop
4. Breadcrumbs se combinan en el wrapper de origen

**Cuándo usar Tipo D:**

- Cuando una sección necesita mostrar datos de otra sección filtrados por contexto
- Cuando quieres evitar duplicar una sección completa en el sidebar
- Cuando la relación entre secciones es de "pertenencia" (ej: flota pertenece a transportista)

---

### Tipo E: Modal Content Stepping (Gestión en Diálogo) 🆕

**Gestión de sub-entidades o catálogos rápidos dentro de un modal.**

**Secciones:** Gestión de Tipos de Ubicación, Selección de Productos, Roles.

**Patrón:**

```
Lista (en diálogo) → Formulario (en mismo diálogo) → Confirmación (en mismo diálogo)
```

**Características:**

- ✅ **Sin diálogos anidados**: No se abren modales sobre modales.
- ✅ **Alineación Visual**: Usa el botón `<` (ChevronLeft) con sangrado de descripción.
- ✅ **Estado Interno**: El diálogo maneja su propio `viewMode`.

**Cuándo usar Tipo E:**

- Para CRUDs secundarios que ocurren "arriba" de una página principal.
- Cuando quieres mantener al usuario en el contexto actual pero permitiéndole editar datos relacionados.

---

## Secciones con Breadcrumbs

**Con navegación profunda:**

- Transportistas: `Transportistas › ColdChain Express › Documentos`
- Transportistas → Fleet: `Transportistas › ColdChain Express › Vehículos`
- Ubicaciones: `Ubicaciones › Warehouse Chicago › Configuración`
- Rutas: `Rutas › Chicago-Dallas › Paradas`

**Sin breadcrumbs:**

- Dashboard, Alertas, Settings, Perfil

---

## Navegación Interna en Diálogos (View Stepping)

Para gestionar flujos complejos dentro de modales (ej: Lista de registros → Edición de uno → Confirmación), se utiliza el patrón de **permutación de contenido**.

### Estándar Visual:
- **Botón de Retroceso**: Se utiliza `ChevronLeft` con estilo `ghost` y `rounded-md`.
- **Iconografía**: El icono debe ser un chevron (`<`), no una flecha (`←`).
- **Alineación**: La descripción debajo del título debe tener un sangrado (`pl-9`) cuando el botón de retroceso está presente para mantener una línea vertical de lectura limpia.

### Ejemplo de Implementación en EntityDialog:
```tsx
<EntityDialog
  open={isOpen}
  onClose={onClose}
  title="Editar Registro"
  showBackButton={true}
  onBack={handleGoBack}
  description="Modifica los detalles del elemento seleccionado"
>
  <FormContent />
</EntityDialog>
```

### Reglas de Oro:
1. **No anidar diálogos**: Nunca abras un diálogo Shadcn sobre otro diálogo Shadcn si pertenecen a la misma entidad. Cambia el contenido interno.
2. **Botón de Retroceso vs Cerrar**: El botón de retroceso siempre va a la izquierda del título. El botón de cerrar (X) siempre permanece en la esquina superior derecha.
3. **Continuidad**: El diálogo debe mantener su `maxWidth` consistente durante la navegación para evitar saltos bruscos de tamaño.
