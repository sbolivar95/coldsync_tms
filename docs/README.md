# 📘 ColdSync - ADN y Documentación Técnica

**ColdSync** es un TMS (Transportation Management System) especializado en **Line Haul de Cadena de Frío**. Nuestra misión es profesionalizar el transporte de media y larga distancia para la industria de alimentos perecederos, garantizando la predictibilidad operativa y comercial.

## 🧬 ADN de Coldsync
Coldsync no es un sistema de gestión de última milla ni un marketplace de carga spot. Es la columna vertebral para organizaciones que manejan **carga propia** con **flota contratada o propia**, donde la relación se basa en acuerdos de largo plazo y estándares de calidad innegociables.

## 🏛️ Los Tres Pilares Operativos

El sistema resuelve los problemas críticos de la industria en tres áreas fundamentales:

### 1. Planificación (Strategic Mapping)
*   **[Gestión de Lanes](./business/lanes.md):** Definición de carriles comerciales como corredores operativos reutilizables.
*   **Contratos Maestros:** Digitalización del paraguas legal que rige la relación con el carrier.
*   **Allocation Rules:** Garantía de cumplimiento de volumen y cupos por contrato.
*   **Backhaul Optimization:** Planificación de circuitos de retorno para optimización de costos.

### 2. Ejecución (Real-Time Control)
*   **Integridad Térmica:** Monitoreo persistente mediante telemetría IoT (Flespi).
*   **Torre de Control:** Visibilidad total de la flota en carriles (lanes) interregionales y nacionales.
*   **Gestión de Observancias:** Registro en tiempo real de desviaciones térmicas y de puntualidad.

### 3. Conciliación (Financial Settlement)
*   **Motor de Costos:** Cálculo automático basado en contratos, tiers de peso y tipos de servicio.
*   **Sistema de Penalidades:** Aplicación de multas automatizadas basadas en reglas de severidad y contextos de transporte.
*   **Liquidación (Audit):** Preparación de la "Pre-factura" validada para evitar disputas comerciales.

## 📊 Alcance Operativo

### ✅ Dentro del Alcance (Core Line Haul)
- Movimientos primarios: Fábrica → CD, CD → CD, CD → Mayorista.
- Tramos de larga distancia con estricto control de frío.
- Gestión de flota dedicada y lealtad contractual.

### ❌ Fuera de Alcance (Out of Scope)
- **Última Milla:** Reparto capilar urbano de paquetería.
- **Spot Market:** Subastas de oportunidad (modelo Uber Freight externo).

---

---

## 🔄 Flujo General del Sistema

```
Demanda → Planificación → Disponibilidad → Programación → Pre-embarque → Despacho → Ejecución → Conciliación
```

1. **Demanda:** Órdenes de transporte ingresadas al sistema
2. **Planificación:** Asignación tentativa de recursos (soft booking)
3. **Disponibilidad:** Validación y aceptación por parte del transportista
4. **Programación:** Tránsito hacia el origen
5. **Pre-embarque:** Validación física en planta
6. **Despacho:** Emisión de BOL y salida física
7. **Ejecución:** Seguimiento en tiempo real (Torre de Control)
8. **Conciliación:** Auditoría post-viaje y facturación

---

## 📚 Estructura de la Documentación

### [Frontend](./frontend/README.md)
Stack tecnológico, arquitectura de la aplicación, sistema de diseño, componentes y navegación.

### [Supabase](./supabase/README.md)
Base de datos, estructura de datos, esquemas y modelo de dominio (entidades).

### [Development](./development/README.md)
Convenciones de desarrollo, estándares de código y guías para contribuidores.

### [Business](./business/README.md)
Flujos operativos, reglas de negocio, estados y KPIs. Incluye documentación detallada sobre gestión de usuarios y organizaciones.

### [UI/Design System](./ui/README.md)
Sistema de diseño, componentes UI y patrones de interfaz.

### [Características por Módulo](./features/README.md)
Documentación detallada de funcionalidades específicas (ej: **[Lanes](./business/lanes.md)**).

## 🚀 Inicio Rápido

- **Nuevo en el proyecto?** → Empieza por [Frontend](./frontend/README.md) y [Business](./business/README.md)
- **Desarrollando features?** → Consulta [Frontend](./frontend/README.md) y [Development](./development/README.md)
- **Configurando base de datos?** → Revisa [Supabase](./supabase/README.md)
- **Entendiendo el negocio?** → Lee [Business](./business/README.md)
- **Entendiendo el negocio?** → Lee [Business](./business/README.md)

## 🔧 Convenciones de Desarrollo

- **Convenciones de Commits:** Ver [development/commit-convention.md](./development/commit-convention.md) para el formato y estándares de mensajes de commit
- **Reglas de Código:** Ver [.cursor/rules/ai-rules.md](../.cursor/rules/ai-rules.md) para guías de desarrollo y mejores prácticas
- **Reglas de Base de Datos:** Ver [.cursor/rules/data-base-rules.md](../.cursor/rules/data-base-rules.md) para reglas de esquema, multi-tenancy y seguridad
- **TypeScript:** Ver [.cursor/rules/typescript-rules.md](../.cursor/rules/typescript-rules.md) y [development/typescript.md](./development/typescript.md) para estándares de TypeScript
- **Reutilización de Componentes:** Ver [.cursor/rules/component-reuse.rules.md](../.cursor/rules/component-reuse.rules.md) para componentes disponibles

## 📝 Notas

- Esta documentación está organizada por responsabilidades (frontend, backend, business)
- Cada sección tiene su propio README con detalles específicos
- Para contribuir, consulta las guías en cada sección

---

**Última actualización:** Enero 2026
