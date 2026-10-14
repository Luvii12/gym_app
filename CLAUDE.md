# Gym Routine — app personal de rutina de gym

PWA mobile-first para gestionar rutinas, registrar entrenos y ver el progreso. Uso personal (un solo usuario).
Datos 100% locales en el dispositivo (IndexedDB vía Dexie). Sin backend, sin login.

## Stack

TypeScript (strict) · React 19 · Vite · react-router · Dexie · Zustand · Recharts · vite-plugin-pwa
Tests: Vitest + Testing Library (+ fake-indexeddb) · E2E: Playwright (viewport móvil)

## Comandos

- `npm run dev` — servidor de desarrollo
- `npm run typecheck` · `npm run lint` · `npm test` · `npm run build`
- `npm run test:e2e` — Playwright (requiere `npx playwright install chromium` la primera vez)
- `npm run format` — Prettier
- Skill `/verify` ejecuta todo lo anterior y resume.

## Arquitectura

```
src/domain/     lógica pura (PRs, volumen, 1RM Epley). Sin React ni Dexie. Siempre con tests.
src/db/         esquema Dexie y repositorios. ÚNICO sitio que toca IndexedDB.
src/data/       datos estáticos (catálogo semilla de ejercicios).
src/features/   exercises/ routines/ workout/ progress/  (UI + hooks por feature)
src/components/ UI reutilizable
src/app/        router, layout, providers
e2e/            tests Playwright
```

## Modelo de datos

- Exercise { id, name, muscleGroup, equipment, isCustom }
- Routine { id, name, days: RoutineDay[] }; RoutineDay { id, name, items: { exerciseId, sets, repsTarget, restSec }[] }
- WorkoutSession { id, routineDayId?, startedAt, endedAt?, sets: LoggedSet[] }
- LoggedSet { exerciseId, setIndex, weightKg, reps, completedAt }
- Derivados (PR, volumen, 1RM) se calculan en `src/domain/`, no se guardan.

## Convenciones

- Componentes funcionales, hooks, nada de clases. TS estricto, sin `any`.
- Los componentes nunca importan Dexie directamente: usan repositorios de `src/db/`.
- Mobile-first (≈390px), objetivos táctiles ≥ 44px, tema oscuro por defecto.
- Textos de UI en español. Código e identificadores en inglés.
- Cada feature nueva: dominio + tests → db → UI → tests → `/verify`.
- Pesos en kg. Fechas en ISO 8601 / timestamps numéricos.

## Plan por fases

F0 Entorno · F1 Identidad visual y estructura · F2 Ejercicios y db · F3 Rutinas (días rotativos)
· F4 Entreno activo · F5 Historial y progreso · F6 Pulido y lanzamiento.
Plan detallado, tareas y criterios de hecho: `docs/ROADMAP.md` (única fuente de verdad; se trabaja una fase y una tarea cada vez).

## Agentes y skills del proyecto

Agentes: `frontend-dev`, `qa-tester`, `pwa-reviewer`. Skills propias: `verify`, `new-feature`, `seed-exercises`.
Skills de terceros (en `.claude/skills/`, no editar; actualizar con `npx skills update`): `frontend-design` (quitar tras definir la identidad visual), `ui-ux-pro-max`, `test-driven-development`.
MCP: `playwright`, `context7`.
