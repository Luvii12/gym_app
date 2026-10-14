import { Dumbbell, Flame, Layers, TrendingUp, type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router';
import { cn } from '../lib/cn';

const tabs: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Hoy', icon: Flame },
  { to: '/rutinas', label: 'Rutinas', icon: Layers },
  { to: '/ejercicios', label: 'Ejercicios', icon: Dumbbell },
  { to: '/progreso', label: 'Progreso', icon: TrendingUp },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-surface-container-high bg-background/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg"
    >
      <ul className="mx-auto flex h-17 max-w-170 items-stretch">
        {tabs.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex h-full flex-col items-center justify-center gap-1 text-label-md',
                  isActive ? 'text-accent' : 'text-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon aria-hidden size={24} />
                  <span>{label}</span>
                  <span
                    aria-hidden
                    className={cn('size-1 rounded-full', isActive ? 'bg-accent' : 'bg-transparent')}
                  />
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
