import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState, useCallback, useEffect } from 'react';
import {
    Upload,
    X,
    FileText,
    Image,
    AlertCircle,
    CheckCircle,
    Save,
    RotateCcw,
    MapPin,
    User,
    Settings,
    FileWarning,
    Loader2
} from 'lucide-react';
import {
    ticketFormSchema,
    defaultValues,
    priorityOptions,
    categoryOptions,
    faultTypeOptions
} from './ticketFormSchema';
import { NavLink, useNavigate } from 'react-router-dom';
import { controllerAPI } from '../../../lib/services/api';
import { useToast } from '../../../components/ui/toast';
import { API_ENDPOINTS } from '../../../lib/constants/api';
import useTickets from '../../../lib/hooks/useTickets';

export default function TicketForm({ onSubmit, onCancel, initialData = null }) {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isDragActive, setIsDragActive] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingController, setIsFetchingController] = useState(false);
    const [controllerError, setControllerError] = useState('');
    const { addToast } = useToast();
    const { createTicket, loading: ticketLoading, error: ticketError } = useTickets();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isDirty },
        setValue,
        watch,
        reset,
        clearErrors,
        getValues
    } = useForm({
        resolver: yupResolver(ticketFormSchema),
        defaultValues: initialData || defaultValues,
        mode: 'all'
    });

    // Debug: Log form state
    useEffect(() => {
        console.log('=== FORM DEBUG ===');
        console.log('Is valid:', isValid);
        console.log('Is dirty:', isDirty);
        console.log('Is submitting:', isSubmitting);
        console.log('Ticket loading:', ticketLoading);
        console.log('Ticket error:', ticketError);
        console.log('Error count:', Object.keys(errors).length);
        console.log('Errors:', errors);
        console.log('Values:', getValues());
        console.log('==================');
    }, [errors, isValid, isDirty, isSubmitting, ticketLoading, ticketError, getValues]);

    const watchedValues = watch();
    const controllerNo = watch('controllerNo');

    // Fetch controller details from LMS
    const fetchControllerDetails = useCallback(async (controllerNumber) => {
        if (!controllerNumber || controllerNumber.length < 3) {
            return;
        }

        setIsFetchingController(true);
        setControllerError('');

        try {
            console.log('Fetching controller details for:', controllerNumber);
            const controllerData = await controllerAPI.getControllerFromLMS(controllerNumber);
            
            console.log('Received controller data:', controllerData);
            
            // Set the fetched data to form fields
            // Handle the specific LMS API response structure
            const data = controllerData.data || controllerData;
            
            console.log('Available data fields:', {
                imei: data.imeinumber,
                simnumber: data.simnumber,
                powerrating: data.lot?.product?.powerrating,
                motortype: data.lot?.product?.motortype,
                productname: data.lot?.product?.name,
                customer: {
                    name: data.lot?.product?.customer?.name,
                    address: data.lot?.product?.customer?.address,
                    email: data.lot?.product?.customer?.email,
                    phone: data.lot?.product?.customer?.phone,
                    contact: data.lot?.product?.customer?.contact
                }
            });
            
            // Extract IMEI from imeinumber field
            setValue('imei', data.imeinumber || '');
            
            // Extract HP from lot.product.powerrating
            const powerRating = data.lot?.product?.powerrating || '';
            setValue('hp', powerRating);
            
            // Extract motor type from lot.product.motortype
            const motorType = data.lot?.product?.motortype || '';
            setValue('motorType', motorType);
            
            // Extract customer information if available
            const customerInfo = data.lot?.product?.customer || {};
            const customerName = customerInfo.name || '';
            if (customerName && !watchedValues.customerName) {
                setValue('customerName', customerName);
            }
            
            // Extract location information from customer address if available
            const customerAddress = customerInfo.address || '';
            if (customerAddress && !watchedValues.district) {
                // Try to extract location info from address
                setValue('district', customerAddress);
                
                // Map cities to states
                const cityStateMapping = {
                    // Tamil Nadu
                    'COIMBATORE': 'Tamil Nadu',
                    'CHENNAI': 'Tamil Nadu',
                    'MADURAI': 'Tamil Nadu',
                    'SALEM': 'Tamil Nadu',
                    'TRICHY': 'Tamil Nadu',
                    'TIRUPUR': 'Tamil Nadu',
                    'ERODE': 'Tamil Nadu',
                    'VELLORE': 'Tamil Nadu',
                    'TANJORE': 'Tamil Nadu',
                    // Karnataka
                    'BANGALORE': 'Karnataka',
                    'BENGALURU': 'Karnataka',
                    'MYSORE': 'Karnataka',
                    'HUBLI': 'Karnataka',
                    'MANGALORE': 'Karnataka',
                    // Maharashtra
                    'MUMBAI': 'Maharashtra',
                    'PUNE': 'Maharashtra',
                    'NASHIK': 'Maharashtra',
                    'AURANGABAD': 'Maharashtra',
                    // Gujarat
                    'AHMEDABAD': 'Gujarat',
                    'SURAT': 'Gujarat',
                    'VADODARA': 'Gujarat',
                    'RAJKOT': 'Gujarat',
                    // Add more as needed
                };
                
                const addressUpper = customerAddress.toUpperCase();
                for (const [city, state] of Object.entries(cityStateMapping)) {
                    if (addressUpper.includes(city)) {
                        setValue('state', state);
                        break;
                    }
                }
            }
            
            // Clear any previous errors for these fields
            clearErrors(['imei', 'hp', 'motorType', 'customerName', 'district', 'state']);
            
        } catch (error) {
            console.error('Error fetching controller details:', error);
            
            let errorMessage = 'Failed to fetch controller details from LMS';
            if (error.response?.status === 404) {
                errorMessage = `Controller ${controllerNumber} not found in LMS system`;
            } else if (error.response?.status === 400) {
                errorMessage = 'Invalid controller number format';
            } else if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
                errorMessage = 'Network error - please check your connection';
            } else if (error.response?.status >= 500) {
                errorMessage = 'LMS server is temporarily unavailable';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            
            setControllerError(errorMessage);
            
            // Clear the auto-filled fields if error occurs
            setValue('imei', '');
            setValue('hp', '');
            setValue('motorType', '');
            // Don't clear customer name, district, or state as user might have entered them manually
            // Only clear them if they were auto-filled from the current controller lookup
        } finally {
            setIsFetchingController(false);
        }
    }, [setValue, clearErrors]);

    // Manual fetch function for the button
    const handleFetchControllerDetails = () => {
        if (controllerNo && controllerNo.length >= 3) {
            fetchControllerDetails(controllerNo);
        } else {
            setControllerError('Please enter a valid controller number (minimum 3 characters)');
        }
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: [0.25, 0.46, 0.45, 0.94],
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4 }
        }
    };

    const buttonVariants = {
        hover: {
            scale: 1.02,
            transition: { duration: 0.2 }
        },
        tap: {
            scale: 0.98,
            transition: { duration: 0.1 }
        }
    };

    // File handling functions
    const handleFileUpload = useCallback((files) => {
        const newFiles = Array.from(files).map(file => ({
            file,
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            type: file.type,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        }));

        setUploadedFiles(prev => [...prev, ...newFiles]);
        setValue('attachments', [...uploadedFiles, ...newFiles].map(f => f.file));
        clearErrors('attachments');
    }, [uploadedFiles, setValue, clearErrors]);

    const removeFile = useCallback((fileId) => {
        setUploadedFiles(prev => {
            const updated = prev.filter(f => f.id !== fileId);
            setValue('attachments', updated.map(f => f.file));
            return updated;
        });
    }, [setValue]);

    const onDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    }, []);

    const onDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    }, []);

    const onDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const onDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileUpload(files);
        }
    }, [handleFileUpload]);

    // Form submission
    const handleFormSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            // Format data to match backend expectations
            const ticketData = {
                // ticketCode will be auto-generated by the backend
                description: data.description,
                customerName: data.customerName,
                controllerNo: data.controllerNo,
                imei: data.imei || '',
                hp: data.hp || '',
                motorType: data.motorType,
                state: data.state,
                district: data.district,
                village: data.village || '',
                block: data.block || '',
                complaintType: data.category, // Map category to complaintType
                faultType: data.faultType,
                faultCode: data.faultCode,
                // Include attachments if any
                attachments: uploadedFiles.map(f => f.file)
            };

            // Use the Redux action to create the ticket (includes authentication)
            console.log('📝 Submitting ticket data:', {
                ...ticketData,
                attachments: ticketData.attachments?.map(f => ({
                    name: f.name,
                    size: f.size,
                    type: f.type
                })) || 'No attachments'
            });
            const resultAction = await createTicket(ticketData);
            
            console.log('🔍 Result action:', resultAction);
            console.log('🔍 Meta status:', resultAction.meta?.requestStatus);
            console.log('🔍 Payload:', resultAction.payload);
            console.log('🔍 Error:', resultAction.error);
            
            // Check if the action was fulfilled by checking the meta.requestStatus
            if (resultAction.meta.requestStatus === 'fulfilled') {
                const result = resultAction.payload;
                console.log('Ticket created successfully:', result);
                
                // Call the onSubmit prop if provided (for parent component handling)
                if (onSubmit) {
                    await onSubmit(result);
                }
                
                // Show success message
                addToast({
                    title: "Success!",
                    description: `Ticket ${result.ticketCode || result.ticketNumber} created successfully.`,
                    variant: "success"
                });
                
                // Reset form after successful submission
                reset(defaultValues);
                setUploadedFiles([]);
                
                // Navigate to tickets page after a brief delay to show the toast
                setTimeout(() => {
                    navigate('/tickets');
                }, 1000);
            } else {
                // Handle rejection
                const errorMessage = resultAction.payload || resultAction.error?.message || 'Failed to create ticket. Please try again.';
                throw new Error(errorMessage);
            }
            
        } catch (error) {
            console.error('Form submission error:', error);
            
            // Show user-friendly error message
            let errorMessage = 'Failed to create ticket. Please try again.';
            if (error.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            
            addToast({
                title: "Error",
                description: errorMessage,
                variant: "error"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset form
    const handleReset = () => {
        reset(defaultValues);
        setUploadedFiles([]);
    };

    // Get file icon
    const getFileIcon = (type) => {
        if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
        return <FileText className="w-4 h-4" />;
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 sm:px-4 md:px-6 space-y-3"
        >
            {/* Page Header */}
            <motion.div
                variants={itemVariants}
                className=" "
            >
                <h1 className="text-xl sm:text-2xl  font-bold text-gray-900 uppercase tracking-wide">
                    Create New Ticket
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                    Fill out the form below to create a new support ticket
                </p>
            </motion.div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8 max-w-7xl mx-auto px-2 xs:px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-6 lg:gap-8">
                    {/* Main Form Section */}
                    <motion.div
                        variants={itemVariants}
                        className="lg:col-span-2 bg-white rounded-lg sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
                    >
                        <h3 className="text-sm xs:text-base sm:text-lg lg:text-xl font-semibold tracking-wide p-2 xs:p-3 sm:p-4 lg:p-6 flex items-center gap-1.5 xs:gap-2 border-b border-gray-200 bg-gray-50">
                            <Settings className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                            <span className="truncate">Ticket Information</span>
                        </h3>

                        <div className="p-2 xs:p-3 sm:p-4 lg:p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 lg:gap-6">
                                {/* Ticket Code will be auto-generated */}

                                {/* Controller No */}
                                <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-2 2xl:col-span-2 space-y-1 xs:space-y-1.5 sm:space-y-2">
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700">
                                        Controller No *
                                    </label>
                                    <div className="flex   gap-1.5 xs:gap-2">
                                        <div className="flex-1 min-w-0">
                                            <input
                                                {...register('controllerNo')}
                                                className={`w-full px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 lg:py-3 border rounded-md xs:rounded-lg text-xs xs:text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.controllerNo ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                    }`}
                                                placeholder="Controller Number"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleFetchControllerDetails();
                                                    }
                                                }}
                                            />
                                        </div>
                                        <motion.button
                                            type="button"
                                            onClick={handleFetchControllerDetails}
                                            disabled={!controllerNo || controllerNo.length < 3 || isFetchingController}
                                            whileHover={{ scale: !isFetchingController ? 1.02 : 1 }}
                                            whileTap={{ scale: !isFetchingController ? 0.98 : 1 }}
                                            className={`flex-shrink-0 px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 lg:py-3 rounded-md xs:rounded-lg text-xs sm:text-sm lg:text-base font-medium transition-all duration-200 whitespace-nowrap min-w-[70px] xs:min-w-[90px] sm:min-w-[110px] ${
                                                controllerNo && controllerNo.length >= 3 && !isFetchingController
                                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            }`}
                                        >
                                            {isFetchingController ? (
                                                <div className="flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-2">
                                                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                                                    <span className="hidden xs:inline text-xs sm:text-sm">Fetching...</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs sm:text-sm">Fetch</span>
                                            )}
                                        </motion.button>
                                    </div>
                                    {errors.controllerNo && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-red-600 text-sm flex items-center gap-1"
                                        >
                                            <AlertCircle className="w-4 h-4" />
                                            {errors.controllerNo.message}
                                        </motion.p>
                                    )}
                                    {!controllerError && !isFetchingController && controllerNo && controllerNo.length < 3 && (
                                        <p className="text-gray-500 text-xs">
                                            Enter controller number and click "Fetch Details" to auto-fill product information
                                        </p>
                                    )}
                                    {controllerError && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-orange-600 text-sm flex items-center gap-1"
                                        >
                                            <AlertCircle className="w-4 h-4" />
                                            {controllerError}
                                        </motion.p>
                                    )}
                                    {controllerNo && controllerNo.length >= 3 && !isFetchingController && !controllerError && watchedValues.imei && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-green-600 text-sm"
                                        >
                                            <p className="flex items-center gap-1 mb-1">
                                                <CheckCircle className="w-4 h-4" />
                                                Controller details fetched and auto-filled successfully
                                            </p>
                                            
                                        </motion.div>
                                    )}
                                </motion.div>

                                {/* IMEI */}
                                <motion.div variants={itemVariants} className="space-y-1.5 sm:space-y-2">
                                    <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700">
                                        IMEI
                                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Auto-filled</span>
                                    </label>
                                    <input
                                        {...register('imei')}
                                        className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 border rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.imei ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            }`}
                                        placeholder="IMEI"
                                    />
                                    <p className="text-xs text-amber-600 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Please verify the controller number before submitting
                                    </p>
                                    {errors.imei && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-red-600 text-xs sm:text-sm flex items-center gap-1"
                                        >
                                            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                            {errors.imei.message}
                                        </motion.p>
                                    )}
                                </motion.div>

                                {/* HP */}
                                <motion.div variants={itemVariants} className="space-y-1.5 sm:space-y-2">
                                    <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700">
                                        HP
                                        {watchedValues.hp && controllerNo && (
                                            <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Auto-filled</span>
                                        )}
                                    </label>
                                    <input
                                        {...register('hp')}
                                        className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 border rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.hp ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            }`}
                                        placeholder="HP"
                                    />
                                    {errors.hp && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-red-600 text-xs sm:text-sm flex items-center gap-1"
                                        >
                                            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                            {errors.hp.message}
                                        </motion.p>
                                    )}
                                </motion.div>

                                {/* Motor Type */}
                                <motion.div variants={itemVariants} className="space-y-1 xs:space-y-1.5 sm:space-y-2">
                                    <label className="flex items-center gap-1.5 xs:gap-2 text-xs sm:text-sm font-medium text-gray-700">
                                        <span className="truncate">Motor Type *</span>
                                        <span className="text-xs text-blue-600 bg-blue-50 px-1 xs:px-1.5 py-0.5 rounded flex-shrink-0">Auto-filled</span>
                                    </label>
                                    <input
                                        {...register('motorType')}
                                        className={`w-full px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 lg:py-3 border rounded-md xs:rounded-lg text-xs xs:text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.motorType ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            }`}
                                        placeholder="Motor Type"
                                    />
                                    {errors.motorType && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-red-600 text-xs sm:text-sm flex items-center gap-1"
                                        >
                                            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                            {errors.motorType.message}
                                        </motion.p>
                                    )}
                                </motion.div>

                               
                                {/* Priority */}
                                <motion.div variants={itemVariants} className="space-y-1 xs:space-y-1.5 sm:space-y-2">
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700">
                                        Priority *
                                    </label>
                                    <select
                                        {...register('priority')}
                                        className={`w-full px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 lg:py-3 border rounded-md xs:rounded-lg text-xs xs:text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.priority ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            }`}
                                    >
                                        {priorityOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.priority && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-red-600 text-xs sm:text-sm flex items-center gap-1"
                                        >
                                            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                            {errors.priority.message}
                                        </motion.p>
                                    )}
                                </motion.div>

                                {/* Project */}
                                <motion.div variants={itemVariants} className="space-y-1 xs:space-y-1.5 sm:space-y-2">
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700">
                                        Project *
                                    </label>
                                    <select
                                        {...register('project')}
                                        className={`w-full px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 lg:py-3 border rounded-md xs:rounded-lg text-xs xs:text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.project ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value="">Select Project</option>
                                        <option value="project1">Project 1</option>
                                        <option value="project2">Project 2</option>
                                        <option value="project3">Project 3</option>
                                    </select>
                                    {errors.project && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-red-600 text-xs sm:text-sm flex items-center gap-1"
                                        >
                                            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                            {errors.project.message}
                                        </motion.p>
                                    )}
                                </motion.div>

                                {/* Customer Name */}
                                <motion.div variants={itemVariants} className="space-y-1 xs:col-span-1 sm:col-span-2 lg:col-span-1 2xl:col-span-2  xs:space-y-1.5 sm:space-y-2">
                                    <label className="flex items-center gap-1 xs:gap-1.5 text-xs sm:text-sm font-medium text-gray-700">
                                        <User className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" />
                                        <span className="truncate">Customer Name *</span>
                                        {watchedValues.customerName && controllerNo && (
                                            <span className="text-xs text-blue-600 bg-blue-50 px-1 xs:px-1.5 py-0.5 rounded">Auto-filled</span>
                                        )}
                                    </label>
                                    <input
                                        {...register('customerName')}
                                        className={`w-full px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 lg:py-3 border rounded-md xs:rounded-lg text-xs xs:text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.customerName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            }`}
                                        placeholder="Customer Name"
                                    />
                                    {errors.customerName && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-red-600 text-xs sm:text-sm flex items-center gap-1"
                                        >
                                            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                            {errors.customerName.message}
                                        </motion.p>
                                    )}
                                </motion.div>

                            </div>

                            {/* Location Information */}
                            <div className="mt-3 xs:mt-4 sm:mt-6 lg:mt-8">
                                <h4 className="text-xs xs:text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1.5 xs:mb-2 sm:mb-3 lg:mb-4 flex items-center gap-1.5 xs:gap-2">
                                    <MapPin className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                                    <span className="truncate">Location Information</span>
                                </h4>
                                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 xs:gap-3 sm:gap-4 lg:gap-6">
                                    {/* State */}
                                    <motion.div variants={itemVariants} className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700">
                                            State *
                                        </label>
                                        <select
                                            {...register('state')}
                                            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 border rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.state ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                }`}
                                        >
                                            <option value="">Select State</option>
                                            <option value="andhra-pradesh">Andhra Pradesh</option>
                                            <option value="arunachal-pradesh">Arunachal Pradesh</option>
                                            <option value="assam">Assam</option>
                                            <option value="bihar">Bihar</option>
                                            <option value="chhattisgarh">Chhattisgarh</option>
                                            <option value="goa">Goa</option>
                                            <option value="gujarat">Gujarat</option>
                                            <option value="haryana">Haryana</option>
                                            <option value="himachal-pradesh">Himachal Pradesh</option>
                                            <option value="jharkhand">Jharkhand</option>
                                            <option value="karnataka">Karnataka</option>
                                            <option value="kerala">Kerala</option>
                                            <option value="madhya-pradesh">Madhya Pradesh</option>
                                            <option value="maharashtra">Maharashtra</option>
                                            <option value="manipur">Manipur</option>
                                            <option value="meghalaya">Meghalaya</option>
                                            <option value="mizoram">Mizoram</option>
                                            <option value="nagaland">Nagaland</option>
                                            <option value="odisha">Odisha</option>
                                            <option value="punjab">Punjab</option>
                                            <option value="rajasthan">Rajasthan</option>
                                            <option value="sikkim">Sikkim</option>
                                            <option value="tamil-nadu">Tamil Nadu</option>
                                            <option value="telangana">Telangana</option>
                                            <option value="tripura">Tripura</option>
                                            <option value="uttar-pradesh">Uttar Pradesh</option>
                                            <option value="uttarakhand">Uttarakhand</option>
                                            <option value="west-bengal">West Bengal</option>
                                            <option value="delhi">Delhi</option>
                                        </select>
                                        {errors.state && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-red-600 text-xs sm:text-sm flex items-center gap-1"
                                            >
                                                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                                {errors.state.message}
                                            </motion.p>
                                        )}
                                    </motion.div>

                                    {/* Block */}
                                    <motion.div variants={itemVariants} className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700">
                                            Block
                                        </label>
                                        <input
                                            {...register('block')}
                                            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.block ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                }`}
                                            placeholder="Block"
                                        />
                                        {errors.block && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-red-600 text-sm flex items-center gap-1"
                                            >
                                                <AlertCircle className="w-4 h-4" />
                                                {errors.block.message}
                                            </motion.p>
                                        )}
                                    </motion.div>

                                    {/* Village */}
                                    <motion.div variants={itemVariants} className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700">
                                            Village
                                        </label>
                                        <input
                                            {...register('village')}
                                            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.village ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                }`}
                                            placeholder="Village"
                                        />
                                        {errors.village && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-red-600 text-sm flex items-center gap-1"
                                            >
                                                <AlertCircle className="w-4 h-4" />
                                                {errors.village.message}
                                            </motion.p>
                                        )}
                                    </motion.div>
                                </div>
                            </div>

                            {/* Fault Information */}
                            <div className="mt-3 xs:mt-4 sm:mt-6 lg:mt-8">
                                <h4 className="text-xs xs:text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1.5 xs:mb-2 sm:mb-3 lg:mb-4 flex items-center gap-1.5 xs:gap-2">
                                    <FileWarning className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                                    <span className="truncate">Fault Information</span>
                                </h4>
                                <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2 gap-2 xs:gap-3 sm:gap-4 lg:gap-6">
                                    {/* Fault Type */}
                                    <motion.div variants={itemVariants} className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700">
                                            Fault Type *
                                        </label>
                                        <select
                                            {...register('faultType')}
                                            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 border rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.faultType ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                }`}
                                        >
                                            <option value="">Select Fault Type</option>
                                            {faultTypeOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.faultType && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-red-600 text-xs sm:text-sm flex items-center gap-1"
                                            >
                                                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                                {errors.faultType.message}
                                            </motion.p>
                                        )}
                                    </motion.div>

                                    {/* Fault Code */}
                                    <motion.div variants={itemVariants} className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700">
                                            Fault Code
                                        </label>
                                        <input
                                            {...register('faultCode')}
                                            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 border rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.faultCode ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                }`}
                                            placeholder="e.g., ERR001"
                                        />
                                        {errors.faultCode && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-red-600 text-xs sm:text-sm flex items-center gap-1"
                                            >
                                                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                                {errors.faultCode.message}
                                            </motion.p>
                                        )}
                                    </motion.div>

                                    {/* Description */}
                                    <motion.div variants={itemVariants} className="xs:col-span-1 sm:col-span-2 lg:col-span-1 2xl:col-span-2 space-y-1 xs:space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700">
                                            Fault detail *
                                        </label>
                                        <textarea
                                            {...register('description')}
                                            rows={2.5}
                                            className={`w-full px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 lg:py-3 border rounded-md xs:rounded-lg text-xs xs:text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none ${errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                }`}
                                            placeholder="Describe the issue in detail..."
                                        />
                                        {errors.description && (
                                            <motion.p
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-red-600 text-xs sm:text-sm flex items-center gap-1"
                                            >
                                                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                                {errors.description.message}
                                            </motion.p>
                                        )}
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* File Upload Section */}
                    <motion.div
                        variants={itemVariants}
                        className="lg:col-span-1 bg-white rounded-lg sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
                    >
                        <h3 className="text-sm xs:text-base sm:text-lg lg:text-xl font-semibold tracking-wide p-2 xs:p-3 sm:p-4 lg:p-6 flex items-center gap-1.5 xs:gap-2 border-b border-gray-200 bg-gray-50">
                            <Upload className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                            <span className="truncate">Attachments (Optional)</span>
                        </h3>

                        <div className="p-2 xs:p-3 sm:p-4 lg:p-6">
                            {/* Drop Zone */}
                            <motion.div
                                onDragEnter={onDragEnter}
                                onDragLeave={onDragLeave}
                                onDragOver={onDragOver}
                                onDrop={onDrop}
                                whileHover={{ scale: 1.01 }}
                                className={`relative border-2 border-dashed rounded-xl p-4 sm:p-6 lg:p-8 text-center transition-all duration-300 ${isDragActive
                                        ? 'border-blue-400 bg-blue-50'
                                        : 'border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*,.pdf,.doc,.docx,.txt"
                                    onChange={(e) => handleFileUpload(e.target.files)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <Upload className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-gray-400 mx-auto mb-2 sm:mb-3 lg:mb-4" />
                                <p className="text-xs sm:text-sm lg:text-base font-medium text-gray-900 mb-1 sm:mb-2">
                                    {isDragActive ? 'Drop files here' : 'Drop files here or click to browse'}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500 px-1 sm:px-2">
                                    Support for images, PDF, DOC, DOCX, TXT files. Max 5MB per file, 5 files maximum.
                                </p>
                            </motion.div>

                            {/* Uploaded Files */}
                            <AnimatePresence>
                                {uploadedFiles.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-6"
                                    >
                                        <h4 className="text-md font-medium text-gray-900 mb-3">
                                            Uploaded Files ({uploadedFiles.length})
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            {uploadedFiles.map((file) => (
                                                <motion.div
                                                    key={file.id}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    className="relative bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                                                >
                                                    {file.preview && (
                                                        <div className="aspect-video mb-3 rounded-lg overflow-hidden bg-gray-100">
                                                            <img
                                                                src={file.preview}
                                                                alt={file.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 mt-1">
                                                            {getFileIcon(file.type)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {file.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {formatFileSize(file.size)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => removeFile(file.id)}
                                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </motion.button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {errors.attachments && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-600 text-sm flex items-center gap-1 mt-4"
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.attachments.message}
                                </motion.p>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Debug Info - Remove in production 
                {import.meta.env.MODE === 'development' && (
                    <motion.div
                        variants={itemVariants}
                        className="bg-gray-100 p-4 rounded-lg mt-6"
                    >
                        <h4 className="text-sm font-semibold mb-2">Debug Info:</h4>
                        <p className="text-xs">Form Valid: {isValid ? 'Yes' : 'No'}</p>
                        <p className="text-xs">Is Dirty: {isDirty ? 'Yes' : 'No'}</p>
                        <p className="text-xs">Is Submitting: {isSubmitting ? 'Yes' : 'No'}</p>
                        <p className="text-xs">Ticket Loading: {ticketLoading ? 'Yes' : 'No'}</p>
                        <p className="text-xs">Ticket Error: {ticketError || 'None'}</p>
                        <p className="text-xs">Submit Disabled: {(!isValid || isSubmitting || ticketLoading) ? 'Yes' : 'No'}</p>
                        <p className="text-xs">Errors: {Object.keys(errors).length}</p>
                        {Object.keys(errors).length > 0 && (
                            <div className="mt-2">
                                <p className="text-xs font-medium">Validation Errors:</p>
                                {Object.entries(errors).map(([field, error]) => (
                                    <p key={field} className="text-xs text-red-600">
                                        {field}: {error?.message}
                                    </p>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-2 mt-2">
                            <button 
                                type="button"
                                onClick={() => console.log('Current values:', getValues())}
                                className="px-3 py-1 bg-blue-500 text-white text-xs rounded"
                            >
                                Log Form Values
                            </button>
                            <button 
                                type="button"
                                onClick={() => {
                                    // ticketCode will be auto-generated
                                    setValue('customerName', ''); // Clear to test auto-fill
                                    setValue('controllerNo', '251010147290011');
                                    setValue('state', ''); // Clear to test auto-fill
                                    setValue('district', ''); // Clear to test auto-fill
                                    setValue('faultType', 'Motor Not Running');
                                    setValue('faultCode', 'ERR001');
                                    setValue('description', 'This is a test description for the ticket form validation.');
                                    setValue('priority', 'medium');
                                    setValue('category', 'hardware');
                                    setValue('motorType', ''); // Clear to test auto-fill
                                    setValue('imei', ''); // Clear to test auto-fill
                                    setValue('hp', ''); // Clear to test auto-fill
                                    setControllerError(''); // Clear any error
                                }}
                                className="px-3 py-1 bg-green-500 text-white text-xs rounded"
                            >
                                Fill Test Data (with real serial)
                            </button>
                            <button 
                                type="button"
                                onClick={async () => {
                                    try {
                                        const values = getValues();
                                        await ticketFormSchema.validate(values, { abortEarly: false });
                                        console.log('Schema validation passed!');
                                    } catch (error) {
                                        console.log('Schema validation failed:', error.errors);
                                    }
                                }}
                                className="px-3 py-1 bg-purple-500 text-white text-xs rounded"
                            >
                                Test Schema
                            </button>
                            <button 
                                type="button"
                                onClick={() => handleFormSubmit(getValues())}
                                className="px-3 py-1 bg-red-500 text-white text-xs rounded"
                            >
                                Force Submit
                            </button>
                            <button 
                                type="button"
                                onClick={() => {
                                    const token = sessionStorage.getItem('token');
                                    const user = sessionStorage.getItem('user');
                                    console.log('🔐 Auth Debug:', {
                                        hasToken: !!token,
                                        tokenLength: token?.length,
                                        tokenPreview: token?.substring(0, 30) + '...',
                                        hasUser: !!user,
                                        userInfo: user ? JSON.parse(user) : null
                                    });
                                }}
                                className="px-3 py-1 bg-purple-500 text-white text-xs rounded"
                            >
                                Check Auth
                            </button>
                        </div>
                    </motion.div>
                )}
*/}
                {/* Action Buttons */}
                <motion.div
                    variants={itemVariants}
                    className="flex gap-2 sm:gap-3 lg:gap-4 justify-start mb-3 sm:mb-4 lg:mb-5 px-4 sm:px-6 lg:px-8"
                >
                    <motion.button
                        type="button"
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={handleReset}
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-lg text-xs sm:text-sm lg:text-base text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
                    >
                        <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                        Reset
                    </motion.button>

                    <NavLink to={"/tickets"} className=" ">
                        <motion.button
                            type="button"
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={onCancel}
                            className="flex items-center w-full xs:w-auto justify-center gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-lg text-xs sm:text-sm lg:text-base text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
                        >
                            <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            Cancel
                        </motion.button>
                    </NavLink>
                    <motion.button
                        type="submit"
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        disabled={!isValid || isSubmitting || ticketLoading}
                        className={`flex ms-auto items-center justify-center gap-2 text-nowrap px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-3 rounded-lg text-xs sm:text-sm lg:text-base font-medium transition-all duration-200 min-w-[120px] sm:min-w-[140px] ${isValid && !isSubmitting && !ticketLoading
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        title={!isValid ? 'Please fill all required fields correctly' : 'Submit ticket'}
                    >
                        {(isSubmitting || ticketLoading) ? (
                            <>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                />
                                Submitting...
                            </>
                        ) : (
                            <div className='flex items-center gap-2'>
                                <Save className="w-4 h-4" />
                                Create Ticket
                            </div>
                        )}
                    </motion.button>
                </motion.div>
            </form>
        </motion.section>
    );
}