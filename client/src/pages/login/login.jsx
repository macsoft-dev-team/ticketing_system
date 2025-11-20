import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Lock, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import useAuth from '../../lib/hooks/useAuth';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login: loginAction, error: authError, isAuthenticated, user } = useAuth();

    const from = location.state?.from?.pathname || '/';
    const successMessage = location.state?.message;
    const prefilledPhone = location.state?.phone || '';

    const [mobileNumber, setMobileNumber] = useState(prefilledPhone);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Navigate after successful login
    React.useEffect(() => {
        if (isAuthenticated && user) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, user, navigate, from]);

    const validateForm = () => {
        const newErrors = {};

        if (!mobileNumber) {
            newErrors.mobileNumber = 'Mobile number is required';
        } else if (!/^\+?[\d\s\-\(\)]{10,15}$/.test(mobileNumber.replace(/\s/g, ''))) {
            newErrors.mobileNumber = 'Please enter a valid mobile number';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
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
            const result = await loginAction(mobileNumber, password);

            if (result.meta.requestStatus === 'fulfilled') {
                // Login successful - navigation will be handled by App.jsx route update
                console.log('Login successful, user:', result.payload.user);
            } else {
                // Handle login error
                setErrors({ general: result.payload || 'Login failed' });
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Login error:', error);
            setErrors({ general: error.message || 'An error occurred during login' });
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <motion.div
                className="w-full max-w-md"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Logo/Header Section */}
                <motion.div
                    className="text-center flex items-center justify-center mb-8"
                    variants={itemVariants}
                >
                    <motion.div
                        className="inline-block p-3 rounded-2xl mb-4 w-20"
                        whileHover={{ rotate: 5, scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <img className='object-contain' src="/macsoft-logo.png" alt="" />
                    </motion.div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                        <p className="text-gray-600">Sign in to your account to continue</p>
                    </div>
                </motion.div>

                {/* Login Form */}
                <motion.div
                    className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8"
                    variants={itemVariants}
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Success Message Display */}
                        {successMessage && (
                            <motion.div
                                className="p-3 bg-green-50 border border-green-200 rounded-lg"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <p className="text-sm text-green-600">{successMessage}</p>
                            </motion.div>
                        )}

                        {/* General Error Display */}
                        {(errors.general || authError) && (
                            <motion.div
                                className="p-3 bg-red-50 border border-red-200 rounded-lg"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <p className="text-sm text-red-600">{errors.general || authError}</p>
                            </motion.div>
                        )}

                        {/* Mobile Number Field */}
                        <motion.div variants={itemVariants}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mobile Number
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="w-5 h-5 text-gray-400" />
                                </div>
                                <motion.input
                                    type="tel"
                                    value={mobileNumber}
                                    onChange={(e) => setMobileNumber(e.target.value)}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.mobileNumber ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                                        }`}
                                    placeholder="Enter your mobile number"
                                    whileFocus={{ scale: 1.02 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                />
                            </div>
                            {errors.mobileNumber && (
                                <motion.p
                                    className="mt-1 text-sm text-red-600"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    {errors.mobileNumber}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Password Field */}
                        <motion.div variants={itemVariants}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="w-5 h-5 text-gray-400" />
                                </div>
                                <motion.input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                                        }`}
                                    placeholder="Enter your password"
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
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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

                        {/* Remember Me */}
                        <motion.div
                            className="flex items-center justify-between"
                            variants={itemVariants}
                        >
                            <label className="flex items-center">
                                <motion.input
                                    type="checkbox"
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                />
                                <span className="ml-2 text-sm text-gray-600">Remember me</span>
                            </label>
                            <motion.a
                                href="#"
                                className="text-sm text-blue-600 hover:text-blue-500"
                                whileHover={{ scale: 1.05 }}
                            >
                                Forgot password?
                            </motion.a>
                        </motion.div>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                            variants={buttonVariants}
                            initial="idle"
                            whileHover="hover"
                            whileTap="tap"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </motion.button>
                    </form>
                </motion.div>

                {/* Footer */}
                <motion.div
                    className="text-center mt-8"
                    variants={itemVariants}
                >
                    <p className="text-gray-600 text-sm">
                        Don't have an account?
                        <Link
                            to="/signup"
                            className="text-blue-600 hover:text-blue-500 ml-1 font-medium transition-colors"
                        >
                            Sign up
                        </Link>
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
}