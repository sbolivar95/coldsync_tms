# Component Size Rules – When to Split Components

## Principio: Separación de Responsabilidades

**Divide componentes grandes en componentes más pequeños y enfocados cuando mejore la mantenibilidad, reutilización o legibilidad.**

## Criterios para Dividir un Componente

### 📏 Métricas Cuantitativas

Divide un componente cuando:

1. **Líneas de código**: Más de **300-400 líneas** (sin contar comentarios y espacios)
2. **Props**: Más de **8-10 props** diferentes
3. **Estados**: Más de **5-7 estados** (`useState`, `useForm`, etc.)
4. **Efectos**: Más de **3-4 `useEffect`** o hooks complejos
5. **Funciones internas**: Más de **10 funciones** helper dentro del componente

### 🎯 Criterios Cualitativos

Divide un componente cuando:

1. **Múltiples responsabilidades**: El componente hace más de una cosa claramente definida
2. **Secciones visuales distintas**: Tiene secciones que podrían ser componentes independientes
3. **Lógica compleja**: Contiene lógica de negocio que podría estar en un hook o utilidad
4. **Reutilización potencial**: Una parte del componente podría usarse en otro lugar
5. **Dificultad para testear**: Es difícil testear partes específicas del componente

## Patrones de División

### 1. Por Secciones Visuales

Si un componente tiene secciones visuales claramente separadas, divídelas:

```tsx
// ❌ ANTES: Todo en un componente
export function Profile() {
  return (
    <div>
      {/* Avatar Section - 50 líneas */}
      <Card>...</Card>
      
      {/* Personal Info Form - 100 líneas */}
      <Card>...</Card>
      
      {/* Company Info Form - 100 líneas */}
      <Card>...</Card>
      
      {/* Password Form - 80 líneas */}
      <Card>...</Card>
    </div>
  );
}

// ✅ DESPUÉS: Componentes separados
export function Profile() {
  return (
    <div>
      <ProfileAvatarSection />
      <ProfilePersonalInfoForm />
      <ProfileCompanyInfoForm />
      <ProfilePasswordForm />
    </div>
  );
}
```

### 2. Por Lógica de Formularios

Si tienes múltiples formularios, sepáralos:

```tsx
// ✅ Componente principal
export function Profile() {
  const profileForm = useForm(...);
  const companyForm = useForm(...);
  const passwordForm = useForm(...);

  return (
    <div>
      <ProfileForm form={profileForm} />
      <CompanyForm form={companyForm} />
      <PasswordForm form={passwordForm} />
    </div>
  );
}

// ✅ Componente de formulario específico
function ProfileForm({ form }: { form: UseFormReturn<ProfileFormData> }) {
  return (
    <Form {...form}>
      {/* Campos del formulario */}
    </Form>
  );
}
```

### 3. Por Funcionalidad Compleja

Si una sección tiene lógica compleja, extráela:

```tsx
// ❌ ANTES: Lógica compleja mezclada
export function Profile() {
  const [avatar, setAvatar] = useState();
  const handleAvatarUpload = async (file) => {
    // 30 líneas de lógica de upload
  };
  const handleAvatarCrop = () => {
    // 20 líneas de lógica de crop
  };
  // ... resto del componente
}

// ✅ DESPUÉS: Hook personalizado
function useAvatarUpload() {
  const [avatar, setAvatar] = useState();
  const handleUpload = async (file) => { /* ... */ };
  const handleCrop = () => { /* ... */ };
  return { avatar, handleUpload, handleCrop };
}

export function Profile() {
  const avatar = useAvatarUpload();
  // ... resto más simple
}
```

### 4. Por Reutilización

Si una parte puede reutilizarse, extráela:

```tsx
// ✅ Componente reutilizable
export function LogoutSection({ onLogout }: { onLogout: () => void }) {
  const [showDialog, setShowDialog] = useState(false);
  
  return (
    <>
      <Card>
        <button onClick={() => setShowDialog(true)}>
          Cerrar Sesión
        </button>
      </Card>
      <ConfirmDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onConfirm={onLogout}
        // ...
      />
    </>
  );
}

// ✅ Uso en Profile
export function Profile() {
  return (
    <div>
      {/* ... otros componentes */}
      <LogoutSection onLogout={handleLogout} />
    </div>
  );
}
```

## Estructura Recomendada

### Patrones de Estructura por Tipo de Feature

**REGLA GENERAL**: La estructura dentro de `src/features/[feature-name]/` depende de la complejidad y naturaleza del feature.

#### **Patrón 1: Feature Simple (Componentes Relacionados)**
**Usar cuando**: El feature maneja una sola entidad o flujo cohesivo

**Estructura:**
```
src/features/[feature-name]/
├── Component1.tsx
├── Component2.tsx
├── Component3.tsx
└── index.ts
```

**Ejemplo - Profile:**
```
src/features/profile/
├── ProfileAvatarSection.tsx
├── ProfilePersonalInfoForm.tsx
├── ProfilePasswordForm.tsx
├── ProfileLogoutSection.tsx
└── index.ts
```

**Cuándo usar:**
- ✅ Feature maneja una sola entidad (usuario, perfil, etc.)
- ✅ Componentes están relacionados funcionalmente
- ✅ Menos de 6-8 componentes en total
- ✅ No hay subdivisiones lógicas claras

#### **Patrón 2: Feature Complejo (Múltiples Entidades)**
**Usar cuando**: El feature maneja múltiples entidades o tiene subdivisiones lógicas claras

**Estructura:**
```
src/features/[feature-name]/
├── entities/
│   ├── entity1/
│   │   ├── Entity1Tab.tsx
│   │   └── Entity1Dialog.tsx
│   ├── entity2/
│   │   ├── Entity2Tab.tsx
│   │   └── Entity2Dialog.tsx
│   └── entity3/
└── index.ts
```

**Ejemplo - Settings:**
```
src/features/settings/
├── entities/
│   ├── organizations/
│   │   ├── OrganizationsTab.tsx
│   │   └── OrganizationDialog.tsx
│   ├── users/
│   │   ├── UsersTab.tsx
│   │   └── UserDialog.tsx
│   ├── products/
│   │   ├── ProductsTab.tsx
│   │   └── ProductDialog.tsx
│   └── thermal_profiles/
│       ├── ThermalProfilesTab.tsx
│       └── ThermalProfileDialog.tsx
└── index.ts
```

**Cuándo usar:**
- ✅ Feature maneja múltiples entidades diferentes
- ✅ Cada entidad tiene su propio CRUD completo
- ✅ Más de 8-10 componentes en total
- ✅ Subdivisiones lógicas claras (entities, modules, etc.)
- ✅ Cada subdivisión sigue un patrón consistente

#### **Patrón 3: Feature Híbrido (Componentes + Subdivisiones)**
**Usar cuando**: El feature tiene componentes principales + subdivisiones específicas

**Estructura:**
```
src/features/[feature-name]/
├── FeatureMainComponent.tsx
├── FeatureSharedComponent.tsx
├── tabs/
│   ├── Tab1.tsx
│   └── Tab2.tsx
├── dialogs/
│   ├── Dialog1.tsx
│   └── Dialog2.tsx
├── hooks/
│   └── useFeatureLogic.ts
└── index.ts
```

**Cuándo usar:**
- ✅ Feature tiene componentes compartidos + especializados
- ✅ Hay hooks o lógica específica del feature
- ✅ Subdivisiones por tipo de componente (tabs, dialogs, etc.)

### Para Páginas Grandes (`src/pages/`)

**IMPORTANTE**: Los subcomponentes de páginas deben ir en `src/features/[feature-name]/`, siguiendo el patrón del proyecto.

**Estructura:**
```
src/
├── pages/
│   └── FeaturePage.tsx (componente orquestador, < 200 líneas)
│       └── Importa componentes de features/[feature-name]/
│
└── features/
    └── [feature-name]/
        └── [Usar Patrón 1, 2 o 3 según complejidad]
```

**Ejemplo de implementación:**
```typescript
// src/pages/Profile.tsx (orquestador)
import { ProfileAvatarSection, ProfilePersonalInfoForm, ProfilePasswordForm, ProfileLogoutSection } from '../features/profile';

export function Profile() {
  // Lógica de orquestación (forms, estado, etc.)
  return (
    <div>
      <ProfileAvatarSection />
      <ProfilePersonalInfoForm />
      <ProfilePasswordForm />
      <ProfileLogoutSection />
    </div>
  );
}

// src/pages/Settings.tsx (orquestador)
import { OrganizationsTab, UsersTab, ProductsTab } from '../features/settings/entities';

export function Settings() {
  // Lógica de orquestación (tabs, estado, etc.)
  return (
    <div>
      {activeTab === "organizations" && <OrganizationsTab />}
      {activeTab === "users" && <UsersTab />}
      {activeTab === "products" && <ProductsTab />}
    </div>
  );
}
```

## Checklist para Elegir Patrón

Antes de estructurar un feature, pregúntate:

### **¿Patrón 1 (Simple)?**
- [ ] ¿El feature maneja una sola entidad principal?
- [ ] ¿Los componentes están funcionalmente relacionados?
- [ ] ¿Hay menos de 8 componentes en total?
- [ ] ¿No hay subdivisiones lógicas claras?

### **¿Patrón 2 (Múltiples Entidades)?**
- [ ] ¿El feature maneja múltiples entidades diferentes?
- [ ] ¿Cada entidad tiene su propio CRUD completo?
- [ ] ¿Hay más de 8-10 componentes en total?
- [ ] ¿Cada entidad sigue el mismo patrón (Tab + Dialog)?

