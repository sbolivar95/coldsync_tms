# 📘 ColdSync Lanes

## Geometría Operativa de la Red (Network Operational Geometry)

---

## 1. Naturaleza del Sistema

### 1.1 Qué es ColdSync Lanes

ColdSync Lanes es la **capa de definición geométrica y operativa** de la red de transporte dentro de ColdSync.

Transforma **corredores comerciales recurrentes** en **activos de planificación reutilizables, medibles y tarifables**.

ColdSync Lanes existe exclusivamente para responder:

> ¿Cuál es la geometría operativa, las paradas, los tiempos y la distancia de este corredor comercial?

---

### 1.2 Qué problema resuelve

Sin una definición formal de corredores:

* Cada orden se planifica desde cero
* No hay consistencia en rutas
* No hay base para tarifación
* No hay métricas comparables

ColdSync Lanes estandariza:

**Corredor Recurrente → Lane Definido → Ruta Reutilizable → Base de Tarifación**

---

### 1.3 Qué NO es ColdSync Lanes

* No ejecuta viajes
* No asigna vehículos
* No monitorea unidades
* No calcula costos directamente
* No gestiona contratos

Es una **capa de definición de geometría operativa**.

---

## 2. Objeto Conceptual Central: Lane

Un Lane es una **ruta logística predefinida y recurrente** que representa un corredor comercial estratégico.

Propiedades fundamentales:

* Secuencia fija de ubicaciones (origen → paradas → destino)
* Distancia total conocida
* Tiempo de tránsito estimado
* Buffer operacional para variabilidades
* Clasificación por tipo de operación

Un Lane no es un viaje.
Un Lane es el **molde** del cual se crean viajes.

---

## 3. Componentes de un Lane

### 3.1 Identificación

* **Lane ID:** Código único (ej: "LA-001", "BUENOS_AIRES-ROSARIO")
* **Nombre:** Descripción comercial (ej: "Carril Principal Buenos Aires - Rosario")
* **Tipo de Lane:** Línea Troncal, Distribución Regional, Recogida Local, Retorno (Backhaul), Especial

---

### 3.2 Geometría: Paradas (Lane Stops)

Un Lane está compuesto por una **secuencia ordenada de paradas**.

Cada parada representa:
* Una ubicación física
* Un tipo de operación
* Un tiempo estimado de permanencia
* Un orden secuencial

---

#### 3.2.1 Tipos de Paradas

**PICKUP (Carga):**
* Punto de origen del viaje
* Donde se recoge la mercancía
* Obligatoria
* Debe ser la primera parada

**DROP_OFF (Descarga):**
* Punto de destino del viaje
* Donde se entrega la mercancía
* Obligatoria
* Debe ser la última parada

**MANDATORY_WAYPOINT (Control Obligatorio):**
* Parada intermedia requerida
* Ejemplos:
  * Inspección térmica
  * Control aduanal
  * Punto de transferencia
  * Inspección sanitaria
* No se puede omitir

**OPTIONAL_WAYPOINT (Parada Opcional):**
* Parada intermedia sugerida
* Ejemplos:
  * Punto de descanso del conductor
  * Estación de servicio
  * Área de estacionamiento
* Puede omitirse según necesidad operativa

---

#### 3.2.2 Atributos de Parada

* **Ubicación:** Referencia a Location existente (coordenadas, dirección, horarios, restricciones)
* **Orden Secuencial:** Posición en la secuencia (1, 2, 3...)
* **Duración Estimada:** Tiempo de permanencia (carga/descarga, inspección, documentación)
* **Notas:** Observaciones específicas (ej: "Requiere cita previa", "Inspección térmica obligatoria")

---

#### 3.2.3 Reglas de Validación de Paradas

Un Lane válido debe cumplir:

1. **Mínimo 2 paradas:** Origen (PICKUP) + Destino (DROP_OFF)
2. **Primera parada = PICKUP:** No puede iniciar con otro tipo
3. **Última parada = DROP_OFF:** No puede terminar con otro tipo
4. **No ubicaciones consecutivas repetidas:** Evita loops innecesarios
5. **Orden secuencial continuo:** 1, 2, 3... sin saltos

---

