import React from "react";

const Input = React.forwardRef(({ className = "", ...props }, ref) => {
  const { label, id, ...restProps } = props;
  return (
    <>
      {label && (
        <label htmlFor={id} className="block mb-1 font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`border rounded w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 bg-white text-gray-700 transition-colors ${className}`}
        {...restProps}
      />
    </>
  );
});

export default Input;
