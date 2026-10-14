---
name: seed-exercises
description: Genera o actualiza el catálogo semilla de ejercicios en src/data/exercises.json (nombre, grupo muscular, equipamiento).
---

Mantén `src/data/exercises.json` como array de `{ "id": string, "name": string, "muscleGroup": string, "equipment": string }`.

- `id`: slug estable en kebab-case a partir del nombre en inglés (p. ej. `barbell-bench-press`); nunca cambies ids ya existentes.
- `name`: nombre en español.
- `muscleGroup` ∈ pecho, espalda, hombro, bíceps, tríceps, cuádriceps, isquios, glúteo, gemelo, core, antebrazo, cardio.
- `equipment` ∈ barra, mancuernas, máquina, polea, peso corporal, kettlebell, banda, otro.
- Sin duplicados (comprueba por id y por nombre normalizado). Orden: por grupo muscular y luego nombre.
- Cubre al menos 5-8 ejercicios por grupo grande (pecho, espalda, piernas, hombro) con los básicos compuestos primero.

Tras editar, valida el JSON (`node -e "JSON.parse(require('fs').readFileSync('src/data/exercises.json','utf8'))"`) y si existe el test del catálogo, ejecuta `npm test`.
Si el usuario aporta una lista, respétala y completa solo lo que falte.
