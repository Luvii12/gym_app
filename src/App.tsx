import { BrowserRouter } from 'react-router';
import { AppRoutes } from './app/AppRoutes';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppRoutes />
    </BrowserRouter>
  );
}
