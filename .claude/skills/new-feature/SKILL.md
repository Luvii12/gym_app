---
name: new-feature
description: Flujo estándar para añadir una feature a Gym Routine (dominio → db → UI → tests → verify). Úsala al empezar cualquier tarea del ROADMAP.
---

Para la feature indicada en los argumentos:

1. **Alcance:** relee la fase correspondiente en `docs/ROADMAP.md` y `CLAUDE.md`. Confirma el criterio de "hecho" en 3-5 líneas.
2. **Dominio:** tipos y funciones puras en `src/domain/` + tests Vitest primero.
3. **Datos:** tablas/repositorio en `src/db/` (migración Dexie versionada si cambia el esquema) + tests con fake-indexeddb.
4. **UI:** delega en el agente `frontend-dev` (mobile-first, español).
5. **Tests:** delega en `qa-tester` (componentes + un E2E del flujo principal).
6. **Cierre:** ejecuta la skill `verify`. Resume qué se hizo y qué queda pendiente.

Mantén los cambios acotados a la feature; no refactorices código ajeno.
