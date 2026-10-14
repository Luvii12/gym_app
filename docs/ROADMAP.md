# Roadmap — Gym Routine

Única fuente de verdad del plan. Se trabaja **una fase cada vez**, en orden, y una tarea cada vez.
Marca `[x]` al terminar cada tarea. Cualquier idea nueva va al **Backlog**, no a la fase en curso.

## Decisiones cerradas

| Tema               | Decisión                                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Plataforma         | PWA instalable, offline                                                                                                                                                        |
| Datos              | 100 % locales (IndexedDB con Dexie). Sin backend ni login                                                                                                                      |
| Stack              | TypeScript estricto + React 19 + Vite + **Tailwind v4 compilado** + react-router                                                                                               |
| Rutina             | **Días rotativos** (A/B/C, Push/Pull/Legs…). La app propone "el siguiente" según la última sesión completada. Los días de _descanso activo_ no cuentan en la rotación          |
| Registro por serie | **Peso (kg) y repeticiones.** Peso 0 = solo cuerpo; en lastradas, el peso es el lastre añadido                                                                                 |
| Repeticiones       | En la rutina se fijan como **rango** (p. ej. 8-10). La serie registrada guarda las reales                                                                                      |
| Identidad visual   | **Kinetic Volt**, del prototipo de Stitch (`design/stitch/`). Es la referencia: `DESIGN.md` + 6 capturas + HTML. Sustituye a la propuesta Disco/Barra                          |
| Colores con rol    | Lima `#C3F400` = acción, activo y récords · Naranja `#FE6B00` = temporizadores y descanso · Verde `#4AE176` = completado. Fondo `#08141F`                                      |
| Texto secundario   | Usar acero `#8E9AA8` (≥ 5:1). El pizarra `#64748B` del prototipo **no cumple AA** y solo vale para elementos decorativos                                                       |
| Fuente e iconos    | **Geist** y **Lucide**, ambos empaquetados en la app. Nada de Google Fonts ni CDN (rompen el modo offline)                                                                     |
| Fidelidad          | Cada pantalla se construye para parecerse a su captura de `design/stitch/`. Si hay que desviarse (accesibilidad, offline, datos que no existen), se anota en el registro abajo |
| Idioma             | UI en español, código en inglés                                                                                                                                                |

## Reglas de trabajo

1. Empezar cada sesión leyendo este archivo y retomar la primera tarea sin marcar.
2. Cada tarea se hace con `/new-feature`: dominio + tests → db → UI → tests → `/verify`.
3. Una fase termina cuando se cumple su **Criterio de hecho**, no antes. Al cerrarla: `/verify`, revisión de `qa-tester` (y `pwa-reviewer` en F0 y F6) y commit.
4. Si el plan cambia, se edita aquí y se anota en el **Registro de cambios**. No se cambia de rumbo "de palabra".

---

## F0 — Entorno y esqueleto ✅

- [x] Vite + React + TS, PWA, Vitest, Playwright, ESLint, Prettier
- [x] CLAUDE.md, agentes, skills, MCP, hooks
- [x] Primer commit del estado actual

## F1 — Identidad visual y estructura de la app

**Objetivo:** la base visual y de navegación del prototipo, sobre la que se construye todo lo demás.

- [x] F1.1 Dirección visual: Kinetic Volt (prototipo de Stitch en `design/stitch/`)
- [x] F1.2 Tokens en Tailwind v4 (`@theme`) copiados de `DESIGN.md`, fuente Geist y iconos Lucide, todo empaquetado
- [x] F1.3 Componentes base: `Button` (primario, secundario, peligro), `Card` (niveles de elevación), `Badge`/`Pill`, `Stepper` (+/−), `ProgressBar`, `EmptyState`
- [x] F1.4 Layout: cabecera (logo y ajustes), barra inferior de 4 pestañas con punto de activo (Hoy · Rutinas · Ejercicios · Progreso), router y pantallas vacías (incluida Ajustes)
- [x] F1.5 Iconos PWA reales (PNG 192/512 maskable + apple-touch-icon) y `theme-color` con la identidad

**Criterio de hecho:** la app navega entre sus pantallas con el estilo del prototipo, instalada en el móvil se ve bien, y los componentes base tienen test.

## F2 — Ejercicios y base de datos

**Objetivo:** catálogo de ejercicios y la capa de datos. Pantalla de referencia: `5._ejercicios_y_filtros`.

- [x] F2.1 Tipos de dominio (`Exercise` con grupo muscular, músculos trabajados y equipamiento; `Routine`, `RoutineDay`, `WorkoutSession`, `LoggedSet`) en `src/domain/`
- [x] F2.2 Esquema Dexie v1 + repositorios en `src/db/` (única puerta a IndexedDB) con tests sobre `fake-indexeddb`
- [x] F2.3 Catálogo semilla (~60-80 ejercicios en español) con la skill `seed-exercises`; carga inicial idempotente
- [x] F2.4 Pantalla Ejercicios: buscador, filtros por grupo muscular y tarjetas con etiquetas "Predeterminado" / "Personalizado"
- [x] F2.5 Botón "Nuevo ejercicio": crear, editar y borrar personalizados (los de la semilla no se borran)

**Criterio de hecho:** abrir la app por primera vez muestra el catálogo; crear un ejercicio propio sobrevive a recargar; tests de `db/` en verde.

> **Decidido en F2.5:** al borrar un ejercicio propio que ya aparece en una rutina o en el historial, se archiva (sale del catálogo y el historial conserva su nombre); si no se usa en ningún sitio, se borra de verdad.
>
> En las tarjetas, el PR y el "Último: 100 kg × 5" se muestran cuando hay sesiones registradas; se conectan en F5.

## F3 — Rutinas

**Objetivo:** definir tus rutinas con días rotativos. Pantalla de referencia: `4._rutinas_y_editor`.

- [x] F3.1 Dominio: `nextDay(routine, sessions)` — propone el siguiente día de entrenamiento según la última sesión completada, saltando los días de descanso (con tests: sin sesiones, rutina de 1 día, día borrado)
- [x] F3.2 Repositorio de rutinas y "rutina activa"
- [x] F3.3 Lista de rutinas: "Rutina activa" arriba, "Activar esta rutina", menú ⋮ (renombrar, duplicar, borrar) y "Nueva rutina"
- [x] F3.4 Editor de rutina: días numerados, "Añadir día de entreno", día de **descanso activo**, días por semana
- [x] F3.5 Editor de día: ejercicios del catálogo con series, rango de repeticiones y descanso; reordenar arrastrando

**Criterio de hecho:** puedes montar tu rutina real completa (p. ej. Push/Pull/Legs) en menos de 5 minutos, y `nextDay` está cubierta por tests.

## F4 — Entreno activo (el corazón de la app) ✅

**Objetivo:** registrar un entreno en el gym con el móvil en la mano, rápido y sin perder datos. Pantallas de referencia: `1._hoy_dashboard`, `2._entreno_activo`, `3._entreno_con_temporizador`.

- [x] F4.1 Pantalla **Hoy**: tarjeta "Siguiente rutina" (día propuesto por `nextDay`, ejercicios, series y rango de peso) con "Empezar entreno"; "Elegir otra" y "Entreno libre"
- [x] F4.2 Sesión en curso: cronómetro y nombre del día, barra de progreso general (7/16 series) y una tarjeta por ejercicio con sus series
- [x] F4.3 Fila de serie: pesos y repeticiones con steppers, "Última vez" y "Objetivo" como ayuda, casilla de completar (la serie hecha se atenúa y tacha)
- [x] F4.4 Añadir serie, añadir ejercicio al vuelo, quitar ejercicio (menú ⋮)
- [x] F4.5 Descanso automático al completar una serie: banner inferior con cuenta atrás, "+30 s" y "Saltar"; hoja completa con −15 s / +15 s / +30 s y "Siguiente: Serie 3"
- [x] F4.6 Aviso al acabar el descanso: vibración y sonido, ambos activables
- [x] F4.7 Persistencia continua: cada serie se guarda al momento; si cierras la app, se **reanuda** la sesión
- [x] F4.8 Terminar o descartar sesión; mantener la pantalla encendida durante el entreno (Wake Lock, con degradación si no existe)

**Criterio de hecho:** E2E en móvil de un entreno completo (empezar → registrar series → descanso → terminar) y de la reanudación tras recargar; ninguna pérdida de datos al cerrar la app.

## F5 — Historial y progreso

**Objetivo:** ver que estás mejorando. Pantalla de referencia: `6._progreso_y_ajustes`.

- [x] F5.1 Dominio con tests: 1RM estimado (Epley), PR por ejercicio y su mejora respecto al anterior, volumen por sesión y por semana, racha de semanas
- [x] F5.2 Historial: lista de sesiones y detalle; editar o borrar una sesión
- [x] F5.3 Progreso: gráfica del 1RM por ejercicio (selector, récord actual, pico, variación a 3 meses) y volumen semanal con la mejor semana resaltada (Recharts)
- [ ] F5.4 Tarjetas de récords personales por grupo muscular, con "hace N días"
- [ ] F5.5 En **Hoy**: "Último entreno" (duración, volumen, PR destacado) y "Racha de N semanas"; PR marcados al terminar una serie

**Criterio de hecho:** con datos de varias semanas (seed de prueba), las gráficas, los PR y la racha coinciden con el cálculo manual de los tests.

## F6 — Ajustes, pulido y lanzamiento

**Objetivo:** que sea fiable y la uses a diario.

