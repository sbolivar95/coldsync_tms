# 📘 ColdSync — Documentación Técnica y Funcional

## 1. Visión General (Overview)

### 1.1 Descripción del Sistema

**ColdSync** es un TMS (Transportation Management System) especializado en la **cadena de frío** para transporte de media y larga distancia. La plataforma está diseñada para orquestar la operación entre **Shippers** (generadores de carga) y **Transportistas** (Carriers).

**Alcance Operativo:**

- Movimientos entre fábricas, centros productivos, almacenes, centros de distribución y mayoristas.
- Tramos intra-ciudad, inter-ciudad, entre capitales y transfronterizo/extraterritorial.

**Fuera de Alcance (Out of Scope):**

- Última milla.
- Spot/Marketplace (modelo "carga disponible y conductor toma").

### 1.2 Macroprocesos (Problemas que resuelve)

El sistema se nuclea en tres pilares operativos:

1.  **Despacho:** Gestión de demanda, planificación, asignación y preparación para carga.
2.  **Ejecución:** Seguimiento del viaje, gestión de eventos, cumplimiento térmico y ETA.
3.  **Conciliación:** Auditoría post-viaje, validación documental, descuentos, disputas y autorización de facturación.

---

## 2. Arquitectura y Stack Tecnológico

### 2.1 Backend y Core

- **Supabase (BaaS):**
  - Gestión de autenticación, usuarios, roles y permisos.
  - Entidades base: Shippers, Transportistas, Conductores, Vehículos, Remolques.
  - Persistencia de datos de negocio, configuración, perfiles térmicos, productos, ubicaciones y rutas.

### 2.2 Telemetría y Conectividad (IoT)

- **Flespi:** Pasarela principal (Gateway) para la integración de dispositivos.
  - **Función:** Ingesta, parsing, procesamiento y almacenamiento de data cruda (mensajes). Todo el flujo de telemática atraviesa Flespi.
  - **Integraciones:**
    - Integraciones OEM con equipos reefer (Thermo King, Carrier, etc.).
    - Otros proveedores de GPS.
- **Módulo de Conexiones:** Sección administrativa para gestionar integraciones en Flespi.
  - **Configuración por dispositivo:** ID de integración, Marca/Modelo, Teléfono, Tipo de dispositivo, Indicador OEM, Sensores BT.
  - **Regla de Asociación:** El dispositivo se asocia **únicamente al Remolque**.
  - **Soporte Multi-compartimiento:** Vinculación de sensores de temperatura específicos por compartimiento (cuando aplique).

### 2.3 Automatización y Orquestación

- **N8N:** Plataforma para workflows operativos críticos.
  - Extracción y procesamiento de documentos BOL (OCR).
  - Sistema de notificaciones multicanal (WhatsApp, Email, SMS).
  - Generación de tickets digitales y QR codes.
  - Recordatorios y alertas programadas.
  - Webhooks para eventos del sistema e integración Supabase <-> Flespi.
  - **Resend.com** → Servicio de email transaccional y deliverability (nuevo desde dic-2025):
    - Utilizado como proveedor principal de emails en todos los workflows N8N que requieran envío de correo.
    - Motivos: alta tasa de entrega (inbox placement), webhooks de eventos (delivered, opened, bounced, complaint), soporte nativo de templates React y adjuntos pesados.
    - Canales afectados: Tickets digitales, cronogramas consolidados, alertas térmicas, reportes de auditoría, notificaciones de disputa y cualquier email formal o de respaldo.
    - Fallback automático: en caso de bounce permanente → supresión de lista y cambio a WhatsApp/SMS.

### 2.4 Frontend

- **Stack:** React + Tailwind CSS + shadcn/ui.
- **Build Tool/Server:** Vite (Rollup).
- **Estado:** Zustand.
- **Mapas:** Google Maps (visualización y geocercas).

---

### 3.2 Actores

#### A. Embarcador (Shipper)

Administra demanda, reglas, programación, productos, perfiles térmicos, seguimiento y conciliación.

- **Modelo Operativo:** Puede trabajar con Flota Propia o con múltiples Transportistas (1 a N).
- **Atributos Relevantes:** Comparte la estructura de atributos generales con "Transportista", diferenciándose únicamente por el `Tipo de Cuenta: Embarcador`.

#### B. Transportista (Carrier)

Entidad propietaria de los activos operativos (vehículos, remolques, conductores). Aporta unidades y conductores, confirma disponibilidad y ejecuta servicios.

- **Atributos Generales:**
  - Nombre Comercial, Razón Social.
  - Tipo de Persona (Sociedad / Unipersonal).
  - Tipo de Documento (NIT, CUIT, RUT), ID Tributario.
  - Tipo de Transportista (Tercero, Propio).
  - Representante Legal.
  - País, Ciudad, Dirección Fiscal.
- **Contacto:**
  - Nombre, Teléfono, Email.
  - Teléfono 24/7 (Operaciones).
  - Email de finanzas.
