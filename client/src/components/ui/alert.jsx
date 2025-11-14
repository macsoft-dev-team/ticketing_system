import * as React from "react"
import { cn } from "../../lib/utils"

const getAlertVariantClasses = (variant) => {
  const baseClasses = "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4"
  
  switch (variant) {
    case "destructive":
      return `${baseClasses} border-red-500/50 text-red-900 bg-red-50 [&>svg]:text-red-600`
    case "warning":
      return `${baseClasses} border-amber-500/50 text-amber-900 bg-amber-50 [&>svg]:text-amber-600`
    case "success":
      return `${baseClasses} border-green-500/50 text-green-900 bg-green-50 [&>svg]:text-green-600`
    case "info":
      return `${baseClasses} border-blue-500/50 text-blue-900 bg-blue-50 [&>svg]:text-blue-600`
    default:
      return `${baseClasses} bg-gray-50 text-gray-900 border-gray-200 [&>svg]:text-gray-600`
  }
}

const Alert = React.forwardRef(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(getAlertVariantClasses(variant), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }