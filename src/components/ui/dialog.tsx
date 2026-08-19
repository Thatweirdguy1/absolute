'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface DialogProps extends React.DialogHTMLAttributes<HTMLDialogElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const Dialog = React.forwardRef<HTMLDialogElement, DialogProps>(
  ({ className, isOpen, onClose, title, children, ...props }, ref) => {
    const dialogRef = React.useRef<HTMLDialogElement>(null);
    
    // Combine refs
    React.useImperativeHandle(ref, () => dialogRef.current as HTMLDialogElement);

    React.useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      if (isOpen) {
        dialog.showModal();
        document.body.style.overflow = 'hidden';
      } else {
        dialog.close();
        document.body.style.overflow = '';
      }

      return () => {
        document.body.style.overflow = '';
      };
    }, [isOpen]);

    React.useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      const handleCancel = (e: Event) => {
        e.preventDefault();
        onClose();
      };

      const handleClickOutside = (e: MouseEvent) => {
        if (e.target === dialog) {
          onClose();
        }
      };

      dialog.addEventListener('cancel', handleCancel);
      dialog.addEventListener('click', handleClickOutside);

      return () => {
        dialog.removeEventListener('cancel', handleCancel);
        dialog.removeEventListener('click', handleClickOutside);
      };
    }, [onClose]);

    return (
      <dialog
        ref={dialogRef}
        className={cn(
          'backdrop:bg-ink-950/80 backdrop:backdrop-blur-sm',
          'bg-ink-900 border border-ink-800 text-smoke-100 rounded-xl shadow-2xl shadow-purple-900/20',
          'p-0 max-w-lg w-full max-h-[90vh] overflow-hidden',
          'open:animate-in open:fade-in open:zoom-in-95 open:duration-200 motion-reduce:transition-none',
          className
        )}
        {...props}
      >
        <div className="flex flex-col h-full max-h-[90vh]">
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink-800">
              <h2 className="text-lg font-semibold text-smoke-50">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-smoke-400 hover:text-white transition-colors p-1 rounded-md hover:bg-ink-800"
                aria-label="Close dialog"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          )}
          <div className="p-6 overflow-y-auto">
            {children}
          </div>
        </div>
      </dialog>
    );
  }
);
Dialog.displayName = 'Dialog';
