# Roadmap — Gym Routine

Única fuente de verdad del plan. Se trabaja **una fase cada vez**, en orden, y una tarea cada vez.
Marca `[x]` al terminar cada tarea. Cualquier idea nueva va al **Backlog**, no a la fase en curso.

## Decisiones cerradas

| Tema               | Decisión                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Plataforma         | PWA instalable, offline                                                                                                   |
| Datos              | 100 % locales (IndexedDB con Dexie). Sin backend ni login                                                                 |
| Stack              | TypeScript estricto + React 19 + Vite                                                                                     |
| Rutina             | **Días rotativos** (A/B/C, Push/Pull/Legs…). La app propone "el siguiente" según la última sesión completada              |
| Registro por serie | Solo **peso (kg) y repeticiones**                                                                                         |
| Estilo visual      | **Oscuro, minimalista, limpio y con identidad propia.** Números grandes, botones táctiles ≥ 44px, un solo color de acento |
| Idioma             | UI en español, código en inglés                                                                                           |

## Reglas de trabajo

1. Empezar cada sesión leyendo este archivo y retomar la primera tarea sin marcar.
2. Cada tarea se hace con `/new-feature`: dominio + tests → db → UI → tests → `/verify`.
3. Una fase termina cuando se cumple su **Criterio de hecho**, no antes. Al cerrarla: `/verify`, revisión de `qa-tester` (y `pwa-reviewer` en F0 y F5) y commit.
4. Si el plan cambia, se edita aquí y se anota en el **Registro de cambios**. No se cambia de rumbo "de palabra".

---

## F0 — Entorno y esqueleto ✅

- [x] Vite + React + TS, PWA, Vitest, Playwright, ESLint, Prettier
- [x] CLAUDE.md, agentes, skills, MCP, hooks
- [x] Primer commit del estado actual

## F1 — Identidad visual y estructura de la app

**Objetivo:** una base visual y de navegación sobre la que construir todo lo demás, para no rehacer la UI después.

- [ ] F1.1 Dirección visual: paleta (4-6 colores), tipografía, escala de espacios y radios. Con `frontend-design` y `ui-ux-pro-max`. Se aprueba antes de codificar
- [ ] F1.2 Tokens CSS (variables) y componentes base: `Button`, `Card`, `Input numérico`, `Stepper (+/−)`, `EmptyState`
- [ ] F1.3 Router y layout con barra inferior: **Hoy · Rutinas · Ejercicios · Progreso**
- [ ] F1.4 Iconos PWA reales (PNG 192/512 maskable + apple-touch-icon) con la identidad elegida

**Criterio de hecho:** la app navega entre 4 pantallas vacías con el estilo final, instalada en el móvil se ve bien, y los componentes base tienen test.

## F2 — Ejercicios y base de datos

**Objetivo:** catálogo de ejercicios y la capa de datos.

- [ ] F2.1 Tipos de dominio (`Exercise`, `Routine`, `RoutineDay`, `WorkoutSession`, `LoggedSet`) en `src/domain/`
- [ ] F2.2 Esquema Dexie v1 + repositorios en `src/db/` (única puerta a IndexedDB) con tests sobre `fake-indexeddb`
- [ ] F2.3 Catálogo semilla (~60-80 ejercicios en español) con la skill `seed-exercises`; carga inicial idempotente
- [ ] F2.4 Pantalla Ejercicios: lista, búsqueda y filtro por grupo muscular
- [ ] F2.5 Crear, editar y borrar ejercicios personalizados (los de la semilla no se borran)

**Criterio de hecho:** abrir la app por primera vez muestra el catálogo; crear un ejercicio propio sobrevive a recargar la página; tests de `db/` en verde.

## F3 — Rutinas

**Objetivo:** definir tus rutinas con días rotativos.

