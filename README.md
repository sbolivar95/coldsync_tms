# ColdSync TMS: Professional Line Haul for Cold Chain

**ColdSync** es un TMS (Transportation Management System) de alto nivel diseñado específicamente para la gestión de **Line Haul (Línea Troncal)** en la cadena de frío de media y larga distancia. A diferencia de los sistemas de última milla o mercado spot, ColdSync se enfoca en la **previsibilidad, el cumplimiento contractual y la integridad térmica** de cargas críticas (alimentos, carnes, lácteos).

La plataforma orquesta la relación estratégica entre dueños de carga (Shippers) y transportistas (Carriers) bajo un modelo de flota contratada y capacidad asegurada.

## 🏛️ Los Tres Pilares Operativos

Nuestra solución ataca de raíz los dolores de planificación, ejecución y conciliación:

1.  **Planificación Estratégica:** Gestión de **Lanes (Carriles)**, contratos maestros, tarifarios dinámicos y **Reglas de Asignación (Allocation)** para garantizar el volumen prometido a los socios logísticos.
2.  **Ejecución con Integridad:** Monitoreo IoT en tiempo real con enfoque en la **persistencia térmica** y gestión de eventos en rutas de larga distancia. Incluye la optimización de activos mediante lógica de **Backhaul (Retorno)** para eliminar millas muertas.
3.  **Conciliación y Auditoría:** Motor de costos automatizado que integra penalidades por desviaciones térmicas o de tiempo, validación documental y liquidación financiera transparente.

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** con TypeScript
- **Vite** (build tool y dev server)
- **Tailwind CSS** para estilos
- **shadcn/ui** + **Radix UI** para componentes
- **Zustand** para gestión de estado
- **React Router** para navegación
- **React Hook Form** + **Zod** para formularios y validación
- **Recharts** para visualización de datos

### Backend & Infraestructura
- **Supabase** (BaaS) - Autenticación, base de datos y backend
- **Flespi** - Gateway IoT para telemetría de dispositivos reefer
- **Resend** - Servicio de email transaccional

## 📋 Requisitos Previos

- **Node.js** >= 18.x
- **npm** >= 9.x (o equivalente como yarn/pnpm)
- Cuenta de **Supabase** configurada (para producción)
- Variables de entorno configuradas (si aplica)

## 🚀 Instalación y Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las variables necesarias (consulta la documentación técnica para más detalles).

### 3. Iniciar servidor de desarrollo

```bash
npm run dev
```

El servidor se iniciará en `http://localhost:3000` y se abrirá automáticamente en tu navegador.

## 📜 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo con hot-reload
- `npm run build` - Genera la build de producción en la carpeta `build/`

## 📁 Estructura del Proyecto

```
coldsync_tms/
├── src/
│   ├── components/       # Componentes reutilizables (UI y widgets)
│   ├── features/         # Módulos de funcionalidad (Despacho, Control Tower, etc.)
│   ├── layouts/          # Layouts de aplicación
│   ├── pages/            # Páginas principales
│   ├── routes/           # Configuración de rutas
│   ├── stores/           # Estado global (Zustand)
│   ├── lib/              # Utilidades y helpers
│   └── styles/           # Estilos globales
├── docs/                 # Documentación técnica completa
├── build/                # Build de producción (generado)
└── public/              # Archivos estáticos
```

## 📚 Documentación

Para información detallada sobre:
- Arquitectura del sistema
- Flujos operativos
- Entidades y relaciones
- Integraciones (Flespi, Supabase)
- Estados y transiciones
- Guías de desarrollo

Consulta la **[Documentación Técnica Completa](./docs/README.md)**

## 📝 Notas Adicionales

- El proyecto utiliza **TypeScript** estrictamente
- Los componentes UI están basados en **shadcn/ui** y **Radix UI**
- El estado global se gestiona con **Zustand**
- La validación de formularios se realiza con **Zod** integrado con **React Hook Form**
- La aplicación está optimizada para producción con **Vite**

## 🤝 Contribución

Para contribuir al proyecto, por favor revisa la documentación técnica en `docs/README.md` para entender la arquitectura y los flujos operativos del sistema.

---

**Versión:** 0.1.0  
**Licencia:** Privada
