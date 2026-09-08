# GTM — notas rápidas ChatGPT Ads

## Base (All Pages)
Custom HTML con snippet oficial:
https://developers.openai.com/ads/measurement-pixel
- Script `oaiq.min.js` desde `bzrcdn.openai.com`
- `oaiq("init", { pixelId: "..." })`

## Conversión (solo thank-you)
```html
<script>
  oaiq("measure", "lead_created", { type: "customer_action" }, {
    event_id: "{{unique_id}}"
  });
</script>
```
Activador: Page View → Page Path contains `/tu-path-unico-gracias/`
Nombre: `PV - chatgpt-ads-gracias`

## Publicar
Versión: `YYYY-MM-DD lead_created ChatGPT Ads`

## CSP
script-src: https://bzrcdn.openai.com
connect-src / img-src: https://bzr.openai.com (y cdn según doc)
