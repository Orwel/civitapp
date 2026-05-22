# Roles globales

Almacenados en la columna `profiles.role` (tipo Postgres `role_global`) y reflejados en TypeScript como `RoleGlobal` en `src/core/enums/Roles.ts`.

## Valores

| Rol | Significado operativo |
|-----|------------------------|
| **USER** | Rol por defecto al registrarse (columna `profiles.role`, trigger `handle_new_user`). Acceso a dashboard e iniciativas según membresía. |
| **ADMIN** | Acceso al panel `/admin` y políticas RLS que usan `is_admin()`: lectura/escritura ampliada en tablas sensibles. |
| **POLITICAL_VERIFIED** | Usuario cuya solicitud de perfil político fue aprobada; habilita participación como figura pública en flujos de iniciativa (p. ej. `POLITICAL_SPONSOR` cuando esté definido el producto). |

## Relación con `political_profiles`

La tabla `political_profiles` guarda cargo, región y `verification_status` (PENDING / VERIFIED / REJECTED). El rol global `POLITICAL_VERIFIED` y el flujo de verificación deben mantenerse alineados en producto (documentación Oleada 2).

## Dónde se comprueba en la app

- Layout o páginas bajo `src/app/admin/` (p. ej. `admin/layout.tsx`) suelen cargar repositorios y comprobar rol antes de renderizar.
- **Autoridad principal en datos**: funciones SQL `is_admin()` y políticas RLS en `008_rls.sql` y migraciones posteriores.

## Referencias

- [Roles en iniciativa](roles-en-iniciativa.md)
- [RLS y políticas](rls-policies.md)
