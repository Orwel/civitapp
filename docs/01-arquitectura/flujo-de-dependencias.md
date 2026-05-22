# Flujo de dependencias

## Resumen

1. La **aplicación Next** arranca una petición (RSC, Server Action o cliente).
2. Se obtiene un **cliente Supabase** acorde al entorno (servidor con cookies, o navegador).
3. Se construye el objeto **`Repositories`** con `createRepositories(supabase)`.
4. Los **casos de uso** reciben `repos` y llaman solo a interfaces (`repos.initiatives`, `repos.members`, …).
5. Las **implementaciones** ejecutan consultas PostgREST / RPC / Storage según RLS del usuario JWT.

## Cliente Supabase en servidor

En Server Components y Server Actions se usa típicamente:

```ts
import { createClient } from "@/infrastructure/supabase/server";
import { createRepositories } from "@/infrastructure/repositories";

const supabase = await createClient();
const repos = createRepositories(supabase);
```

`createClient` de `server.ts` usa `@supabase/ssr` y `cookies()` de Next.js para mantener la sesión.

## Cliente Supabase en el navegador

En componentes con `"use client"` (p. ej. chat interactivo) se usa:

```ts
import { createClient } from "@/infrastructure/supabase/client";
import { createRepositories } from "@/infrastructure/repositories";

const supabase = createClient();
const repos = createRepositories(supabase);
```

Misma factoría de repositorios; cambia solo cómo se construye `SupabaseClient` (sesión en cookie vs cliente browser).

## Middleware

`src/middleware.ts` importa `updateSession` desde `infrastructure/supabase/middleware` y aplica el matcher de Next para refrescar tokens en rutas que no sean assets estáticos.

## Casos de uso

Ejemplo real: `createInitiative` en `src/application/initiatives/CreateInitiativeUseCase.ts` recibe `repos: Repositories` y encadena:

- `repos.initiatives.create`
- `repos.members.add`
- `repos.leaders.add`
- `repos.chat.createDefaultThread`
- `repos.events.add`

No importa `SupabaseInitiativeRepository` directamente.

## Límites del patrón actual

- **No hay inyección centralizada**: cada página o action llama a `createRepositories`. Es simple y explícito; duplica una línea en muchos sitios.
- **`Repositories` definido en infrastructure**: los use cases dependen nominalmente de un tipo exportado desde infra; ver [Clean Architecture](clean-architecture.md) para el matiz pragmático.

## Referencias en código

- Factoría: `src/infrastructure/repositories/index.ts` (`createRepositories`, interfaz `Repositories`).
- Servidor: `src/infrastructure/supabase/server.ts`.
- Browser: `src/infrastructure/supabase/client.ts`.
