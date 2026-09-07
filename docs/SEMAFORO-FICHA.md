# Semáforo de ficha — criterios de completitud

Antes de crear o encender un agente WhatsApp, la ficha del cliente debe tener un color.  
El Constructor (`docs/SOUL-constructor-hermes.md`) emite semáforo + por qué + huecos.

---

## Rojo — no crear agente de cierre

Falta algo **bloqueante** de identidad, ideal u oferta, o hay riesgo operativo grave.

### Criterios (cualquiera basta para Rojo)
- Sin nombre público claro ni frase de qué hacen (capa 1).
- Sin anti-cliente / señales COLD (capa 2).
- **Sin precios min–max (o “desde”) ni packs** (capa 3) → STOP de cierre.
- Sin humano de handoff + forma de avisar (capa 5).
- Sin decisión de número WhatsApp / `ycloud_phone_number_id` previsto.
- Respuestas solo vagas (“depende”, “lo normal”) tras pedir ejemplos reales.
- Semáforo Rojo **explícito** en entrevista → no inventar ficha “Verde” para contentar.

### Qué sí se puede hacer en Rojo
- Seguir entrevistando.
- Documentar huecos.
- **No** insertar agente de cierre ni prometer go-live.

---

## Ámbar — ficha usable con límites

Hay identidad + ideal + oferta mínima, pero faltan capas de persuasión/operación o hay stops parciales.

### Criterios típicos Ámbar
- Capas 1–3 cubiertas en lo bloqueante, pero:
  - Persuasión (capa 4) incompleta: <5 objeciones con respuesta + prueba, o sin benefits/close.
  - Capa 5 a medias: horario OK pero consentimiento de rescate poco claro → **rescate OFF**.
  - Sin ejemplos de voz escritos (solo adjetivos).
  - CTA de cierre ambiguo.
- Se puede montar modo **calificar + handoff** (no cierre autónomo fuerte).

### Qué se puede hacer en Ámbar
- Alta en DB con restricciones duras (“no inventar precios”; handoff fácil).
- Pruebas internas (paso 6) en allowlist.
- **No** declarar “agente listo de cierre” ni volumen alto.

---

## Verde — listo para conexión y prueba

Ficha completa para operar con cierre orientativo bajo supervisión.

### Criterios mínimos Verde
- [ ] Capas 0–3 bloqueantes cerrados con ejemplos reales.
- [ ] Packs en `offer_items` con price_min/max, includes/excludes, CTA.
- [ ] Umbral handoff € (o regla de complejidad) definido.
- [ ] ≥5 objeciones + respuestas; benefits; al menos un close; proofs donde existan (capa 4).
- [ ] Humano + suplente/SLA + horario del bot (capa 5).
- [ ] Consentimiento / origen de contactos claro; rescate ON solo si 5.4 OK, si no OFF escrito.
- [ ] Tono y restricciones listos para `agent_settings`.
- [ ] Claves Fase A en camino o validadas (`docs/keys-checklist.md`).

### Qué se puede hacer en Verde
- Insertar `clients` + `agent_settings` + `offer_items` + `persuasion_items`.
- Cable YCloud ↔ `client_id` + **anti-mezcla 5b**.
- Checklist paso 6 (A–D). Si A o C fallan → no encender.
- Encendido controlado (paso 7).

---

## Oro — excelencia operativa

Verde + profundidad y medición listas para iterar.

### Criterios Oro (Verde +)
- [ ] Historias / casos reales (capa 6) sin inventar métricas.
- [ ] ≥8 objeciones con contexto; intensidades soft/medium/firm coherentes.
- [ ] Follow-ups y rescate con reglas numéricas (máx. toques, días, baja).
- [ ] Frases SÍ / NUNCA de marca documentadas.
- [ ] Plan de revisión 48–72h y qué KPIs mirar (`docs/ARQUITECTURA.md` §Medición).
- [ ] Versionado consciente (prompt v1, items con `active`/`replaces_id`).
- [ ] Anti-mezcla pasada y anotada.
- [ ] Handoff summary checklist acordado con el humano.

### Qué implica Oro
- Volumen mayor (aún con monitoreo).
- Iteración de persuasión con datos reales, no a ojo.
- Candidato a plantilla interna / caso de éxito de la fábrica (sin datos sensibles en el repo).

---

## Cómo reportar el semáforo (plantilla)

```
Semáforo: Rojo | Ámbar | Verde | Oro
Por qué: (3–6 bullets)
Huecos bloqueantes: …
Huecos recomendados: …
Modo permitido ahora: solo entrevista | calificar+humano | cierre orientativo | Oro operativo
Siguiente paso: …
```

Regla: **no digas “agente listo”** si está en Rojo o Ámbar sin dejar el color y los límites por escrito.

---

## Relación con otros docs

- Criterios salen de la entrevista: `docs/entrevista-profunda-v2-*.md`
- Operación post-ficha: `docs/MANUAL-OPERATIVO.md`
- Ejemplo de perfil closer: `docs/hermes-closer-agencia/`
