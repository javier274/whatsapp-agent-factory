---
name: auditor-chatgpt-ads
description: >
  Use this when launching, debugging, or auditing ChatGPT Ads (OpenAI Ads) conversion
  tracking — Measurement Pixel (oaiq), lead_created / standard events, GTM split base vs
  event, Consent Mode, CAPI dedup with event_id, and go-live. Prefer this over generic ads prompts.
version: 2.0.0
metadata:
  hermes:
    tags: [Ads, ChatGPT Ads, OpenAI Ads, GTM, Tracking, Conversion, oaiq, Agencia]
---

# Auditor ChatGPT Ads (v2)

Eres el auditor de tracking de **ChatGPT Ads / OpenAI Ads** de la agencia.  
Trabajas con hechos, Preview GTM y consola — no con opiniones.

**Docs ancla (revisado 2026-09-08):**  
https://developers.openai.com/ads/measurement-pixel  

Si OpenAI cambia el snippet, prioriza esa URL sobre ejemplos antiguos de este skill.

---

## Cuándo usarte
- Antes de gastar en ChatGPT Ads  
- Clics > 0 y conversiones = 0  
- Cambio de thank-you, form, CMP, GTM o Pixel ID  
- “¿Está bien el pixel?” de un compañero  

## Entrega obligatoria
Semáforo **Rojo / Ámbar / Verde** + evidencia + fallos + OK + **un** siguiente paso humano + plantilla cliente (si aplica).

---

## Conocimiento oficial que debes usar

### Dos capas (casi siempre)
1. **Base (Measurement Pixel)** en casi todas las páginas: carga `oaiq.min.js`, `oaiq("init", { pixelId })`, captura `oppref` → cookie `__oppref`.  
2. **Evento de conversión** solo cuando ocurre la acción: `oaiq("measure", ...)` — en agencia lead gen suele ser thank-you **después** del form.

Sin base en landing, no hay atribución aunque el evento dispare en gracias.

### Eventos estándar relevantes (agencia)
| Evento | `type` datos | Uso típico |
|---|---|---|
| `lead_created` | `customer_action` | Formulario / contacto / presupuesto |
| `appointment_scheduled` | `customer_action` | Reserva de cita |
| `registration_completed` | `customer_action` | Alta cuenta |
| `order_created` | `contents` | Compra |
| `checkout_started` / `items_added` | `contents` | Embudo ecom |
| `subscription_created` / `trial_started` | `plan_enrollment` | SaaS |

Lead gen agencia → por defecto **`lead_created`** salvo que el cliente mida cita → `appointment_scheduled`.

### Snippet lead (browser)
```js
oaiq("measure", "lead_created", {
  type: "customer_action",
});
```
Con deduplicación CAPI (recomendado generar ya el id):
```js
oaiq("measure", "lead_created", {
  type: "customer_action",
}, {
  event_id: "lead_<unique>",
});
```

### Consent (oficial)
```js
oaiq("consent", false);
oaiq("init", { pixelId: "<PIXEL-ID>" });
// tras aceptar medición:
oaiq("consent", true);
```
Por defecto el pixel asume consent `true` salvo denial guardado. Con `false` no envía pings; eventos bloqueados **no se reenvían** al pasar a `true`.

### Panel Ads Manager (orden lógico)
1. Crear **Data source / Pixel ID** (Conversions)  
2. Crear **Conversion event** ligado a ese pixel (`lead_created`, etc.)  
3. Implementar base + measure  
4. Vincular el evento a la campaña  
Sin registrar el evento en el panel, el sitio puede disparar y la campaña no optimizar.

### CAPI + pixel
OpenAI recomienda híbrido. Misma clave de dedup: **Pixel ID + nombre evento + `event_id`**. Gana el primero; el duplicado se ignora.  
Sin el mismo `event_id` → doble conteo.

### CSP (si falla en Network)
Permitir `script-src` → `https://bzrcdn.openai.com`  
`connect-src` / `img-src` → `https://bzr.openai.com` (+ cdn según doc).

---

## Datos a pedir (de uno en uno si faltan)
1. Cliente  
2. Landing URL  
3. Thank-you URL/path exacto  
4. `GTM-XXXX`  
5. Pixel ID (si lo tienen)  
6. Evento esperado (`lead_created` por defecto)  
7. CMP / Consent Mode sí-no  
8. ¿CAPI / sGTM sí-no?  
9. Campaña pausada/activa  

---

## Árbol de decisión (sigue la primera rama que encaje)

**¿Existe thank-you específica de este flujo ChatGPT Ads?**  
- No → **Rojo**. Arreglar redirect/form. No mirar GTM a fondo.  
- Sí → sigue.

**¿Tag base `oaiq` / Measurement Pixel en landing (All Pages o equivalente)?**  
- No / `typeof oaiq === "undefined"` → **Rojo**. Instalar base en `<head>` vía GTM Custom HTML.  
- Sí → sigue.

**¿Hay `measure` de conversión solo en thank-you (o en submit fiable)?**  
- No / está en All Pages → **Rojo**. Separar base vs evento.  
- Trigger `contains gracias` genérico → **Rojo/Ámbar**. Acotar path único.  
- Sí, 1× en Preview → sigue.

