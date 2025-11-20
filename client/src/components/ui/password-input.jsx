import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const PasswordInput = React.forwardRef(({ className = "", ...props }, ref) => {
  const { label, id, ...restProps } = props;
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      {label && (
        <label htmlFor={id} className="block mb-1 font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={showPassword ? "text" : "password"}
          className={`border rounded w-full px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 bg-white text-gray-700 transition-colors ${className}`}
          {...restProps}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 transition-colors"
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    </>
  );
});

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;