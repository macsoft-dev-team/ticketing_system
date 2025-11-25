import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

// Toast Context
const ToastContext = createContext();

export const ToastProvider = ({ children, placement = "top-right" }) => {
  const [toasts, setToasts] = useState([]);

  // Add or replace toast by id
  const addToast = useCallback((toast) => {
    const id = toast.id || (toast.title + toast.description + toast.variant);
    setToasts((prev) => {
      // Remove any existing toast with same id
      const filtered = prev.filter((t) => t.id !== id);
      return [...filtered, { ...toast, id, duration: toast.duration }];
    });
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastViewport toasts={toasts} removeToast={removeToast} placement={placement} />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const getPlacementClasses = (placement) => {
  switch (placement) {
    case "top-left":
      return "top-0 left-0 flex-col-reverse sm:top-0 sm:left-0 sm:flex-col";
    case "top-right":
      return "top-0 right-0 flex-col-reverse sm:top-0 sm:right-0 sm:flex-col";
    case "bottom-left":
      return "bottom-0 left-0 flex-col sm:bottom-0 sm:left-0 sm:flex-col-reverse";
    case "bottom-right":
      return "bottom-0 right-0 flex-col sm:bottom-0 sm:right-0 sm:flex-col-reverse";
    case "top-center":
      return "top-0 left-1/2 -translate-x-1/2 flex-col-reverse sm:top-0 sm:left-1/2 sm:-translate-x-1/2 sm:flex-col";
    case "bottom-center":
      return "bottom-0 left-1/2 -translate-x-1/2 flex-col sm:bottom-0 sm:left-1/2 sm:-translate-x-1/2 sm:flex-col-reverse";
    default:
      return "top-0 right-0 flex-col-reverse sm:top-0 sm:right-0 sm:flex-col";
  }
};

const ToastViewport = ({ toasts, removeToast, placement = "top-right" }) => (
  <div
    className={`fixed z-[100] max-h-screen w-full p-4 md:max-w-[420px] ${getPlacementClasses(
      placement
    )}`}
  >
    {toasts.map((toast) => (
      <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} removeToast={removeToast} />
    ))}
  </div>
);

const VARIANT_CLASSES = {
  default: "border border-gray-200/90 bg-gray-50 text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200/90",
  success: "border border-green-200/90 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900 dark:text-green-200/90",
  error: "border border-red-200/90 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900 dark:text-red-200/90",
  warning: "border border-yellow-200/90 bg-yellow-50 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900 dark:text-yellow-200/90",
  info: "border border-blue-200/90 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-200/90",
  dark: "border border-gray-700 bg-gray-800 text-gray-200/90",
  primary: "border border-indigo-200/90 bg-indigo-50 text-indigo-800 dark:border-indigo-700 dark:bg-indigo-900 dark:text-indigo-200/90",
  secondary: "border border-purple-200/90 bg-purple-50 text-purple-800 dark:border-purple-700 dark:bg-purple-900 dark:text-purple-200/90",
  destructive: "border border-red-300 bg-red-200/90 text-red-900 dark:border-red-700 dark:bg-red-900 dark:text-red-200/90",
};

const Toast = ({
  id,
  title,
  description,
  variant = "default",
  action,
  onClose,
  className,
  removeToast,
  duration,
}) => {
  useEffect(() => {
    // Default: 3s, error: 7s, or custom
    let autoClose = typeof duration === 'number' ? duration : (variant === 'error' ? 7000 : 3000);
    if (autoClose > 0) {
      const timer = setTimeout(() => {
        removeToast(id);
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [id, duration, variant, removeToast]);

  const base =
    "group m-2 pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md p-4 pr-6 shadow-lg transition-all";
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.default;
  return (
    <div className={`${base} ${variantClass} ${className || ""}`}>
      <div className="flex-1">
        {title && <ToastTitle>{title}</ToastTitle>}
        {description && <ToastDescription>{description}</ToastDescription>}
      </div>
      {action && <ToastAction onClick={action.onClick}>{action.label}</ToastAction>}
      <ToastClose onClick={onClose} />
    </div>
  );
};

const ToastTitle = ({ children, className }) => (
  <div className={`font-semibold [&+div]:text-sm ${className || ""} dark:text-white`}>
    {children}
  </div>
);

const ToastDescription = ({ children, className }) => (
  <div className={`opacity-90 ${className || ""} dark:text-gray-300`}>
    {children}
  </div>
);

const ToastAction = ({ children, onClick, className }) => (
  <button
    className={`inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 ${className || ""} dark:border-gray-700 dark:text-white dark:hover:bg-gray-800`}
    onClick={onClick}
  >
    {children}
  </button>
);

const ToastClose = ({ onClick, className }) => (
  <button
    className={`absolute right-1 top-1 rounded-md p-1 text-gray-500 opacity-0 transition-opacity hover:text-black focus:opacity-100 focus:outline-none focus:ring-1 group-hover:opacity-100 ${className || ""} dark:text-gray-400 dark:hover:text-white`}
    onClick={onClick}
    aria-label="Close"
  >
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  </button>
);

export { ToastContext, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction };
