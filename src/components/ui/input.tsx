import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error = false, ...props }, ref) => {
    const baseClasses = 'flex w-full px-3 py-2 text-sm bg-white border rounded-lg shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50';
    
    const stateClasses = error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
    
    const classes = `${baseClasses} ${stateClasses} ${className}`;
    
    return (
      <input
        className={classes}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };