import React from 'react';

export function Separator({ className = '', ...props }) {
  return <hr className={`my-4 border-gray-200 ${className}`} {...props} />;
}
