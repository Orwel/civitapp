# Clean Architecture (enfoque pragmático)

## Objetivo del documento

Describir cómo está organizado Civitapp hoy: **separación de capas** con reglas claras, sin imponer un formalismo máximo (sin contenedor DI obligatorio, sin mappers DTO en todos los bordes).

## Capas

| Capa | Ubicación | Responsabilidad |
|------|-----------|-----------------|
| **Dominio** | `src/core/` | Entidades (tipos TypeScript), enums, contratos de repositorios. Sin imports de Next.js ni de `@supabase/supabase-js`. |
| **Aplicación** | `src/application/` | Casos de uso: orquestan repositorios y expresan reglas de negocio. Dependen de interfaces en `core`, no de Supabase. |
| **Infraestructura** | `src/infrastructure/` | Cliente Supabase (browser/server), middleware de sesión, implementaciones concretas de repositorios. |
| **Presentación / entrega** | `src/app/`, `src/components/` | UI React, App Router, Server Actions. Componen casos de uso y repositorios vía factoría. |

## Regla de dependencias

- `core` **no** importa `application`, `infrastructure`, `app` ni `components`.
- `application` importa solo `core` (entidades + interfaces de repositorios). **No** importa implementaciones Supabase.
- `infrastructure` implementa interfaces definidas en `core` y puede usar Supabase y tipos del SDK.
- `app` y `components` pueden importar `application`, `infrastructure`, `core` y `components`.

Excepción conocida y aceptada en modo pragmático: el tipo agregado `Repositories` vive en `infrastructure/repositories/index.ts` y los casos de uso lo reciben como parámetro. Es un pequeño acoplamiento al “módulo de composición”; una evolución futura sería mover `Repositories` a `application` o a un módulo `composition` solo de tipos.

## Entidades como tipos planos

Las entidades en `src/core/entities/` reflejan en gran medida las **columnas de Postgres** (incluidos campos en transición o marcados `@deprecated` en TypeScript hasta que se eliminen del esquema). Esto reduce boilerplate; el coste es acoplar el modelo de dominio al esquema actual.

## Dónde vive la “lógica de negocio”

1. **Casos de uso** (`application/`): flujos que combinan varios repositorios (p. ej. crear iniciativa + miembro OWNER + líder + hilo de chat + evento).
2. **Políticas RLS** en Postgres: garantizan acceso a datos incluso si el cliente llama a PostgREST directamente.
3. **Server Actions y páginas**: validación de sesión, redirecciones y orquestación fina; parte de la lógica puede estar aquí hasta extraerse a use cases.

## Próximas mejoras (fuera de esta oleada)

- ADR sobre **Result vs excepciones** en casos de uso.
- Validación de entrada (p. ej. Zod) en el borde (Server Actions).
- Retirada de campos legacy en entidades y BD (ver sprint tracker T1.1).

## Referencias

- [Estructura de carpetas](estructura-de-carpetas.md)
- [Flujo de dependencias](flujo-de-dependencias.md)
