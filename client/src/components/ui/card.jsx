import { motion } from 'motion/react';

export const Card = ({ children, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
  >
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
  </motion.div>
);

export const CardHeader = ({ children, className = '' }) => (
  <div className={`px-4 sm:px-6 py-2 min-h-14 flex items-center border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h2 className={`text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 ${className}`}>
    {children}
  </h2>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-gray-600 ${className}`}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`px-4 sm:px-6 py-4 ${className}`}>
    {children}
  </div>
);
