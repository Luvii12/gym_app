---
name: verify
description: Ejecuta typecheck, lint, tests y build del proyecto y resume los fallos. Úsala antes de dar una tarea por terminada.
---

Ejecuta en este orden desde la raíz del proyecto, sin parar en el primer fallo:

1. `npm run typecheck`
2. `npm run lint`
3. `npm test`
4. `npm run build`

Luego informa en una tabla: paso → OK/FALLO. Para cada fallo, indica archivo:línea y la causa probable. Si todo está verde, dilo sin adornos. No marques nada como verificado sin haber ejecutado el comando.
Si el usuario pide E2E, añade `npm run test:e2e`.