- [ ] F6.1 Ajustes: almacenamiento local ("N entrenos guardados"), exportar e importar JSON con validación y confirmación, y "Borrar todos los datos" con confirmación dentro de la app
- [ ] F6.2 Pedir almacenamiento persistente (`navigator.storage.persist`) para que el navegador no borre los datos
- [ ] F6.3 Offline completo verificado (modo avión tras la primera carga) con `pwa-reviewer`
- [ ] F6.4 Lighthouse PWA ≥ 90 y accesibilidad ≥ 90
- [ ] F6.5 Despliegue estático (GitHub Pages o Netlify) y guía de instalación en el móvil
- [ ] F6.6 Quitar skills y deps que ya no se usen (`frontend-design`)

**Criterio de hecho:** instalada en tu móvil, la usas un entreno real sin conexión, exportas, borras datos de prueba e importas de vuelta sin pérdidas.

---

## Backlog (fuera de alcance de la v1)

Barra cargada que muestra los discos a medida que haces series (idea de la propuesta Disco/Barra, como indicador de progreso del entreno) · medidas corporales y peso · RPE y notas por serie · tipos de serie (calentamiento, fallo, drop set) · peso asistido en dominadas · calculadora de discos · plantillas de rutinas · sincronización entre dispositivos · notificaciones · unidades en lb.

## Descartado del prototipo

- **"Top 5 %" y "Consistente"** en los récords: necesitan datos de otros usuarios o criterios que no existen en una app local.
- **Objetivos semanales configurables** de la tarjeta de racha: la racha se define como semanas seguidas cumpliendo los días por semana de tu rutina, sin objetivos aparte.
- **Etiquetas de dato en fuente monoespaciada** de la pantalla Hoy: se usa Geist con cifras tabulares, como indica `DESIGN.md`.

## Registro de cambios