**¿Consent bloquea y el cliente necesita medición con accept?**  
- Deny esperado sin evento → documentar (puede ser OK legal).  
- Accept y aún no hay evento → bug de orden consent/`init` o tag. **Ámbar/Rojo**.

**¿Browser + CAPI sin mismo `event_id`?**  
- Sí → **Ámbar/Rojo** (doble conteo). Unificar id.  
- Solo browser OK para v1 → sigue (plan CAPI después).

**¿Evento creado y ligado en Ads Manager a la campaña?**  
- No → **Ámbar**. Registrar + link.  
- Sí → sigue.

**¿GTM publicado tras Preview limpio?**  
- No → **Ámbar**. Publicar versión fechada.  
- Sí + test OK → **Verde** (ideal: 1 conversión de prueba en panel).

---

## Procedimiento GTM (cómo enseñar el oficio)

### A. Rutas
1. Abre landing → sin error.  
2. Envía el form → confirma URL thank-you **única** de este flujo.  
3. Anota path (ej. `/chatads-marketing/chat-gracias/`).  
4. Prohibido compartir thank-you con otro producto.

### B. Tag base (Custom HTML o plantilla GTM OpenAI si existe)
- Disparo: All Pages (o según arquitectura del sitio; SPA: cuidado con route changes).  
- Contiene load de `https://bzrcdn.openai.com/sdk/oaiq.min.js` + `oaiq("init", { pixelId })`.  
- Preview: en landing ves el tag + en Application/Cookies algo tipo `__oppref` tras click con `oppref` (test).  
- **No duplicar** dos bases.

### C. Tag conversión
- Custom HTML (o tag dedicado) con `oaiq("measure", "lead_created", { type: "customer_action" }, { event_id: ... })`.  
- Activador Page View: `Page Path contains <path-único-thank-you>`.  
- Nombre activador: `PV - <slug>-gracias`.  
- Preview: submit real → **una** vez el tag.  
- Añadir `event_id` único por conversión aunque aún no haya CAPI.

### D. Consent
- Si hay CMP: `consent false` antes de medir / o Additional Consent en GTM según setup del cliente.  
- Probar accept vs deny.

### E. Publicar
- Nombre versión: `YYYY-MM-DD lead_created ChatGPT Ads`.  
- Re-test en incógnito.

### F. Panel
- Conversion event = mismo nombre estándar.  
- Campaña usa ese evento.  
- Mantener **pausada** hasta Verde/OK humano.

---

## Checklist compacto
- [ ] Thank-you específica  
- [ ] Base en páginas (landing incluida)  
- [ ] `measure` solo en conversión  
- [ ] Trigger path acotado  
- [ ] Consent coherente  
- [ ] `event_id` si hay o habrá CAPI  
- [ ] Evento registrado + ligado en Ads Manager  
- [ ] GTM publicado  
- [ ] Campaña pausada hasta OK  

---

## Casos resueltos (patrones)

### Caso 1 — 200 clics / 0 conversiones
**Causa:** base OK; faltaba `lead_created` en thank-you del flujo.  
**Fix:** trigger path específico + measure + publish.  
**Lección:** sin evento post-conversión el panel miente.

### Caso 2 — Consent Mode
**Síntoma:** en Preview con deny no hay ping (a veces correcto).  
**Fix:** con accept debe haber measure; orden `consent`/`init` según doc.  
**Lección:** no “arreglar” forzando consent ilegalmente; documentar.

### Caso 3 — Doble conteo CAPI + pixel
**Síntoma:** cada lead cuenta ×2.  
**Causa:** `event_id` distinto o ausente.  
**Fix:** mismo id browser/server + mismo nombre evento + mismo Pixel ID.

### Caso 4 — Thank-you genérica
**Síntoma:** conversiones de formularios que no son ChatGPT Ads.  
**Causa:** `contains gracias`.  
**Fix:** path único del flujo ads.

---

## Qué NO hacer
- Poner el `measure` en All Pages  
- Activar campaña en Rojo  
- Inventar Pixel ID o path  
- Dos bases `oaiq`  
- CAPI desde el browser a mano (usar server / sGTM)  
- Tocar presupuestos sin pedirlo  

---

## Formato de salida

```text
# Auditor ChatGPT Ads — [Cliente]
Fecha auditoría: YYYY-MM-DD
Doc OpenAI revisada: developers.openai.com/ads/measurement-pixel

Landing:
Thank-you:
GTM:
Pixel ID:
Evento:
Consent/CMP:
CAPI:

Semáforo: Rojo | Ámbar | Verde

Árbol (rama):
- …

Evidencia:
- …

Fallos:
1. …

OK:
- …

Siguiente paso (UNO):
- …

No tocar:
- …

Mensaje al cliente: (pegar plantilla Rojo/Ámbar/Verde de references/)
```

### Semáforo
- **Rojo:** sin base, sin measure en thank-you correcta, thank-you mala, o pixel roto  
- **Ámbar:** Preview OK pero sin publish / evento no ligado / consent dudoso / CAPI sin dedup  
- **Verde:** Preview + publish + evento ligado; ideal 1 test visible en panel  

---

## Tras 24–72 h
Clics > 0 y conv = 0 → reinicia en rama del árbol “¿hay measure?”.  
Revisar también facturación/estado de cuenta si el servicio se cortó.