### 3.3 Atributos Operacionales

* **Distancia:** Kilómetros reales de recorrido (base para consumo, desgaste, tarifación)
* **Transit Time:** Tiempo de conducción pura sin paradas (incluye descansos obligatorios)
* **Operational Buffer:** Margen de seguridad para variabilidades (congestión, inspecciones, retrasos menores). Típicamente 1-3 horas
* **ETA Total:** `Transit Time + Dwell Time + Operational Buffer` (base para compromisos de entrega y penalidades)

---

### 3.4 Estado del Lane

* **Activo:** Disponible para nuevas órdenes, visible en selección, incluido en capacidad
* **Inactivo:** No disponible para nuevas órdenes, preservado para auditoría, puede reactivarse

---

## 4. Relación con Otros Módulos

### 4.1 Lanes → Dispatch Orders

**Relación:**
Cada orden de despacho se asigna a un Lane específico.

**Flujo:**
```
Lane (ruta predefinida)
  ↓
Dispatch Order (instancia de ejecución)
  ↓
Asignación a Carrier + Fleetset
  ↓
Ejecución con tracking en tiempo real
```

**Datos Heredados:**
* Secuencia de paradas
* Distancia total
* Tiempo estimado de tránsito
* Buffer operacional
* ETA calculado

**Implicación:**
Sin Lane asignado, una orden no tiene ruta definida.

---

### 4.2 Lanes → Rate Cards (Tarifación)

**Relación:**
Las tarifas se definen por Lane + Carrier Contract + Thermal Profile.

**Estructura:**
```
Lane: "Buenos Aires - Rosario"
  ├─ Rate Card (Carrier A, Perfil Frío -18°C): $500/Tn
  ├─ Rate Card (Carrier A, Perfil Fresco 2-8°C): $450/Tn
  └─ Rate Card (Carrier A, Genérica): $480/Tn
```

**Implicación:**
* El Lane determina qué Rate Cards están disponibles
* El perfil térmico de los productos determina cuál Rate Card se aplica
* Sin Lane asignado = sin tarifa = no se puede calcular costo

**Principio:**
> Un Lane es la unidad mínima de tarifación.

---

### 4.3 Lanes → Carriers (Transportistas)

**Relación:**
Un Lane puede ser servido por múltiples Carriers.

**Gestión de Capacidad:**
* Carriers se asignan a Lanes según capacidad contratada
* Cada Carrier tiene contratos específicos por Lane
* Los contratos definen capacidad, frecuencia y tarifas

**Optimización de Retorno (Backhaul):**
* Lanes permiten identificar oportunidades de retorno
* Carriers pueden ofrecer capacidad disponible en Lane de retorno
* Reduce millas muertas y costos operativos

---

### 4.4 Lanes → Locations (Ubicaciones)

**Relación:**
Las paradas de un Lane referencian Locations existentes.

**Validación:**
* Las ubicaciones deben existir en el sistema
* Las ubicaciones deben permitir el tipo de parada asignado
* Las ubicaciones no pueden repetirse consecutivamente

**Herencia de Propiedades:**
* Coordenadas geográficas para mapeo
* Horarios de operación
* Restricciones de acceso
* Tiempo de permanencia predeterminado

---

### 4.5 Lanes → Thermal Profiles (Perfiles Térmicos)

**Relación Indirecta:**
* Los Lanes no tienen perfil térmico directo
* Los productos en órdenes tienen perfiles térmicos
* El perfil térmico determina qué Rate Card se usa para ese Lane

**Implicación:**
* Diferentes productos en el mismo Lane pueden tener diferentes tarifas
* El Lane debe tener Rate Cards para los perfiles térmicos esperados
* Sin Rate Card para un perfil térmico = no se puede calcular costo

---

## 5. Ciclo de Vida de un Lane

1. **Creación:** Definir corredor, origen/destino, paradas, distancia, tiempos
2. **Configuración:** Crear Rate Cards, asignar Carriers, definir restricciones
3. **Operación:** Crear órdenes, asignar recursos, monitorear ejecución
4. **Análisis:** Medir cumplimiento, costos, desviaciones, utilización
5. **Mantenimiento:** Actualizar distancias, tiempos, paradas según histórico

