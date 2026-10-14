import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-3 pb-4">
      <div className="min-w-0">
        <h1 className="text-headline-xl text-balance">{title}</h1>
        {description && <p className="mt-1 text-body-md text-muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}
