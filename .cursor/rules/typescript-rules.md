# Reglas básicas de TypeScript

## Configuración obligatoria

- Usar `"strict": true` en `tsconfig.json`
- Activar `"noUncheckedIndexedAccess": true`

## Tipos

### ✅ Hacer

- Tipar explícitamente parámetros de funciones
- Tipar valores de retorno en funciones públicas/exportadas
- Usar `unknown` para valores desconocidos
- Usar union types para valores específicos: `type Status = 'active' | 'inactive'`

### ❌ Evitar

- No usar `any` (usar `unknown` si es necesario)
- No usar `!` (non-null assertion) sin justificación
- No usar `as` (type assertion) salvo casos específicos

## Interfaces vs Types

```typescript
// Interfaces para estructuras de objetos
interface User {
  id: string;
  name: string;
  email: string;
}

// Types para uniones, intersecciones y aliases
type ID = string | number;
type Result<T> = Success<T> | Error;
```

## Nullability

```typescript
// Manejar explícitamente null/undefined
function getUser(id: string): User | null {
  // ...
}

const user = getUser('123');
if (user) {
  console.log(user.name); // Safe
}
```

## Funciones

```typescript
// Siempre tipar parámetros y retorno en funciones exportadas
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

## Arrays y objetos

```typescript
// Preferir sintaxis array
const numbers: number[] = [1, 2, 3];

// En lugar de
const numbers: Array<number> = [1, 2, 3];
```

## Utility Types útiles

- `Partial<T>` - Hace todas las propiedades opcionales
- `Required<T>` - Hace todas las propiedades requeridas
- `Pick<T, K>` - Selecciona propiedades específicas
- `Omit<T, K>` - Excluye propiedades específicas
- `Record<K, V>` - Crea objeto con keys y values específicos