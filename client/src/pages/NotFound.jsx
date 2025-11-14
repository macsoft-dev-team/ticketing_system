
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-7xl font-extrabold text-blue-600 mb-4">404</h1>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Page Not Found</h2>
        <p className="text-lg text-gray-500 mb-8">Sorry, the page you are looking for does not exist.</p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors duration-200"
        >
          Go Home
        </a>
      </motion.div>
    </div>
  );
}
