# Firmar acción

## Actores

Visitante anónimo → registrado; firmante.

## Flujo

1. Visita `/acciones/[slug]` (ve estado y contador sin login).
2. Clic en Firmar → login/register con `?next=`.
3. Si perfil sin identidad firmable → formulario cédula, fotos, firma canvas → `PENDING`.
4. Confirma firma → INSERT en `constitutional_action_signatures` con snapshot.
5. Acceso a chat/bitácora/meetups de la acción.
6. Sistema evalúa transición a `FIRMADO` si aplica.

## Reglas

- Una firma por usuario por acción (UNIQUE).
- Solo en `EN_FIRMA`.
