# Firmar acción

## Actores

Visitante (sin cuenta) o usuario con sesión.

## Flujo (firma `SIMPLE`, p. ej. derecho de petición)

1. Escanea el QR o abre `/acciones/[slug]`: ve el documento completo, el contador y el formulario, sin registrarse.
2. Llena los campos que pide el tipo (`signer_fields`): nombre, cédula, dirección, celular, correo; marca la autorización de datos (desmarcada por defecto).
3. "Enviarme el código" → `signInWithOtp` (crea la cuenta sin contraseña si no existe).
4. Escribe el código de 6 dígitos → `verifyOtp` → `signActionAction` registra la firma con el correo verificado de la sesión.
5. Pantalla de confirmación con número de firma y botón de WhatsApp. Sus datos quedan en el perfil para la siguiente acción del caso.

Con sesión abierta se omiten los pasos 3–4. En tipos `DRAWN` además se dibuja la firma (`{id}/signatures/{uid}.png`); en `VERIFIED` se exige identidad aprobada.

## Reglas

- Una firma por usuario y **una por cédula** en cada acción (índices únicos).
- Solo en `EN_FIRMA` (verificado también por RLS: `action_is_open_for_signing`).
- Dirección, celular y correo no van al PDF radicado; solo nombre, cédula y fecha.

## Configuración de Supabase requerida

- Auth → Email: habilitar registros por correo; plantilla **Magic Link** con el código: `Tu código para firmar en Civitapp es {{ .Token }}`.
- Auth → SMTP: proveedor propio (Resend, Postmark…). El correo por defecto de Supabase admite muy pocos envíos por hora.
- URL Configuration: agregar el dominio de producción a Redirect URLs.
