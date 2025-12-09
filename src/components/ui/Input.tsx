import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, required, type = 'text', ...props }, ref) => {
        return (
            <div className="form-group">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {label}
                        {required && <span className="text-red-600 ml-1">*</span>}
                    </label>
                )}
                <input
                    type={type}
                    className={cn(
                        'w-full px-3 py-2 border border-gray-300 rounded-md text-sm transition-all',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                        error && 'border-red-500',
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && (
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input };
