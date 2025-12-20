import React from 'react';
import { cn } from '../../lib/utils';

const PageContainer = ({ children, className }) => {
  return (
    <div className={cn(
      'w-full min-h-screen px-6 py-6 lg:px-8 lg:py-8',
      className
    )}>
      <div className="w-full max-w-[1800px]">
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
