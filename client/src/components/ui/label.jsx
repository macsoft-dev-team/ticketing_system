import React from 'react';

export function Label({ children, htmlFor, className = '', ...props }) {
  return (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 ${className}`} {...props}>
      {children}
    </label>
  );
}
