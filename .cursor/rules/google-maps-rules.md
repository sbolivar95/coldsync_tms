# 🗺️ Google Maps + ColdSync: Arquitectura y Reglas

> **Stack:** @vis.gl/react-google-maps | **Principio:** Integración invisible, sin parpadeos y basada en features.

---



## 🎯 Configuración (Setup)

### 1. Ubicación del Provider
**REGLA CRÍTICA:** NO envolver toda la aplicación (`main.tsx`) con el `APIProvider` a menos que sea estrictamente necesario.
- ✅ **HACER:** Envolver solo las rutas que requieren mapas en `src/routes/index.tsx`.
- ❌ **NO HACER:** Inyectar el script de Google globalmente si no se usa en el Dashboard o Login.

**Usar el MCP para Consultar Mejores Prácticas**
Aprovechar el MCP de Google Maps Platform para:
- Consultar documentación actualizada sobre `@vis.gl/react-google-maps`
- Obtener ejemplos de implementación de mapas y componentes interactivas
- Verificar mejores prácticas de rendimiento y optimización
- Consultar sobre manejo de errores y edge cases

```tsx
// src/routes/index.tsx
<APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
  <Outlet />
</APIProvider>
```

### 2. Estructura de Archivos
Sigue el **Patrón de Features** del proyecto (`component-size.rules.md`).
- ✅ **Ubicación:** `src/features/[feature-name]/components/LocationMap.tsx`
- ✅ **Hooks:** `src/features/[feature-name]/hooks/useMapLogic.ts`
- ❌ **Evitar:** Carpetas genéricas como `src/components/maps` a menos que sea un componente 100% agnóstico.

---

## 🔧 Integración con Formularios (React Hook Form)

El mapa es un input más del formulario. Debe comportarse como tal.

### 1. Comunicación vía Contexto
- ✅ Usa `useFormContext()` dentro de los componentes del mapa para leer y escribir coordenadas.
- ✅ Sincroniza cambios usando `form.setValue('geofence_data', data, { shouldDirty: true })`.

### 2. Detección de Cambios (`useFormChanges`)
- ✅ Asegúrate de que los cambios en el mapa disparen el estado `hasChanges` del `DetailFooter`.
- ✅ **Tip:** Usa una comparación profunda (JSON.stringify o similar) en `useFormChanges` para objetos de coordenadas.

---

## 🚀 UX y Prevención de Flickering

Basado en `detail-views-pattern.md`:

### 1. Loading States (NO Desmontar)
- ❌ **NUNCA** desmontes el componente de mapa para mostrar un Skeleton.
- ✅ **HACER:** Mantén el contenedor montado con un fondo gris neutro (`bg-gray-100`). 
- ✅ **Refinamiento:** Evita spinners intrusivos si el usuario prefiere minimalismo; el fondo gris es suficiente para indicar "preparando".
- ✅ **Control de Spawn:** En modo edición, no renderices el componente `<Map />` hasta que los datos de la base de datos estén cargados en el estado local. Esto evita que el usuario vea el mapa "viajar" desde un punto inicial (0,0).

### 2. Geolocalización y Places
- ⚠️ **PRECAUCIÓN:** Solo usar Geocoding o Autocomplete si los servicios están explícitamente habilitados en el proyecto. 
- ✅ **HACER:** Si los servicios están desactivados, el mapa debe comportarse de forma manual pura.
- ✅ **Creación:** Al crear una ubicación nueva, inicializa el mapa con una vista regional (ej. Américas, Zoom 3-4) para dar contexto inmediato sin necesidad de búsqueda.

---

## 📹 Control de Cámara y Estabilidad (fitBounds)

La estabilidad de la cámara es clave para una buena experiencia de edición.

### 1. Política de fitBounds
- **REGLA:** `fitBounds` solo debe ejecutarse automáticamente en momentos de "salto de contexto":
  1. Al cargar la geocerca por primera vez.
  2. Al cambiar el tipo de geocerca (Punto ↔ Polígono).
- ❌ **NUNCA** dispares `fitBounds` durante la edición interactiva (arrastrar puntos, cambiar radios). Esto causa saltos de zoom molestos.
- ✅ **HACER:** Usa un `hasFittedRef` para asegurar que el ajuste automático solo ocurra una vez por sesión de edición.

### 2. Edición Interactiva
- ✅ Al hacer clic para situar un punto, el mapa debe permanecer estático (`panTo` es aceptable, pero no obligatorio).
- ✅ El zoom debe ser respetado; si el usuario hizo un zoom manual, el código no debe sobreescribirlo automáticamente.

---

## 🎮 Controles Personalizados (UI Estándar)

Para mantener una interfaz premium y consistente, usamos componentes personalizados en lugar de los nativos de Google.

### 1. Uso de `MapSideControls`
**REGLA:** NUNCA usar los controles nativos de zoom o tipo de mapa.
- ✅ **HACER:** Importar y usar `<MapSideControls />` de `src/components/widgets/MapControls.tsx`.
- ✅ **Alineación:** Los controles deben estar en una sola columna vertical para facilidad de uso.
- ✅ **Estilo:** Mantener sombras `shadow-sm`, bordes `border-gray-100` y padding de `10px` para alineación perfecta con los bordes del mapa.

