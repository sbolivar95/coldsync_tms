# Convenciones de Commits Git

## Formato

Los commits siguen este formato:

```
tipo(contexto): descripción
```

- **Primera línea**: máximo 100 caracteres
- **Idioma**: Inglés (los mensajes de commit siempre en inglés)
- **Descripción**: modo imperativo ("add" no "added" ni "adds"), minúsculas, sin punto final

## Tipos

- **feat**: Nueva funcionalidad
- **fix**: Corrección de bug
- **docs**: Cambios en documentación (ver [docs/](../docs/README.md))
- **style**: Formato, espacios, sin cambio de código
- **refactor**: Cambio de código sin nueva funcionalidad ni corrección de bug
- **perf**: Mejoras de rendimiento
- **test**: Adición o corrección de tests
- **chore**: Cambios en proceso de build o herramientas

## Contexto

Usa `kebab-case` para el área de contexto. Opcionalmente incluye el nombre del componente con `/`:

- `auth`: Autenticación (ver [../supabase/authentication.md](../supabase/authentication.md))
- `dispatch`: Módulo de Despacho (ver [../business/dispatch.md](../business/dispatch.md))
- `control-tower`: Torre de Control (ver [../business/control-tower.md](../business/control-tower.md))
- `reconciliation`: Módulo de Conciliación (ver [../business/reconciliation.md](../business/reconciliation.md))
- `ui`: Componentes UI (ver [../ui/components.md](../ui/components.md))
- `layout`: Componentes de layout (Sidebar, Header, etc.)
- `service`: Capa de servicios (ver [../frontend/services.md](../frontend/services.md))
- `store`: Stores de Zustand (ver [../frontend/state-management.md](../frontend/state-management.md))

### Ejemplos

- `feat(dispatch): add order creation dialog`
- `fix(auth/Login): validate password visibility toggle`
- `refactor(ui/DataTable): improve pagination logic`
- `docs(control-tower): update tracking documentation`

## Branches y Pull Requests

- Crear branches de feature desde `main`
- Abrir PRs a `main` para revisión
- Usar rebase para mantener el historial limpio (ver [guía de fixup](https://fle.github.io/git-tip-keep-your-branch-clean-with-fixup-and-autosquash.html))

## Documentación Relacionada

- [Resumen del Proyecto](../README.md)
- [Arquitectura Frontend](../frontend/architecture.md)
- [Reglas de Código](../../.cursor/rules/ai-rules.md)
- [Reutilización de Componentes](../../.cursor/rules/component-reuse.rules.md)
