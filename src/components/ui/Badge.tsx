import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'draft' | 'pending' | 'rejected' | 'approved' | 'paid' | 'active' | 'inactive';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant: BadgeVariant;
    children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
    draft: 'bg-gray-200 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-800',
    approved: 'bg-green-100 text-green-800',
    paid: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-200 text-gray-600',
};

export function Badge({ variant, className, children, ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                variantStyles[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}
