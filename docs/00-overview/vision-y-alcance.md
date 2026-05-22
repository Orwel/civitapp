# Visión y alcance

## Propósito

Civitapp es una aplicación web para **impulsar y respaldar acciones constitucionales** en Colombia: redactar el documento, recolectar **firmas de respaldo ciudadano verificables**, radicar ante la entidad competente y dar seguimiento al trámite con trazabilidad y equipo.

La fórmula del producto:

> Acción constitucional = documento + firmas de respaldo + estado idempotente + comunidad.

Las firmas en Civitapp **no sustituyen** la validación de la Registraduría para mecanismos participativos (referendo, revocatoria, etc.). Son respaldo organizado de ciudadanos identificados en la plataforma.

## Alcance geográfico y normativo

- **País**: Colombia.
- **Tipos cubiertos (MVP)**: acciones judiciales constitucionales — tutela, popular, de grupo, de cumplimiento, de nulidad, de inconstitucionalidad.
- **Fuera de alcance MVP**: instrumentos participativos avalados por Registraduría, derechos de petición genéricos como producto separado.

## Público objetivo

1. **Ciudadanos** que quieren firmar o liderar una acción.
2. **Activistas y organizaciones** que coordinan equipo, bitácora y radicación.
3. **Políticos verificados** (oleada posterior): respaldo visible sin ser núcleo del MVP.

## Qué incluye el MVP del pivot

- Autenticación Supabase; perfil con **identidad firmable** al primer intento de firmar (validación ADMIN asíncrona).
- **Acciones constitucionales** con 7 estados principales, hitos en `RADICADO` y resultado en `FINALIZADO`.
- Página pública `/acciones/[slug]` (estado y contador sin login).
- Recolección de firmas con mínimo y plazo definidos por el líder; cierre automático o manual.
- **Firmar = unirse**: acceso a chat, bitácora y encuentros de la acción.
- Roles por acción (`CREADOR`, `LIDER`, `CO_LIDER`, `APOYO`).
- Composición de PDF final al radicar (documento + firmas con timestamp).

## No objetivos

- Asesoría legal automatizada con validez garantizada.
- Integración oficial con Registraduría o tribunales.
- App móvil nativa.
- Multi-idioma.

## Referencias

- [Estados de la acción](../02-dominio/estados-accion.md)
- [Acciones constitucionales](../02-dominio/acciones-constitucionales.md)
- [Sprint tracker](../sprints/SPRINT-TRACKER.md)
