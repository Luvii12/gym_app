---
name: seed-exercises
description: Genera o actualiza el catálogo semilla de ejercicios en src/data/exercises.ts (nombre, grupo muscular, músculos, equipamiento).
---

Mantén `src/data/exercises.ts` como array de objetos que cumplan el tipo `SeedExercise` de `src/domain/exercise.ts` (sin `isCustom`: la carga inicial lo fija a `false`). Es un archivo TypeScript tipado (`SeedExercise[]`), así un valor inválido rompe el `typecheck`:

```ts
{ id: 'barbell-bench-press', name: 'Press banca plano con barra', muscleGroup: 'chest', muscles: 'Pecho mayor, tríceps, deltoides anterior', equipment: 'barbell' },
```

- `id`: slug estable en kebab-case a partir del nombre en inglés; nunca cambies ids ya existentes.
- `name`: nombre en español, como se dice en el gimnasio.
- `muscleGroup` ∈ `MUSCLE_GROUPS` (chest, back, shoulders, arms, legs, core, cardio). Bíceps y tríceps van en `arms`; cuádriceps, isquios, glúteo y gemelo en `legs`.
- `muscles`: músculos trabajados en español, separados por comas, el principal primero.
- `equipment` ∈ `EQUIPMENT` (barbell, dumbbell, machine, cable, bodyweight, kettlebell, band, other).
- Sin duplicados (comprueba por id y por nombre normalizado, sin tildes ni mayúsculas). Orden: por grupo muscular y luego nombre.
- Cubre al menos 8 ejercicios por grupo grande (chest, back, legs, shoulders, arms), con los compuestos básicos primero.

Los valores de `muscleGroup` y `equipment` deben salir de las constantes del dominio, no inventarse. Tras editar, ejecuta `npm run typecheck && npm test`: `src/data/exercises.test.ts` comprueba ids únicos, nombres sin repetir y la cobertura por grupo. **Nunca cambies un `id` existente**: las rutinas y el historial lo referencian.
El cardio por tiempo o distancia no entra: la app solo registra peso y repeticiones.
Si el usuario aporta una lista, respétala y completa solo lo que falte.
