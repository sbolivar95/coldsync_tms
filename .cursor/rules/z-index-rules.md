# Jerarquía de Z-Index

## Objetivo

Mantener una jerarquía clara y consistente de z-index para evitar conflictos de apilamiento (stacking context) entre componentes.

## Jerarquía Establecida

```
z-1 / z-10    → Elementos de fondo, líneas decorativas
z-20          → Sidebars, paneles laterales
z-30 / z-40   → Headers sticky, elementos de tabla/gantt
z-50          → Componentes Radix UI (Dialog, Drawer, Popover, etc.)
z-100         → AlertDialog (modales críticos de confirmación)
z-200         → Toasts, notificaciones críticas
```

## Reglas

### 1. Usar Constantes

✅ **HACER:** Usar las constantes definidas en `src/lib/constants/z-index.constants.ts`

```tsx
import { Z_INDEX } from '@/lib/constants/z-index.constants';

// En inline styles
<div style={{ zIndex: Z_INDEX.ALERT_DIALOG }}>...</div>
```

❌ **NO HACER:** Usar valores arbitrarios

```tsx
// ❌ Evitar valores mágicos
<div className="z-[999]">...</div>
<div style={{ zIndex: 9999 }}>...</div>
```

### 2. Jerarquía de Modales

Los modales deben seguir esta jerarquía:

1. **Dialog / Drawer / Sheet** (`z-50`): Modales estándar para contenido
2. **AlertDialog** (`z-100`): Modales de confirmación críticos
3. **Toast** (`z-200`): Notificaciones que deben estar siempre visibles

**Razón:** Los AlertDialogs requieren decisión del usuario y deben estar por encima de todo el contenido, incluyendo otros modales.

### 3. Sidebars y Paneles

Los sidebars y paneles laterales usan `z-20` para estar por encima del contenido base pero por debajo de modales.

```tsx
// ✅ Correcto
<div className="z-20 bg-white border-r">
  {/* Sidebar content */}
</div>
```

### 4. Headers Sticky

Los headers sticky en tablas y gantt usan `z-30` o `z-40` para estar por encima del contenido scrolleable.

```tsx
// ✅ Correcto
<thead className="sticky top-0 z-40 bg-gray-50">
  {/* Table headers */}
</thead>
```

## Casos Especiales

### Google Maps

Para marcadores en Google Maps que necesitan prioridad visual, usar valores altos (ej. 1000+) según la documentación de Google Maps Platform.

```tsx
// ✅ Correcto para marcadores prioritarios
<AdvancedMarker zIndex={1000}>
  {/* Marcador seleccionado o en alerta */}
</AdvancedMarker>
```

### Elementos Decorativos

Para elementos que deben estar detrás de todo (líneas de timeline, backgrounds), usar valores negativos o muy bajos.

```tsx
// ✅ Correcto
<div className="-z-10 absolute">
  {/* Línea decorativa */}
</div>
```

## Checklist

Antes de agregar un z-index:

- [ ] ¿Existe una constante para este caso en `z-index.constants.ts`?
- [ ] ¿El valor respeta la jerarquía establecida?
- [ ] ¿Es realmente necesario el z-index o puedo reorganizar el DOM?
- [ ] ¿He verificado que no causa conflictos con otros componentes?

## Debugging

Si un elemento no aparece correctamente:

1. Verificar que el z-index sea mayor que los elementos que debe cubrir
2. Verificar que el elemento tenga `position: relative`, `absolute`, o `fixed`
3. Verificar que no haya un contexto de apilamiento padre que limite el z-index
4. Usar las DevTools para inspeccionar el stacking context

## Referencias

- [MDN: Understanding z-index](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index)
- [MDN: Stacking context](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index/Stacking_context)
