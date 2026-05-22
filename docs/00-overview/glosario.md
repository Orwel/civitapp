# Glosario

Términos en el sentido **dentro de Civitapp**.

## Acción constitucional

Unidad principal del producto: un trámite judicial constitucional (tutela, popular, etc.) con documento, estado, firmas de respaldo y comunidad. Tabla: `constitutional_actions`.

## Tipo de acción

Clasificación desde catálogo (`action_types`): una de las seis acciones judiciales del MVP.

## Estado de la acción

Uno de siete valores (`action_state`): `EN_CREACION`, `EN_FIRMA`, `FIRMADO`, `RADICADO`, `APELADO`, `EN_ESPERA_DE_OTRO_PROCESO`, `FINALIZADO`. Idempotente para todos los visitantes.

## Hito de radicación

Subestado dentro de `RADICADO` (`radicado_milestone`): p. ej. `ADMITIDA`, `EN_PRUEBAS`, `SENTENCIA`.

## Resultado final

Subestado dentro de `FINALIZADO` (`finalizado_result`): p. ej. `FAVORABLE`, `DESFAVORABLE`.

## Firma de respaldo

Registro en `constitutional_action_signatures` con snapshot inmutable (nombre, cédula, imagen de firma, timestamp). No es firma electrónica certificada por entidad estatal.

## Identidad firmable

Datos en `profiles` (cédula, fotos, firma capturada) completados al **primer intento de firmar**; `identity_verification_status` revisado después por ADMIN.

## Líder

Usuario con rol `LIDER` o `CREADOR` en `constitutional_action_roles`. Responsable de publicar, cerrar firmas, radicar y actualizar hitos.

## Firmar = unirse

Al firmar una acción, el usuario obtiene acceso a chat, bitácora y meetups de esa acción (equivalente a membresía).

## Bitácora / evento

Registro en `action_events` con `event_type` y `payload` JSON.

## RLS

Políticas Postgres que filtran filas según `auth.uid()` y rol en la acción.

## Caso de uso

Función en `src/application/` que orquesta repositorios.

## Iniciativa (deprecado)

Término del modelo anterior. Sustituido por **acción constitucional**. Ver [catalogos.md](../02-dominio/catalogos.md) solo como histórico.
