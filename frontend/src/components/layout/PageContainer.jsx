import React from 'react';
import { cn } from '../../lib/utils';

const PageContainer = ({ children, className, fullHeight = false }) => {
  return (
    <div className={cn(
      'w-full px-6 lg:px-8',
      fullHeight ? 'flex-1 flex flex-col overflow-hidden py-4' : 'py-6 lg:py-8',
      className
    )}>
      <div className={cn(
        'w-full max-w-[1800px]',
        fullHeight && 'flex-1 flex flex-col overflow-hidden'
      )}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
