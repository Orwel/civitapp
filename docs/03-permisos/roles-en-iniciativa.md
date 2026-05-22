# Roles en iniciativa

Definidos como enum Postgres `role_in_initiative` y tipo TypeScript `RoleInInitiative` en `src/core/enums/Roles.ts`. Se aplican por fila en `initiative_members.role_in_initiative`.

## Valores

| Rol | Uso típico |
|-----|------------|
| **OWNER** | Creador u operador principal; al crear iniciativa el caso de uso asigna OWNER al `created_by`. |
| **LEADER** | Coordinación; puede convivir con filas en `initiative_leaders` que refinan el tipo de liderazgo. |
| **MEMBER** | Participante estándar; unión pública o por invitación suele acabar en MEMBER. |
| **OBSERVER** | Lectura / seguimiento sin participación activa (según reglas de UI que se documenten en Oleada 2). |
| **POLITICAL_SPONSOR** | Respaldo político verificado; el flujo de negocio completo está pendiente de especificar. |

## Estado de membresía (`member_status`)

| Estado | Significado |
|--------|-------------|
| INVITED | Invitado, aún no activo como miembro pleno. |
| ACTIVE | Miembro con acceso según RLS de “miembro activo”. |
| REMOVED | Participación retirada. |
| BANNED | Bloqueado explícitamente. |

Las políticas RLS usan casi siempre **solo miembros ACTIVE** vía `is_initiative_member(initiative_id)`.

## Líderes de iniciativa (`initiative_leaders`)

Campo `leader_type`: **GENERAL**, **LEGAL**, **COMMS**, **FIELD**. Es ortogonal al rol `LEADER` en miembros: describe el foco del liderazgo.

## Visibilidad de la iniciativa (`initiative_visibility`)

- **PUBLIC**: visible en listados según reglas de explore; permite política de auto-unión a miembros (migración `019_invitations_and_join_public.sql`).
- **PRIVATE**: acceso restringido a miembros y admin; detalle de UX para no miembros en Oleada 2.

## Referencias

- Entidad: `src/core/entities/Member.ts`, `InitiativeLeader.ts`.
- [RLS y políticas](rls-policies.md) para matriz efectiva de lectura/escritura.
