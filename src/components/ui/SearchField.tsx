import { Search, X } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Etiqueta accesible del campo. */
  label: string;
  className?: string;
}

export function SearchField({ value, onChange, placeholder, label, className }: SearchFieldProps) {
  return (
    <div className={cn('relative', className)}>
      <Search
        aria-hidden
        size={20}
        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className={cn(
          'h-12 w-full rounded-md border border-surface-container-high bg-surface-container-low',
          'pr-12 pl-12 text-body-lg text-on-surface placeholder:text-muted',
          'focus:border-accent focus:outline-none',
          '[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden',
        )}
      />
      {value && (
        <button
          type="button"
          aria-label="Borrar búsqueda"
          onClick={() => onChange('')}
          className="absolute top-1/2 right-0 grid size-11 -translate-y-1/2 cursor-pointer place-items-center text-muted active:text-on-surface"
        >
          <X aria-hidden size={20} />
        </button>
      )}
    </div>
  );
}
