# Gestión de Usuarios y Organizaciones - ColdSync TMS  
**Versión Actualizada - Enero 2026**

## Visión General

ColdSync TMS es un sistema SaaS multi-tenant especializado en gestión de transporte de media y larga distancia a temperatura controlada que opera bajo un modelo de negocio B2B2B. El sistema conecta tres actores principales:

1. **Proveedores del SaaS (Platform Admins)** - Propietarios y desarrolladores del sistema con control total.
2. **Organizaciones (Shipper)** - Empresas generadoras de carga (clientes del SaaS) que necesitan servicios de transporte refrigerado.
3. **Transportistas (Carriers)** - Empresas proveedoras de servicios de transporte que operan dentro del ecosistema de cada Organización.

**Modelo de Negocio Clave:**
- Solo los proveedores del SaaS pueden crear y gestionar organizaciones (Shipper).
- Cada Organización (Shipper) opera en un tenant completamente aislado con sus propios transportistas, usuarios, productos, operaciones, etc.
- Las Organizaciones (Shippers) no pueden crear otras organizaciones.
- Los Carriers operan exclusivamente dentro del contexto de la Organización (Shipper) que los contrató y solo ven datos asociados a su propio `carrier_id`. No tienen acceso a datos de otros Carriers ni de otros Shippers.

El sistema implementa autenticación Supabase, invitaciones mediante **magic links**, roles granulares y Row Level Security (RLS) para garantizar el aislamiento completo de datos entre organizaciones.

**Aclaración clave**: La organización (`organizations`) es únicamente una entidad de datos empresariales con información fiscal, operativa y de contacto. El control y acceso a la organización se otorga exclusivamente mediante usuarios asociados a través de `organization_members`. El rol **OWNER** siempre corresponde a un usuario en Supabase Auth, nunca a la organización como entidad, sino como usuario vinculado a dicha organización.

## Estructura de Datos

### Tabla `organizations`
Entidad que representa a las Organizaciones (Shippers clientes del SaaS).

- **Campos principales**:
  - `comercial_name` (text)
  - `legal_name` (text)
  - `city` (text)
  - `base_country_id` (bigint)
  - `status` (enum: ACTIVE, INACTIVE) – Estado de la organización. Solo dos estados permitidos: ACTIVE (activa) e INACTIVE (inactiva). Las organizaciones con estados anteriores (SUSPENDED, CANCELED, PAST_DUE) fueron migradas a INACTIVE.
  - `tax_id` (text, UNIQUE) – NIT, RUC, etc.
  - `fiscal_address` (text)
  - `billing_email` (text)
  - `currency` (enum: BOB, USD, default 'USD')
  - `time_zone` (text, default 'America/La_Paz') – Nombre IANA de zona horaria
  - `contact_name` (text)
  - `contact_phone` (text)
  - `contact_email` (text)
  - `plan_type` (enum: STARTER, PROFESSIONAL, default 'PROFESSIONAL', NOT NULL)

### Tabla `organization_members`  
Relación entre usuarios reales (Supabase Auth) y organizaciones, con asignación de roles.

- **Campos**: `org_id`, `user_id`, `role`, `first_name`, `last_name`, `email`, `phone`, `is_active` (boolean, default: true), `status` (text)
- **Roles**: OWNER, ADMIN, STAFF, DRIVER
- **Nota**: El primer miembro con rol OWNER es quien tiene control total sobre la organización.
- **Campo `phone`**: Se almacena tanto en `organization_members.phone` como en `auth.users.user_metadata.phone` para mantener consistencia. El sistema prioriza `organization_members.phone` cuando está disponible.
- **Estados en Base de Datos**: Se gestionan mediante `is_active` y `status`:
  - **Activo**: `user_id IS NOT NULL AND is_active = true AND status = 'active'` (usuario activo con acceso completo)
  - **Suspendido**: `user_id IS NOT NULL AND is_active = false AND status = 'suspended'` (usuario suspendido temporalmente, reversible mediante reactivación)
  - **Eliminado (Soft Delete)**: `is_active = false AND status = 'inactive'` (usuario eliminado, no aparece en listas pero puede ser reactivado)
