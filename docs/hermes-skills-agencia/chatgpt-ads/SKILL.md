---
name: chatgpt-ads-checklist
description: Use this when launching or auditing ChatGPT Ads / OpenAI ads for a client — GTM, thank-you page, lead_created, consent, pixels, and go-live checks before spending.
---

# ChatGPT Ads — checklist pre-lanzamiento

## Cuándo usarlo
- Antes de activar campaña ChatGPT Ads
- Cuando hay clics pero 0 conversiones
- Auditoría rápida de tracking OpenAI / GTM

## Objetivo
Salir con: **verde / ámbar / rojo** + lista de fallos concretos + qué no tocar.

## Datos que debes pedir (si faltan, pregunta 1 a 1)
1. URL landing + URL thank-you (path exacto)
2. Contenedor GTM (`GTM-XXXX`)
3. Si usan Consent Mode (sí/no) y CMP
4. Evento de conversión esperado (nombre exacto, p. ej. `lead_created`)
5. Si hay CAPI / server-side además del pixel
6. Estado campaña (pausada / activa) y desde cuándo midieron mal

## Procedimiento (orden fijo)

### A. Rutas
- [ ] Landing carga sin error
- [ ] Formulario envía a thank-you **específica** (no una “gracias” genérica de otro flujo)
- [ ] Path thank-you documentado (ej. contiene `/chat-gracias/` o el path real del cliente)
- [ ] No mezclar thank-you de ChatGPT Ads con thank-you de otros canales

### B. GTM — tags base
- [ ] Contenedor correcto en la web
- [ ] Tag base OpenAI / `oaiq` (o el snippet oficial vigente) en All Pages o según doc actual
- [ ] **NO** duplicar el tag base
- [ ] Preview GTM: el tag base dispara en landing

### C. Evento de conversión (crítico)
- [ ] Existe tag/evento `lead_created` (o el nombre que use OpenAI Ads ahora)
- [ ] Trigger = Page View (o evento form) **solo** en la thank-you correcta
- [ ] Nombre del trigger claro (ej. `PV - chat-gracias`)
- [ ] En preview: al enviar el form, el evento dispara **1 vez**
- [ ] No disparar en toda URL que contenga “gracias”

### D. Consent Mode
- [ ] Si hay CMP: el tag de conversión espera consent (`ad_storage`, `ad_user_data`, `ad_personalization` según configuración del cliente)
- [ ] Probar con consent aceptado → evento OK
- [ ] Probar con consent rechazado → no inventar conversiones falsas

### E. Consola / verificación técnica
En thank-you (incógnito, consent OK):
- [ ] `typeof oaiq` (o API vigente) no es `undefined`
- [ ] Network: petición del pixel/evento sale
- [ ] No errores JS que rompan el form

### F. CAPI / doble conteo
- [ ] Si hay CAPI en thank-you: confirmar que **no** doble-cuenta con el pixel
- [ ] Regla: o browser, o server bien deduplicado — no los dos a lo loco

### G. Campaña
- [ ] Conversión correcta seleccionada en el panel ChatGPT Ads
- [ ] Campaña **pausada** hasta verificación (salvo que el cliente diga lo contrario)
- [ ] Tras publicar GTM: versión con nombre fechado (ej. `YYYY-MM-DD lead_created ChatGPT Ads`)

## Qué NO tocar (salvo orden explícita)
- Tag base `oaiq` / pixel All Pages que ya funciona
- Flujos de gracias de otros productos
- Presupuestos / activar campaña sin OK humano

## Salida obligatoria (formato)
```
Cliente:
Landing:
Thank-you:
GTM:
Evento:

Semáforo: Rojo | Ámbar | Verde

Fallos:
- …

Hecho OK:
- …

Siguiente paso humano:
- Publicar GTM / verificar / activar campaña (elige uno)
```

## Semáforo
- **Rojo:** no hay evento en thank-you correcta, o thank-you mala, o pixel roto
- **Ámbar:** tracking OK en preview pero falta publish / consent dudoso / posible doble conteo
- **Verde:** preview + publish + 1 conversión de prueba visible (o checklist técnico completo si el panel aún no muestra)

## Después del go-live (24–72 h)
- Comparar clics reales vs conversiones
- Si clics > 0 y conv = 0 otra vez → reabrir esta skill desde C
- Revisar facturación / estado de cuenta si el servicio se detuvo

