import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  gradient?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  hover = false,
  gradient = false,
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const hoverStyle = hover ? 'hover:shadow-2xl hover:scale-[1.01] transition-all duration-300' : '';
  const gradientStyle = gradient ? 'bg-gradient-to-br from-white to-blue-50/50' : 'bg-white/80 backdrop-blur-sm';
  
  return (
    <div className={`${gradientStyle} rounded-2xl shadow-lg border border-white/20 ${paddingStyles[padding]} ${hoverStyle} ${className}`}>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '', actions }) => {
  return (
    <div className={`flex items-center justify-between mb-6 pb-4 border-b border-gray-100 ${className}`}>
      <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">{children}</h3>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return <div className={className}>{children}</div>;
};
