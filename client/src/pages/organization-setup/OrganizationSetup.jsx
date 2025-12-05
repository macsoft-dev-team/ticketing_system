import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Building2, ArrowRight, Loader2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/hooks/useAuth';
import axios from '../../lib/services/apiInterceptor';
import { API_ENDPOINTS } from '../../lib/constants/api';

export default function OrganizationSetup() {
    const navigate = useNavigate();
    const { user, setUser } = useAuth();
    const [selectedOrganization, setSelectedOrganization] = useState('');
    const [organizations, setOrganizations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);

    // Fetch organizations on component mount
    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const response = await axios.get(`${API_ENDPOINTS.organisationsWA}`);
                if (Array.isArray(response.data)) {
                    setOrganizations(response.data.length > 0 ? response.data : []);
                }
            } catch (error) {
                console.error('Error fetching organizations:', error);
                setErrors({ general: 'Failed to load organizations. Please try again.' });
            } finally {
                setIsLoadingOrgs(false);
            }
        };

        fetchOrganizations();
    }, []);

    // Redirect if user already has organization or is MACSOFT role
    useEffect(() => {
        const macsoftRoles = ['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT'];
        if (user?.orgCode || user?.organisation || macsoftRoles.includes(user?.role)) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    const validateForm = () => {
        const newErrors = {};

        if (!selectedOrganization) {
            newErrors.organization = 'Please select an organization';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        setErrors({});

        try {
            const response = await axios.patch(`${API_ENDPOINTS.user}/me/organization`, {
                orgCode: selectedOrganization
            });

            if (response.data.user) {
                // Update user in context and session
                setUser(response.data.user);
                setSuccess(true);
                
                // Navigate to dashboard after success
                setTimeout(() => {
                    navigate('/dashboard', { replace: true });
                }, 1500);
            }
        } catch (error) {
            console.error('Organization setup error:', error);
            setErrors({
                general: error.response?.data?.message || 'Failed to update organization. Please try again.'
            });
            setIsLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.5,
                ease: "easeOut"
            }
        }
    };

    const buttonVariants = {
        idle: { scale: 1 },
        hover: { scale: 1.02 },
        tap: { scale: 0.98 }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
                <motion.div
                    className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="mb-6">
                        <div className="inline-block p-3 bg-green-100 rounded-full mb-4">
                            <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Organization Set!</h1>
                        <p className="text-gray-600">Your organization has been successfully configured. Redirecting you to dashboard...</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
            <motion.div
                className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div
                    className="text-center flex flex-col items-center justify-center mb-8"
                    variants={itemVariants}
                >
                    <motion.div
                        className="inline-block p-3 bg-blue-100 rounded-2xl mb-4"
                        whileHover={{ rotate: 5, scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <Building2 className="w-8 h-8 text-blue-600" />
                    </motion.div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Setup Organization</h1>
                    <p className="text-gray-600">Please select your organization to complete your profile</p>
                </motion.div>

                {/* Organization Setup Form */}
                <motion.div variants={itemVariants}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* General Error */}
                        {errors.general && (
                            <motion.div
                                className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {errors.general}
                            </motion.div>
                        )}

                        {/* Organization Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Organization *
                            </label>
                            {isLoadingOrgs ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                    <span className="ml-2 text-gray-600">Loading organizations...</span>
                                </div>
                            ) : (
                                <select
                                    value={selectedOrganization}
                                    onChange={(e) => setSelectedOrganization(e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.organization ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Select your organization</option>
                                    {organizations.map((org) => (
                                        <option key={org.orgCode} value={org.orgCode}>
                                            {org.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {errors.organization && (
                                <p className="text-red-500 text-sm mt-1">{errors.organization}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={isLoading || isLoadingOrgs}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Complete Setup</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </motion.button>
                    </form>
                </motion.div>

                {/* User Info */}
                <motion.div
                    className="text-center mt-6 pt-6 border-t border-gray-200"
                    variants={itemVariants}
                >
                    <p className="text-gray-600 text-sm">
                        Logged in as: <span className="font-medium">{user?.name}</span>
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                        Phone: {user?.phone}
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
}