- [ ] F3.1 Dominio: `nextDay(routine, sessions)` — propone el siguiente día según la última sesión completada (con tests, incluidos casos límite: sin sesiones, rutina de 1 día, día borrado)
- [ ] F3.2 Repositorio de rutinas y ajuste "rutina activa"
- [ ] F3.3 Lista de rutinas y crear/renombrar/duplicar/borrar
- [ ] F3.4 Editor de rutina: añadir/quitar/reordenar días
- [ ] F3.5 Editor de día: elegir ejercicios del catálogo y fijar series, repeticiones objetivo y descanso; reordenar

**Criterio de hecho:** puedes montar tu rutina real completa (p. ej. Push/Pull/Legs) en menos de 5 minutos, y `nextDay` está cubierta por tests.

## F4 — Entreno activo (el corazón de la app)

**Objetivo:** registrar un entreno en el gym con el móvil en la mano, rápido y sin perder datos.

- [ ] F4.1 Pantalla **Hoy**: muestra el día propuesto por `nextDay` y botón "Empezar"; opción de elegir otro día o entreno libre
- [ ] F4.2 Sesión en curso: lista de ejercicios del día, series con peso/reps **precargados con lo último que hiciste**
- [ ] F4.3 Registro rápido: steppers +/−, marcar serie como hecha, añadir/quitar serie
- [ ] F4.4 Temporizador de descanso automático al completar una serie (con vibración si el dispositivo la soporta)
- [ ] F4.5 Persistencia continua: cada serie se guarda al momento; si cierras la app a mitad, se **reanuda** la sesión
- [ ] F4.6 Terminar o descartar sesión; añadir un ejercicio extra al vuelo
- [ ] F4.7 Mantener la pantalla encendida durante el entreno (Wake Lock, con degradación si no existe)

**Criterio de hecho:** E2E en móvil de un entreno completo (empezar → registrar series → descanso → terminar) y de la reanudación tras recargar; ninguna pérdida de datos al cerrar la app.

## F5 — Historial y progreso

**Objetivo:** ver que estás mejorando.

- [ ] F5.1 Dominio con tests: 1RM estimado (Epley), PR por ejercicio, volumen por sesión y por semana
- [ ] F5.2 Historial: lista de sesiones y detalle; editar o borrar una sesión
- [ ] F5.3 Pantalla Progreso: gráfica por ejercicio (peso máximo / 1RM estimado) y volumen semanal (Recharts)
- [ ] F5.4 Marcar récords personales (PR) al terminar una serie y en el historial

**Criterio de hecho:** con datos de varias semanas (seed de prueba), las gráficas y los PR coinciden con el cálculo manual de los tests.

## F6 — Pulido y lanzamiento

**Objetivo:** que sea fiable y la uses a diario.

- [ ] F6.1 Exportar e importar todo en JSON, con validación del archivo importado y confirmación antes de sobrescribir
- [ ] F6.2 Pedir almacenamiento persistente (`navigator.storage.persist`) para que el navegador no borre los datos
- [ ] F6.3 Offline completo verificado (modo avión tras la primera carga) con `pwa-reviewer`
- [ ] F6.4 Lighthouse PWA ≥ 90 y accesibilidad ≥ 90
- [ ] F6.5 Despliegue estático (GitHub Pages o Netlify) y guía de instalación en el móvil
- [ ] F6.6 Quitar skills y deps que ya no se usen (`frontend-design`)

**Criterio de hecho:** instalada en tu móvil, la usas un entreno real sin conexión, exportas, borras datos de prueba e importas de vuelta sin pérdidas.

---

## Backlog (fuera de alcance de la v1)

Medidas corporales y peso · RPE y notas por serie · tipos de serie (calentamiento, fallo, drop set) · calculadora de discos · plantillas de rutinas · sincronización entre dispositivos · notificaciones · unidades en lb.

## Registro de cambios

- 2026-10-14 — Plan creado. Decididos: días rotativos, solo peso y reps, estilo oscuro minimalista con identidad propia.
