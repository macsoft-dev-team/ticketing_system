import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Phone, ArrowRight, Loader2, ArrowLeft, Mail, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../lib/services/api';

export default function ForgotPassword() {
    const [step, setStep] = useState(1); // 1: Enter phone, 2: Verification, 3: New Password, 4: Success
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [countdown, setCountdown] = useState(0);

    const validatePhoneNumber = () => {
        const newErrors = {};
        
        if (!phoneNumber) {
            newErrors.phoneNumber = 'Phone number is required';
        } else if (!/^\+?[\d\s\-\(\)]{10,15}$/.test(phoneNumber.replace(/\s/g, ''))) {
            newErrors.phoneNumber = 'Please enter a valid phone number';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSendCode = async (e) => {
        e.preventDefault();
        
        if (!validatePhoneNumber()) return;
        
        setIsLoading(true);
        setErrors({});
        
        try {
            const response = await authAPI.sendForgotPasswordCode(phoneNumber);
            
            if (response.success) {
                setStep(2);
                startCountdown();
            } else {
                throw new Error(response.message || 'Failed to send verification code');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to send verification code. Please try again.';
            setErrors({ general: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerificationCodeChange = (index, value) => {
        if (value.length <= 1 && /^\d*$/.test(value)) {
            const newCode = [...verificationCode];
            newCode[index] = value;
            setVerificationCode(newCode);
            
            // Auto-focus next input
            if (value && index < 5) {
                const nextInput = document.querySelector(`input[name="code-${index + 1}"]`);
                if (nextInput) nextInput.focus();
            }
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        
        const code = verificationCode.join('');
        if (code.length !== 6) {
            setErrors({ verification: 'Please enter the complete verification code' });
            return;
        }
        
        setIsLoading(true);
        setErrors({});
        
        try {
            const response = await authAPI.verifyResetCode(phoneNumber, code);
            
            if (response.success) {
                setStep(3); // Go to password reset step
            } else {
                throw new Error(response.message || 'Invalid verification code');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Invalid verification code. Please try again.';
            setErrors({ verification: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const startCountdown = () => {
        setCountdown(60);
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleResendCode = async () => {
        setIsLoading(true);
        setErrors({});
        
        try {
            const response = await authAPI.sendForgotPasswordCode(phoneNumber);
            
            if (response.success) {
                startCountdown();
            } else {
                throw new Error(response.message || 'Failed to resend code');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to resend code. Please try again.';
            setErrors({ general: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const validatePassword = () => {
        const newErrors = {};
        
        if (!newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (newPassword.length < 6) {
            newErrors.newPassword = 'Password must be at least 6 characters long';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
            newErrors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }
        
        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your new password';
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        
        if (!validatePassword()) return;
        
        setIsLoading(true);
        setErrors({});
        
        try {
            const code = verificationCode.join('');
            const response = await authAPI.resetPassword(phoneNumber, code, newPassword);
            
            if (response.success) {
                setStep(4); // Go to success step
            } else {
                throw new Error(response.message || 'Failed to reset password');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to reset password. Please try again.';
            setErrors({ general: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    // Animation variants
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

    const stepVariants = {
        enter: {
            x: 300,
            opacity: 0
        },
        center: {
            x: 0,
            opacity: 1,
            transition: {
                duration: 0.4,
                ease: "easeOut"
            }
        },
        exit: {
            x: -300,
            opacity: 0,
            transition: {
                duration: 0.4,
                ease: "easeIn"
            }
        }
    };

    const buttonVariants = {
        idle: { scale: 1 },
        hover: { scale: 1.02 },
        tap: { scale: 0.98 }
    };

    const floatingIconVariants = {
        float: {
            y: [-10, 10, -10],
            rotate: [0, 5, -5, 0],
            transition: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background floating elements */}
            <motion.div
                className="absolute top-20 left-20 w-20 h-20 bg-blue-200 rounded-full opacity-20"
                animate="float"
                variants={floatingIconVariants}
            />
            <motion.div
                className="absolute bottom-20 right-20 w-16 h-16 bg-blue-200 rounded-full opacity-20"
                animate="float"
                variants={{
                    float: {
                        y: [10, -10, 10],
                        rotate: [-5, 5, -5],
                        transition: {
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 1
                        }
                    }
                }}
            />
            
            <motion.div
                className="w-full max-w-md relative z-10"
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
                        <img className='object-contain' src="/macsoft-logo.png" alt="Macsoft Logo" />
                    </motion.div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {step === 1 && 'Forgot Password'}
                            {step === 2 && 'Verify Your Phone'}
                            {step === 3 && 'Set New Password'}
                            {step === 4 && 'Password Reset Complete'}
                        </h1>
                        <p className="text-gray-600">
                            {step === 1 && 'Enter your phone number to reset your password'}
                            {step === 2 && 'Enter the 6-digit code sent to your phone'}
                            {step === 3 && 'Create a new secure password for your account'}
                            {step === 4 && 'Your password has been successfully reset'}
                        </p>
                    </div>
                </motion.div>

                {/* Main Form Card */}
                <motion.div
                    className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8"
                    variants={itemVariants}
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                    {/* Step 1: Enter Phone Number */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            variants={stepVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                        >
                            <form onSubmit={handleSendCode} className="space-y-6">
                                {/* Error Display */}
                                {errors.general && (
                                    <motion.div
                                        className="p-3 bg-red-50 border border-red-200 rounded-lg"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <p className="text-sm text-red-600">{errors.general}</p>
                                    </motion.div>
                                )}

                                {/* Phone Number Field */}
                                <motion.div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Phone className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <motion.input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                                errors.phoneNumber ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                                            }`}
                                            placeholder="Enter your phone number"
                                            whileFocus={{ scale: 1.02 }}
                                            transition={{ type: "spring", stiffness: 300 }}
                                        />
                                    </div>
                                    {errors.phoneNumber && (
                                        <motion.p
                                            className="mt-1 text-sm text-red-600"
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            {errors.phoneNumber}
                                        </motion.p>
                                    )}
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
                                            <span>Send Verification Code</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </motion.button>
                            </form>
                        </motion.div>
                    )}

                    {/* Step 2: Verify Code */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            variants={stepVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                        >
                            <form onSubmit={handleVerifyCode} className="space-y-6">
                                {/* Error Display */}
                                {errors.verification && (
                                    <motion.div
                                        className="p-3 bg-red-50 border border-red-200 rounded-lg"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <p className="text-sm text-red-600">{errors.verification}</p>
                                    </motion.div>
                                )}

                                <motion.div className="text-center mb-6">
                                    <motion.div
                                        className="inline-block p-3 rounded-full bg-blue-100 mb-4"
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Mail className="w-8 h-8 text-blue-600" />
                                    </motion.div>
                                    <p className="text-sm text-gray-600">
                                        We've sent a 6-digit code to <br />
                                        <span className="font-semibold text-gray-900">{phoneNumber}</span>
                                    </p>
                                </motion.div>

                                {/* Verification Code Input */}
                                <motion.div className="flex justify-center space-x-3 mb-6">
                                    {verificationCode.map((digit, index) => (
                                        <motion.input
                                            key={index}
                                            name={`code-${index}`}
                                            type="text"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleVerificationCodeChange(index, e.target.value)}
                                            className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            whileFocus={{ scale: 1.1, borderColor: "#9333ea" }}
                                            transition={{ type: "spring", stiffness: 300 }}
                                        />
                                    ))}
                                </motion.div>

                                {/* Resend Code */}
                                <motion.div className="text-center mb-6">
                                    {countdown > 0 ? (
                                        <p className="text-sm text-gray-600">
                                            Resend code in <span className="font-semibold text-blue-600">{countdown}s</span>
                                        </p>
                                    ) : (
                                        <motion.button
                                            type="button"
                                            onClick={handleResendCode}
                                            disabled={isLoading}
                                            className="text-sm text-blue-600 hover:text-blue-500 font-medium disabled:opacity-50"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            Resend Code
                                        </motion.button>
                                    )}
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
                                            <span>Verify Code</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </motion.button>

                                {/* Back Button */}
                                <motion.button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="w-full text-gray-600 hover:text-gray-800 py-2 font-medium flex items-center justify-center space-x-2"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Back to Phone Number</span>
                                </motion.button>
                            </form>
                        </motion.div>
                    )}

                    {/* Step 3: Set New Password */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            variants={stepVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                        >
                            <form onSubmit={handleResetPassword} className="space-y-6">
                                {/* Error Display */}
                                {errors.general && (
                                    <motion.div
                                        className="p-3 bg-red-50 border border-red-200 rounded-lg"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <p className="text-sm text-red-600">{errors.general}</p>
                                    </motion.div>
                                )}

                                {/* New Password Field */}
                                <motion.div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <motion.input
                                            type={showPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                                errors.newPassword ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                                            }`}
                                            placeholder="Enter your new password"
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
                                    {errors.newPassword && (
                                        <motion.p
                                            className="mt-1 text-sm text-red-600"
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            {errors.newPassword}
                                        </motion.p>
                                    )}
                                </motion.div>

                                {/* Confirm Password Field */}
                                <motion.div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <motion.input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                                errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                                            }`}
                                            placeholder="Confirm your new password"
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
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                                            <span>Reset Password</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </motion.button>

                                {/* Back Button */}
                                <motion.button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="w-full text-gray-600 hover:text-gray-800 py-2 font-medium flex items-center justify-center space-x-2"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Back to Verification</span>
                                </motion.button>
                            </form>
                        </motion.div>
                    )}

                    {/* Step 4: Success */}
                    {step === 4 && (
                        <motion.div
                            key="step4"
                            variants={stepVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="text-center space-y-6"
                        >
                            <motion.div
                                className="inline-block p-4 rounded-full bg-green-100 mb-6"
                                animate={{ 
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 360]
                                }}
                                transition={{ 
                                    duration: 1,
                                    ease: "easeInOut"
                                }}
                            >
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    Password Reset Successful!
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Your password has been successfully reset. You can now sign in to your account using your new password.
                                </p>
                                <p className="text-sm text-gray-500">
                                    For security reasons, you may need to sign in again on other devices.
                                </p>
                            </motion.div>

                            <motion.div
                                className="space-y-3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <Link
                                    to="/login"
                                    className="block w-full"
                                >
                                    <motion.button
                                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        variants={buttonVariants}
                                        initial="idle"
                                        whileHover="hover"
                                        whileTap="tap"
                                    >
                                        Sign In Now
                                    </motion.button>
                                </Link>
                                <motion.button
                                    onClick={() => {
                                        setStep(1);
                                        setPhoneNumber('');
                                        setVerificationCode(['', '', '', '', '', '']);
                                        setNewPassword('');
                                        setConfirmPassword('');
                                        setErrors({});
                                    }}
                                    className="w-full text-blue-600 hover:text-blue-500 py-2 font-medium transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Reset Another Password
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Footer */}
                <motion.div
                    className="text-center mt-8"
                    variants={itemVariants}
                >
                    <p className="text-gray-600 text-sm">
                        Remember your password?
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
    );
}