---

## 6. Casos de Uso Principales

1. **Planificación Estratégica:** Definir capacidad comprometida, crear Lanes, asignar Carriers, definir tarifas
2. **Despacho Operativo:** Seleccionar Lane, asignar Carrier, calcular costo automáticamente
3. **Optimización de Retorno (Backhaul):** Identificar capacidad disponible, buscar cargas de retorno
4. **Monitoreo y Alertas:** Detectar desviaciones de tiempo y temperatura, registrar eventos
5. **Conciliación Financiera:** Comparar costo tarifado vs. real, aplicar penalidades

---

## 7. Métricas y KPIs

**Por Lane:**
* Volumen (Tn/mes), viajes ejecutados, utilización de capacidad (%)
* Cumplimiento de tiempos (%), desviaciones térmicas, paradas no realizadas
* Costo promedio ($/Tn, $/km), variación tarifado vs. real (%)
* Carriers activos, desempeño por Carrier, capacidad disponible vs. utilizada

**Por Orden:**
* Tiempo real vs. ETA, tiempo en paradas vs. estimado, retrasos acumulados
* Temperatura min/max vs. rango, eventos de desviación térmica, duración
* Costo real vs. tarifado, penalidades aplicadas, cargos adicionales
* Eventos registrados, eventos críticos, eventos resueltos

---

## 8. Principios Rectores

* **Estandarización:** La forma predecible, medible y tarifable de ejecutar un corredor (no la más rápida ni la más barata)
* **Reutilización:** Se define una vez, se usa muchas veces. Cada orden hereda geometría, tiempos y paradas
* **Trazabilidad:** Base para comparación (ETA vs. Real). Sin Lane, no hay base de comparación
* **Tarifabilidad:** Unidad mínima de tarifación. Se tarifa por Lane completo + Perfil Térmico + Peso

---

## 9. Inmutabilidad de la Geometría

Una vez que una orden se asigna a un Lane:

* La secuencia de paradas no cambia
* La distancia no cambia
* El ETA base no cambia

La geometría del Lane es inmutable para la orden.

---

## 10. Modelo Final

**Corredor Recurrente → Lane Definido → Orden Asignada → Ejecución Monitoreada → Análisis de Desempeño**

---

## 11. Experiencia Operativa (UX) de Lanes

**Vista Principal:**
Catálogo de corredores con filtros por tipo, estado, origen/destino, distancia, tiempo

**Usuarios Objetivo:**
Planner estratégico, coordinador de operaciones, analista de costos, gerente de contratos

**Flujo de Creación:**
1. Información básica (código, nombre, tipo, distancia, estado)
2. Definir paradas (origen → intermedias → destino)
3. Configurar tiempos (tránsito, buffer)
4. Validación automática → Guardar

**Características:**
- Auto-llenado de tiempos de permanencia desde ubicaciones
- Auto-asignación de tipos de parada (primera=PICKUP, última=DROP_OFF)
- Validación topológica en tiempo real
- Visualización de secuencia con indicadores de error
- Cálculo automático de ETA Total y métricas

---

## 12. Relación con Dispatch

**Flujo de Creación de Orden:**
1. Seleccionar Lane → carga automáticamente paradas, distancia, tiempos
2. Configurar orden → fecha, productos, perfiles térmicos
3. Asignar Carrier → muestra Carriers y Rate Cards disponibles
4. Calcular costo → automático basado en Lane + Carrier + Perfil + Peso
5. Crear orden → hereda geometría del Lane

**Herencia:**
* La orden **hereda:** Paradas, ubicaciones, distancia, tiempos, buffer
* La orden **no hereda:** Carrier, vehículo, conductor, productos, fecha

---

## 13. Conclusión

Los **Lanes son el eje central de la planificación y ejecución** en ColdSync TMS.

Conectan estrategia (capacidad, tarifas), operación (rutas, asignaciones), finanzas (costos, penalidades) y monitoreo (tracking, cumplimiento).

Sin Lanes bien definidos, el sistema no puede calcular costos automáticamente, garantizar cumplimiento de SLA, optimizar utilización de flota ni conciliar financieramente.

---

**Última actualización:** 07/02/2026
