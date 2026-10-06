import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  pulse = false,
}) => {
  const variantStyles = {
    default: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30',
    success: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/30',
    danger: 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/30',
    info: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30',
    gray: 'bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-lg shadow-gray-500/20',
  };
  
  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };
  
  const pulseStyle = pulse ? 'animate-pulse' : '';
  
  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${pulseStyle} ${className}`}>
      {children}
    </span>
  );
};