- **Estados en Interfaz de Usuario**: La UI solo muestra dos estados para simplificar:
  - **Activo**: Usuario con acceso completo al sistema
  - **Suspendido**: Usuario suspendido temporalmente, reversible mediante reactivación
- **Nota sobre eliminación**: Los usuarios eliminados no aparecen en la lista de usuarios activos, pero pueden ser reactivados mediante el formulario de creación manual.

## Roles

### Roles de Plataforma (Platform Roles)
- **DEV**: Desarrollador con acceso completo al sistema.
- **PLATFORM_ADMIN**: Administrador de plataforma SaaS, único con permisos para crear organizaciones Shipper y gestionar todos los recursos.

### Roles Organizacionales (Organization Roles)
- **OWNER**: Rol con acceso total a la organización Shipper. Puede editar información operativa y de contacto de su organización, gestionar usuarios y configuraciones dentro de su tenant. No puede modificar datos legales/fiscales críticos ni configuración administrativa (ver sección "Permisos de Edición de Organizaciones").
- **ADMIN**: Gestión de usuarios y configuración dentro de la organización. Puede gestionar usuarios con roles inferiores (STAFF, DRIVER) y tiene acceso a todos los tabs de configuración (Usuarios, Productos, Perfiles Térmicos).
- **STAFF**: Operaciones del TMS dentro de la organización. Puede gestionar usuarios con roles inferiores (DRIVER) y tiene acceso solo al tab "Usuarios". No tiene acceso a "Productos" ni "Perfiles Térmicos".
- **DRIVER**: Acceso limitado a asignaciones específicas. No tiene acceso a gestión de usuarios ni a los tabs de configuración (solo puede ver su propio perfil).

### Roles de Carrier
- **ADMIN**: Administrador del transportista.
- **STAFF**: Personal operativo del transportista.

**Importante**: No se permiten roles dobles. Un usuario con rol DEV o PLATFORM_ADMIN no puede ser miembro de ninguna organización Shipper como OWNER, ADMIN, STAFF o DRIVER.

## Restricciones de Acceso

### Creación de Organizaciones
- Solo los roles DEV y PLATFORM_ADMIN pueden crear organizaciones Shipper.
- Las organizaciones Shipper y los Carriers no pueden crear organizaciones.
- La sección "Empresas" en Settings es visible para roles DEV, PLATFORM_ADMIN y OWNER.
  - **Platform Admins (DEV/PLATFORM_ADMIN)**: Ven lista completa de todas las organizaciones, pueden crear, editar todos los campos y eliminar.
  - **OWNER**: Ve únicamente su propia organización en vista de detalle, puede editar solo campos operativos (ver sección "Permisos de Edición de Organizaciones"), no puede crear ni eliminar organizaciones.
- Al crear una organización, **solo se registran los datos de la empresa**. No se genera ningún usuario ni credencial en este paso.

### Gestión de Usuarios
- Toda la gestión de usuarios (incluido el primer usuario con rol OWNER) se realiza exclusivamente desde la sección "Usuarios" dentro de una organización existente.
- El Platform Admin debe acceder manualmente a la nueva organización y crear el primer miembro con rol OWNER mediante uno de los dos métodos disponibles (invitación por magic link o creación directa).
- No hay solapamiento entre la creación de organizaciones y la gestión de usuarios.

### Modificación de Roles
- Nadie puede modificar su propio rol (ni para subirlo ni para bajarlo).
- Solo un rol superior o con privilegios equivalentes puede modificar el rol de otro usuario:
  - OWNER puede modificar cualquier rol dentro de su organización.
  - ADMIN puede modificar solo roles inferiores (STAFF, DRIVER).
  - STAFF puede modificar solo roles inferiores (DRIVER).
  - DRIVER no puede modificar roles (no tiene acceso a gestión de usuarios).
  - DEV y PLATFORM_ADMIN pueden modificar cualquier rol en cualquier organización.

