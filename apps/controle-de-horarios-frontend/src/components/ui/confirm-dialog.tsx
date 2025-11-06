import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from './button';
import { cn } from '../../lib/utils';

type Variant = 'warning' | 'danger' | 'info';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: Variant;
}

const variantStyles: Record<Variant, { ring: string; icon: string; accent: string }> = {
  warning: {
    ring: 'ring-yellow-500',
    icon: 'text-yellow-300',
    accent: 'text-yellow-100',
  },
  danger: {
    ring: 'ring-red-500',
    icon: 'text-red-300',
    accent: 'text-red-100',
  },
  info: {
    ring: 'ring-blue-500',
    icon: 'text-blue-300',
    accent: 'text-blue-100',
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  variant = 'warning',
}: ConfirmDialogProps) {
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    if (open) document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const vs = variantStyles[variant];

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      aria-live="assertive"
    >
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-50 w-full sm:max-w-md m-0 sm:m-4',
          'rounded-xl border border-yellow-400/20 bg-neutral-900/95 text-gray-100 shadow-2xl',
          'ring-1',
          vs.ring,
        )}
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className={cn('h-6 w-6 mt-0.5 flex-shrink-0', vs.icon)} />
            <div className="flex-1">
              <h2 className="text-lg font-semibold leading-snug">{title}</h2>
              {description && (
                <div className="mt-2 text-sm text-gray-300">{description}</div>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              {cancelText}
            </Button>
            <Button
              onClick={() => {
                onOpenChange(false);
                onConfirm();
              }}
              className="w-full sm:w-auto"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
}

export default ConfirmDialog;

