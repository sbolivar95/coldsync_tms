# 📘 TypeScript - Guía Completa

Esta guía contiene todas las reglas, estándares y mejores prácticas de TypeScript para el proyecto ColdSync TMS.

---

## 🎯 Configuración Obligatoria

### tsconfig.json
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    // ... otras configuraciones
  }
}
```

**Reglas obligatorias:**
- `"strict": true` - Activa todas las verificaciones estrictas
- `"noUncheckedIndexedAccess": true` - Previene acceso no verificado a índices

---

## 🔧 Tipos y Tipado

### ✅ Hacer

#### Tipar Parámetros de Funciones
```typescript
// ✅ Correcto
function processUser(user: User, options: ProcessOptions): void {
  // ...
}

// ❌ Incorrecto
function processUser(user, options) {
  // ...
}
```

#### Tipar Valores de Retorno (Funciones Públicas)
```typescript
// ✅ Correcto - función exportada
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ Aceptable - función interna simple
function helper(x: number) {
  return x * 2; // tipo inferido
}
```

#### Usar `unknown` para Valores Desconocidos
```typescript
// ✅ Correcto
function parseApiResponse(data: unknown): User | null {
  if (typeof data === 'object' && data !== null && 'id' in data) {
    return data as User;
  }
  return null;
}

// ❌ Incorrecto
function parseApiResponse(data: any): User | null {
  return data;
}
```

#### Union Types para Valores Específicos
```typescript
// ✅ Correcto
type Status = 'active' | 'inactive'; // Para usuarios: 'active' | 'suspended'
type Theme = 'light' | 'dark';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface Order {
  id: string;
  status: Status;
}
```

### ❌ Evitar

#### No Usar `any`
```typescript
// ❌ Incorrecto
function handleData(data: any): void {
  console.log(data.whatever);
}

// ✅ Correcto
function handleData(data: unknown): void {
  if (typeof data === 'object' && data !== null) {
    console.log(data);
  }
}
```

#### No Usar `!` (Non-null Assertion) Sin Justificación
```typescript
// ❌ Incorrecto (sin justificación)
const user = getUser(id)!;

// ✅ Correcto (con validación)
const user = getUser(id);
if (!user) {
  throw new Error('User not found');
}

// ✅ Aceptable (con justificación clara)
const user = getUser(id)!; // Safe: ID viene de lista validada
```

#### No Usar `as` (Type Assertion) Salvo Casos Específicos
```typescript
// ❌ Incorrecto (forzar tipo)
const data = response as User;

// ✅ Correcto (con validación)
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}

const data = response;
if (isUser(data)) {
  // data es User aquí
}
```

---

## 🏗️ Interfaces vs Types

### Interfaces - Para Estructuras de Objetos
```typescript
// ✅ Usar interfaces para objetos
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

interface CreateUserRequest {
  name: string;
  email: string;
}

// Extensión de interfaces
interface AdminUser extends User {
  permissions: string[];
}
```

### Types - Para Uniones, Intersecciones y Aliases
```typescript
// ✅ Usar types para uniones
type ID = string | number;
type Result<T> = Success<T> | Error;
type Status = 'loading' | 'success' | 'error';

// ✅ Usar types para intersecciones
type UserWithPermissions = User & {
  permissions: string[];
};

// ✅ Usar types para aliases complejos
type EventHandler<T> = (event: T) => void;
type ApiResponse<T> = {
  data: T;
  status: number;
  message: string;
};
```

---

## 🛡️ Manejo de Nullability

### Verificación Explícita de null/undefined
```typescript
// ✅ Correcto
function getUser(id: string): User | null {
  // ... lógica de búsqueda
  return user || null;
}

const user = getUser('123');
if (user) {
  console.log(user.name); // Safe - TypeScript sabe que user no es null
}

// ✅ Correcto - con optional chaining
console.log(user?.name);

// ✅ Correcto - con nullish coalescing
const userName = user?.name ?? 'Unknown';
```

### Funciones que Pueden Fallar
```typescript
// ✅ Correcto - retorno explícito de error
type Result<T, E = Error> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};

