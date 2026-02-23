# ColdSync UI/UX Design Standards

Esta regla define los estándares de diseño visual para asegurar una experiencia "Premium", profesional y de baja carga cognitiva en todo el TMS.

## 1. La Regla de los Tres Contrastes (Jerarquía Visual)

Para evitar que "todo parezca importante", cada vista debe respetar estrictamente esta jerarquía de contraste:

### Nivel 1: Información Clave y Títulos (Anclaje Visual)
- **Uso**: Títulos de secciones, nombres de entidades principales, totales críticos.
- **Estilo**: `text-gray-900` u `oklch(0.145 0 0)`, `font-semibold` o `font-bold`.
- **Objetivo**: Que el ojo sepa inmediatamente qué está viendo.

### Nivel 2: Datos del Usuario y Contenido (Operativo)
- **Uso**: Valores dentro de inputs, texto de celdas en tablas, descripciones.
- **Estilo**: `text-gray-700`, `font-normal` o `font-medium`.
- **Bordes de Input**: `border-gray-200`.
- **Objetivo**: Legibilidad máxima sin fatiga visual.

### Nivel 3: Guía y Contexto (Soporte)
- **Uso**: Labels de campos, placeholders, iconos decorativos, textos de ayuda.
- **Estilo**: `text-gray-500` (para labels) o `text-gray-400` (para placeholders).
- **Objetivo**: Estar presente cuando se busca, pero no distraer del dato real.

## 2. Estándares de Componentes de Formulario

### Inputs y Selects
- **Tamaño Desktop**: Siempre usar `text-sm` (14px) para el valor y el label.
- **Altura**: Estándar de `h-9` (36px).
- **Bordes**: `border-gray-200` por defecto. Evitar `gray-300` o `gray-400` a menos que sea un estado de error o foco.
- **Sombra**: Evitar sombras internas o externas agresivas (`shadow-none`).

### Botones
- **Acción Primaria**: Variante `default` (Color sólido `--primary`). Solo debe haber UNO prominente por contexto.
- **Acciones Secundarias/De Tabla**: Usar variante `ghost` o `outline`.
- **Acciones Directas en Labels**: Usar el componente `LabelActionButton` (estilo link ligero).

## 3. Estándares de Tablas (DataTables)

- **Cabecera**: Fondo suave `#eff5fd` y borde azulado `#dde9fb` para delimitar el área de datos. No usar fondos grises oscuros.
- **Contenido**: Texto de celdas en `text-gray-700`.
- **Alineación**: 
  - Texto: izquierda.
  - Números/Montos: derecha.
  - Acciones: derecha.

## 4. Checklist de Aplicación

Antes de entregar un cambio de UI, verifica:
- [ ] ¿El botón "Guardar" o principal es el único con peso visual fuerte?
- [ ] ¿Los inputs tienen bordes suaves (`gray-200`)?
- [ ] ¿Los labels son `gray-500` y no compiten con los títulos?
- [ ] ¿El texto dentro de los campos es `gray-700`?
- [ ] ¿Se mantiene el tamaño `text-sm` en desktop?
