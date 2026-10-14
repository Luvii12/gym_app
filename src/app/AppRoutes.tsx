import { Navigate, Route, Routes } from 'react-router';
import { ExercisesPage } from '../features/exercises/ExercisesPage';
import { ProgressPage } from '../features/progress/ProgressPage';
import { RoutineDayEditorPage } from '../features/routines/RoutineDayEditorPage';
import { RoutineEditorPage } from '../features/routines/RoutineEditorPage';
import { RoutinesPage } from '../features/routines/RoutinesPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { TodayPage } from '../features/today/TodayPage';
import { Layout } from './Layout';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<TodayPage />} />
        <Route path="rutinas" element={<RoutinesPage />} />
        <Route path="rutinas/:routineId" element={<RoutineEditorPage />} />
        <Route path="rutinas/:routineId/dias/:dayId" element={<RoutineDayEditorPage />} />
        <Route path="ejercicios" element={<ExercisesPage />} />
        <Route path="progreso" element={<ProgressPage />} />
        <Route path="ajustes" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