function fetchUser(id: string): Promise<Result<User>> {
  // ... implementación
}

// Uso
const result = await fetchUser('123');
if (result.success) {
  console.log(result.data.name); // Safe
} else {
  console.error(result.error);
}
```

---

## 📚 Arrays y Objetos

### Sintaxis de Arrays
```typescript
// ✅ Preferir sintaxis array
const numbers: number[] = [1, 2, 3];
const users: User[] = [];

// ❌ Evitar (aunque válido)
const numbers: Array<number> = [1, 2, 3];
```

### Objetos con Índices Dinámicos
```typescript
// ✅ Correcto - con Record
type UserRoles = Record<string, string[]>;
const roles: UserRoles = {
  admin: ['read', 'write', 'delete'],
  user: ['read']
};

// ✅ Correcto - con index signature
interface Cache {
  [key: string]: unknown;
}
```

---

## 🔧 Utility Types Útiles

### Partial<T>
```typescript
// Hace todas las propiedades opcionales
interface User {
  id: string;
  name: string;
  email: string;
}

type UserUpdate = Partial<User>; // { id?: string; name?: string; email?: string; }

function updateUser(id: string, updates: UserUpdate): void {
  // ...
}
```

### Required<T>
```typescript
// Hace todas las propiedades requeridas
interface CreateUserRequest {
  name?: string;
  email?: string;
}

type CompleteUser = Required<CreateUserRequest>; // { name: string; email: string; }
```

### Pick<T, K>
```typescript
// Selecciona propiedades específicas
type UserSummary = Pick<User, 'id' | 'name'>; // { id: string; name: string; }
```

### Omit<T, K>
```typescript
// Excluye propiedades específicas
type CreateUser = Omit<User, 'id' | 'createdAt'>; // { name: string; email: string; }
```

### Record<K, V>
```typescript
// Crea objeto con keys y values específicos
type StatusMessages = Record<Status, string>;
const messages: StatusMessages = {
  active: 'Usuario activo',
  inactive: 'Usuario suspendido' // Para usuarios: 'suspended' en lugar de 'inactive'
};
```

---

## 🎯 Patrones Específicos del Proyecto

### Servicios de Base de Datos
```typescript
// ✅ Patrón para servicios
export interface DatabaseService<T> {
  create(data: Omit<T, 'id' | 'createdAt'>): Promise<T>;
  findById(id: string): Promise<T | null>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

export class UserService implements DatabaseService<User> {
  async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    // ... implementación
  }
  // ... otros métodos
}
```

### Componentes React
```typescript
// ✅ Patrón para props de componentes
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function UserCard({ user, onEdit, onDelete, className }: UserCardProps) {
  // ... implementación
}
```

### Hooks Personalizados
```typescript
// ✅ Patrón para hooks
interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUser(id: string): UseUserReturn {
  // ... implementación
}
```

---

## 🚨 Errores Comunes y Soluciones

### Error: Object is possibly 'null'
```typescript
// ❌ Problema
const user = getUser(id);
console.log(user.name); // Error: Object is possibly 'null'

// ✅ Solución
const user = getUser(id);
if (user) {
  console.log(user.name);
}

// ✅ O con optional chaining
console.log(user?.name);
```

### Error: Element implicitly has an 'any' type
```typescript
// ❌ Problema
const cache = {};
cache[key] = value; // Error: Element implicitly has an 'any' type

// ✅ Solución
const cache: Record<string, unknown> = {};
cache[key] = value;
```

### Error: Argument of type 'string | undefined' is not assignable
```typescript
// ❌ Problema
function processId(id: string) { /* ... */ }
const maybeId = getId();
processId(maybeId); // Error: string | undefined no es string

// ✅ Solución
const maybeId = getId();
if (maybeId) {
  processId(maybeId);
}
```

---

## 📖 Recursos Adicionales

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Utility Types Reference](https://www.typescriptlang.org/docs/handbook/utility-types.html)

---

**Última actualización:** Enero 2025