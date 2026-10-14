import { ChevronDown } from 'lucide-react';
import { useId, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'id' | 'onChange' | 'value' | 'children'
> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  error?: string;
  hint?: string;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  error,
  hint,
  className,
  ...rest
}: SelectFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-label-lg text-on-surface">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={cn(
            'h-12 w-full cursor-pointer appearance-none rounded-md border bg-surface-container-low',
            'pr-12 pl-4 text-body-lg text-on-surface',
            'focus:border-accent focus:outline-none',
            error ? 'border-danger' : 'border-surface-container-high',
          )}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          size={20}
          className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted"
        />
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-body-md text-danger">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="mt-2 text-body-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
