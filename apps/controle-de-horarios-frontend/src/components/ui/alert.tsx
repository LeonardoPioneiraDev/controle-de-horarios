import * as React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

type AlertVariant = 'destructive' | 'success' | 'info';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

const variantClasses: Record<AlertVariant, { container: string; icon: string }> = {
  destructive: {
    container: 'border-red-500/40 bg-red-900/30 text-red-200',
    icon: 'text-red-300',
  },
  success: {
    container: 'border-green-500/40 bg-green-900/20 text-green-200',
    icon: 'text-green-300',
  },
  info: {
    container: 'border-blue-500/40 bg-blue-900/20 text-blue-200',
    icon: 'text-blue-300',
  },
};

export function Alert({ className, variant = 'destructive', ...props }: AlertProps) {
  const v = variantClasses[variant];
  return (
    <div
      role="alert"
      className={cn('flex items-start gap-3 rounded-md border p-3', v.container, className)}
      {...props}
    />
  );
}

export function AlertIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return <AlertCircle className={cn('h-5 w-5 flex-shrink-0', className)} {...props} />;
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm font-semibold', className)} {...props} />;
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('text-sm', className)} {...props} />;
}