- 2026-10-14 — Plan creado. Decididos: días rotativos, solo peso y reps, estilo oscuro minimalista con identidad propia.
- 2026-10-14 — Se adopta el prototipo de Stitch ("Kinetic Volt") como identidad y referencia de pantallas, en lugar de la propuesta Disco/Barra. F1 reescrita; F4 rehecha según el entreno del prototipo (lista de ejercicios con series y casilla, en vez de pantalla de una serie); se añaden rango de repeticiones, día de descanso activo, ajustes y racha. Tailwind v4, Geist y Lucide empaquetados por funcionar sin conexión. Texto secundario en acero `#8E9AA8` por contraste.
- 2026-10-14 — F1 construida según el prototipo. Desviaciones: cifras con coma decimal (82,5) en vez de punto, por ser una app en español; la cabecera muestra siempre la marca y el título de cada pantalla va en el contenido; el engranaje de la cabecera lleva a una pantalla de Ajustes en vez de abrir un modal.
- 2026-10-14 — F2.1: los grupos musculares siguen los filtros del prototipo (pecho, espalda, hombros, brazos, piernas, core, cardio) en vez de la lista más fina anterior; los músculos concretos van en un texto libre por ejercicio. Los valores guardados son identificadores en inglés (`chest`, `barbell`…) con etiquetas en español. Una serie sin `completedAt` es una serie prevista aún sin hacer.
- 2026-10-14 — F2.2: esquema Dexie v1 con las cuatro tablas (ejercicios, rutinas, sesiones, ajustes) y repositorio de ejercicios. Los repositorios de rutinas y sesiones llegan con F3.2 y F4. `isCustom` no se indexa porque IndexedDB no admite booleanos como clave. Dos reglas de ESLint hacen cumplir la arquitectura: solo `src/db/` importa Dexie y `src/domain/` no importa React ni datos.
- 2026-10-14 — F2.3: catálogo semilla de 67 ejercicios (pecho 10, espalda 11, hombros 10, brazos 12, piernas 16, core 8) en `src/data/exercises.ts`, tipado para que un valor inválido rompa el `typecheck`. No incluye cardio, porque la app registra peso y repeticiones y no tiempo ni distancia. Se carga en cada arranque con `seedCatalog` (idempotente).
- 2026-10-14 — F2.4: pantalla Ejercicios con buscador (ignora tildes y busca en nombre, músculos y equipamiento), chips de grupo (solo los que tienen ejercicios) y tarjetas. Desviaciones del prototipo: las tarjetas no llevan chevron, PR ni "Último" hasta que existan datos (F5); el recuento es texto pequeño ("67 ejercicios") en lugar de "142 ACTIVOS"; el catálogo va en orden alfabético.
- 2026-10-14 — F2.5: crear, editar y borrar ejercicios propios. Botón flotante "Nuevo ejercicio", formulario en hoja inferior (nombre, grupo, equipamiento y músculos opcionales), validación en línea sin nombres repetidos (ignora tildes y mayúsculas) y confirmación de borrado dentro de la app. Borrar archiva si el ejercicio está en una rutina o en el historial. Solo los ejercicios propios tienen botón de editar. Pendiente para F6: al borrar el ejercicio desde cuya tarjeta se abrió la hoja, el foco no vuelve a un sitio concreto. **F2 completada.**
- 2026-10-14 — F3.1: `nextDay(routine, sessions)` en `src/domain/next-day.ts`. Parte de la sesión completada más reciente cuyo día siga existiendo (ignora sesiones en curso, entrenos libres y días borrados) y salta los descansos activos; sin historial devuelve el primer día de entreno, y `undefined` si la rutina no tiene ninguno.
- 2026-10-14 — F3.2: repositorio de rutinas (`src/db/routines.ts`: listar, crear, editar, duplicar, borrar) y rutina activa guardada en `settings` (`activeRoutineId`), con hooks `useRoutines` y `useActiveRoutine`. Decisiones: la primera rutina que se crea queda activa; al borrar la activa pasa a serlo la más antigua que queda; duplicar no activa la copia; borrar una rutina no toca las sesiones (llevan su propio nombre). Sin esquema nuevo: sigue en `version(1)`.
- 2026-10-14 — F3.3: lista de rutinas con la activa arriba (borde lima), "Activar esta rutina", menú ⋮ como hoja inferior (renombrar, duplicar, borrar con confirmación que avisa si es la activa) y "Nueva rutina" en la cabecera. Desviaciones: la tarjeta solo muestra un resumen (los días desplegados y el botón "Editar" llegan con F3.4/F3.5); las rutinas nuevas nacen con 0 días y 3 días por semana.
- 2026-10-14 — F3.4: editor de rutina en `/rutinas/:routineId` (botón "Editar" en cada tarjeta): nombre, días por semana (1–7), días numerados con tipo entreno/descanso activo (con nota), añadir, borrar con confirmación y reordenar con subir/bajar. Guarda al momento (los textos al salir del campo). Desviaciones: el editor es una página aparte, no la tarjeta desplegada del prototipo; el tipo de día es un selector Entreno/Descanso. **Pendiente para F3.5:** al pasar un día a descanso se vacían sus ejercicios sin aviso (el dominio exige `items` vacío); conviene avisar o confirmar cuando el día ya tenga ejercicios.
- 2026-10-14 — F3.5: editor de día en `/rutinas/:routineId/dias/:dayId` (se entra desde "N ejercicios · M series" de la tarjeta de día). Ejercicios del catálogo con series (1–10), repeticiones mín–máx (1–100) y descanso (pasos de 15 s, 0–600); hoja para añadir con buscador y chips, sin duplicados; quitar con "Deshacer"; reordenar arrastrando (`@dnd-kit`, nueva dependencia) o con subir/bajar. Pasar a descanso un día con ejercicios pide confirmación (pendiente de F3.4 resuelto). Desviaciones: pantalla propia en vez de embebida; tarjeta de ejercicio con controles siempre visibles. Pendiente: el arrastre táctil real no está probado en E2E (solo ratón); al teclear repeticiones se guardan los valores intermedios válidos. **F3 completada.**
- 2026-10-14 — F5.1: dominio de progreso en `src/domain/progress.ts` (27 tests). Decisiones: Epley con 1 repetición = el propio peso; solo cuentan sesiones terminadas y series hechas; las semanas empiezan el lunes (hora local); la variación del 1RM compara el mejor actual con el mejor de hace 3 meses (sin datos anteriores, no hay variación); un empate de récord conserva la fecha del primero; la primera vez con un ejercicio no es PR (`isNewRecord`); la racha cuenta semanas seguidas con ≥ `daysPerWeek` entrenos y la semana en curso sin cumplir no la rompe.
- 2026-10-14 — F5.2: historial en `/progreso/historial` (lista) y `/progreso/historial/:sessionId` (detalle), con tarjeta de acceso en Progreso (el prototipo no tiene pantalla de historial). Se puede editar peso y repeticiones de cada serie (guarda al momento), quitar series o ejercicios y borrar el entreno con confirmación; si se queda sin series se ofrece borrarlo. Dominio nuevo: `sessionDuration` y `deleteLoggedSet`; hook `useSession`. Pendiente: no hay E2E del historial todavía.
- 2026-10-14 — F5.3: Progreso con la gráfica de área del 1RM por ejercicio (selector con los ejercicios con historial, récord actual, pico, variación a 3 meses) y el volumen semanal de las últimas 8 semanas con la mejor resaltada ("MÁX"). Desviaciones: las barras de volumen son CSS, no Recharts; el selector es un `SelectField` nativo; la gráfica del 1RM va en un chunk aparte (`React.lazy`, ~93 kB gzip). Los récords por grupo muscular llegan con F5.4.
