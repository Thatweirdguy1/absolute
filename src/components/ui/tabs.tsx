'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
}>({ value: '', onValueChange: () => {} });

export function Tabs({ defaultValue, value, onValueChange, className, children, ...props }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '');
  
  const currentValue = value !== undefined ? value : internalValue;
  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (value === undefined) setInternalValue(newValue);
      if (onValueChange) onValueChange(newValue);
    },
    [value, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex w-full items-center border-b border-ink-800 overflow-x-auto scrollbar-hide",
        className
      )}
      role="tablist"
      {...props}
    />
  )
);
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = React.useContext(TabsContext);
    const isSelected = selectedValue === value;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isSelected}
        onClick={() => onValueChange(value)}
        className={cn(
          "relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap outline-none",
          "focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 rounded-sm",
          isSelected ? "text-purple-400" : "text-smoke-400 hover:text-smoke-200",
          className
        )}
        {...props}
      >
        {children}
        {isSelected && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-t-full" />
        )}
      </button>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: selectedValue } = React.useContext(TabsContext);

    if (selectedValue !== value) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn("mt-4 outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 rounded-md", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = 'TabsContent';