### Permisos de Edición de Organizaciones

El sistema implementa permisos granulares para la edición de campos de organizaciones, siguiendo el principio de menor privilegio y mejores prácticas de seguridad.

#### Campos Editables por OWNER
El rol OWNER puede editar únicamente campos operativos y de contacto de su propia organización:

- ✅ `comercial_name` - Nombre comercial
- ✅ `city` - Ciudad
- ✅ `base_country_id` - País base
- ✅ `currency` - Moneda operativa
- ✅ `time_zone` - Zona horaria
- ✅ `contact_name` - Nombre del contacto
- ✅ `contact_phone` - Teléfono del contacto
- ✅ `contact_email` - Email del contacto
- ✅ `fiscal_address` - Dirección fiscal

#### Campos de Solo Lectura para OWNER
El rol OWNER **NO puede editar** los siguientes campos críticos (solo Platform Admins pueden modificarlos):

- ❌ `legal_name` - Razón social (requiere cambios legales formales)
- ❌ `tax_id` - Identificación fiscal (crítico para facturación y compliance)
- ❌ `billing_email` - Email de facturación (afecta recepción de facturas)
- ❌ `plan_type` - Tipo de plan (afecta facturación y servicios)
- ❌ `status` - Estado de la organización (tiene implicaciones contractuales)

**Justificación**: Estos campos tienen implicaciones legales, fiscales y administrativas críticas. Su modificación debe ser controlada exclusivamente por Platform Admins para garantizar seguridad, compliance y prevención de fraude.

#### Permisos de Platform Admins
Los roles DEV y PLATFORM_ADMIN pueden editar **todos los campos** de cualquier organización, incluyendo los campos críticos restringidos para OWNER.

### Aislamiento por Tenant
- Cada organización solo ve entidades relacionadas a su `org_id`.
- Los usuarios con roles (OWNER, ADMIN, STAFF, DRIVER) tienen acceso exclusivo a su tenant.
- Los usuarios con roles Carrier solo ven datos de su propio `carrier_id` dentro de la Organización (Shipper) que los contrató.
- Row Level Security (RLS) garantiza aislamiento completo de datos por `org_id` y `carrier_id` cuando corresponda.

## Flujos Principales

### 1. Crear Organización (Solo Platform Admins)
1. Platform Admin abre Settings → Empresas → "Crear".
2. Completa datos de la organización (nombre comercial, razón social, ciudad, país, tax_id, dirección fiscal, moneda, zona horaria, contacto, plan, etc.).
3. Sistema crea únicamente la entidad `organizations`.
4. Organización queda en estado **ACTIVE** por defecto, pero sin usuarios asociados.
5. El Platform Admin debe acceder a la sección "Usuarios" de la nueva organización para crear el primer usuario con rol OWNER (ver flujos 2 o 3).

**Nota sobre estados de organizaciones**: El sistema utiliza únicamente dos estados para organizaciones: **ACTIVE** (activa) e **INACTIVE** (inactiva). Las organizaciones pueden cambiar entre estos dos estados mediante la edición del campo `status` (solo Platform Admins pueden modificar este campo).

### 2. Método de Invitación por Magic Link (Registro Diferido)
**Flujo recomendado y principal para incorporar usuarios**

1. Usuario con permisos (OWNER, ADMIN, STAFF o Platform Admin) abre Settings → Usuarios → "Enviar Invitación".
2. Completa: nombre, apellido, email, teléfono (opcional), rol (incluido OWNER para el primer usuario).
   - OWNER puede asignar cualquier rol (OWNER, ADMIN, STAFF, DRIVER).
   - ADMIN puede asignar solo roles inferiores (STAFF, DRIVER).
   - STAFF puede asignar solo roles inferiores (DRIVER).
   - DRIVER no tiene acceso a gestión de usuarios.
