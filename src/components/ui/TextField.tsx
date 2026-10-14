import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'onChange' | 'value'
> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
}

export function TextField({
  label,
  value,
  onChange,
  error,
  hint,
  className,
  ...rest
}: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-label-lg text-on-surface">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn(
          'h-12 w-full rounded-md border bg-surface-container-low px-4',
          'text-body-lg text-on-surface placeholder:text-muted',
          'focus:border-accent focus:outline-none',
          error ? 'border-danger' : 'border-surface-container-high',
        )}
        {...rest}
      />
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
