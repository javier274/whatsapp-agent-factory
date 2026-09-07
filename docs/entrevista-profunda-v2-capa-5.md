# Entrevista profunda v2 — Capa 5 (operación, consentimiento, ética)

Sin esta capa el agente puede vender bien y aun así crear problemas legales, de marca o de sueño al equipo.

## 5.1 Humano de respaldo (BLOQUEANTE)
1. Nombre y teléfono/WhatsApp de quien recibe handoffs.  
2. ¿Suplente si no contesta?  
3. En cuántos minutos/horas debe responder un humano (SLA).  
4. Fuera de horario: ¿el bot dice “te avisamos mañana” o escala igual?  
5. Qué debe incluir el resumen de handoff (mínimo: nombre, necesidad, presupuesto, última objeción, link/historial).

**Test:** si el bot escala a las 23:40, ¿quién se entera y cómo?

## 5.2 Horario y ritmo (BLOQUEANTE)
6. Horario en que el bot puede escribir (timezone del negocio).  
7. ¿Fines de semana?  
8. Máximo de follow-ups sin respuesta + días entre ellos.  
9. ¿Puede escribir el primero a un lead frío (outbound) o solo responder (inbound)? **Decisión explícita.**

## 5.3 WhatsApp y números (BLOQUEANTE)
10. ¿WhatsApp Business / API listo? ¿Número dedicado o el del dueño?  
11. ¿Un número = un agente = un `client_id`? (debe ser sí)  
12. ¿Quién paga YCloud/Meta y quién tiene el acceso?  
13. Si el dueño sigue usando ese WhatsApp a mano, ¿cómo evitáis choques bot vs humano?

## 5.4 Consentimiento y datos (BLOQUEANTE para rescate; recomendado siempre)
14. ¿De dónde salen los contactos? (web, anuncio, referido, lista vieja, Excel…)  
15. ¿Hay base legal / consentimiento para escribirles?  
16. En rescate de antiguos: ¿solo quienes os escribieron antes o también lista fría?  
17. ¿Qué hacer si dicen “no me escribáis más” / “baja”? (parar + marcar, no discutir)  
18. Datos que el bot NUNCA pide (DNI, tarjeta, contraseñas, historial clínico sensible…).  
19. ¿Cuánto tiempo guardáis chats? ¿El cliente final puede pedir borrado?

**Regla dura:** sin claridad en 14–17 → modo rescate **OFF** hasta resolverlo.

## 5.5 Quejas, crisis y límites
20. Si hay enfado / amenaza / legal: ¿respuesta fija + handoff inmediato?  
21. ¿El bot admite errores de la empresa o solo escala?  
22. Temas que no discute (diagnósticos, garantías absolutas, política…).  
23. ¿Hay competencia a la que no debe mencionar?

## 5.6 Handoff de calidad (no solo “te paso con alguien”)
24. Frase exacta de transición a humano.  
25. ¿El lead elige horario de llamada o solo deja teléfono?  
26. ¿Se crea registro en `handoffs` + aviso (WhatsApp/email/Telegram al equipo)?  
27. Si el humano no contesta a tiempo, ¿segundo aviso?

## 5.7 Multi-idioma y accesibilidad
28. ¿Solo español? ¿Otros?  
29. Si escriben en otro idioma: ¿cambiar, pedir español, o handoff?

## 5.8 Rescate — protocolo ético (si aplica)
30. Definir “antiguo”: meses sin compra/escritura.  
31. Mensaje 1 de rescate: gancho honesto (qué ofrecéis de verdad).  
32. Si no responden: ¿cuántos toques y fin?  
33. Lista negra: impagos, conflictos, “no contactar”.  
34. ¿El bot puede ofrecer descuento en rescate o solo humano?

## Bisturí capa 5
- “¿Qué sería un escándalo menor si el bot lo manda a 200 personas?”  
- “¿Quién se enfada primero si el bot falla: el dueño del negocio o el lead?”  
- “Si mañana Meta limita el número, ¿tenéis plan B?”  

## Semáforo capa 5
| Falta | Efecto |
|---|---|
| Sin humano + SLA | No encender |
| Sin horario / límites de follow-up | No encender |
| Sin política de baja / consentimiento en rescate | Rescate OFF |
| Sin regla bot vs humano en el mismo número | Riesgo alto de caos |
| Sin datos prohibidos | Añadir defaults estrictos antes de Verde |

## Defaults recomendados si el cliente no sabe
- Follow-ups: máx 2; separación 48h; luego 7 días silencio.  
- Baja: “Hecho, no te escribo más.” + flag `do_not_contact`.  
- Fuera de horario: responde 1 vez corto + “el equipo te contacta en horario laboral”.  
- Presentación: “asistente de [negocio]” (decidir IA sí/no en capa 1).  
- Nunca: pagos, contraseñas, documentos sensibles por chat.
