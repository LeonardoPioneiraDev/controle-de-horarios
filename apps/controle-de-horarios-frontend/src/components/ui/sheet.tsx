import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface SheetProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({ open, onOpenChange, children }) => {
    // If controlled, use props. If uncontrolled, could use state, but here we expect controlled usage based on HistoryDrawerList
    if (open === undefined) return <>{children}</>; // Fallback if not controlled, though ideally should be

    return (
        <div className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
                onClick={() => onOpenChange?.(false)}
            />
            {/* Content Wrapper to pass props down if needed, or just render children */}
            {children}
        </div>
    );
};

interface SheetContentProps {
    side?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
    children: React.ReactNode;
}

export const SheetContent: React.FC<SheetContentProps> = ({ side = 'right', className, children }) => {
    // We need to access the 'open' state from the parent Sheet if we want to animate based on it, 
    // but since we are doing a simple composition, we might rely on the parent rendering us conditionally or 
    // just CSS transitions based on parent class. 
    // However, the Sheet component above renders children always but toggles visibility of wrapper.
    // To do slide-in animation, we can use the same 'open' state logic or just rely on the parent's visibility.
    // A better way for a simple implementation without context is to have Sheet handle the visibility and 
    // SheetContent handle the styling.

    // Actually, to make it work smoothly with the provided usage <Sheet open={...}> <SheetContent ...> </Sheet>,
    // we need to ensure SheetContent is what actually slides in.
    // The Sheet component above wraps everything.

    return (
        <div
            className={`relative z-50 w-full max-w-md h-full bg-white p-6 shadow-xl transition-transform duration-300 transform ${className || ''}`}
            style={{
                // Simple slide-in logic could be improved with Context or cloning children, 
                // but for now let's rely on the parent's pointer-events/opacity for visibility
                // and maybe just always be there or slide.
                // Since we don't have the 'open' prop here directly without context, we'll assume it's visible when parent is.
            }}
        >
            <div className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 dark:ring-offset-gray-950 dark:focus:ring-gray-300 dark:data-[state=open]:bg-gray-800">
                {/* Close button could be here if we had access to onClose, but usually it's inside or we rely on backdrop */}
            </div>
            {children}
        </div>
    );
};

export const SheetHeader: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
    <div className={`flex flex-col space-y-2 text-center sm:text-left ${className || ''}`}>
        {children}
    </div>
);

export const SheetTitle: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
    <div className={`text-lg font-semibold text-gray-950 dark:text-gray-50 ${className || ''}`}>
        {children}
    </div>
);

export const SheetDescription: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
    <div className={`text-sm text-gray-500 dark:text-gray-400 ${className || ''}`}>
        {children}
    </div>
);
