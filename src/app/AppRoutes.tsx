import { Navigate, Route, Routes } from 'react-router';
import { ExercisesPage } from '../features/exercises/ExercisesPage';
import { HistoryPage } from '../features/history/HistoryPage';
import { HistorySessionPage } from '../features/history/HistorySessionPage';
import { ProgressPage } from '../features/progress/ProgressPage';
import { RoutineDayEditorPage } from '../features/routines/RoutineDayEditorPage';
import { RoutineEditorPage } from '../features/routines/RoutineEditorPage';
import { RoutinesPage } from '../features/routines/RoutinesPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { WorkoutPage } from '../features/workout/WorkoutPage';
import { TodayPage } from '../features/today/TodayPage';
import { Layout } from './Layout';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="entreno" element={<WorkoutPage />} />
      <Route element={<Layout />}>
        <Route index element={<TodayPage />} />
        <Route path="rutinas" element={<RoutinesPage />} />
        <Route path="rutinas/:routineId" element={<RoutineEditorPage />} />
        <Route path="rutinas/:routineId/dias/:dayId" element={<RoutineDayEditorPage />} />
        <Route path="ejercicios" element={<ExercisesPage />} />
        <Route path="progreso" element={<ProgressPage />} />
        <Route path="progreso/historial" element={<HistoryPage />} />
        <Route path="progreso/historial/:sessionId" element={<HistorySessionPage />} />
        <Route path="ajustes" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
