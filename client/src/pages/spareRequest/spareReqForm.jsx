 import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { SpareRequestForm } from '../../components/ui/spareRequestForm';

export default function SpareReqForm() {
    const navigate = useNavigate();

    const handleSubmit = (formData) => {
        console.log('Spare request submitted:', formData);
        // Handle form submission here - send to API
        // navigate back or show success message
        navigate('/tickets'); // or wherever you want to redirect
    };

    const handleCancel = () => {
        navigate(-1); // Go back to previous page
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-b border-gray-200 px-6 py-4"
            >
                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleCancel}
                        className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </motion.button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Spare Parts Request</h1>
                        <p className="text-gray-600">Request spare parts for maintenance and repairs</p>
                    </div>
                </div>
            </motion.div>

            {/* Form Content */}
            <div className="p-6">
                <SpareRequestForm
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                />
            </div>
        </div>
    );
}