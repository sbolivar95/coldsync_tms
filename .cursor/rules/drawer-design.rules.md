# Drawer Design Standards

## Alturas Estándar
- **Header/Footer**: `style={{ minHeight: '60px' }}` + `px-6 py-3`
- **Botones**: Siempre `size="sm"` (36px altura)

## Estructura Base
```tsx
// Header
<div style={{ minHeight: '60px' }} className="shrink-0 bg-white border-b border-gray-200">
  <div className="flex items-start justify-between px-6 py-3">
    {/* Contenido */}
  </div>
</div>

// Footer  
<div style={{ minHeight: '60px' }} className="shrink-0 border-t border-gray-200 px-6 py-3 bg-white flex gap-3 items-center">
  <Button variant="outline" size="sm" className="flex-1">Cancelar</Button>
  <PrimaryButton size="sm" className="flex-1">Confirmar</PrimaryButton>
</div>
```

## Reglas
1. **Drawers = contexto secundario**: Botones más pequeños que páginas principales
2. **Proporción**: Botones 36px en footer 60px = 60% ocupación (ideal)
3. **Iconos**: Siempre `w-4 h-4`
4. **Un solo botón primario** por drawer

## ❌ No Hacer
- `size="default"` en botones de drawer
- Headers/footers sin altura mínima
- Más de un botón primario prominente