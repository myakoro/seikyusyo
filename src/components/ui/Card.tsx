import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
    return (
        <div
            className={cn(
                'bg-white rounded-lg shadow-sm p-6 mb-6',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
    return (
        <div
            className={cn(
                'flex justify-between items-center mb-4 pb-4 border-b border-gray-200',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
    children: ReactNode;
}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
    return (
        <h3
            className={cn('text-lg font-semibold', className)}
            {...props}
        >
            {children}
        </h3>
    );
}
