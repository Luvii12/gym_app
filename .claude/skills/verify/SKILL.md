---
name: verify
description: Ejecuta typecheck, lint, tests y build del proyecto y resume los fallos. Úsala antes de dar una tarea por terminada.
---

Ejecuta `npm run verify` (añade `-- --e2e` si el usuario pide E2E). Hace typecheck, lint, formato, tests y build, y solo imprime una línea por paso; si uno falla, se detiene y muestra el final de su salida.

Informa con esas líneas tal cual. Para cada fallo, indica archivo:línea y la causa probable. Si todo está verde, dilo sin adornos. No marques nada como verificado sin haber ejecutado el comando.
Usa esta skill en lugar de lanzar cada comando por separado: ahorra mucho contexto.
