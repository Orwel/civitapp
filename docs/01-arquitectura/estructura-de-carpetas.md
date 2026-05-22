# Estructura de carpetas

Raíz del repo relevante para desarrollo:

```text
civitapp/
├── docs/                    # Documentación (este árbol)
├── public/                  # Assets estáticos servidos por Next.js
├── src/
│   ├── app/                 # App Router: rutas, layouts, server actions
│   ├── application/         # Casos de uso
│   ├── components/          # UI: layout, features, primitivos (ui/)
│   ├── core/                # Dominio: entities, enums, types, repositories (interfaces)
│   ├── infrastructure/      # Supabase + repositorios concretos
│   ├── lib/                 # Utilidades compartidas (p. ej. cn para clases)
│   ├── assets/              # SVG u otros assets importados desde código
│   └── middleware.ts        # Delega en infrastructure/supabase/middleware
├── supabase/
│   ├── migrations/          # SQL versionado (001, 002, …)
│   └── seed/                # Datos iniciales opcionales
├── package.json
├── README.md
└── tsconfig.json (paths @/* → src/*)
```

## `src/app`

Convenciones de Next.js 15:

- **`(auth)/`**: grupo de rutas sin segmento URL; login, registro, recuperación de contraseña.
- **`dashboard/`**: área autenticada de usuario; iniciativas, perfil, explorar.
- **`admin/`**: panel administrativo (protegido por rol).
- **`invite/[token]/`**: canje de invitación.
- **`auth/confirm/route.ts`**: ruta API/handler para confirmación de email u flujos Supabase.

## `src/application`

Una carpeta por **contexto** (`initiatives/`, `instruments/`). Cada caso de uso suele ser un archivo que exporta una función async y, si aplica, tipos `Command` / entrada.

## `src/core`

- **`entities/`**: interfaces TypeScript del dominio persistente.
- **`enums/`** y **`types/`**: valores cerrados (roles, estados).
- **`repositories/`**: `IInitiativeRepository`, etc.; barril en `index.ts` (no exporta todas las interfaces; revisar archivo concreto).

## `src/infrastructure`

- **`supabase/`**: `client.ts` (browser), `server.ts` (Server Components / Actions), `middleware.ts` (refresh de sesión).
- **`repositories/`**: clases `Supabase*Repository` + `createRepositories()` y tipo `Repositories`.

## `src/components`

- **`layout/`**: shell del dashboard, navegación, drawer.
- **`features/`**: paneles por dominio (chat, instrumentos, miembros, meetups…).
- **`ui/`**: componentes reutilizables estilo shadcn (button, card).

## `supabase/migrations`

Archivos SQL ordenados por prefijo numérico. **Importante**: existen dos archivos con prefijo `019_`; al aplicar en un proyecto nuevo hay que respetar un orden consistente (ver [Migraciones](../05-base-de-datos/migraciones.md)).