- **Contrato:** Nro de Contrato, Fecha de Vencimiento.
- **Seguros:** Nro de Póliza de carga, Fecha de vencimiento.
- **Condiciones de Pago:**
  - Condiciones (Contado, semanal, mensual).
  - Moneda (Bs, USD, etc.).
  - Método de facturación (Manual, Electrónica).
- **Información Bancaria:** Banco, Número de Cuenta, CCI/Swift.

> **Nota:** Todos los activos operativos (Vehículos, Remolques, Conductores) pertenecen obligatoriamente a un único Transportista. La creación y edición de activos se realiza siempre dentro del contexto de un Transportista seleccionado.

#### C. Conductores (Drivers)

Persona que opera el vehículo asignado (y por extensión el remolque acoplado).

- **Datos Generales:** Nombre Completo, Nro. Licencia, Teléfono, Email, Fecha de nacimiento, Nacionalidad, Dirección, Ciudad, Estado (Disponible/En servicio/Enfermo/etc.).
- **Información Laboral:**
  - Transportista propietario (fijo, no editable en esta ficha).
  - **Asignación operativa actual** (solo lectura): Vehículo asignado y Remolque asignado (si aplica).
  - Fecha de contratación.
  - Grupo sanguíneo.
  - Notas adicionales.

> **Importante:** La asignación de un conductor a un vehículo/remolque **no se edita directamente en esta ficha**. Se gestiona exclusivamente desde la sección **Asignaciones**.

### 3.3 Activos Operativos

#### D. Vehículo (Vehicle)

- **Identificación:** Unidad (ID interno), Placa/Patente, VIN, Marca, Modelo, Año.
- **Operativo:**
  - Tipo de Vehículo (Reefer, Seco, etc.).
  - Capacidad Combustible (litros).
  - Estado (Operativo/Mantenimiento/Averiado).
  - Kilometraje actual.
  - Base de operación.
- **Propiedad y Asignación:**
  - Transportista propietario (fijo).
  - **Asignación operativa actual** (solo lectura): Conductor asignado, Remolque asignado.
- **Datos adicionales.**

> **Nota:** La relación Vehículo ↔ Conductor ↔ Remolque se gestiona únicamente desde la sección **Asignaciones**. En esta ficha solo se muestra el estado actual de la asignación activa.

#### E. Remolque (Trailer – Entidad Crítica)

El remolque es la entidad central para el **matching** de viajes debido a sus restricciones físicas y térmicas.

- **General:**
  - Unidad (ID interno), Placa/Patente.
  - Estado operativo (Activo, Inactivo, Mantenimiento).
  - Transportista propietario (fijo).
  - **Asignación operativa actual** (solo lectura): Vehículo asignado.
- **Capacidad y Dimensiones:**
  - Capacidad Peso (Tn), Volumen (m³), Peso Tara (Tn).
  - Dimensiones internas: Largo (m), Ancho (m), Alto (m), Espesor aislamiento (cm).
  - Unidad de medida (pallets, cajas, ganchos, granel, unidad).
  - Configuración: Single-zone (1 compartimento) o Híbrido (N compartimentos >1).
  - N° Compartimentos (solo visible y editable si Configuración = Híbrido).
- **Especificaciones del Equipo Reefer:**
  - Marca (Thermo King, Carrier, Otro), Modelo, Año.
  - Tipo de Alimentación (Diésel, Eléctrico, Híbrido).
  - Horas de reefer, Capacidad Combustible (litros), Consumo (l/h).
  - Rango Operativo: Temp. Mínima y Máxima (utilizado para matching automático con perfiles térmicos).
- **Notas adicionales.**

> **Lógica para Caso Híbrido (Multi-temperatura):**
>
> 1. Los remolques híbridos pueden usarse también como single-zone.
> 2. Al activar "Configuración = Híbrido", se debe indicar el número de compartimentos (>1).
> 3. **Regla de Validación:** La suma del peso/volumen de las órdenes asignadas nunca debe exceder la capacidad total del remolque.
> 4. **Matching:** Se realiza por peso y por rango de temperatura (el perfil térmico de la orden debe encajar dentro del rango operativo del remolque).

#### F. Asignación Operativa

Entidad que representa la configuración operativa activa de un conjunto Tractor + Conductor + Remolque. Las asignaciones son estables (varios días/semanas) y solo cambian por eventos excepcionales (avería, mantenimiento, enfermedad, etc.).

- **Atributos:**
  - Transportista (heredado del contexto, no editable).
  - Conductor (selección de conductores disponibles del Transportista).
  - Vehículo (selección de vehículos disponibles del Transportista).
  - Remolque (opcional, selección de remolques disponibles).
  - Fecha de Inicio (automática: fecha de creación).
  - Fecha de Fin (opcional, abierta por defecto).
  - Estado: Activa / Inactiva.
