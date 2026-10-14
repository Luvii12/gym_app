import { Dumbbell, Settings } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-surface-container-high bg-background/92 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-170 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-headline-md text-accent">
            <Dumbbell aria-hidden size={24} />
            Gym Routine
          </Link>
          <Link
            to="/ajustes"
            aria-label="Ajustes"
            className="-mr-2 grid size-11 place-items-center rounded-md text-muted"
          >
            <Settings aria-hidden size={24} />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-170 px-4 pt-5 pb-[calc(4.25rem+env(safe-area-inset-bottom)+1.5rem)]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
