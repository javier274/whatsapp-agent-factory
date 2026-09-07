# Entrevista profunda v2 — Constructor de agentes (Hermes)

Uso: el super agente hace estas capas con el negocio final (o contigo si aún no está el cliente).  
Estilo: conversación. Una pregunta (o bloque corto) cada vez. Parafrasea y confirma antes de guardar.

## Reglas del constructor
- No inventar precios, casos ni promesas.
- Si una respuesta es vaga (“depende”), pedir un ejemplo real.
- Marcar cada dato: **BLOQUEANTE** | recomendado | opcional.
- Sin BLOQUEANTES de capas 1–3 → no crear agente.
- Sin capa 4 mínima (objeciones+pruebas) → agente solo en modo “calificar + handoff”, no cierre solo.
- Al final entregar: ficha estructurada lista para Supabase (clients, settings, offer, persuasion).

---

## Capa 0 — Contexto de la sesión (contigo / agencia)
1. ¿Este agente es para un cliente nuevo o uno que ya conocéis?  
2. ¿Sector y nombre comercial exacto?  
3. ¿Objetivo prioritario del bot: leads nuevos, cierre, rescate, o mix? **BLOQUEANTE**

---

## Capa 1 — Identidad del negocio (quiénes son)
**BLOQUEANTES**
1. Nombre público + una frase de qué hacen (la que dirían en WhatsApp).  
2. Qué NO hacen / qué encargos rechazan (igual de importante que lo que venden).  
3. Zona geográfica o 100% online.  
4. Tono deseado + 2 ejemplos de frases que SÍ sonarían a ellos + 2 que NUNCA dirían.

**Profundas**
5. Historia corta: por qué existe el negocio (1–2 frases humanas).  
6. Diferencia real frente a 2–3 competidores típicos (sin insultar).  
7. Límites legales/éticos del sector (salud, finanzas, garantías, “resultados”).  

**Opcional**
8. Palabras del gremio que el bot debe entender (jerga local).

→ Sale: `clients` + trozo de `agent_settings` (tono, restricciones de voz).

---

## Capa 2 — Cliente ideal y anti-cliente (a quién hablar)
**BLOQUEANTES**
1. Cliente ideal: sector/tamaño/situación (describir una persona concreta, no “pymes”).  
2. Anti-cliente: a quién hay que filtrar rápido (ej. solo mira precios, fuera de zona, sin presupuesto).  
3. Señales HOT vs COLD en las primeras frases del lead.

**Profundas**
4. Recorrido de compra habitual: ¿cómo llegan? ¿cuántos toques hasta cerrar?  
5. Quién decide (dueño, pareja, comité) y qué duda tiene cada uno.  
6. Estacionalidad (meses fuertes/flojos) y urgencias típicas.  

**Opcional**
7. Ticket emocional: miedo principal del comprador (perder dinero, elegir mal, tiempo).

→ Sale: reglas de filtrado en prompt + tipos de `persuasion` “qualifying”.

---

## Capa 3 — Oferta y dinero (qué se puede prometer)
**BLOQUEANTES**
1. Lista de packs/servicios con precio min–max (o “desde”).  
2. Qué incluye / no incluye cada uno.  
3. CTA de cierre preferido (call, reserva, pago, visita, formulario).  
4. Umbral de handoff (€ o complejidad).  

**Profundas**
5. Margen o flexibilidad real (¿puede el bot bajar precio? casi siempre: no).  
6. Condiciones: permanencia, setup fee, plazos de entrega.  
7. Qué pasa si el lead pide “solo el precio” sin contexto.

**Regla dura:** si no hay precios claros → STOP. Solo modo info + human.

→ Sale: `offer_items` + `handoff_threshold_eur`.

---

## Capa 4 — Persuasión con contexto (no frases sueltas)
Para cada objeción top (mínimo 5, ideal 8):

**Por objeción (BLOQUEANTE el set mínimo)**
1. Texto exacto que dice el lead (“es caro”, “ya tengo agencia”…).  
2. Qué hay detrás (miedo real).  
3. Respuesta humana que ya funciona (con sus palabras).  
4. Prueba asociada (caso, número, reseña) — solo si es verificable.  
5. Intensidad: suave / media / firme.  
6. ¿Cuándo NO usar esa respuesta?

**Además**
7. 3 pruebas sociales / casos que SÍ se pueden contar (nombre anonimizado si hace falta).  
8. Promesas prohibidas (lista explícita).  
9. Scripts de rescate: clientes a X meses; gancho honest (revisión, novedad, no “te echo de menos” vacío).  
10. Un cierre bueno y uno malo (ejemplos de mensajes).

→ Sale: `persuasion_items` v1 (objection/benefit/proof/rescue/close).

---

## Capa 5 — Operación y confianza
**BLOQUEANTES**
1. Humano de respaldo (nombre, teléfono, horario de aviso).  
2. Horario en que el bot puede escribir.  
3. WhatsApp Business: ¿existe? ¿número dedicado?  
4. Consentimiento / cómo entraron los contactos (importante en rescate).

**Profundas**
5. SLA: en cuánto debe responder un humano tras handoff.  
6. Idiomas.  
7. Datos que el bot NUNCA debe pedir.

→ Sale: campos operativos en `clients` / `agent_settings`.

---

## Capa 6 — Historias (excelencia; hace “humano” al agente)
**Recomendadas (muy valiosas)**
1. Cuenta un cierre reciente paso a paso (qué preguntó el cliente, qué desbloqueó).  
2. Cuenta un lead perdido: por qué se fue.  
3. Frase que más orgullo os da decir.  
4. Frase que os hace perder al cliente si la soltáis.

→ Sale: ejemplos few-shot dentro del system_prompt + restricciones vivas.

---

## Criterio de ficha completa

| Nivel | Condición | Qué se permite |
|---|---|---|
| Rojo | Falta capa 1–3 bloqueante | No crear agente |
| Ámbar | 1–3 OK, capa 4 incompleta | Solo calificar + handoff |
| Verde | 1–5 bloqueantes OK + ≥5 objeciones con respuesta | Filtrar + presupuesto + seguimiento |
| Oro | Verde + capa 6 + rescate + pruebas | Las 4 tareas a pleno |

---

## Salida que debe producir el constructor
1. Resumen en lenguaje humano (1 página).  
2. JSON/filas listas: clients, agent_settings, offer_items, persuasion_items.  
3. Lista de huecos pendientes.  
4. Recomendación: Rojo / Ámbar / Verde / Oro.
