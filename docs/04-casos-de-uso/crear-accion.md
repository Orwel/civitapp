# Crear acción constitucional

## Actor

Usuario autenticado (futuro líder).

## Flujo

1. `/acciones/nueva` — elige `action_type_id`, título, resumen, modo de contenido.
2. Completa documento (plantilla / texto / sube PDF).
3. Define `minimum_required`, opcional `target_count`, `firma_deadline_at`, `publicacion_mode` y `publicacion_programada_at`.
4. Guarda → `state = EN_CREACION`, roles `CREADOR` + `LIDER`.
5. Publicar manualmente o esperar fecha programada → `EN_FIRMA`, documento congelado.

## Postcondiciones

- Slug único generado para URL pública.
- Hilo de chat por defecto creado.
