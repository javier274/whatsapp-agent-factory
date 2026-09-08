# Notas GTM — ChatGPT Ads (referencia rápida)

## Trigger Page View recomendado
- Tipo: Page View
- Condición: Page Path **contains** el path único del thank-you del flujo ChatGPT Ads
- Nombre: `PV - [slug-flujo]-gracias`

## Evitar
- `contains gracias` sin más
- Mismo thank-you que el formulario de otro producto
- Dos tags de conversión iguales

## Publicación
- Nombre versión: `YYYY-MM-DD lead_created ChatGPT Ads`
- Probar en incógnito tras publicar (cache CMP)

## Consent (si aplica)
Additional consent on conversion tag as configured for the client CMP.