3. Organización se asigna automáticamente.
4. Sistema genera un magic link único y temporal mediante Supabase.
5. Envía email automático con un botón prominente **"Unirse a ColdSync TMS"** que contiene el magic link.
6. Al hacer click en el magic link:
   - Si ya tiene cuenta → entra directamente a la organización.
   - Si es nuevo → se le pide definir contraseña → entra.
7. Usuario queda en estado **"Activo"** cuando se crea `user_id` en `organization_members` y `is_active = true`.
8. El teléfono se guarda en `organization_members.phone` y `auth.users.user_metadata.phone`.

**Ventajas**:
- Máxima simplicidad: un solo click para unirse.
- Usuario controla su contraseña desde el inicio.
- Proceso seguro sin compartir credenciales ni códigos manuales.
- Consistencia: Ambos métodos (magic link y creación directa) requieren que el usuario defina su propia contraseña.

**Nota técnica**: Los magic links expiran automáticamente según la configuración global de Supabase (Dashboard → Settings → Auth → Rate Limits). La expiración es global para todos los magic links y no se puede configurar por invitación individual. Los magic links son de un solo uso (one-time use only) y se invalidan automáticamente después del primer uso.

**Recuperación de acceso**: Si el usuario pierde sus accesos o el magic link expira, debe utilizar el método de recuperación de contraseña disponible en la página de login. Si el usuario quedase suspendido, luego de reactivarse debería ingresar normalmente por los métodos disponibles.

### 3. Método de Creación Directa (Registro Inmediato)
**Flujo alternativo para acceso inmediato o usuarios internos**

1. Usuario con permisos (OWNER, ADMIN, STAFF o Platform Admin) abre Settings → Usuarios → "Crear".
2. Completa: nombre, apellido, email, teléfono (opcional), rol (incluido OWNER para el primer usuario).
   - OWNER puede asignar cualquier rol (OWNER, ADMIN, STAFF, DRIVER).
   - ADMIN puede asignar solo roles inferiores (STAFF, DRIVER).
   - STAFF puede asignar solo roles inferiores (DRIVER).
   - DRIVER no tiene acceso a gestión de usuarios.
3. Sistema crea usuario en Supabase Auth + membresía automáticamente.
4. Genera contraseña temporal segura (12 caracteres, alfanumérica).
5. Modal muestra credenciales (email + contraseña temporal) para **copiar y entregar** al usuario por un canal seguro (no se envían por email inseguro).
6. Usuario queda "Activo" inmediatamente (`user_id` creado y `is_active = true`).
7. El teléfono se guarda en `organization_members.phone` y `auth.users.user_metadata.phone`.
8. **Cambio obligatorio de contraseña en primer login**:
   - El usuario intenta iniciar sesión con la contraseña temporal.
   - El sistema detecta que es el primer login o que la contraseña es temporal (marcado en `user_metadata.temp_password`).
   - **Redirige automáticamente a `/set-password`** (reutiliza el mismo flujo que magic link).
   - El usuario define su nueva contraseña personal.
   - Una vez cambiada, accede normalmente al sistema.
   - El acceso al resto del sistema queda bloqueado hasta completar el cambio.

**Ventajas**:
- **Consistencia**: Ambos métodos (magic link y creación directa) requieren que el usuario defina su propia contraseña.
- **Seguridad**: El administrador nunca conoce la contraseña final del usuario.
- **Reutilización**: Se utiliza el mismo flujo `/set-password` para ambos métodos.
- **Mejores prácticas**: Cumple con estándares de seguridad empresarial (OWASP).

**Nota técnica**: El sistema marca en `user_metadata` o detecta automáticamente si el usuario necesita cambiar su contraseña. El middleware o guard de rutas verifica esta condición y redirige a `/set-password` si es necesario, bloqueando el acceso al resto de la aplicación hasta completar el cambio.

## Estados de Usuario y Transiciones

### Estados Principales en la Interfaz
La interfaz de usuario muestra únicamente dos estados para simplificar la gestión:
- **Activo**: Usuario con acceso completo al sistema. Visible en la lista de usuarios.
- **Suspendido**: Usuario suspendido temporalmente, reversible mediante reactivación. Visible en la lista de usuarios.

### Estados en Base de Datos
Internamente, el sistema gestiona tres estados mediante `is_active` y `status`:
- **Activo**: `is_active = true AND status = 'active'` - Usuario con acceso completo
- **Suspendido**: `is_active = false AND status = 'suspended'` - Usuario suspendido temporalmente
- **Eliminado (Soft Delete)**: `is_active = false AND status = 'inactive'` - Usuario eliminado, no visible en listas

### Eliminación de Usuarios (Soft Delete)
- Los usuarios se eliminan mediante **soft delete**: se marca `is_active = false` y `status = 'inactive'`.
- Los usuarios eliminados **no aparecen en la lista de usuarios** (filtrados por `status != 'inactive'`).
- Los usuarios eliminados **no pueden iniciar sesión** (el sistema verifica `is_active = true` en autenticación).
- Los usuarios eliminados pueden ser **reactivados** mediante el formulario de creación manual:
  - Al reactivar un usuario eliminado, el sistema genera una nueva contraseña temporal.
  - Se muestra un diálogo con las credenciales (email + contraseña temporal) para copiar y entregar al usuario.
  - El usuario debe cambiar la contraseña en su primer login.

### Suspensión de Usuarios
- Los usuarios se suspenden estableciendo `is_active = false` y `status = 'suspended'` en `organization_members`.
- Los usuarios suspendidos **aparecen en la lista** con estado "Suspendido".
- Los usuarios suspendidos **no pueden iniciar sesión** y reciben el mensaje: "Acceso bloqueado, contacta al administrador".
- **Sistema de baneo de dos capas**: La suspensión actualiza tanto `is_active` en `organization_members` como `banned_until` en `auth.users` mediante la Edge Function `sync-banned-until`. Supabase bloquea nativamente el login cuando `banned_until` está activo.
- Los usuarios suspendidos pueden ser **reactivados** mediante la acción "Reactivar", que actualiza `is_active = true`, `status = 'active'` y establece `banned_until = NULL` en `auth.users`.

### Autenticación y Validación de Estados
- El sistema valida `is_active = true` en los siguientes puntos:
  - **Login**: Supabase bloquea nativamente si `banned_until` está activo. El sistema verifica `is_active = true` en `organization_members` después de la autenticación.
  - **Sesión actual**: Se verifica al obtener la sesión actual (`getCurrentSession`).
  - **Cambio de organización**: Se verifica al cambiar de organización (`switchOrganization`).
- **Diferenciación de mensajes de error**:
  - Usuario suspendido (`status = 'suspended'`): "Acceso bloqueado, contacta al administrador"
  - Usuario eliminado (`status = 'inactive'`): "Credenciales inválidas"
- El sistema utiliza un cliente admin temporal para verificar el estado real cuando RLS bloquea el acceso a membresías inactivas.

### Matriz de Transiciones
```
Nuevo → Activo (método invitación por magic link)
Nuevo → Activo (método directo - usuario creado con credenciales)
Activo ↔ Suspendido (suspender/reactivar por administrador superior)
Activo → Eliminado (soft delete - no visible en listas)
Eliminado → Activo (reactivación manual - genera nueva contraseña temporal)
Suspendido → Activo (reactivar usuario - actualiza is_active = true y status = 'active')
```

### Confirmación de Eliminación
- La eliminación de usuarios (individual o masiva) requiere confirmación mediante un diálogo.
- El diálogo muestra el nombre del usuario y advierte que no podrá acceder al sistema.
- La eliminación masiva muestra la cantidad de usuarios seleccionados.

## Gestión de Resiliencia y Sesión

Para garantizar una experiencia fluida incluso tras periodos de inactividad prolongados (pestañas inactivas del navegador), el sistema implementa un patrón de **Control de Concurrencia de Sesión**.

### Concurrencia y Sincronización (Promise Gating)
El sistema utiliza un patrón de *Promise Gating* en el `authService` para gestionar múltiples solicitudes simultáneas de sincronización de sesión:
- **Propósito**: Evitar múltiples llamadas redundantes a Supabase y la base de datos cuando la aplicación se "despierta" (ej. cuando el navegador reactiva los timers de JS al volver a la pestaña).
- **Mecanismo**: Si una solicitud de `getCurrentSession()` está en curso, cualquier otro componente o hook que la solicite recibirá la misma promesa activa en lugar de iniciar una nueva. Esto previene condiciones de carrera (race conditions).

### Resiliencia a la Inactividad
- **Auto-Refresco Nativo**: Se delega la renovación de tokens JWT exclusivamente en el mecanismo `autoRefreshToken: true` de Supabase. Los tokens (`access_token`, `refresh_token`) se almacenan en `localStorage` por Supabase internamente (`persistSession: true`), no en el store Zustand.
- **Eliminación de Redundancia**: Se han eliminado los listeners manuales de `focus` que disparaban sincronizaciones pesadas, dejando únicamente el listener global de `onAuthStateChange` para actualizar el estado de la aplicación.
- **Pre-Sincronización Crítica**: Métodos de mutación de estado como `switchOrganization` realizan un `await` preventivo sobre la sincronización de la sesión actual. Esto garantiza que cualquier proceso de refresco de token en curso finalice satisfactoriamente antes de realizar peticiones al servidor.

### Estado de Inicialización Compartido
- El estado `isAuthInitializing` se gestiona en Zustand (`useAppStore`) como estado compartido entre componentes, no en `useState` local del hook.
- Esto garantiza que múltiples componentes que consumen `useAuth()` vean el mismo estado de inicialización.
- El listener global de `onAuthStateChange` se registra una sola vez, después de que la inicialización completa.

### Eventos de Auth y Estrategia de Manejo
El listener global de `onAuthStateChange` maneja cada evento según su semántica real:

| Evento | Comportamiento | Justificación |
|---|---|---|
| `SIGNED_IN` (login genuino) | Fetch completo de metadata (user + org + memberships) vía `syncAuthSession()` | El usuario recién se autenticó, se necesita cargar toda la información |
| `SIGNED_IN` (tab-return) | **No-op** si ya está autenticado | Supabase dispara `SIGNED_IN` en cada retorno de pestaña vía `_recoverAndRefresh()`. Re-fetchar bloquearía el pipeline de auth (Supabase `await` los callbacks) y podría resetear la organización seleccionada |
| `TOKEN_REFRESHED` | Solo valida que la sesión siga activa | Los tokens rotan internamente en Supabase storage. Los datos del store Zustand (user, organization, memberships) no cambian con la rotación de tokens |
| `USER_UPDATED` | Fetch completo de metadata | Los datos del usuario cambiaron y deben sincronizarse |
| `SIGNED_OUT` | Limpia todo el estado de auth en Zustand | Sesión terminada |

### Flujo de Recuperación Transparente
1. El usuario vuelve a una pestaña inactiva tras varias horas (token expirado).
2. Supabase detecta el cambio de visibilidad y ejecuta `_recoverAndRefresh()`.
3. Si el token expiró, Supabase lo renueva internamente y dispara `TOKEN_REFRESHED` — el handler valida la sesión sin hacer queries adicionales a la base de datos.
4. Si el token aún es válido, Supabase dispara `SIGNED_IN` como confirmación — el handler detecta que el usuario ya está autenticado y no ejecuta ninguna acción.
5. En ambos casos, los datos del store Zustand (user, organization, memberships) permanecen intactos y la UI no se bloquea.
6. Si el usuario interactúa instantáneamente (ej. cambia de organización), el sistema opera normalmente sin latencia adicional porque no hay promesas pendientes de sincronización.

## Principios de Implementación Técnica
- **Prohibición estricta de triggers**: Toda lógica de negocio, sincronización o notificaciones se implementa mediante Edge Functions, servicios o validaciones en capa de aplicación.
- **Evitar recursiones en RLS**: Las políticas RLS se diseñan utilizando funciones SECURITY DEFINER o claims en JWT cuando sea necesario para prevenir cualquier ciclo recursivo.
- **Seguridad por diseño**: RLS en todas las tablas principales, validación de membresía en cada operación, contraseñas temporales con cambio obligatorio en primer login.
- **Consistencia en flujos de autenticación**: Tanto el método de invitación por magic link como la creación directa requieren que el usuario defina su propia contraseña, reutilizando el mismo flujo `/set-password` para mantener consistencia y seguridad.
- **Soft Delete para usuarios**: Los usuarios se eliminan mediante soft delete (marcando `is_active = false` y `status = 'inactive'`) en lugar de eliminación física, permitiendo reactivación y auditoría.
- **Filtrado por `is_active`**: Todas las consultas de autenticación y sesión filtran por `is_active = true` para garantizar que solo usuarios activos puedan acceder al sistema.
- **Sistema de baneo de dos capas**: La suspensión utiliza tanto `is_active` en `organization_members` como `banned_until` en `auth.users` mediante la Edge Function `sync-banned-until`. Requiere la Edge Function desplegada con acceso al `SERVICE_ROLE_KEY`.
- **Mensajes de error en español**: Todos los mensajes de error de autenticación se muestran en español.
- **Gestión de teléfono**: El teléfono se almacena tanto en `organization_members.phone` como en `auth.users.user_metadata.phone`, priorizando `organization_members.phone` cuando está disponible.

## Interfaz de Usuario (Diferenciada por Rol)

### Para Platform Admins (DEV / PLATFORM_ADMIN)
- Tabs: Empresas, Usuarios, Productos, Perfiles Térmicos.
- Filtros de organización visibles en listas.
- **Sin selector de organización en formularios de creación**: Los usuarios siempre se crean en el contexto de la organización actual.
- Tab "Empresas": Lista completa de todas las organizaciones.
  - Pueden crear nuevas organizaciones (estado ACTIVE por defecto).
  - Pueden editar todos los campos de cualquier organización, incluyendo el estado (ACTIVE/INACTIVE).
  - Pueden cambiar el estado de organizaciones entre ACTIVE e INACTIVE.
  - Pueden eliminar organizaciones (soft delete estableciendo estado a INACTIVE).

### Para OWNER (Organización Shipper)
- Tabs: Empresas, Usuarios, Productos, Perfiles Térmicos.
- Tab "Empresas": Vista de detalle de su propia organización (no lista).
  - No puede crear organizaciones.
  - Puede editar solo campos operativos y de contacto (ver sección "Permisos de Edición de Organizaciones").
  - Campos legales/fiscales/administrativos en solo lectura.
  - No puede eliminar organizaciones.
- No hay selector de organización (siempre ve su propia organización).
- Datos filtrados automáticamente por tenant actual.

### Para ADMIN (Organización Shipper)
- Tabs: Usuarios, Productos, Perfiles Térmicos.
- No hay tab "Empresas" ni selector de organización.
- Datos filtrados automáticamente por tenant actual.
- Puede gestionar usuarios con roles inferiores (STAFF, DRIVER).
- Puede asignar solo roles inferiores (STAFF, DRIVER) al crear o invitar usuarios.

### Para STAFF (Organización Shipper)
- Tabs: Solo Usuarios (no tiene acceso a "Productos" ni "Perfiles Térmicos").
- No hay tab "Empresas" ni selector de organización.
- Datos filtrados automáticamente por tenant actual.
- Puede gestionar usuarios con roles inferiores (DRIVER).
- Puede asignar solo roles inferiores (DRIVER) al crear o invitar usuarios.
- No puede ver ni gestionar usuarios con roles iguales o superiores (OWNER, ADMIN, STAFF).

### Para DRIVER (Organización Shipper) y Carrier
- Tabs: Solo Usuarios (no tiene acceso a "Productos" ni "Perfiles Térmicos").
- No hay tab "Empresas" ni selector de organización.
- Datos filtrados automáticamente por tenant actual.
- No puede gestionar usuarios ni asignar roles (no tiene acceso a gestión de usuarios).