### 2. Limpieza de Interfaz (Bloqueo de UI Nativa)
**REGLA:** Desactivar siempre la interfaz por defecto para evitar ruido visual.
- ✅ **HACER:** Usar `disableDefaultUI={true}` en el componente `<Map />`.
- ✅ Esto elimina automáticamente el icono de rotación/tilt, street view y otros elementos no deseados.

---

## 📍 Marcadores Avanzados y Rendimiento (Advanced Markers)

Para aplicaciones de flota y tracking en tiempo real, la precisión y fluidez de los marcadores es crítica.

### 1. Anclaje Nativo vs Manual
**REGLA:** NUNCA uses `transform: translate(-50%, -100%)` en el elemento raíz de un marcador custom dentro de `<AdvancedMarker />`.
- **Razón:** `AdvancedMarker` ya ancla el contenido en su **base central (bottom-center)** por defecto. Añadir una traslación manual desplaza el marcador de su coordenada real, causando que "salte" o se desalinee durante el zoom.
- ✅ **HACER:** Deja que el mapa maneje la posición raíz. Si necesitas ajustar el anclaje, usa la propiedad `anchorPoint` o `anchor` de la API de Google, pero lo ideal es diseñar el componente para que su punta esté en la base central.

### 2. Prevención de Lag en Movimiento
**REGLA:** NUNCA apliques `transition: all` o transiciones de posición en el div raíz del marcador.
- **Razón:** Google Maps actualiza la posición del marcador en cada frame durante un zoom o paneo. Una transición intentará "animar" esos miles de cambios, creando un efecto de retraso (lag) donde el marcador parece flotar o perseguir al mapa.
- ✅ **HACER:** Las transiciones de posición deben ser manejadas exclusivamente por el motor de Google Maps.

### 3. Estructura de Capas para Animaciones Premium
Para permitir efectos visuales (como escalar al seleccionar) sin romper el anclaje ni causar lag:
- ✅ **Dividir Responsabilidades:** Usa un div raíz estático para la posición y un **Wrapper Interno** para las animaciones visuales (hover, scale, selection).
```tsx
<div style={{ position: 'relative' }}> {/* Root: Estático para Maps */}
  <div style={{ 
    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    transform: isSelected ? 'scale(1.1)' : 'scale(1)' 
  }}>
    {/* Contenido del Marcador */}
  </div>
</div>
```

### 4. Gestión de Densidad (Collision Behavior)
**REGLA:** En vistas de flota con alta densidad, usa `collisionBehavior` para mantener la claridad.
- ✅ **HACER:** Usar `collisionBehavior="OPTIONAL_AND_HIDES_LOWER_PRIORITY"`.
- ✅ **Z-Index:** Asegura que la unidad seleccionada o en alerta siempre tenga un `zIndex` superior (ej. 1000) para que nunca sea ocultada por colisión.

### 5. Tipografía Técnica
- ✅ **HACER:** Usa `font-variant-numeric: tabular-nums` (o la clase `tabular-nums` de Tailwind) para mostrar temperaturas y coordenadas. Esto evita que el marcador "tiemble" o cambie de ancho cuando los números cambian rápidamente.

---

## 🎨 Estándares Técnicos

### 1. Memoización Obligatoria
Google Maps es intensivo en recursos. Los objetos de opciones DEBEN estar fuera del render o memoizados.
```tsx
// ✅ Correcto
const circleOptions = useMemo(() => ({
  fillColor: '#004ef0',
  fillOpacity: 0.1,
  strokeColor: '#004ef0',
  strokeWeight: 2,
}), []);

<Circle options={circleOptions} ... />
```

### 2. Limpieza de Eventos (Cleanup)
- ✅ Limpia siempre los listeners nativos de Google para evitar fugas de memoria.
- ✅ Prefiere los eventos por props de `@vis.gl/react-google-maps` sobre `google.maps.event.addListener`.

---

## 📏 Esquema de Datos (Supabase Consistent)

Mantener consistencia con el esquema `jsonb` de la base de datos:

- **Circular:** `{ "center": { "lat": number, "lng": number }, "radius": number }`
- **Polígono:** `{ "coordinates": Array<{ lat: number, lng: number }> }`
- **Nulo:** El formulario debe permitir que `geofence_data` sea `null` inicialmente en la creación. Esto evita que aparezcan marcadores "fantasma" en el origen (0,0) antes de que el usuario elija su ubicación.

---

## 🚫 NO Hacer (Anti-patterns ColdSync)

1. ❌ **No usar `any`** en eventos de mapas (`ev: google.maps.MapMouseEvent`).
2. ❌ **No duplicar estado** del mapa en Zustand si ya vive en React Hook Form.
3. ❌ **No inyectar** múltiples instacias de `APIProvider`.
4. ❌ **No ocultar** el `DetailFooter` mientras el mapa carga.
5. ❌ **No permitir** que el mapa modifique datos si el formulario está en modo "Vista" (`readOnly`).

---
**Refs:** [Standard Detail Pattern](./detail-views-pattern.md) | [Component Structure](./component-size.rules.md)