- **Reglas:**
  - Cada Vehículo, Conductor y Remolque puede tener **máximo una asignación operativa activa** simultáneamente.
  - Al crear una nueva asignación que involucre un recurso ya asignado, el sistema ofrece desactivar automáticamente la asignación anterior.
  - El historial de asignaciones pasadas solo está disponible en la sección de **Reportes**.

> **Gestión UI:** Toda la creación, edición y desactivación de asignaciones se realiza exclusivamente en la sección/tab **Asignaciones** del Transportista. Las fichas de Vehículo, Conductor y Remolque muestran únicamente el snapshot actual de la asignación activa (solo lectura) con botones de acción rápida que redirigen a la edición en "Asignaciones".

#### G. Conexión (Integración Telemática)

- **Atributos:** Proveedor, ID de Conexión (IMEI/Serial), Teléfono SIM, Marca, Modelo, etc.
- **Asociación:** Exclusivamente al **Remolque** o al **vehiculo** solo una a la vez.

---

## 4. Catálogos Operativos

### 4.1 Perfiles Térmicos

Definen las reglas de temperatura.

- **Atributos:** Nombre, Descripción, Temp. Min, Temp. Max, Estado.
- **Uso:** Validar compatibilidad con el remolque/compartimiento.

### 4.2 Productos

- **Atributos:** Nombre (ej. Pollo, Cerdo, Bananas), Descripción, Estado, **Perfil Térmico Asociado**.

### 4.3 Ubicaciones

Orígenes y destinos para la construcción de rutas.

- **Atributos:**
  - Nombre, Dirección, Ciudad, País.
  - **Geocercas:** Geo-referenciación (poligonales y circulares).
  - Tipo (CD, Almacén, Planta, Puerto, Fábrica, Hub, Cross Dock).
  - Horarios de atención, Cantidad de muelles.
  - Persona de contacto y Teléfono.
  - Estado.

### 4.4 Rutas y Tarifas

- **Construcción:** 1 o más orígenes -> 1 o más destinos.
- **Atributos Generales:** Tipo de Ruta (Local, Nacional, Internacional), Distancia, Estado.
- **Ciclo de Servicio (Variables):**
  - Tiempo de Tránsito (h), Tiempo de Carga (h), Tiempo de Descarga (h).
  - HOS (Horas de descanso/sueño).
  - Tiempo para abastecimiento (h).
  - Margen Operacional (%) para mantenimiento/imprevistos.
  - _Fórmula:_ `Ciclo de Servicio = (Tiempo de Transito * 2 Ida/Vuelta) + Ajustes del Ciclo`.
- **Ajustes de Flete:**
  - Moneda (Bs), Tarifa Base.
  - Ajuste por Kilómetro (costo/km), Ajuste por hora (costo/hora).
  - Definido por Ruta y Perfil Térmico.

---

## 5. Flujo Operativo de Despacho (End-to-End)

**Lógica Maestra:** La aptitud operativa (mecánica/combustible) es un pre-requisito para la Programación. Solo se programa lo que está validado y apto.
**Macroflujo:** Demanda -> Planificación -> Disponibilidad (Validación) -> Programación -> Pre-embarque -> Despacho.

### 5.1 Ordenes/Demanda (Entrada)

Solicitudes de transporte ingresadas al sistema.

#### Formulario de Creación de Orden

El formulario de creación de órdenes (`OrdenDialog.tsx`) permite ingresar demandas de transporte con dos configuraciones: **Standard** y **Híbrido**.

**Campos del Formulario:**

1. **Configuración** (Requerido)
   - **Standard:** Una sola carga homogénea con un perfil térmico
   - **Híbrido:** Múltiples compartimientos con diferentes productos y perfiles térmicos

2. **Ruta** (Requerido)
   - Selector de rutas predefinidas (origen → destino)
   - Opciones cargadas desde `mockRutas` (estado: "Activa")

3. **Cantidad** (Requerido)
   - Número de viajes/unidades requeridas para esta orden
   - Valor por defecto: 1

**Para Configuración Standard:**

4. **Producto** (Requerido)
   - Selector de productos del catálogo
   - Opciones cargadas desde `mockProductos` (estado: "Activo")

5. **Perfil Térmico** (Requerido)
   - Selector de perfiles térmicos disponibles
   - Formato mostrado: "Nombre (TempMin°C a TempMax°C)"
   - Opciones cargadas desde `mockPerfilesTermicos` (estado: "Activo")

6. **Peso (Tn)** (Requerido)
   - Peso total de la carga en toneladas
   - Formato decimal: 0.00

**Para Configuración Híbrido:**

4. **Compartimientos** (Requerido - mínimo 1)
   - Sistema dinámico de múltiples compartimientos
   - Botón "+ Agregar" para añadir compartimientos
   - Botón de eliminación (icono basura) cuando hay más de 1 compartimiento
   - **Cada compartimiento incluye:**
     - Producto (selector)
     - Perfil Térmico (selector)
     - Peso (Tn) (input numérico)
   - **Inicialización:** Al cambiar a "Híbrido", se crea automáticamente 1 compartimiento vacío

