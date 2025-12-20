import React from 'react';
import { Button } from '../ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';

const Header = ({ 
  title, 
  subtitle, 
  breadcrumbs = [], 
  action,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  compact = false
}) => {
  return (
    <div className={compact ? 'mb-4 shrink-0' : 'mb-8 shrink-0'}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <Breadcrumb className={compact ? 'mb-2' : 'mb-4'}>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.label}>
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Title and Action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`font-bold tracking-tight text-foreground ${compact ? 'text-2xl' : 'text-3xl'}`}>{title}</h1>
          {subtitle && (
            <p className="mt-1 text-muted-foreground text-sm">{subtitle}</p>
          )}
        </div>
        {(action || onAction) && (
          <Button onClick={onAction} className="gap-2">
            {ActionIcon && <ActionIcon className="h-4 w-4" />}
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Header;
