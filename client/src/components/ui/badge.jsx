import React from "react";

const Badge = ({ children, variant = "default", size = "medium", className = "", ...props }) => {
  const baseStyles =
    "inline-flex items-center rounded-full font-semibold border transition-colors";
  
  const variants = {
    default: "bg-gray-200 text-gray-800 border-gray-300",
    outline: "bg-transparent text-gray-800 border-gray-400",
    primary: "bg-blue-100 text-blue-700 border-blue-200",
    success: "bg-green-100 text-green-700 border-green-200",
    danger: "bg-red-100 text-red-700 border-red-200",
    warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
    info: "bg-cyan-100 text-cyan-700 border-cyan-200",
    dark: "bg-gray-900 text-white border-gray-800",
  };

  const sizes = {
    xsmall: "px-1.5 py-0.5 text-[0.6rem]",
    small: "px-2 py-0.5 text-xs",
    medium: "px-3 py-1 text-xs",
    large: "px-4 py-1.5 text-sm",
  };
  
  return (
    <span className={`${baseStyles} ${variants[variant] || ""} ${sizes[size] || ""} ${className}`} {...props}>
      {children}
    </span>
  );
};

export { Badge };