**Campos Comunes (ambas configuraciones):**

7. **Fecha Prevista** (Requerido)
   - Selector de fecha con calendario dropdown
   - Formato: dd/mm/yyyy
   - Permite selección de año mediante dropdown

8. **Ventana de Tiempo** (Requerido)
   - **Opciones disponibles:**
     - "Sin preferencia"
     - "Mañana (08:00 - 12:00)"
     - "Tarde (13:00 - 18:00)"
     - "Noche (19:00 - 23:59)"
     - "Hora específica"
   - Valor por defecto: "Sin preferencia"

9. **Hora Prevista** (Condicional)
   - Selector de hora en formato 24h
   - **Solo habilitado** cuando Ventana de Tiempo = "Hora específica"
   - **Requerido** cuando está habilitado
   - Deshabilitado (gris) para todas las demás opciones de ventana

10. **Notas Adicionales** (Opcional)
    - Campo de texto libre (textarea)
    - Placeholder: "Agrega información adicional sobre la orden...

**Validaciones:**

- Todos los campos marcados con `*` son obligatorios
- Para Standard: Configuración, Ruta, Producto, Perfil, Peso, Cantidad, Fecha, Ventana
- Para Híbrido: Configuración, Ruta, Cantidad, Fecha, Ventana + mínimo 1 compartimiento completo
- El peso debe ser mayor a 0
- La cantidad debe ser mínimo 1

**Comportamiento al Cambiar Configuración:**

- **Standard → Híbrido:**
  - Limpia campos: producto, perfil, peso
  - Inicializa array de compartimientos con 1 compartimiento vacío
- **Híbrido → Standard:**
  - Limpia compartimientos
  - Inicializa campos: producto="", perfil="", peso=""

**Acciones del Formulario:**

- **Botón "Cancelar":** Cierra el diálogo sin guardar
- **Botón "Crear Orden"** (o "Guardar Cambios" en modo edición): Valida y guarda la orden

**Herramientas de Ingreso:**

- Botón `+ Crear Orden` en el header del módulo Despacho
- Importación masiva (funcionalidad futura)

**Estado Inicial:** **Sin Asignar**

**Visualización:** Lista de espera en panel izquierdo del Gantt (columna "Sin Asignar")

_Nota:_ Sin asignación de unidad/transportista en esta etapa. El matching de recursos se realiza posteriormente en la fase de Planificación (5.2).

### 5.2 Planificación (Asignación Tentativa)

El planner proyecta los recursos en el tablero. Asigna unidades teóricamente capaces (por perfil y peso), pero sin validar su estado real actual con el transportista.

- **Acción:** _Drag & Drop_ o _Auto-Asignar_.
- **Estado Visual (Gantt):** **1. Asignada** (Borde Punteado).
- **Significado:** "Propuesta del Planner". Asignación interna no visible para el transportista.

### 5.3 Disponibilidad (Negociación y Validación)

**Punto Crítico de Control.** Se valida el compromiso comercial Y la capacidad operativa real.

- **Acción:** Planner presiona `Enviar Despacho` (Batch Request).
- **Estado Visual (Gantt):** **2. Pendiente** (Ámbar + Reloj).
- **Responsabilidad del Transportista:**
  - Al recibir la solicitud, el transportista debe verificar físicamente la unidad antes de responder.
  - **Condición de Aceptación:** Solo puede dar "Aceptar" si valida:
    1. Disponibilidad de Chofer.
    2. Estado Mecánico OK.
    3. Combustible Suficiente para el tramo.
- **Resultados:**
  - **Acepta (Con Declaración Jurada):** Pasa a Fase 5.4 (Programada). _Al aceptar, garantiza condiciones operativas._
  - **Rechaza:** Pasa a estado **3. Rechazada** (Icono Rojo reject). _Si no tiene combustible o chofer, DEBE rechazar._

### 5.4 Programación (Tránsito al Origen)

La unidad debe viajar hacia el origen en los tiempos y fechas establecidos.

- **Lógica:** Como la unidad fue validada y aceptada en 5.3, se asume apta y lista para ir a cargar segun los tiempos establecidos.
- **Estado Visual (Gantt):** **4. Programada** (Azul primario de coldsync).
- **Monitoreo (Crisis Combustible):**
  - Aunque el transportista declaró tener combustible en 5.3, en situaciones de crisis se puede solicitar una **Evidencia Visual** (Foto) durante el tránsito como reaseguro.
  - **Indicador UI:** Icono ⛽ en la tarjeta (Verde = Evidencia recibida / Gris = Declarado sin foto).

### 5.5 Pre-embarque (Arribo y Validación Final)

La unidad llega a la portería. Se verifica que la declaración del paso 5.3 coincida con la realidad física.

- **Trigger:** Arribo a Planta (Geocerca/QR).
- **Proceso:** Checklist de Ingreso (Limpieza, Olores, Temp, Fugas).
- **Resultados:**
  - **Aprobado:** Pasa a Despacho.
  - **Observada:** La unidad no paso las exigencias ni cumple los requisitos para viajar.
    - **Estado Visual:** **5. Observacion en Pre-embarque** (Borde Rojo Grueso + Icono ⛔).
    - **Consecuencia:** Retorno de unidad y posible sanción por incumplimiento de declaración.

### 5.6 Despacho (Cierre)

Ejecución del servicio y traspaso de responsabilidad.

- **Condición:** Checklist 5.5 Aprobado.
- **Acción:** Emisión de BOL y salida física.
- **Estado Visual (Gantt):** **6. Despachado** (Gris Oscuro Sólido).
- **Destino:** El viaje se transfiere al módulo **Control Tower**.

---

## 6. Glosario Visual de Estados (UI Definitiva)

Mapa de consistencia entre el proceso operativo y la visualización en el Gantt. Toda orden nueva creada tiene un estado inicial "Sin Asignar".

### 6.1 Estados Operativos del Flujo de Despacho

| Estado            | Paleta Visual                                                                                                     | Significado Operativo                                       | Fase del Flujo             | Icono        |
| :---------------- | :---------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------- | :------------------------- | :----------- |
| **Sin Asignar**   | Fondo: `#f9fafb` (gray-50)<br>Borde izquierdo: `#d1d5db` (gray-300)<br>Badge: `bg-gray-200 text-gray-700`         | Demanda sin asignar a unidad                                | 5.1 Demanda                | Package      |
| **1. Asignada**   | Fondo: `#e5e7eb` (gray-200)<br>Borde: `dashed #6b7280`<br>Badge: `bg-gray-100 text-gray-600 font-semibold`        | Propuesta del Planner (sin validar con transportista)       | 5.2 Planificación          | CheckCircle2 |
| **2. Pendiente**  | Fondo: `#f9fafb` (gray-50)<br>Borde izquierdo: `#f59e0b` (amber-500)<br>Badge: `bg-amber-50 text-amber-700`       | Esperando confirmación/validación del Transportista         | 5.3 Disponibilidad         | Clock        |
| **3. Rechazada**  | Fondo: `#f9fafb` (gray-50)<br>Borde izquierdo: `#ef4444` (red-500)<br>Badge: `bg-red-50 text-red-700`             | Unidad No Apta / Sin combustible / Problema mecánico        | 5.3 Disponibilidad         | XCircle      |
| **4. Programada** | Fondo: `#f9fafb` (gray-50)<br>Borde izquierdo: `#3b82f6` (blue-500)<br>Badge: `bg-blue-50 text-blue-700`          | **Apta y Confirmada** - Unidad en tránsito hacia el origen  | 5.4 Programación           | CheckCircle2 |
| **5. En Destino** | Fondo: `#f9fafb` (gray-50)<br>Borde izquierdo: `#091E42` (#091E42)<br>Badge: `bg-white text-[#091E42]`            | **La unidad esta en destino** - Lista para ervisar y cargar | 5.4 En Destino             | CheckCircle3 |
| **5. Observada**  | Fondo: `#f9fafb` (gray-50)<br>Borde izquierdo: `#f97316` (orange-500)<br>Badge: `bg-orange-50 text-orange-700`    | Fallo físico en checklist de ingreso (incumplimiento)       | 5.5 Pre-embarque           | AlertCircle  |
| **6. Despachada** | Fondo: `#f9fafb` (gray-50)<br>Borde izquierdo: `#10b981` (emerald-500)<br>Badge: `bg-emerald-50 text-emerald-700` | Servicio en Ejecución - Transferido a Control Tower         | 5.6 Despacho               | Send         |
| **7. Cancelada**  | Fondo: `#f9fafb` (gray-50)<br>Borde izquierdo: `#64748b` (slate-500)<br>Badge: `bg-slate-100 text-slate-700`      | Orden Anulada por el planner o sistema                      | **5.1-5.5** (Pre-despacho) | Ban          |

### 6.2 Especificaciones de Diseño (TripCard)

**Características Comunes:**

- **Altura fija:** `70px`
- **Padding:** `p-2` (8px)
- **Border radius:** `rounded-sm`
- **Borde izquierdo:** `4px solid` (color según estado)
- **Font weight badge:** `font-semibold`
- **Tamaño badge:** `text-[10px]`
- **Hover:** `hover:shadow-md transition-all`

**Estado "Asignada" (Diferenciador Visual):**

- ✅ Bordes: `dashed` en todos los lados (excepto izquierdo que es `solid`)
- ✅ Fondo más oscuro: `#e5e7eb` (gray-200) para contrastar con el badge
- ✅ Badge sin borde: `bg-gray-100 text-gray-600`

**Estado "Cancelada" (Restricciones):**

- ❌ **NO arrastrable** (no se puede mover en el Gantt)
- ❌ **NO seleccionable** (sin checkbox)
- ❌ Cursor: `not-allowed`
- ❌ Estilo visual: `opacity-50 blur-[0.5px]`
- ⚠️ **Solo visible en panel "Sin Asignar"** (no en el Gantt)

**⚠️ Regla de Negocio para Cancelación:**

Una orden **solo puede ser cancelada ANTES del despacho** (fases 5.1 a 5.5):

- ✅ Puede cancelarse desde "Sin Asignar"
- ✅ Puede cancelarse desde "Asignada", "Pendiente", "Rechazada", "Programada" u "Observada"
- ❌ **NO puede cancelarse** después de "Despachada" (fase 5.6) porque el viaje ya está en ejecución en Control Tower

Una vez cancelada, la orden regresa al panel "Sin Asignar" con restricciones de interacción completas.

### 6.3 Paleta de Colores Consistente

Todos los estados comparten el mismo fondo base (`#f9fafb` gray-50) excepto "Asignada", lo que permite que el **color del borde izquierdo** sea el diferenciador principal:

| Color       | Código    | Uso                         |
| :---------- | :-------- | :-------------------------- |
| Gray-300    | `#d1d5db` | Sin Asignar                 |
| Gray-500    | `#6b7280` | Asignada (con borde dashed) |
| Amber-500   | `#f59e0b` | Pendiente                   |
| Red-500     | `#ef4444` | Rechazada                   |
| Blue-500    | `#3b82f6` | Programada                  |
| Azul Navy   | `#091E42` | En Destino                  |
| Orange-500  | `#f97316` | Observada                   |
| Emerald-500 | `#10b981` | Despachada                  |
| Slate-500   | `#64748b` | Cancelada                   |

---

## 7. Ejecución (Seguimiento de los Viajes) - Torre de Control

La Torre de Control es el módulo de **seguimiento en tiempo real** de la flota en operación. Permite monitorear ubicación, temperatura, estado del reefer y alertas de todas las unidades activas.

### 7.1 Arquitectura de la Vista

**Layout Principal:**

```
Torre de Control (Vista Completa)
├── PageHeader con Tabs de Filtrado (8 tabs)
├── Barra de Búsqueda Global
├── Filtros: Estado, Transportista, Tipo de Vehículo
└── TrackingView (Layout 32/68)
    ├── Lista de Unidades (32% - Panel Izquierdo)
    │   └── UnitCard (Tarjetas de unidades)
    └── Mapa en Tiempo Real (68% - Área Principal)
        └── UnitDetailsDrawer (Drawer flotante inferior)
```

### 7.2 Sistema de Tabs de Filtrado

Los tabs permiten filtrar los viajes activos según su estado operativo:

| Tab                   | Descripción                                        | Badge (Contador) |
| :-------------------- | :------------------------------------------------- | :--------------- |
| **Todos**             | Todas las unidades visibles (con y sin viaje)      | 89 (total)       |
| **Programado**        | Ticket enviado, aún no salió de su base            | 12               |
| **En Origen**         | Dentro de geocerca de carga (cargando o esperando) | 8                |
| **En Ruta**           | Viaje en marcha – estado principal del día a día   | 45               |
| **En Destino**        | Acaba de llegar al destino                         | 6                |
| **Retrasado**         | ETA peor que la planificada (leve o grave)         | 11               |
| **Excursión Térmica** | Temperatura fuera de rango – alarma máxima         | 3                |
| **Finalizado**        | Descargado y auditoría OK – desaparece del mapa    | 4                |

**⚠️ Nota:** El tab "Todos" muestra también unidades **sin viaje activo** (tracking general de flota), mientras que el resto de tabs solo muestran unidades con viajes asignados.

### 7.3 Barra de Búsqueda y Filtros

**Búsqueda Global:**

- Permite buscar por: Unidad (TRK-1024), Remolque (RMQ-456), Conductor, Ubicación o Transportista
- Búsqueda en tiempo real sin necesidad de enviar formulario

**Filtros Disponibles (Botones desplegables):**

- **Estado:** Activo, En Tránsito, Detenido, En Planta
- **Transportista:** Lista de transportistas con unidades activas
- **Tipo de Vehículo:** Camión, Tractomula, Remolque

### 7.4 Lista de Unidades (UnitCard)

Panel lateral izquierdo (32% del ancho) con tarjetas compactas de cada unidad.

**Información mostrada por tarjeta:**

- **Header:** Unidad (TRK-1024) + Remolque (RMQ-456)
- **Conductor:** Nombre completo
- **Ubicación:** Ciudad, Estado/País
- **Estado Operativo:** Badge con color semántico
  - En Ruta: Verde
  - Detenido: Amarillo
  - En Planta: Azul
- **Métricas en tiempo real:**
  - Velocidad actual (km/h)
  - Temperatura del reefer
  - Última actualización (tiempo transcurrido)
- **Indicadores:**
  - Icono de alerta si hay errores de reefer
  - Badge "Con Viaje" / "Sin Viaje"

**Interacción:**

- Click en tarjeta → Selecciona unidad en el mapa + Abre UnitDetailsDrawer
- Scroll vertical para navegar todas las unidades

### 7.5 Mapa en Tiempo Real

Área principal (68% del ancho) con visualización geográfica de la flota.

**Características implementadas:**

- **Placeholder visual** (pendiente integración Google Maps / Mapbox)
- **Controles flotantes:** Zoom In (+) / Zoom Out (-)
- **Selección de unidad:** Muestra ID de unidad seleccionada en el centro
- **Integración futura:**
  - Marcadores dinámicos con iconos según estado
  - Geocercas de origen/destino
  - Ruta planificada vs ruta real
  - Clustering de unidades cercanas

### 7.6 Drawer de Detalles de Unidad (UnitDetailsDrawer)

Drawer flotante inferior que aparece al seleccionar una unidad. Tiene **3 estados redimensionables**:

| Estado         | Altura        | Descripción                             |
| :------------- | :------------ | :-------------------------------------- |
| **Minimizado** | `56px` (h-14) | Solo muestra barra con nombre de unidad |
| **Medio**      | `220px`       | Muestra tabs + contenido básico         |
| **Completo**   | `360px`       | Vista expandida con gráficos grandes    |

**Sistema de Tabs del Drawer (6 tabs):**

#### **1. General**

- Información del viaje activo
- Origen → Destino
- Producto transportado
- Transportista asignado
- Hora de salida y ETA
- Progreso del viaje (barra de progreso)

#### **2. Temperatura**

- Temperatura actual del reefer
- Setpoint configurado
- Rango térmico permitido (min/max)
- Estado térmico: Normal / Advertencia / Crítico
- Indicador visual de desviación
- Sensor return air / supply air (si aplica)

#### **3. Gráficos**

- Gráfico de temperatura histórica (últimas 24h)
- Gráfico de velocidad
- Gráfico de eventos (paradas, aperturas de puertas)
- **Estado:** Placeholder (pendiente integración con recharts)

#### **4. Reefer**

- Estado del motor de frío
- Modo de operación: Continuo / Start-Stop
- Horas de motor (Hours Run)
- Consumo de combustible estimado
- Códigos de error activos (si aplica)
- Presión de refrigerante
- Estado de sensores

#### **5. Info**

- Datos del conductor
- Datos del vehículo (placa, marca, modelo)
- Datos del remolque (placa, capacidad)
- Transportista
- Base de operación
- Último mantenimiento

#### **6. Alertas** (con indicador de alertas activas)

- Lista de alertas activas y recientes
- Tipos de alertas:
  - Excursión térmica (crítica/media/leve)
  - Apertura de puertas no autorizada
  - Desvío de ruta
  - Velocidad excedida
  - Error de reefer
  - Pérdida de señal GPS
- Severidad con colores: Crítica (Roja), Media (Amarilla), Leve (Azul)
- Timestamp de cada alerta
- Botón "Marcar como resuelta"

**Controles del Drawer:**

- **Botón ↑:** Expandir (Minimizado → Medio o Medio → Completo)
- **Botón ↓:** Contraer (Completo → Medio o Medio → Minimizado)
- **Botón X:** Cerrar drawer completamente

### 7.7 Estados Operativos en Control Tower

Correspondencia con los estados de Despacho:

| Estado en DB        | Nombre en UI / Control Tower | Comentario operativo                               |
| :------------------ | :--------------------------- | :------------------------------------------------- |
| `scheduled`         | Programado                   | Ticket enviado, aún no salió de su base            |
| `at_origin`         | En Origen                    | Dentro de geocerca de carga (cargando o esperando) |
| `in_transit`        | En Ruta                      | Viaje en marcha – estado principal del día a día   |
| `at_destination`    | En Destino                   | Acaba de llegar al destino                         |
| `delayed`           | Retrasado                    | ETA peor que la planificada (leve o grave)         |
| `thermal_excursion` | Excursión Térmica            | Temperatura fuera de rango – alarma máxima         |
| `completed`         | Finalizado                   | Descargado y auditoría OK – desaparece del mapa    |

### 7.8 Tracking de Flota General vs Tracking de Viaje

**Torre de Control maneja dos niveles de tracking:**

#### **Nivel 1: Tracking General de Flota**

- Unidades visibles incluso **sin viaje activo**
- Útil para planificar asignaciones futuras
- Muestra ubicación actual, estado del vehículo y conductor disponible
- Visible en tab "Todos"

#### **Nivel 2: Tracking de Viaje Activo**

- Solo unidades con viaje asignado
- Incluye información de carga, origen, destino y ETA
- Monitoreo de cumplimiento térmico y ruta
- Alertas operativas específicas del viaje
- Visible en tabs específicos (En Ruta, Retrasado, etc.)

### 7.9 Orquestación de Alertas (N8N)

**Flujo automático de notificaciones:**

- Alertas de excursión térmica → envío vía **Resend** (email) + WhatsApp
- Alertas de desvío de ruta → notificación al dispatcher
- Alertas de apertura de puertas no autorizada → alerta inmediata
- Notificaciones de ETA actualizado → email vía **Resend** con gráficos adjuntos
- Contingencias operativas → escalamiento automático

**Canales de notificación:**

- **Email (Resend):** Reportes detallados con gráficos
- **WhatsApp:** Alertas urgentes y actualizaciones de ETA
- **SMS:** Backup para alertas críticas
- **Push (futuro):** Notificaciones en tiempo real en la app

### 7.10 Integración con Flespi (Telemetría)

**Fuente de datos en tiempo real:**

- **GPS:** Coordenadas lat/lng actualizadas cada 30-60 segundos
- **Velocidad:** Velocidad instantánea y promedio
- **Temperatura:** Datos de sensores del reefer (return air / supply air)
- **Eventos:** Encendido/apagado motor, apertura puertas, geocercas
- **Datos CAN Reefer:** Modo de operación, setpoint, códigos de error, horas de motor

**Procesamiento:**

- Flespi → Webhook → N8N → Supabase
- Actualización en tiempo real del estado de la unidad
- Trigger automático de alertas según reglas configuradas
- Histórico de telemetría para auditoría post-viaje

---

## 8. Conciliación (Auditoría y Facturación)

Proceso post-viaje consolidado semanalmente.

### 8.1 Auditoría Automática

El sistema calcula automáticamente:

- Tiempos de tránsito reales vs. planificados.
- **Auditoría Térmica:** Análisis de gráficos, detección de min/max, cálculo de tiempo y porcentaje de excursiones térmicas.
- Aplicación de descuentos automáticos (Reglas de Merma).

### 8.2 Gestión de Evidencias

- Fuente principal: Telemetría.
- Respaldo: BOL (Digitalizado).
- **Dataloggers:** Soporte para carga de archivos de dataloggers físicos (USB) para contrastar datos en caso de disputa.

### 8.3 Flujo de Disputa

1.  Si hay observaciones -> Se abre disputa Shipper/Carrier.
2.  Carrier presenta descargos.
3.  Resolución (Procede/No Procede descuento) → notificación automática vía **Resend**.
4.  Cierre -> Autorización de facturación → envío de reporte final consolidado semanal por **Resend**.

---

## 9. Matriz de Calificación de Transportistas (KPIs)

Sistema de puntuación ponderada para evaluar el nivel de servicio.

### Sección A: Criterios y Fórmulas

| Indicador                    | Peso    | Definición y Fórmula                                                                                                                                                              |
| :--------------------------- | :------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **% Ejecución**              | **15%** | $Viajes \ Ejecutados \ / \ Viajes \ Programados$                                                                                                                                  |
| **Cumplimiento Plazos Adm.** | **5%**  | Escala:<br>100% (Antes del plazo)<br>70% (Fuera de plazo aceptable)<br>40% (Con perjuicio)<br>0% (Continuamente fuera)                                                            |
| **% Rechazos**               | **10%** | $(Viajes \ Programados \ - \ Nº \ Rechazos \ Checklist) \ / \ Viajes \ Programados$                                                                                               |
| **% ON TIME (EAL)**          | **20%** | Basado en ETA a destino:<br>< 36h: 100%<br>< 38h: 80%<br>< 40h: 50%<br>>= 40h: 0%                                                                                                 |
| **FR CRÍTICO**               | **25%** | Viajes con excursión térmica crítica (Fuera de Rango).<br>Fórmula: $(Viajes \ Ejecutados \ - \ (Viajes \ FR \ Crítico \ \times \ 6)) \ / \ Viajes \ Ejecutados$                   |
| **FR MEDIO**                 | **10%** | Fórmula: $(Viajes \ Ejecutados \ - \ (Viajes \ FR \ Medio \ \times \ 3)) \ / \ Viajes \ Ejecutados$                                                                               |
| **FR LEVE**                  | **5%**  | Fórmula: $(Viajes \ Ejecutados \ - \ Viajes \ FR \ Leve) \ / \ Viajes \ Ejecutados$                                                                                               |
| **SNC / PNC**                | **10%** | Servicio o Producto No Conforme.<br>_(Nota: En viajes de producto seco, este peso sube al 50%)_.<br>Fórmula: $(Viajes \ Ejecutados \ - \ Viajes \ SNC) \ / \ Viajes \ Ejecutados$ |

**Nueva Métrica agregada (dic-2025):**  
**% Entrega de Notificaciones Email** → 5% adicional (calculado vía webhooks de Resend: delivered / sent). Impacta positivamente el puntaje global cuando >98%.