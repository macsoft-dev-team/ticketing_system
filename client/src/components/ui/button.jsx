 const Button = ({
  children,
  variant = "default",
  size = "medium",
  className = "",
  ...props
}) => {
  const baseStyles =
    "flex gap-1 cursor-pointer items-center rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500";
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20",
    primary: "bg-blue-600 text-white hover:bg-blue-700 border border-blue-600",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 border border-gray-600",
    success: "bg-green-600 text-white hover:bg-green-700 border border-green-600",
    danger: "bg-red-600 text-white hover:bg-red-700 border border-red-600",
    warning: "bg-yellow-500 text-white hover:bg-yellow-600 border border-yellow-500",
    info: "bg-cyan-600 text-white hover:bg-cyan-700 border border-cyan-600",
    dark: "bg-gray-900 text-white hover:bg-gray-800 border border-gray-900",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 border border-gray-200/60 dark:border-gray-600/60",
  };
  const sizes = {
    small: "px-2 py-1 text-xs",
    medium: "px-4 py-2 text-base",
    large: "px-6 py-3 text-lg",
  };
  return (
    <button
      className={`${baseStyles} ${variants[variant] || ""} ${sizes[size] || sizes["medium"]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export { Button };
