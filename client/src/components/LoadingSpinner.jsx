import { useSelector } from 'react-redux';

const LoadingSpinner = () => {
  const { loading } = useSelector((state) => state.ui);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 font-mono bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-700 font-medium">Loading...</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
