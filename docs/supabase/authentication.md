# 🔐 Autenticación - Supabase

Este documento describe el sistema de autenticación y autorización en ColdSyn TMS usando Supabase Auth.

---

## 📋 Tabla de Contenidos

1. [Sistema de Autenticación](#sistema-de-autenticación)
2. [Roles y Permisos](#roles-y-permisos)
3. [Flujo de Autenticación](#flujo-de-autenticación)
4. [Context de Autenticación](#context-de-autenticación)
5. [Protección de Rutas](#protección-de-rutas)
6. [Platform Admins](#platform-admins)

---

## 🎯 Sistema de Autenticación

### Supabase Auth

ColdSyn TMS usa **Supabase Auth** para autenticación:

- ✅ Email/Password authentication
- ✅ Magic Links para invitaciones (método principal)
- ✅ JWT tokens
- ✅ Session management
- ✅ Auto-refresh tokens
- ✅ Row Level Security (RLS) integration

### Sistema de Invitaciones

El sistema utiliza **magic links** como método principal de invitación:

- **Magic links únicos y temporales** generados automáticamente
- **Email automático** con botón "Unirse a ColdSync TMS"
- **Un solo click** para unirse (si ya tiene cuenta) o definir contraseña (si es nuevo)
- **Expiración configurable**: 30m, 1h, 2h, 24h, 7d
- **Reenvío de invitación**: Genera un nuevo magic link (el anterior se invalida automáticamente)

**Estados de usuario**:
- **Activo**: Usuario con acceso completo al sistema. Tiene `user_id IS NOT NULL AND is_active = true AND status = 'active'` en `organization_members`. Visible en la lista de usuarios.
- **Suspendido**: Usuario suspendido temporalmente por un administrador. Tiene `user_id IS NOT NULL AND is_active = false AND status = 'suspended'` en `organization_members`. Es reversible mediante reactivación. Visible en la lista de usuarios. No puede iniciar sesión (bloqueado por `banned_until` en `auth.users`).
- **Eliminado (Soft Delete)**: Usuario eliminado mediante soft delete. Tiene `is_active = false AND status = 'inactive'` en `organization_members`. No visible en listas. No puede iniciar sesión. Puede ser reactivado mediante el formulario de creación manual.

**Nota**: Los estados se calculan dinámicamente desde la base de datos. No existe el estado "Pendiente" - cuando se envía una invitación, el registro se crea con `user_id IS NULL`, y cuando el usuario acepta el magic link, se actualiza con `user_id` y `is_active = true`, pasando directamente a "Activo".

**Sistema de baneo de dos capas**: La suspensión utiliza tanto `is_active` en `organization_members` como `banned_until` en `auth.users` mediante la Edge Function `sync-banned-until`. Supabase bloquea nativamente el login cuando `banned_until` está activo.

### Configuración

El cliente Supabase está configurado con:

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
```

---

## 👥 Roles y Permisos

### Estructura de Roles

El sistema tiene dos niveles de roles:

#### 1. Platform Roles

Definidos en tabla `platform_users`:

- **DEV** - Desarrollador con acceso completo al sistema
- **PLATFORM_ADMIN** - Administrador de plataforma, puede acceder a múltiples organizaciones

**Restricción importante**: Los usuarios con roles DEV o PLATFORM_ADMIN **no pueden ser miembros** de ninguna organización Shipper (prohibición de roles dobles).

#### 2. Organization Roles

Definidos en tabla `organization_members`:

- **OWNER** - Usuario humano con acceso total a la organización Shipper
- **ADMIN** - Gestión de usuarios y configuración dentro de la organización
- **STAFF** - Operaciones del TMS dentro de la organización
- **DRIVER** - Acceso limitado a asignaciones específicas

**Nota**: El rol OWNER siempre corresponde a un usuario en Supabase Auth, nunca a la organización como entidad, sino como usuario vinculado a dicha organización.

### Jerarquía de Permisos

```
Platform Level:
  DEV > PLATFORM_ADMIN

Organization Level:
  OWNER > ADMIN > STAFF > DRIVER
```

### Reglas de Modificación de Roles

- **Nadie puede modificar su propio rol** (ni para subirlo ni para bajarlo)
- **OWNER** puede modificar cualquier rol dentro de su organización
- **ADMIN** puede modificar solo roles inferiores (STAFF, DRIVER)
- **DEV y PLATFORM_ADMIN** pueden modificar cualquier rol en cualquier organización

---

## 🔄 Flujo de Autenticación

### 1. Inicio de Sesión

El sistema implementa validación en múltiples capas para garantizar que solo usuarios activos puedan acceder:

1. **Supabase Auth (Primera Línea de Defensa)**: Supabase verifica automáticamente `banned_until` en `auth.users`. Si está activo, rechaza el login con "User is banned" (traducido a: "Tu cuenta está suspendida. Contacta al administrador").

2. **Validación de Membresías Activas (Segunda Línea de Defensa)**: Después de la autenticación exitosa, el sistema verifica `is_active = true` en `organization_members`. Si no hay membresías activas, se verifica el estado real usando un cliente admin temporal (para bypass RLS).

3. **Diferenciación de mensajes de error**:
   - Usuario suspendido (`status = 'suspended'`): "Acceso bloqueado, contacta al administrador"
   - Usuario eliminado (`status = 'inactive'`): "Credenciales inválidas"

```typescript
// En Login.tsx
const { signIn } = useAuth();

const handleSubmit = async (email: string, password: string) => {
  try {
    await signIn(email, password);
    // onAuthStateChange se dispara automáticamente
  } catch (error) {
    console.error('Error signing in:', error);
    toast.error('Credenciales inválidas');
  }
};
```

### 2. Detección de Cambio de Sesión

```typescript
// En AuthProvider
supabase.auth.onAuthStateChange(async (event, session) => {
  const sessionUser = session?.user ?? null;
  setUser(sessionUser);

  if (sessionUser) {
    // Cargar información adicional del usuario
    await fetchUserData(sessionUser.id);
  } else {
    // Limpiar datos de usuario
    setPlatformUser(null);
    setOrganizationMember(null);
  }
});
```

### 3. Carga de Datos de Usuario

```typescript
const fetchUserData = async (userId: string) => {
  // 1. Verificar si es platform admin
  const platformRes = await supabase
    .from('platform_users')
    .select('user_id, role, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  const platformUserData = platformRes.data ?? null;
  setPlatformUser(platformUserData);

  const isPlatformAdmin = Boolean(
    platformUserData?.is_active &&
    ['DEV', 'PLATFORM_ADMIN'].includes(platformUserData.role)
  );

  // 2. Si es platform admin, verificar organización seleccionada
  if (isPlatformAdmin) {
    const selectedOrgId = localStorage.getItem('platform_admin_selected_org');
    
    if (selectedOrgId) {
      // Cargar organización seleccionada
      const orgRes = await supabase
        .from('organizations')
        .select('id, comercial_name, legal_name')
        .eq('id', selectedOrgId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (orgRes.data) {
        setOrganizationMember({
          org_id: orgRes.data.id,
          user_id: userId,
          role: 'ADMIN', // Platform admins tienen rol ADMIN
          organization: orgRes.data,
        });
        return;
      }
    }
    
    // Sin organización seleccionada - vista global
    setOrganizationMember(null);
    return;
  }

  // 3. Si no es platform admin, cargar membership regular
  const memberRes = await supabase
    .from('organization_members')
    .select('org_id, user_id, role')
    .eq('user_id', userId)
    .maybeSingle();

  const member = memberRes.data;
  
  if (member?.org_id) {
    // Cargar información de organización
    const orgRes = await supabase
      .from('organizations')
      .select('id, comercial_name, legal_name')
      .eq('id', member.org_id)
      .maybeSingle();

    setOrganizationMember({
      ...member,
      organization: orgRes.data ?? undefined,
    });
  } else {
    setOrganizationMember(null);
  }
};
```

### 4. Cierre de Sesión

```typescript
const { signOut } = useAuth();

const handleSignOut = async () => {
  try {
    await signOut();
    // onAuthStateChange se dispara automáticamente
    navigate('/login');
  } catch (error) {
    console.error('Error signing out:', error);
  }
};
```

---

## 🎭 Context de Autenticación

### AuthProvider

El `AuthProvider` (`src/lib/auth-context.tsx`) proporciona:

```typescript
interface AuthContextType {
  // Usuario actual (de Supabase Auth)
  user: User | null;
  
  // Miembro de organización
  organizationMember: OrganizationMember | null;
  
  // Usuario de plataforma (si es admin)
  platformUser: PlatformUser | null;
  
  // Helpers
  isPlatformAdmin: boolean;
  isOrgMember: boolean;
  loading: boolean;
  
  // Métodos
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}
```

### Uso del Context

```typescript
import { useAuth } from '@/lib/auth-context';

function MyComponent() {
  const {
    user,
    organizationMember,
    isPlatformAdmin,
    isOrgMember,
    loading,
  } = useAuth();

  if (loading) return <div>Cargando...</div>;
  if (!user) return <div>No autenticado</div>;
  if (!isOrgMember) return <div>Sin organización</div>;

  return (
    <div>
      <p>Usuario: {user.email}</p>
      {organizationMember && (
        <p>Organización: {organizationMember.organization?.comercial_name}</p>
      )}
      {isPlatformAdmin && <p>Eres administrador de plataforma</p>}
    </div>
  );
}
```

---

## 🛡️ Protección de Rutas

### ProtectedRoute Component

```typescript
// src/components/ProtectedRoute.tsx
import { useAuth } from '@/lib/auth-context';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOrgMember?: boolean;
}

export function ProtectedRoute({
  children,
  requireOrgMember = false,
}: ProtectedRouteProps) {
  const { user, isOrgMember, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireOrgMember && !isOrgMember) {
    return <Navigate to="/no-organization" replace />;
  }

  return <>{children}</>;
}
```

### Uso en Rutas

```typescript
// src/routes/index.tsx
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute requireOrgMember>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      // ...
    ],
  },
]);
```

---

## 👑 Platform Admins

### Características

Los platform admins pueden:

1. **Crear organizaciones** (solo DEV y PLATFORM_ADMIN)
2. **Acceder a múltiples organizaciones**
3. **Cambiar entre organizaciones** usando selector
4. **Ver vista global** sin organización seleccionada
5. **Gestionar usuarios** en cualquier organización (incluido crear el primer OWNER)

**Nota**: Al crear una organización, **solo se registran los datos de la empresa**. No se genera ningún usuario ni credencial en este paso. El Platform Admin debe acceder manualmente a la nueva organización y crear el primer miembro con rol OWNER mediante uno de los dos métodos disponibles (invitación por magic link o creación directa).

### Selección de Organización

```typescript
// Seleccionar organización
const handleSelectOrganization = (orgId: string) => {
  localStorage.setItem('platform_admin_selected_org', orgId);
  refreshUserData(); // Recargar datos con nueva organización
};

// Limpiar selección (vista global)
const handleClearSelection = () => {
  localStorage.removeItem('platform_admin_selected_org');
  refreshUserData();
};
```

### OrganizationSelector Component

```typescript
// src/components/OrganizationSelector.tsx
function OrganizationSelector() {
  const { isPlatformAdmin, organizationMember } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  if (!isPlatformAdmin) return null;

  const handleChange = (orgId: string) => {
    localStorage.setItem('platform_admin_selected_org', orgId);
    window.location.reload(); // Recargar para aplicar cambios
  };

  return (
    <Select value={organizationMember?.org_id} onValueChange={handleChange}>
      <SelectTrigger>
        <SelectValue placeholder="Seleccionar organización" />
      </SelectTrigger>
      <SelectContent>
        {organizations.map(org => (
          <SelectItem key={org.id} value={org.id}>
            {org.comercial_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

---

## 🔒 Verificación de Permisos

### En Componentes

```typescript
function VehicleForm({ vehicleId }: Props) {
  const { organizationMember } = useAuth();
  
  const canEdit = organizationMember?.role === 'OWNER' || 
                  organizationMember?.role === 'ADMIN';
  
  const canDelete = organizationMember?.role === 'OWNER';

  return (
    <form>
      {/* Campos del formulario */}
      
      {canEdit && (
        <button type="submit">Guardar</button>
      )}
      
      {canDelete && (
        <button type="button" onClick={handleDelete}>
          Eliminar
        </button>
      )}
    </form>
  );
}
```

### En Servicios (RLS)

Las políticas de Row Level Security (RLS) en Supabase verifican automáticamente los permisos:

```sql
-- Ejemplo: Solo OWNER y ADMIN pueden actualizar
CREATE POLICY "Admins can update vehicles"
ON vehicles FOR UPDATE
USING (
  org_id IN (
    SELECT org_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
    AND role IN ('OWNER', 'ADMIN')
  )
);
```

---

## 🔗 Referencias

- [Arquitectura Supabase](./architecture.md)
- [Convenciones Supabase](./conventions.md)
- [Auth Context](../../src/lib/auth-context.tsx)
- [Protected Route](../../src/components/ProtectedRoute.tsx)

---

**Última actualización:** 15/01/2026

