# 🛠️ Development - Convenciones y Estándares

Esta sección contiene todas las convenciones, estándares y guías para desarrolladores que contribuyen al proyecto ColdSync TMS.

---

## 📋 Tabla de Contenidos

1. [Convenciones de Commits](#convenciones-de-commits)
2. [Estándares de Código](#estándares-de-código)
3. [TypeScript](#typescript)
4. [Flujo de Desarrollo](#flujo-de-desarrollo)
5. [Herramientas y Configuración](#herramientas-y-configuración)

---

## 📝 Convenciones de Commits

### [Commit Convention](./commit-convention.md)
Formato estándar para mensajes de commit, tipos, contextos y ejemplos.

**Formato básico:**
```
tipo(contexto): descripción
```

**Ejemplos:**
- `feat(dispatch): add order creation dialog`
- `fix(auth): validate password visibility toggle`
- `docs(supabase): update schema documentation`

---

## 🎯 Estándares de Código

### Reglas de IA y Desarrollo
Las reglas específicas para desarrollo están en [`.cursor/rules/`](../../.cursor/rules/):

- **[AI Rules](../../.cursor/rules/ai-rules.md)** - Reglas completas para desarrollo con IA
- **[Database Rules](../../.cursor/rules/data-base-rules.md)** - Reglas de base de datos, multi-tenancy y seguridad
- **[TypeScript Rules](../../.cursor/rules/typescript-rules.md)** - Estándares y mejores prácticas de TypeScript
- **[Component Size](../../.cursor/rules/component-size.rules.md)** - Cuándo y cómo dividir componentes
- **[Component Reuse](../../.cursor/rules/component-reuse.rules.md)** - Componentes reutilizables disponibles
- **[Language Rules](../../.cursor/rules/language.rules.md)** - Convenciones de idioma
- **[Tech Stack](../../.cursor/rules/tech-stack.rules.md)** - Stack tecnológico y herramientas

### Principios Generales

1. **TypeScript Estricto** - Todo el código debe pasar TypeScript strict mode
2. **Componentes Funcionales** - No usar componentes de clase
3. **Hooks Personalizados** - Extraer lógica compleja a hooks reutilizables
4. **Validación Zod** - Usar Zod para validación de formularios y APIs
5. **Organización por Features** - Estructura modular por funcionalidades

---

## 📘 TypeScript

### [Reglas de TypeScript](../../.cursor/rules/typescript-rules.md)
Estándares completos y mejores prácticas para TypeScript en el proyecto.

### [Guía Completa de TypeScript](./typescript.md)
Documentación detallada con ejemplos, patrones y soluciones a errores comunes.

### Configuración Obligatoria
- `"strict": true` en `tsconfig.json`
- `"noUncheckedIndexedAccess": true` activado

### Principios Clave

**✅ Hacer:**
- Tipar explícitamente parámetros de funciones
- Tipar valores de retorno en funciones públicas/exportadas
- Usar `unknown` para valores desconocidos
- Usar union types: `type Status = 'active' | 'inactive'`

**❌ Evitar:**
- No usar `any` (usar `unknown` si es necesario)
- No usar `!` (non-null assertion) sin justificación
- No usar `as` (type assertion) salvo casos específicos

### Interfaces vs Types
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

### Utility Types Recomendados
- `Partial<T>` - Propiedades opcionales
- `Required<T>` - Propiedades requeridas
- `Pick<T, K>` - Seleccionar propiedades
- `Omit<T, K>` - Excluir propiedades
- `Record<K, V>` - Objeto con keys y values específicos

---

## 🔄 Flujo de Desarrollo

### 1. Preparación
```bash
# Crear branch desde main
git checkout main
git pull origin main
git checkout -b feat/nueva-funcionalidad
```

### 2. Desarrollo
- Seguir las [AI Rules](../../.cursor/rules/ai-rules.md)
- Usar [convenciones de commits](./commit-convention.md)
- Mantener componentes bajo 300 líneas
- Incluir validaciones Zod apropiadas

### 3. Testing
```bash
# Verificar TypeScript
npm run type-check

# Verificar build
npm run build
```

### 4. Commit y Push
```bash
# Commits siguiendo convenciones
git add .
git commit -m "feat(dispatch): add order creation dialog"
git push origin feat/nueva-funcionalidad
```

### 5. Pull Request
- Crear PR hacia `main`
- Incluir descripción clara de cambios
- Referenciar issues relacionados
- Solicitar revisión del equipo

---

## 🛠️ Herramientas y Configuración

### Editores Recomendados
- **Cursor** (preferido) - Con configuración en `.cursor/`
- **VS Code** - Con extensiones TypeScript, Tailwind, etc.

### Extensiones Esenciales
- TypeScript y JavaScript
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- Auto Rename Tag
- Prettier - Code formatter

### Configuración del Proyecto
- **TypeScript** - `tsconfig.json` con modo estricto
- **Tailwind** - `tailwind.config.js` con configuración personalizada
- **Vite** - `vite.config.ts` para build y desarrollo
- **ESLint/Prettier** - Configuración de linting y formato

---

## 📚 Recursos Adicionales

### Documentación Relacionada
- [Frontend Architecture](../frontend/architecture.md)
- [Supabase Conventions](../supabase/conventions.md)
- [UI/Design System](../ui/README.md)
- [Business Logic](../business/README.md)

### Enlaces Externos
- [React 18 Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Zustand Guide](https://zustand-demo.pmnd.rs/)

---

## 🤝 Contribución

Para contribuir al proyecto:

1. **Lee esta documentación** completa
2. **Configura tu entorno** según las herramientas recomendadas
3. **Sigue las convenciones** establecidas
4. **Haz commits descriptivos** usando el formato estándar
5. **Solicita revisión** antes de hacer merge

---

**¿Preguntas?** Consulta la documentación específica de cada área o contacta al equipo de desarrollo.