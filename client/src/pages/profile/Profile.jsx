import { Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import useAuth from "../../lib/hooks/useAuth";
import { profileAPI } from "../../lib/services/api";
import { useToast } from "../../components/ui/toast";

export default function ProfilePage() {
    const { user, quickLogout } = useAuth();
    const { addToast } = useToast();
    const [showPassword, setShowPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset
    } = useForm({
        defaultValues: {
            name: user?.name || '',
            phone: user?.phone || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        }
    });

    // Update form values when user data changes
    useEffect(() => {
        if (user) {
            reset({
                name: user.name || '',
                phone: user.phone || '',
                newPassword: '',
                confirmPassword: ''
            });
        }
    }, [user, reset]);

    // Prevent autofill by making fields readonly initially
    useEffect(() => {
        const timer = setTimeout(() => {
            const inputs = document.querySelectorAll('input[readonly]');
            inputs.forEach(input => {
                input.removeAttribute('readonly');
            });
        }, 100);
        return () => clearTimeout(timer);
    }, []);
    const onSubmit = async (data) => {
        try {
            // Validate password match if changing password
            if (isChangingPassword && data.newPassword !== data.confirmPassword) {
                addToast({
                    title: 'Password Mismatch',
                    description: 'New passwords do not match!',
                    variant: 'error'
                });
                return;
            }

            // Prepare form data
            const formData = {
                name: data.name.trim(),
                phone: data.phone.trim()
            };

            // Add password if changing
            if (isChangingPassword && data.newPassword) {
                formData.newPassword = data.newPassword;
            }

            // Call the API
            const response = await profileAPI.updateProfile(formData);
            
            // Update the user context with new data (from useAuth hook)
            // setUser(response.user); // This would need to be implemented in useAuth
            
            addToast({
                title: 'Profile Updated',
                description: 'Profile updated successfully! You will be logged out for security.',
                variant: 'success'
            });
            
            // Reset password change mode and clear password fields
            if (isChangingPassword) {
                setIsChangingPassword(false);
                // Keep name and phone, clear passwords
                reset({
                    name: data.name,
                    phone: data.phone,
                    newPassword: '',
                    confirmPassword: ''
                });
            }
            
            // Quick logout after any profile update for security
            setTimeout(async () => {
                await quickLogout();
                addToast({
                    title: 'Logged Out',
                    description: 'Please log in again to continue.',
                    variant: 'info'
                });
            }, 2000); // 2 second delay to show success message first
        } catch (error) {
            console.error('Error updating profile:', error);
            
            // Handle different types of errors
            if (error.response) {
                const errorMessage = error.response.data?.message || 'Failed to update profile';
                addToast({
                    title: 'Update Failed',
                    description: errorMessage,
                    variant: 'error'
                });
            } else if (error.request) {
                addToast({
                    title: 'Network Error',
                    description: 'Please check your connection and try again.',
                    variant: 'error'
                });
            } else {
                addToast({
                    title: 'Update Failed',
                    description: 'Failed to update profile. Please try again.',
                    variant: 'error'
                });
            }
        }
    };

    const handlePasswordChangeToggle = () => {
        setIsChangingPassword(!isChangingPassword);
        if (isChangingPassword) {
            // Reset password fields when canceling
            reset(prev => ({
                ...prev,
                newPassword: '',
                confirmPassword: ''
            }));
        }
        setShowPassword(false);
    };

    return (
        <div className="w-full p-8 flex flex-col">
            <h2 className="text-3xl font-semibold text-gray-800 mb-8">
                WELCOME BACK <span className="text-blue-600">{user?.name}</span>
            </h2>

            <form 
                autoComplete="off" 
                onSubmit={handleSubmit(onSubmit)} 
                className="space-y-8 max-w-lg"
                data-lpignore="true"
                data-form-type="other"
                noValidate
            >
                {/* Honeypot fields to confuse autofill */}
                <div style={{ display: 'none' }}>
                    <input type="text" name="username" autoComplete="username" tabIndex="-1" />
                    <input type="password" name="password" autoComplete="current-password" tabIndex="-1" />
                    <input type="email" name="email_fake" autoComplete="email" tabIndex="-1" />
                </div>
                <div className="space-y-8">
                    {/* Name */}
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-600 mb-1">Name</label>
                        <input
                            {...register('name', {
                                required: 'Name is required',
                                minLength: {
                                    value: 2,
                                    message: 'Name must be at least 2 characters'
                                }
                            })}
                            type="text"
                            placeholder="Enter your name"
                            autoComplete="off"
                            data-form-type="other"
                            data-lpignore="true"
                            readOnly
                            onFocus={(e) => e.target.removeAttribute('readonly')}
                            className={`border-b border-gray-300 focus:border-blue-500 outline-none py-2 ${
                                errors.name ? 'border-red-500' : ''
                            }`}
                        />
                        {errors.name && (
                            <span className="text-red-500 text-sm mt-1">{errors.name.message}</span>
                        )}
                    </div>

                    {/* Mobile */}
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-600 mb-1">Mobile No</label>
                        <input
                            {...register('phone', {
                                required: 'Phone number is required',
                                pattern: {
                                    value: /^[0-9]{10}$/,
                                    message: 'Phone number must be 10 digits'
                                }
                            })}
                            type="text"
                            maxLength="10"
                            placeholder="Enter your mobile number"
                            autoComplete="off"
                            data-form-type="other"
                            data-lpignore="true"
                            readOnly
                            onFocus={(e) => e.target.removeAttribute('readonly')}
                            className={`border-b border-gray-300 focus:border-blue-500 outline-none py-2 ${
                                errors.phone ? 'border-red-500' : ''
                            }`}
                        />
                        {errors.phone && (
                            <span className="text-red-500 text-sm mt-1">{errors.phone.message}</span>
                        )}
                    </div>

                    {/* Password Section */}
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-600">Password</label>
                            <button
                                type="button"
                                onClick={handlePasswordChangeToggle}
                                className={`px-4 py-2 text-sm rounded-lg transition-all ${
                                    isChangingPassword
                                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                }`}
                            >
                                {isChangingPassword ? 'Cancel' : 'Change'}
                            </button>
                        </div>

                        {isChangingPassword && (
                            <div className="space-y-4 pl-4 border-l-2 border-blue-200">
                                {/* New Password */}
                                <div className="flex flex-col relative">
                                    <label className="text-sm font-medium text-gray-600 mb-1">New Password</label>
                                    <input
                                        {...register('newPassword', {
                                            required: isChangingPassword ? 'New password is required' : false,
                                            minLength: {
                                                value: 6,
                                                message: 'Password must be at least 6 characters'
                                            }
                                        })}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your new password"
                                        className={`border-b border-gray-300 focus:border-blue-500 outline-none py-2 pr-10 ${
                                            errors.newPassword ? 'border-red-500' : ''
                                        }`}
                                        autoComplete="off"
                                        data-form-type="other"
                                        data-lpignore="true"
                                        readOnly
                                        onFocus={(e) => e.target.removeAttribute('readonly')}
                                    />
                                    <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        type="button"
                                        className="absolute right-3 bottom-2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                    </button>
                                    {errors.newPassword && (
                                        <span className="text-red-500 text-sm mt-1">{errors.newPassword.message}</span>
                                    )}
                                </div>

                                {/* Confirm New Password */}
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-600 mb-1">Confirm New Password</label>
                                    <input
                                        {...register('confirmPassword', {
                                            required: isChangingPassword ? 'Please confirm your new password' : false
                                        })}
                                        type="password"
                                        placeholder="Confirm your new password"
                                        className={`border-b border-gray-300 focus:border-blue-500 outline-none py-2 ${
                                            errors.confirmPassword ? 'border-red-500' : ''
                                        }`}
                                        autoComplete="off"
                                        data-form-type="other"
                                        data-lpignore="true"
                                        readOnly
                                        onFocus={(e) => e.target.removeAttribute('readonly')}
                                    />
                                    {errors.confirmPassword && (
                                        <span className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-950 ms-auto text-white py-2 px-6 mt-4 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
            </form>
        </div>
    );
}
