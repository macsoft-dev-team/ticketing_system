import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Lock, Phone, User, ArrowRight, Loader2, CheckCircle, MapPin, Briefcase } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../lib/services/apiInterceptor';
import { API_ENDPOINTS } from '../../lib/constants/api';

export default function Signup() {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        stateId: '',
        orgCode: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const [states, setStates] = useState([]);
    const [loadingStates, setLoadingStates] = useState(true);
    const [organisations, setOrganisations] = useState([]);
    const [loadingOrganisations, setLoadingOrganisations] = useState(true);

    const navigate = useNavigate();

    // Fetch states and projects on component mount
    useEffect(() => {
        const fetchStates = async () => {
            try {
                const statesResponse = await axios.get(API_ENDPOINTS.states);

                if (Array.isArray(statesResponse.data)) {
                    setStates(statesResponse.data);
                } else {
                    setStates([]);
                }
            } catch (error) {
                if (error.code === 'ERR_NETWORK') {
                    setErrors(prev => ({
                        ...prev,
                        general: 'Unable to connect to server. Please check if the server is running.'
                    }));
                } else {
                    setErrors(prev => ({
                        ...prev,
                        general: `Failed to load states: ${error.response?.status || error.message}`
                    }));
                }
                setStates([]);
            } finally {
                setLoadingStates(false);
            }
        };

        const fetchOrganisations = async () => {
            try {
                const organisationsResponse = await axios.get(API_ENDPOINTS.organisationsWA);

                if (Array.isArray(organisationsResponse.data)) {
                    setOrganisations(organisationsResponse.data);
                } else {
                    setOrganisations([]);
                }
            } catch (error) {
                if (error.code === 'ERR_NETWORK') {
                    setErrors(prev => ({
                        ...prev,
                        general: 'Unable to connect to server. Contact your administrator.'
                    }));
                } else {
                    setErrors(prev => ({
                        ...prev,
                        general: `Failed to load organisations: ${error.response?.status || error.message}`
                    }));
                }
                setOrganisations([]);
            } finally {
                setLoadingOrganisations(false);
            }
        };

        // Fetch both independently so if one fails, the other still works
        fetchStates();
        fetchOrganisations();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Special handling for phone number - only allow digits and limit to 10
        if (name === 'phone') {
            // Remove all non-digit characters
            const digitsOnly = value.replace(/\D/g, '');
            // Remove leading zeros
            const withoutLeadingZero = digitsOnly.replace(/^0+/, '');
            // Limit to 10 digits
            const limitedValue = withoutLeadingZero.slice(0, 10);
            
            setFormData(prev => ({
                ...prev,
                [name]: limitedValue
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Full name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        // Phone validation
        if (!formData.phone) {
            newErrors.phone = 'Mobile number is required';
        } else if (!/^\d{10}$/.test(formData.phone)) {
            newErrors.phone = 'Mobile number must be exactly 10 digits';
        }

        // State validation
        if (!formData.stateId || formData.stateId === '') {
            newErrors.stateId = 'Please select a state';
        }

        // Organisation validation
        if (!formData.orgCode || formData.orgCode === '') {
            newErrors.orgCode = 'Please select an organisation';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
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
            const response = await axios.post(API_ENDPOINTS.register, {
                name: formData.name.trim(),
                phone: formData.phone,
                stateId: parseInt(formData.stateId),
                orgCode: formData.orgCode,
                password: formData.password
            });

            if (response.status === 201) {
                setSuccess(true);
                // Navigate to login page after a short delay
                setTimeout(() => {
                    navigate('/login', {
                        state: {
                            message: 'Registration successful! Please log in with your credentials.',
                            phone: formData.phone
                        }
                    });
                }, 2000);
            }
        } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.error?.code === 'USER_EXISTS') {
                setErrors({
                    phone: 'A user with this phone number already exists. Please use a different number or try logging in.'
                });
            } else {
                setErrors({
                    general: error.response?.data?.message || error.response?.data?.error?.message || 'Registration failed. Please try again.'
                });
            }
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

    const successVariants = {
        hidden: { scale: 0, opacity: 0 },
        visible: {
            scale: 1,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25
            }
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-8 px-2 sm:px-4">
                <div className="flex items-center justify-center min-h-full">
                    <motion.div
                        className="w-full max-w-md text-center"
                        variants={successVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.div
                            className="inline-block p-3 sm:p-4 rounded-full bg-green-100 mb-4 sm:mb-6"
                            animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 10, -10, 0]
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                repeatDelay: 2
                            }}
                        >
                            <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-600" />
                        </motion.div>

                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">Registration Successful!</h1>
                        <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 px-2">
                            Your account has been created successfully. You will be redirected to the login page shortly.
                        </p>
                        <div className="flex items-center justify-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            <span className="text-sm sm:text-base text-blue-600">Redirecting...</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen max-h-96 overflow-auto bg-gradient-to-br from-blue-50 via-white to-purple-50 py-4 sm:py-8">
            <div className="container mx-auto px-2 sm:px-4 max-w-md">
                <motion.div
                    className="w-full"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Logo/Header Section */}
                    <motion.div
                        className="text-center flex flex-col sm:flex-row items-center justify-center mb-4 sm:mb-8 space-y-2 sm:space-y-0 sm:space-x-4"
                        variants={itemVariants}
                    >
                        <motion.div
                            className="inline-block p-2 sm:p-3 rounded-2xl w-16 sm:w-20"
                            whileHover={{ rotate: 5, scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <img className='object-contain' src="/macsoft-logo.png" alt="" />
                        </motion.div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Create Account</h1>
                            <p className="text-sm sm:text-base text-gray-600">Join us to get started with your tickets</p>
                        </div>
                    </motion.div>

                    {/* Registration Form */}
                    <motion.div
                        className="bg-white/70 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6 md:p-8"
                        variants={itemVariants}
                        whileHover={{ y: -2 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                            {/* General Error Display */}
                            {errors.general && (
                                <motion.div
                                    className="p-3 bg-red-50 border border-red-200 rounded-lg"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <p className="text-sm text-red-600">{errors.general}</p>

                                </motion.div>
                            )}

                            {/* Personal Information Section */}
                            <motion.div className="space-y-4 sm:space-y-6" variants={itemVariants}>
                                <div className="border-b border-gray-200 pb-2">
                                    <h3 className="text-base sm:text-lg font-medium text-gray-900">Personal Information</h3>
                                    <p className="text-xs sm:text-sm text-gray-600">Please provide your basic details</p>
                                </div>
                            </motion.div>

                            {/* Full Name Field */}
                            <motion.div variants={itemVariants}>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                    Full Name *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                    </div>
                                    <motion.input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                                            }`}
                                        placeholder="Enter your full name"
                                        whileFocus={{ scale: 1.02 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                    />
                                </div>
                                {errors.name && (
                                    <motion.p
                                        className="mt-1 text-sm text-red-600"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        {errors.name}
                                    </motion.p>
                                )}
                            </motion.div>

                            {/* Mobile Number Field */}
                            <motion.div variants={itemVariants}>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                    Mobile Number *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                    </div>
                                    <motion.input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base ${errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                                            }`}
                                        placeholder="Enter your mobile number"
                                        whileFocus={{ scale: 1.02 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                    />
                                </div>
                                {errors.phone && (
                                    <motion.p
                                        className="mt-1 text-sm text-red-600"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        {errors.phone}
                                    </motion.p>
                                )}
                            </motion.div>

                            {/* State Selection Field */}
                            <motion.div variants={itemVariants}>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                    State *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                    </div>
                                    <motion.select
                                        name="stateId"
                                        value={formData.stateId}
                                        onChange={handleInputChange}
                                        disabled={loadingStates}
                                        className={`w-full pl-9 sm:pl-10 pr-8 sm:pr-10 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white text-sm sm:text-base ${errors.stateId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            } ${loadingStates ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        whileFocus={{ scale: 1.02 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                    >
                                        <option value="">
                                            {loadingStates ? 'Loading states...' :
                                                states.length > 0 ? `Select your state (${states.length} available)` :
                                                    'No states available - Check server connection'}
                                        </option>
                                        {states.map((state) => (
                                            <option key={state.id} value={state.id}>
                                                {state.name}
                                            </option>
                                        ))}
                                    </motion.select>
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                        {loadingStates ? (
                                            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                        ) : (
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                                {errors.stateId && (
                                    <motion.p
                                        className="mt-1 text-sm text-red-600"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        {errors.stateId}
                                    </motion.p>
                                )}
                            </motion.div>

                            {/* Organisation Selection Field */}
                            <motion.div variants={itemVariants}>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                    Organisation *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                    </div>
                                    <motion.select
                                        name="orgCode"
                                        value={formData.orgCode}
                                        onChange={handleInputChange}
                                        disabled={loadingOrganisations}
                                        className={`w-full pl-9 sm:pl-10 pr-8 sm:pr-10 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-white text-sm sm:text-base ${errors.orgCode ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            } ${loadingOrganisations ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        whileFocus={{ scale: 1.02 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                    >
                                        <option value="">
                                            {loadingOrganisations ? 'Loading organisations...' :
                                                organisations.length > 0 ? `Select your organisation (${organisations.length} available)` :
                                                    'No organisations available - Check server connection'}
                                        </option>
                                        {organisations.map((organisation) => (
                                            <option key={organisation.orgCode} value={organisation.orgCode}>
                                                {organisation.name}
                                            </option>
                                        ))}
                                    </motion.select>
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                        {loadingOrganisations ? (
                                            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                        ) : (
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                                {errors.orgCode && (
                                    <motion.p
                                        className="mt-1 text-sm text-red-600"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        {errors.orgCode}
                                    </motion.p>
                                )}
                            </motion.div>

                            {/* Account Security Section */}
                            <motion.div className="space-y-4 sm:space-y-6" variants={itemVariants}>
                                <div className="border-b border-gray-200 pb-2">
                                    <h3 className="text-base sm:text-lg font-medium text-gray-900">Account Security</h3>
                                    <p className="text-xs sm:text-sm text-gray-600">Create a secure password for your account</p>
                                </div>
                            </motion.div>

                            {/* Password Field */}
                            <motion.div variants={itemVariants}>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                    Password *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                    </div>
                                    <motion.input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className={`w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                                            }`}
                                        placeholder="Create a password"
                                        whileFocus={{ scale: 1.02 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                    />
                                    <motion.button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                                    </motion.button>
                                </div>
                                {errors.password && (
                                    <motion.p
                                        className="mt-1 text-sm text-red-600"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        {errors.password}
                                    </motion.p>
                                )}
                            </motion.div>

                            {/* Confirm Password Field */}
                            <motion.div variants={itemVariants}>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                    Confirm Password *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                    </div>
                                    <motion.input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className={`w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base ${errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                                            }`}
                                        placeholder="Confirm your password"
                                        whileFocus={{ scale: 1.02 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                    />
                                    <motion.button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                                    </motion.button>
                                </div>
                                {errors.confirmPassword && (
                                    <motion.p
                                        className="mt-1 text-sm text-red-600"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        {errors.confirmPassword}
                                    </motion.p>
                                )}
                            </motion.div>

                            {/* Password Requirements */}
                            <motion.div
                                className="text-xs sm:text-sm text-gray-500 bg-gray-50 p-2 sm:p-3 rounded-lg"
                                variants={itemVariants}
                            >
                                <p className="font-medium mb-1 text-xs sm:text-sm">Password requirements:</p>
                                <ul className="space-y-1">
                                    <li className={`flex items-center space-x-2 text-xs sm:text-sm ${formData.password.length >= 6 ? 'text-green-600' : 'text-gray-500'
                                        }`}>
                                        <span className="w-1 h-1 bg-current rounded-full flex-shrink-0"></span>
                                        <span>At least 6 characters</span>
                                    </li>
                                    <li className={`flex items-center space-x-2 text-xs sm:text-sm ${/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password) ? 'text-green-600' : 'text-gray-500'
                                        }`}>
                                        <span className="w-1 h-1 bg-current rounded-full flex-shrink-0"></span>
                                        <span>One uppercase, lowercase, and number</span>
                                    </li>
                                </ul>
                            </motion.div>

                            {/* Submit Button */}
                            <motion.button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
                                variants={buttonVariants}
                                initial="idle"
                                whileHover="hover"
                                whileTap="tap"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>Create Account</span>
                                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </>
                                )}
                            </motion.button>
                        </form>
                    </motion.div>

                    {/* Footer */}
                    <motion.div
                        className="text-center mt-4 sm:mt-8 pb-4"
                        variants={itemVariants}
                    >
                        <p className="text-gray-600 text-xs sm:text-sm">
                            Already have an account?
                            <Link
                                to="/login"
                                className="text-blue-600 hover:text-blue-500 ml-1 font-medium transition-colors"
                            >
                                Sign in
                            </Link>
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}