### **¿Patrón 3 (Híbrido)?**
- [ ] ¿Hay componentes compartidos + especializados?
- [ ] ¿Hay hooks o lógica específica del feature?
- [ ] ¿Las subdivisiones son por tipo de componente?
```

**Patrón del proyecto:**
- `CarriersWrapper.tsx` (pages) → importa de `features/carriers/`
- `Settings.tsx` (pages) → importa de `features/settings/entities/`
- `Profile.tsx` (pages) → debe importar de `features/profile/`

### Para Features (`src/features/`)

```
feature-name/
├── FeatureMain.tsx (orquestador, si aplica)
├── components/          # Componentes específicos del feature
│   ├── FeatureSection1.tsx
│   ├── FeatureSection2.tsx
│   └── FeatureSection3.tsx
├── tabs/               # Tabs específicos (opcional)
│   └── GeneralTab.tsx
├── hooks/              # Hooks personalizados del feature
│   └── useFeatureLogic.ts
└── types.ts            # Tipos específicos del feature
```

## Checklist de División

Antes de dividir, verifica:

1. [ ] ¿El componente tiene más de 300 líneas?
2. [ ] ¿Tiene más de 8 props?
3. [ ] ¿Tiene múltiples responsabilidades claramente separadas?
4. [ ] ¿Hay secciones que podrían ser componentes independientes?
5. [ ] ¿Hay lógica compleja que podría estar en un hook?
6. [ ] ¿Alguna parte podría reutilizarse en otro lugar?

Si respondes "sí" a 3+ preguntas, considera dividir el componente.

## Cuándo NO Dividir

**NO dividas** si:

1. El componente es pequeño (< 200 líneas) y cohesivo
2. La división no mejora la legibilidad
3. Las partes divididas no tienen sentido por sí solas
4. La división crea dependencias circulares complejas
5. El componente es específico de un solo lugar y no se reutilizará

## Ejemplo Práctico: Profile.tsx

### Estructura Actual (690 líneas)

```
src/pages/Profile.tsx (690 líneas - TODO EN UN ARCHIVO)
├── Avatar Section
├── Personal Info Form
├── Company Info Form
├── Password Form
└── Logout Section
```

### Estructura Recomendada

**Ubicación de archivos:**
```
src/
├── pages/
│   └── Profile.tsx (orquestador, ~100-150 líneas)
│       └── Maneja: forms, estado, lógica de orquestación
│
└── features/
    └── profile/
        ├── ProfileAvatarSection.tsx (~30-50 líneas)
        ├── ProfilePersonalInfoForm.tsx (~60-80 líneas)
        ├── ProfileCompanyInfoForm.tsx (~60-80 líneas)
        ├── ProfilePasswordForm.tsx (~80-100 líneas)
        └── ProfileLogoutSection.tsx (~40-60 líneas)
```

**Ejemplo de código:**
```typescript
// src/pages/Profile.tsx (orquestador)
import { ProfileAvatarSection } from '../features/profile/ProfileAvatarSection';
import { ProfilePersonalInfoForm } from '../features/profile/ProfilePersonalInfoForm';
import { ProfileCompanyInfoForm } from '../features/profile/ProfileCompanyInfoForm';
import { ProfilePasswordForm } from '../features/profile/ProfilePasswordForm';
import { ProfileLogoutSection } from '../features/profile/ProfileLogoutSection';

export function Profile() {
  // Lógica de orquestación (forms, estado, etc.)
  const profileForm = useForm(...);
  const companyForm = useForm(...);
  const passwordForm = useForm(...);
  
  return (
    <div>
      <ProfileAvatarSection />
      <ProfilePersonalInfoForm form={profileForm} />
      <ProfileCompanyInfoForm form={companyForm} />
      <ProfilePasswordForm form={passwordForm} />
      <ProfileLogoutSection />
    </div>
  );
}
```

**Beneficios:**
- ✅ Sigue el patrón establecido del proyecto (CarriersWrapper, Settings)
- ✅ Componentes más pequeños y enfocados
- ✅ Mejor organización y mantenibilidad
- ✅ Facilita reutilización si es necesario

## Beneficios de Dividir

- 📖 **Legibilidad**: Más fácil entender cada componente
- 🔄 **Reutilización**: Componentes más pequeños son más reutilizables
- 🧪 **Testabilidad**: Más fácil testear componentes pequeños
- 🐛 **Debugging**: Más fácil encontrar y arreglar bugs
- 👥 **Colaboración**: Múltiples desarrolladores pueden trabajar en paralelo
- ⚡ **Performance**: React puede optimizar mejor componentes pequeños

## Regla de Oro

> **"Si tienes que hacer scroll más de 3 veces para ver todo el componente, probablemente debería dividirse."**

## Referencias

- React Docs: [Composition vs Inheritance](https://react.dev/learn/composition-vs-inheritance)
- Clean Code: Single Responsibility Principle
- Component Size: Idealmente 50-200 líneas por componente


