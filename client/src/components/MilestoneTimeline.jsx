import { useState, useEffect, useMemo } from 'react';
import { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    CheckCircle,
    Circle,
    Clock,
    AlertCircle,
    FileText,
    ChevronRight,
    AlertTriangle,
    Lock,
    Camera,
    ArrowRight,
    Image as ImageIcon,
    X,
    Download,
    Eye
} from 'lucide-react';
import moment from 'moment';
import { useAuth } from '../lib/hooks/useAuth';
import { useToast } from './ui/toast';
import axios from 'axios';
import MilestoneActionButton from './MilestoneActionButton';
import { SpareRequestForm } from './ui/spareRequestForm';
import { API_URL } from '../lib/constants/api';
import PhotoUploadModal from './PhotoUploadModal';

// Role-based permissions - matches backend milestoneConfig.js
const STAGE_ROLE_PERMISSIONS = {
    // ticket creation / field actions
    TICKET_RAISED: ['CUSTOMER_FIELD_ENGINEER', 'MACSOFT_ADMIN'],
    REQUEST_CLEARED_AT_FIELD: ['CUSTOMER_FIELD_ENGINEER', 'MACSOFT_ADMIN'],

    // assigning / submitting to service centre (image shows Macsoft roles + support/head)
    SERVICE_CENTER_ASSIGNED: ['MACSOFT_SUPPORT', 'MACSOFT_ADMIN', 'MACSOFT_HEAD'],
    SENT_TO_SERVICE_CENTER: ['MACSOFT_SUPPORT', 'MACSOFT_ADMIN', 'MACSOFT_HEAD', 'CUSTOMER_SERVICE_HEAD'],
    SUBMITTED_TO_SERVICE_CENTER: ['CUSTOMER_FIELD_ENGINEER', 'CUSTOMER_SERVICE_HEAD', 'MACSOFT_ADMIN'],

    // service centre arrival / work
    RECEIVED_AT_SERVICE_CENTER: ['MACSOFT_HEAD', 'MACSOFT_SUPPORT', 'SERVICE_CENTER_TECHNICIAN', 'MACSOFT_ADMIN'],
    DIAGNOSIS_IN_PROGRESS: ['MACSOFT_HEAD', 'MACSOFT_SUPPORT', 'SERVICE_CENTER_TECHNICIAN', 'MACSOFT_ADMIN'],

    // spares workflow
    SPARE_REQUESTED: ['MACSOFT_HEAD', 'MACSOFT_SUPPORT', 'SERVICE_CENTER_TECHNICIAN', 'MACSOFT_ADMIN', 'CUSTOMER_SERVICE_HEAD'],
    SPARE_APPROVED: ['MACSOFT_HEAD', 'MACSOFT_ADMIN'],

    // repair / replacement
    REPAIR_IN_PROGRESS: ['MACSOFT_HEAD', 'MACSOFT_SUPPORT', 'SERVICE_CENTER_TECHNICIAN', 'MACSOFT_ADMIN'],
    REPLACEMENT_IN_PROGRESS: ['MACSOFT_HEAD', 'MACSOFT_SUPPORT', 'SERVICE_CENTER_TECHNICIAN', 'MACSOFT_ADMIN'],
    REPAIRED: ['MACSOFT_HEAD', 'MACSOFT_SUPPORT', 'SERVICE_CENTER_TECHNICIAN', 'MACSOFT_ADMIN'],

    // dispatch / field delivery / final clearance
    READY_FOR_DISPATCH: ['MACSOFT_HEAD', 'MACSOFT_SUPPORT', 'SERVICE_CENTER_TECHNICIAN', 'MACSOFT_ADMIN'],
    DELIVERED_TO_FIELD: ['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT', 'SERVICE_CENTER_TECHNICIAN'],
    FIELD_CLEARANCE_APPROVED: ['MACSOFT_HEAD', 'MACSOFT_ADMIN']
};

// Utility function to check if user role can transition to a specific stage
const canUserTransitionToStage = (userRole, targetStage) => {
    const allowedRoles = STAGE_ROLE_PERMISSIONS[targetStage];
    return allowedRoles ? allowedRoles.includes(userRole) : false;
};

// Utility function to extract detailed error messages from API responses
const getErrorMessage = (error) => {
    if (error.response) {
        // API responded with error status
        if (error.response.data) {
            if (error.response.data.error) {
                return error.response.data.error;
            } else if (error.response.data.message) {
                return error.response.data.message;
            } else if (typeof error.response.data === 'string') {
                return error.response.data;
            }
        }
    } else if (error.message) {
        // Network or other error
        return error.message;
    }
    return 'An unexpected error occurred';
};

// Milestone Attachment Component
const ERROR_TOAST_ID = 'milestone-error-toast';
const MilestoneAttachmentItem = ({ attachment, token, addToast }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [imageError, setImageError] = useState(false);

    const isImage = attachment.fileType?.startsWith('image/') ||
        attachment.fileName?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

    const getFileExtension = () => {
        if (attachment.fileType) {
            return attachment.fileType.split('/')[1]?.slice(0, 4).toUpperCase();
        }
        const extension = attachment.fileName?.split('.').pop()?.toUpperCase();
        return extension || 'FILE';
    };

    const handleDownload = async (e) => {
        e.stopPropagation();
        setIsDownloading(true);

        try {
            const baseUrl = import.meta.env.VITE_API_URL;
            let downloadUrl;

            // Use dedicated download endpoint if attachment has an ID
            if (attachment.id) {
                downloadUrl = `${baseUrl}/api/attachments/download/${attachment.id}`;
            } else {
                // Fallback to direct file URL
                downloadUrl = `${baseUrl}${attachment.fileUrl}`;
            }


            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(downloadUrl, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                // Try fallback method - direct link
                if (attachment.fileUrl) {
                    const fallbackUrl = `${baseUrl}${attachment.fileUrl}`;
                    window.open(fallbackUrl, '_blank');
                    if (addToast) addToast({
                        title: `Opening ${attachment.fileName}`,
                        description: 'File opened in new tab',
                        variant: 'success'
                    });
                    return;
                }
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = attachment.fileName || 'milestone-attachment';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            if (addToast) addToast({
                title: `Downloaded ${attachment.fileName}`,
                description: 'File saved to your downloads folder',
                variant: 'success'
            });
        } catch (error) {
            console.error('Download failed:', error);

            // Final fallback - try direct URL in new tab
            if (attachment.fileUrl) {
                const baseUrl = import.meta.env.VITE_API_URL;
                const fallbackUrl = `${baseUrl}${attachment.fileUrl}`;
                window.open(fallbackUrl, '_blank');
                if (addToast) addToast({
                    title: `Opening ${attachment.fileName}`,
                    description: 'File opened in new tab',
                    variant: 'success'
                });
            } else {
                if (addToast) {
                    if (addToast.dismiss) addToast.dismiss(ERROR_TOAST_ID);
                    addToast({
                        title: 'Download failed',
                        description: 'Please check your connection and try again',
                        variant: 'error',
                        toastId: ERROR_TOAST_ID,
                        autoClose: 5000,
                        onClose: () => {
                            if (addToast.dismiss) addToast.dismiss(ERROR_TOAST_ID);
                        }
                    });
                }
                else console.error('Download failed');
            }
        } finally {
            setIsDownloading(false);
        }
    };

    const [showPreview, setShowPreview] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [showImage, setShowImage] = useState(false);
    const previewTimeout = useRef(null);
    const handlePreview = () => {
        setShowPreview(true);
        setPreviewLoading(true);
        setShowImage(false);
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <>
            <motion.div
                whileHover={{ scale: 1.02 }}
                className="group flex items-center gap-2 p-2 bg-gray-50 rounded border hover:bg-gray-100 transition-colors"
            >
                {isImage && !imageError ? (
                    <div className="relative w-12 h-12 flex-shrink-0">
                        <img
                            src={`${import.meta.env.VITE_API_URL}${attachment.fileUrl}`}
                            alt={attachment.fileName}
                            className="w-full h-full object-cover rounded"
                            onError={() => setImageError(true)}
                        />
                    </div>
                ) : (
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-gray-200 rounded">
                        <span className="text-xs font-medium text-gray-600">{getFileExtension()}</span>
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate text-sm">{attachment.fileName}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        {attachment.fileSize && (
                            <span>{formatFileSize(attachment.fileSize)}</span>
                        )}
                        {attachment.createdAt && (
                            <span>{moment(attachment.createdAt).fromNow()}</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 transition-opacity">
                    {isImage && (
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handlePreview}
                            className="p-1 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Preview"
                        >
                            <Eye size={14} />
                        </motion.button>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className={`p-1 transition-colors ${isDownloading
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-blue-600 hover:text-blue-800 cursor-pointer'
                            }`}
                        title={isDownloading ? 'Downloading...' : 'Download'}
                    >
                        {isDownloading ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full"
                            />
                        ) : (
                            <Download size={14} />
                        )}
                    </motion.button>
                </div>
            </motion.div>
            {/* Photo Preview Dialog */}
            {showPreview && isImage && !imageError && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed top-0 left-0 w-full h-full z-50 flex items-center justify-center bg-black/15"
                    onClick={() => setShowPreview(false)}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.25, delay: 0.05 }}
                        className="relative rounded-lg p-4 max-w-full max-h-full flex flex-col items-center justify-center"
                        onClick={e => e.stopPropagation()}
                    >{!previewLoading && (
                        <button
                            className="absolute top-0 right-2 text-white bg-red-500 rounded-lg text-xl font-bold cursor-pointer"
                            onClick={() => setShowPreview(false)}
                            aria-label="Close preview"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    )}
                        <div className="flex items-center justify-center w-full h-fu">
                            {previewLoading && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.5 }}
                                    className="flex items-center justify-center h-screen w-full z-10"
                                >
                                    <div className="animate-spin rounded-full sm:h-42 sm:w-42 border-b-2 border-blue-600"></div>
                                </motion.div>
                            )}
                            <motion.img
                                src={`${import.meta.env.VITE_API_URL}${attachment.fileUrl}`}
                                alt={attachment.fileName}
                                className="max-w-[90vw] max-h-[80vh] rounded border"
                                style={{ objectFit: 'contain', display: showImage ? 'block' : 'none' }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: showImage ? 1 : 0 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                                onLoad={() => {
                                    setTimeout(() => {
                                        setPreviewLoading(false);
                                        setShowImage(true);
                                    }, 250);
                                }}
                                onError={() => { setPreviewLoading(false); setImageError(true); }}
                            />
                        </div>
                        <div className="mt-2 text-sm text-gray-700 text-center break-all">
                            {/*   {attachment.fileName} */}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </>
    );
};

const MilestoneStatus = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    DONE: 'DONE',
    BLOCKED: 'BLOCKED',
};

// Milestone configuration (matches backend milestoneConfig.js)
const MILESTONE_CONFIG = {
    TICKET_RAISED: {
        label: 'Ticket Raised',
        description: 'Initial ticket raised by field engineer',
        photoRequired: false,
        order: 0,
    },
    SERVICE_CENTER_ASSIGNED: {
        label: 'Service Center Assigned',
        description: '',
        photoRequired: false,
        order: 1,
    },
    REQUEST_CLEARED_AT_FIELD: {
        label: 'Request Cleared at Field',
        description: 'Fault cleared on-site by field engineer',
        photoRequired: true,
        minPhotos: 1,
        order: 2,
        isFinal: true,
    },
    SENT_TO_SERVICE_CENTER: {
        label: 'Submit to Service Center',
        description: 'Controller submission request raised submit to service centre',
        photoRequired: false,
        order: 3,
    },
    SUBMITTED_TO_SERVICE_CENTER: {
        label: 'Submitted to Service Center',
        description: 'Controller submitted to service center (4 specific photos required)',
        photoRequired: true,
        minPhotos: 4,
        requiredPhotos: ['Controller Front', 'Controller Bottom', 'Full View Open', 'MCB Close Up'],
        order: 4,
    },
    RECEIVED_AT_SERVICE_CENTER: {
        label: 'Received at Service Center',
        description: 'Controller physically received at centre (requires prior submission acknowledgment, 4 specific photos required)',
        photoRequired: true,
        minPhotos: 4,
        requiredPhotos: ['Controller Front', 'Controller Bottom', 'Full View Open', 'MCB Close Up'],
        order: 5,
    },
    DIAGNOSIS_IN_PROGRESS: {
        label: 'Diagnosis in Progress',
        description: 'Diagnosis started to decide repair or replacement',
        photoRequired: false,
        order: 6,
    },
    REPAIR_IN_PROGRESS: {
        label: 'Repair in Progress',
        description: 'Controller repair initiated (no spares needed)',
        photoRequired: false,
        order: 7,
    },
    REPLACEMENT_IN_PROGRESS: {
        label: 'Replacement in Progress',
        description: 'Replacement initiated (may require spare parts)',
        photoRequired: false,
        order: 8,
    },
    SPARE_REQUESTED: {
        label: 'Spare Requested',
        description: 'Spare parts requested for replacement (photo required)',
        photoRequired: true,
        minPhotos: 1,
        order: 9,
    },
    SPARE_APPROVED: {
        label: 'Spare Approved',
        description: 'Spare request approved - replacement can continue',
        photoRequired: false,
        order: 10,
    },
    REPAIRED: {
        label: 'Repaired',
        description: 'Controller repaired or replaced successfully',
        photoRequired: false,
        order: 11,
    },
    READY_FOR_DISPATCH: {
        label: 'Ready for Dispatch',
        description: 'Controller ready for dispatch (photo required)',
        photoRequired: true,
        minPhotos: 1,
        order: 12,
    },
    DELIVERED_TO_FIELD: {
        label: 'Delivered',
        description: 'Controller delivered/dispatched',
        photoRequired: false,
        order: 13,
        isFinal: true,
    },
    FIELD_CLEARANCE_APPROVED: {
        label: 'Field Clearance Approved',
        description: 'Field clearance approved by Head (legacy)',
        photoRequired: false,
        order: 14,
        isFinal: true,
    },
};

const StatusIcon = ({ status }) => {
    const icons = {
        [MilestoneStatus.DONE]: <CheckCircle className="w-6 h-6 text-green-600" />,
        [MilestoneStatus.IN_PROGRESS]: <Clock className="w-6 h-6 text-blue-600 animate-pulse" />,
        [MilestoneStatus.PENDING]: <Circle className="w-6 h-6 text-gray-400" />,
        [MilestoneStatus.BLOCKED]: <AlertCircle className="w-6 h-6 text-red-600" />,
    };
    return icons[status] || icons[MilestoneStatus.PENDING];
};

const MilestoneCard = ({
    milestone,
    isActive,
    onTransition,
    onUpdateNotes,
    onBlock,
    handleMilestoneAction,
    token,
    addToast,
    user,
    allMilestones
}) => {
    const [showDetails, setShowDetails] = useState(isActive);
    const [showTransitionForm, setShowTransitionForm] = useState(false);
    const [showNotesForm, setShowNotesForm] = useState(false);
    const [notes, setNotes] = useState(milestone.notes || '');
    const [photos, setPhotos] = useState([]);
    const [blockReason, setBlockReason] = useState('');
    const [showBlockForm, setShowBlockForm] = useState(false);

    // Default handler if not provided
    const defaultMilestoneAction = (actionData) => {
        console.warn('handleMilestoneAction not provided. Action data:', actionData);
    };

    // Get config from MILESTONE_CONFIG using milestone.stage
    const config = MILESTONE_CONFIG[milestone.stage] || {
        label: milestone.stage,
        description: '',
        photoRequired: false,
        order: 0,
    };
    const isBlocked = milestone.status === MilestoneStatus.BLOCKED;

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        setPhotos(files);
    };

    const handleTransition = async () => {
        if (config.photoRequired && photos.length === 0) {
            alert(`This stage requires at least ${config.minPhotos || 1} photo(s)`);
            return;
        }

        await onTransition(milestone.stage, notes, photos);
        setShowTransitionForm(false);
        setNotes('');
        setPhotos([]);
    };

    const handleUpdateNotes = async () => {
        await onUpdateNotes(milestone.id, notes);
        setShowNotesForm(false);
    };

    const handleBlock = async () => {
        if (!blockReason.trim()) {
            alert('Please provide a reason for blocking');
            return;
        }
        await onBlock(milestone.id, blockReason);
        setShowBlockForm(false);
        setBlockReason('');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative pl-8 pb-8 ${milestone.status === MilestoneStatus.DONE ? 'opacity-75' : ''
                }`}
        >
            {/* Timeline line */}
            <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-200" />

            {/* Status icon */}
            <div className="absolute left-0 top-0 z-10 bg-white">
                <StatusIcon status={milestone.status} />
            </div>

            {/* Card */}
            <motion.div
                className={`ml-4 p-4 rounded-lg border-2 transition-all ${isActive
                    ? 'border-blue-500 bg-blue-50'
                    : milestone.status === MilestoneStatus.DONE
                        ? 'border-green-200 bg-green-50'
                        : isBlocked
                            ? 'border-red-200 bg-red-50'
                            : 'border-gray-200 bg-white'
                    }`}
            >
                {/* Header */}
                <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => setShowDetails(!showDetails)}
                >
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{config.label}</h3>
                            {isBlocked && <Lock className="w-4 h-4 text-red-600" />}
                            {config.photoRequired && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    Photo Required
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                        {milestone.startedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                                Started: {moment(milestone.startedAt).format('DD MMM YYYY, hh:mm A')}
                            </p>
                        )}
                        {milestone.completedAt && (
                            <p className="text-xs text-green-600 mt-1">
                                Completed: {moment(milestone.completedAt).format('DD MMM YYYY, hh:mm A')}
                            </p>
                        )}
                    </div>
                    <ChevronRight
                        className={`w-5 h-5 text-gray-400 transition-transform ${showDetails ? 'rotate-90' : ''
                            }`}
                    />
                </div>

                {/* Details */}
                <AnimatePresence>
                    {showDetails && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-4 space-y-3"
                        >
                            {/* Notes */}
                            {milestone.notes && (
                                <div className="p-3 bg-gray-50 rounded text-sm">
                                    <p className="font-medium text-gray-700">Notes:</p>
                                    <p className="text-gray-600 mt-1">{milestone.notes}</p>
                                </div>
                            )}

                            {/* Changed by */}
                            {milestone.changer && (
                                <p className="text-xs text-gray-500">
                                    Marked by: {milestone.changer.name} ({milestone.changer.role})
                                </p>
                            )}

                            {/* Attachments */}
                            {milestone.attachments && milestone.attachments.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">
                                        Attachments ({milestone.attachments.length}):
                                    </p>
                                    <div className="space-y-2">
                                        {milestone.attachments.map((attachment, index) => (
                                            <MilestoneAttachmentItem
                                                key={attachment.id || index}
                                                attachment={attachment}
                                                token={token}
                                                addToast={addToast}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                {/* Dynamic Milestone Action Button - Shows only for active milestone */}
                                {isActive && !isBlocked && (
                                    <MilestoneActionButton
                                        currentMilestone={milestone}
                                        onAction={handleMilestoneAction || defaultMilestoneAction}
                                        userRole={user?.role}
                                        allMilestones={allMilestones}
                                    />
                                )}
                            </div>

                            {/* Transition form */}
                            <AnimatePresence>
                                {showTransitionForm && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-4 bg-white border rounded space-y-3"
                                    >
                                        <h4 className="font-medium text-gray-900">Transition Details</h4>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Add notes (optional)"
                                            className="w-full p-2 border rounded text-sm"
                                            rows="3"
                                        />

                                        {config.photoRequired && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Upload Photos (Required - Min: {config.minPhotos || 1})
                                                </label>
                                                <div className="flex gap-2 mb-2">
                                                    <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer text-sm">
                                                        <ImageIcon className="w-4 h-4" />
                                                        Gallery
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            onChange={handlePhotoUpload}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                    <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-orange-300 rounded-lg text-orange-600 hover:border-orange-400 hover:text-orange-700 transition-colors cursor-pointer text-sm">
                                                        <Camera className="w-4 h-4" />
                                                        Camera
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            capture="environment"
                                                            onChange={handlePhotoUpload}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                </div>
                                                {photos.length > 0 && (
                                                    <p className="text-xs text-green-600 mt-1">
                                                        {photos.length} photo(s) selected
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleTransition}
                                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                            >
                                                Confirm Transition
                                            </button>
                                            <button
                                                onClick={() => setShowTransitionForm(false)}
                                                className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Notes form */}
                            <AnimatePresence>
                                {showNotesForm && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-4 bg-white border rounded space-y-3"
                                    >
                                        <h4 className="font-medium text-gray-900">Update Notes</h4>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Enter notes"
                                            className="w-full p-2 border rounded text-sm"
                                            rows="3"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleUpdateNotes}
                                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                            >
                                                Save Notes
                                            </button>
                                            <button
                                                onClick={() => setShowNotesForm(false)}
                                                className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Block form */}
                            <AnimatePresence>
                                {showBlockForm && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-4 bg-red-50 border border-red-200 rounded space-y-3"
                                    >
                                        <h4 className="font-medium text-red-900">Block Milestone</h4>
                                        <textarea
                                            value={blockReason}
                                            onChange={(e) => setBlockReason(e.target.value)}
                                            placeholder="Enter reason for blocking (required)"
                                            className="w-full p-2 border rounded text-sm"
                                            rows="3"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleBlock}
                                                className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                            >
                                                Block Milestone
                                            </button>
                                            <button
                                                onClick={() => setShowBlockForm(false)}
                                                className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
};

export const MilestoneTimeline = ({ ticketId, milestones: propMilestones, onMilestoneUpdate, onAction, ticketStatus }) => {
    const [milestones, setMilestones] = useState(propMilestones || []);
    const [availableTransitions, setAvailableTransitions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showTransitionModal, setShowTransitionModal] = useState(false);
    const [selectedTargetStage, setSelectedTargetStage] = useState(null);
    const [transitionNotes, setTransitionNotes] = useState('');
    const [transitionPhotos, setTransitionPhotos] = useState([]);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmDialogData, setConfirmDialogData] = useState(null);
    const [showSpareRequestModal, setShowSpareRequestModal] = useState(false);
    const [pendingSpareTransition, setPendingSpareTransition] = useState(null);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const { token, user } = useAuth();
    const { addToast } = useToast();
    // Update milestones when prop changes
    useEffect(() => {
        if (propMilestones && propMilestones.length > 0) {
            setMilestones(propMilestones);
        }
    }, [propMilestones]);

    // Get current milestone
    const currentMilestone = useMemo(() => {
        return milestones.find(m => m.status === 'IN_PROGRESS') || null;
    }, [milestones]);

    // Check if current milestone requires photos and has them
    const currentMilestoneNeedsPhotos = useMemo(() => {
        if (!currentMilestone) return false;

        // Stages that require photos
        const photoRequiredStages = [
            'SUBMITTED_TO_SERVICE_CENTER',
            'RECEIVED_AT_SERVICE_CENTER',
            'SPARE_REQUESTED',
            'READY_FOR_DISPATCH'
        ];

        if (!photoRequiredStages.includes(currentMilestone.stage)) {
            return false;
        }

        const photoCount = currentMilestone.attachments?.length || 0;
        return photoCount === 0;
    }, [currentMilestone]);

    // Filter milestones for closed tickets with CLEARANCE_AT_FIELD - MOVED BEFORE EARLY RETURNS
    const displayMilestones = useMemo(() => {
        if (!milestones || milestones.length === 0) return [];

        // Check if ticket is closed and has field clearance as the final milestone
        const isClosedByClearance = ticketStatus === 'closed' &&
            milestones.some(m => (m.stage === 'REQUEST_CLEARED_AT_FIELD' || m.stage === 'FIELD_CLEARANCE_APPROVED') && m.status === MilestoneStatus.DONE);

        if (isClosedByClearance) {
            // Show only accomplished milestones (DONE status)
            return milestones.filter(m => m.status === MilestoneStatus.DONE);
        }

        // For open tickets or closed by other means, show all milestones
        return milestones;
    }, [milestones, ticketStatus]);

    // Active milestone - MOVED BEFORE EARLY RETURNS
    const activeMilestone = useMemo(() => {
        return milestones.find(m => m.status === 'IN_PROGRESS' || m.status === 'BLOCKED') || null;
    }, [milestones]);

    // Check if user has any permissions for current milestone or transitions
    const userHasPermissions = useMemo(() => {
        if (!user?.role) return true; // Fallback to show UI if no role info

        // Check if user can access current milestone
        const canAccessCurrent = currentMilestone ? canUserTransitionToStage(user.role, currentMilestone.stage) : false;

        // Check if user has any available transitions (backend already filters by role)
        const hasTransitions = availableTransitions.length > 0;

        return canAccessCurrent || hasTransitions;
    }, [user?.role, currentMilestone, availableTransitions]);

    const fetchMilestones = async () => {
        if (!ticketId) return;

        try {
            setLoading(true);
            const baseUrl = API_URL;
            const url = `${baseUrl}/milestones/${ticketId}`;
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            setMilestones(response.data);
            if (onMilestoneUpdate) {
                onMilestoneUpdate(response.data);
            }
        } catch (error) {
            console.error('Error fetching milestones:', error);
            addToast({
                title: 'Failed to load milestones',
                description: getErrorMessage(error),
                variant: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableTransitions = async () => {
        if (!ticketId || !token) return;

        try {
            const baseUrl = API_URL;
            const url = `${baseUrl}/milestones/ticket/${ticketId}/available-transitions`;
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            setAvailableTransitions(response.data);
        } catch (error) {
            console.error('Error fetching available transitions:', error);
        }
    };

    useEffect(() => {
        if (ticketId && token) {
            fetchAvailableTransitions();
        }
    }, [ticketId, token]);

    // Handle spare request submission
    const handleSpareRequestSubmit = async (formData) => {
        try {

            // Get ticket data
            const baseUrl = API_URL;
            const ticketResponse = await axios.get(
                `${baseUrl}/tickets/${ticketId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            const ticketData = ticketResponse.data;
            // Prepare spare items data - convert product IDs from P001 format to integer
            const spareItems = formData.products.map(product => {
                // Extract numeric part from product ID (P001 -> 1, P002 -> 2, etc.)
                const productId = parseInt(product.productId.replace(/\D/g, ''), 10);

                return {
                    productId: productId,
                    quantity: product.quantity
                };
            });

            const requestData = {
                ticketCode: ticketData.ticketCode,
                spareItems,
                requestReason: formData.requestReason || 'Spare parts required',
                urgencyLevel: formData.urgencyLevel?.toUpperCase() || 'MEDIUM',
                expectedDelivery: formData.expectedDelivery,
                additionalNotes: formData.additionalNotes
            };
            // Submit spare request to API
            const response = await fetch(`${baseUrl}/spare-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to submit spare request');
            }

            // Close spare request modal
            setShowSpareRequestModal(false);

            // Show success notification
            addToast({
                title: 'Spare Request Submitted',
                description: `Request for ${spareItems.length} item(s) submitted and milestone updated automatically`,
                variant: 'success'
            });

            // Refresh milestones to show the updated state (backend handles the transition)
            await fetchMilestones();
            await fetchAvailableTransitions();

            // Clear pending transition since backend handles it
            setPendingSpareTransition(null);
        } catch (error) {
            console.error('❌ Error submitting spare request:', error);
            addToast({
                title: 'Submission Failed',
                description: error.message || 'Failed to submit spare request. Please try again.',
                variant: 'error'
            });
        }
    };

    const handleAddPhotos = async (photos) => {
        if (!photos || photos.length === 0) return;

        try {
            setUploadingPhotos(true);
            const baseUrl = API_URL;
            const formData = new FormData();
            photos.forEach((photo) => {
                formData.append('photos', photo);
            });
            await axios.post(
                `${baseUrl}/milestones/ticket/${ticketId}/add-photos`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            addToast({
                title: 'Photos Uploaded',
                description: 'Photos added to current milestone',
                variant: 'success'
            });
            await fetchMilestones();
        } catch (error) {
            console.error('Error uploading photos:', error);
            if (addToast) {
                if (addToast.dismiss) addToast.dismiss(ERROR_TOAST_ID);
                addToast({
                    title: 'Upload Failed',
                    description: getErrorMessage(error),
                    variant: 'error',
                    toastId: ERROR_TOAST_ID,
                    autoClose: 5000,
                    onClose: () => {
                        if (addToast.dismiss) addToast.dismiss(ERROR_TOAST_ID);
                    }
                });
            }
        } finally {
            setUploadingPhotos(false);
        }
    };

    const handleTransition = async () => {
        if (!selectedTargetStage) return;

        // Check if photos are required and validate
        const targetConfig = MILESTONE_CONFIG[selectedTargetStage];
        if (targetConfig?.photoRequired) {
            const minPhotos = targetConfig.minPhotos || 1;
            if (transitionPhotos.length < minPhotos) {
                addToast({
                    title: 'Photos Required',
                    description: `Please upload at least ${minPhotos} photo(s) for ${targetConfig.label}`,
                    variant: 'error'
                });
                return;
            }
        }

        try {
            const baseUrl = API_URL;
            const formData = new FormData();
            formData.append('targetStage', selectedTargetStage);
            if (transitionNotes) formData.append('notes', transitionNotes);
            transitionPhotos.forEach((photo) => {
                formData.append('photos', photo);
            });
            // Update current milestone
            const response = await axios.post(
                `${baseUrl}/milestones/ticket/${ticketId}/transition`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            const updatedMilestone = response.data;
            // Show appropriate success message based on target stage
            if (selectedTargetStage === 'REQUEST_CLEARED_AT_FIELD' || selectedTargetStage === 'FIELD_CLEARANCE_APPROVED') {
                addToast({
                    title: 'Ticket Closed',
                    description: 'Ticket has been successfully closed with field clearance',
                    variant: 'success'
                });
            } else {
                addToast({
                    title: 'Milestone Updated',
                    description: 'Successfully transitioned to new stage',
                    variant: 'success'
                });
            }
            // Create next milestone with IN_PROGRESS status
            if (updatedMilestone && updatedMilestone.id && updatedMilestone.ticketId) {
                const nextStage = updatedMilestone.nextStage || 'NEXT_STAGE';
                try {
                    await axios.post(
                        `${baseUrl}/milestones/create-next`,
                        {
                            ticketId: updatedMilestone.ticketId,
                            previousMilestoneId: updatedMilestone.id,
                            stage: nextStage,
                            status: 'IN_PROGRESS',
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        }
                    );
                    addToast({
                        title: 'Next Milestone Created',
                        description: 'A new milestone has been started.',
                        variant: 'success'
                    });
                } catch (err) {
                    if (addToast) {
                        if (addToast.dismiss) addToast.dismiss(ERROR_TOAST_ID);
                        addToast({
                            title: 'Next Milestone Creation Failed',
                            description: 'Could not create next milestone.',
                            variant: 'error',
                            toastId: ERROR_TOAST_ID,
                            autoClose: 5000,
                            onClose: () => {
                                if (addToast.dismiss) addToast.dismiss(ERROR_TOAST_ID);
                            }
                        });
                    }
                }
            }
            setShowTransitionModal(false);
            setSelectedTargetStage(null);
            setTransitionNotes('');
            setTransitionPhotos([]);
            await fetchMilestones();
            await fetchAvailableTransitions();
        } catch (error) {
            console.error('Error transitioning milestone:', error);
            if (addToast) {
                if (addToast.dismiss) addToast.dismiss(ERROR_TOAST_ID);
                addToast({
                    title: 'Transition Failed',
                    description: getErrorMessage(error),
                    variant: 'error',
                    toastId: ERROR_TOAST_ID,
                    autoClose: 5000,
                    onClose: () => {
                        if (addToast.dismiss) addToast.dismiss(ERROR_TOAST_ID);
                    }
                });
            }
        }
    };

    const handleUpdateNotes = async (milestoneId, notes) => {
        try {
            const baseUrl = API_URL;
            await axios.put(
                `${baseUrl}/milestones/${milestoneId}/notes`,
                { notes },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            addToast({
                title: 'Notes Updated',
                description: 'Milestone notes updated successfully',
                variant: 'success'
            });
            await fetchMilestones();
        } catch (error) {
            console.error('Error updating notes:', error);
            if (addToast) {
                if (addToast.dismiss) addToast.dismiss(ERROR_TOAST_ID);
                addToast({
                    title: 'Update Failed',
                    description: getErrorMessage(error),
                    variant: 'error',
                    toastId: ERROR_TOAST_ID,
                    autoClose: 5000,
                    onClose: () => {
                        if (addToast.dismiss) addToast.dismiss(ERROR_TOAST_ID);
                    }
                });
            }
        }
    };

    const handleBlock = async (milestoneId, reason) => {
        try {
            const baseUrl = API_URL;
            const response = await fetch(
                `${baseUrl}/milestones/${milestoneId}/block`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ reason }),
                }
            );

            if (!response.ok) throw new Error('Failed to block milestone');

            addToast({
                title: 'Milestone Blocked',
                description: 'Milestone has been blocked',
                variant: 'success'
            });
            await fetchMilestones();
        } catch (error) {
            console.error('Error blocking milestone:', error);
            if (addToast) {
                if (addToast.dismiss) addToast.dismiss(ERROR_TOAST_ID);
                addToast({
                    title: 'Block Failed',
                    description: getErrorMessage(error),
                    variant: 'error',
                    toastId: ERROR_TOAST_ID,
                    autoClose: 5000,
                    onClose: () => {
                        if (addToast.dismiss) addToast.dismiss(ERROR_TOAST_ID);
                    }
                });
            }
        }
    };

    const handleUnblock = async (milestoneId) => {
        try {
            const baseUrl = API_URL;
            const response = await fetch(
                `${baseUrl}/milestones/${milestoneId}/unblock`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) throw new Error('Failed to unblock milestone');

            addToast({
                title: 'Milestone Unblocked',
                description: 'Milestone has been unblocked',
                variant: 'success'
            });
            await fetchMilestones();
        } catch (error) {
            console.error('Error unblocking milestone:', error);
            if (addToast) {
                if (addToast.dismiss) addToast.dismiss(ERROR_TOAST_ID);
                addToast({
                    title: 'Unblock Failed',
                    description: getErrorMessage(error),
                    variant: 'error',
                    toastId: ERROR_TOAST_ID,
                    autoClose: 5000,
                    onClose: () => {
                        if (addToast.dismiss) addToast.dismiss(ERROR_TOAST_ID);
                    }
                });
            }
        }
    };

    // Handle milestone action with confirmation
    const handleMilestoneAction = (actionData) => {
        const { action, targetStage, requiresPhotos, currentStage } = actionData;

        // First, check if this action should be handled by the parent component
        if (action === 'service_center_assignment' || action === 'upload_photos') {
            if (onAction) {
                onAction(actionData);
            }
            return;
        }

        // Special handling for spare request actions - any role can create spare requests
        if (action === 'spare_request' || targetStage === 'SPARE_REQUESTED') {
            // All roles can create spare requests - no permission check needed

            // Show spare request form modal instead of direct transition
            setPendingSpareTransition({ targetStage, notes: transitionNotes });
            setShowSpareRequestModal(true);
            return;
        }

        // Define confirmation messages for different actions
        const confirmationMessages = {
            transition: {
                REQUEST_SUBMISSION: {
                    title: 'Submit to Service Center',
                    message: 'Submit to the service center?',
                    confirmText: 'Submit SEC'
                },
                SENT_TO_SERVICE_CENTER: {
                    title: 'Submit to service center',
                    message: 'Send the controller to the assigned service center?',
                    confirmText: 'Submit to SC'
                },
                RECEIVED_AT_SERVICE_CENTRE: {
                    title: 'Mark as Received',
                    message: 'Confirm that the controller has been received at the service center.',
                    confirmText: 'Confirm Receipt'
                },
                INITIATE_REPLACEMENT: {
                    title: 'Initiate Replacement',
                    message: 'This will start the replacement process. Continue?',
                    confirmText: 'Start Replacement'
                },
                INITIATE_REPAIR: {
                    title: 'Initiate Repair',
                    message: 'This will start the repair process. Continue?',
                    confirmText: 'Start Repair'
                },
                SPARE_REQUESTED: {
                    title: 'Request Spare Parts',
                    message: 'This will create a spare parts request. Continue?',
                    confirmText: 'Request Spares'
                },
                SPARE_REQUEST_APPROVED: {
                    title: 'Approve Spare Request',
                    message: 'Confirm approval of the spare parts request.',
                    confirmText: 'Approve'
                },
                READY_FOR_DISPATCH: {
                    title: 'Ready for Dispatch',
                    message: 'Mark this item as ready for dispatch to customer?',
                    confirmText: 'Ready to Dispatch',
                },
                DELIVERED: {
                    title: 'Mark as Delivered',
                    message: 'Confirm that the item has been delivered to the customer.',
                    confirmText: 'Mark Delivered'
                },
                REQUEST_CLEARED_AT_FIELD: {
                    title: 'Close Ticket - Field Clearance',
                    message: 'This will immediately close the ticket with field clearance. The issue has been resolved at the field level without requiring service center processing.',
                    confirmText: 'Close Ticket',
                    isTicketClosure: true
                },
                FIELD_CLEARANCE_APPROVED: {
                    title: 'Approve Field Clearance',
                    message: 'This will approve the field clearance and mark the ticket as fully resolved.',
                    confirmText: 'Approve Clearance',
                    isTicketClosure: true
                }
            },
            upload_photos: {
                title: 'Upload Photos Required',
                message: 'This milestone requires photo documentation before proceeding. Please upload the required photos.',
                confirmText: 'Upload Photos',
                isPhotoUpload: true
            }
        };

        let confirmData;

        if (action === 'transition' && targetStage) {
            confirmData = confirmationMessages.transition[targetStage];
        } else if (action === 'upload_photos') {
            confirmData = confirmationMessages.upload_photos;
        }

        if (confirmData) {
            setConfirmDialogData({
                ...confirmData,
                action,
                targetStage,
                requiresPhotos,
                currentStage
            });
            setShowConfirmDialog(true);
        } else if (action === 'transition' && targetStage) {
            // Fallback for transitions without specific confirmation messages
            setConfirmDialogData({
                title: `Advance to ${targetStage.replace(/_/g, ' ').toLowerCase()}`,
                message: `Proceed with this milestone transition?`,
                confirmText: 'Proceed',
                action,
                targetStage,
                requiresPhotos,
                currentStage
            });
            setShowConfirmDialog(true);
        } else {
            console.warn('No handler found for action:', actionData);
        }
    };

    // Handle confirmed action
    const handleConfirmedAction = async () => {
        const { action, targetStage, isPhotoUpload } = confirmDialogData;

        setShowConfirmDialog(false);

        if (isPhotoUpload) {
            // Handle photo upload action - create a file input dynamically
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.multiple = true;
            fileInput.accept = 'image/*';
            fileInput.onchange = (e) => {
                const files = Array.from(e.target.files);
                if (files.length > 0) {
                    handleAddPhotos(files);
                }
            };
            fileInput.click();
        } else if (action === 'transition' && targetStage) {
            // Handle milestone transition
            setSelectedTargetStage(targetStage);
            setShowTransitionModal(true);
        }

        setConfirmDialogData(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!milestones || milestones.length === 0) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-600 mb-4">No milestones found for this ticket.</p>
                <p className="text-sm text-gray-500">
                    Milestones are automatically created for new tickets.
                </p>
            </div>
        );
    }

    if (displayMilestones.length === 0) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-600 mb-4">No milestones to display.</p>
                <p className="text-sm text-gray-500">
                    This ticket was closed before any milestones were completed.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Service Progress</h2>
                    <span className="text-sm text-gray-600">
                        {displayMilestones.filter(m => m.status === MilestoneStatus.DONE).length} / {displayMilestones.length} Complete
                        {ticketStatus === 'closed' && displayMilestones.some(m => (m.stage === 'REQUEST_CLEARED_AT_FIELD' || m.stage === 'FIELD_CLEARANCE_APPROVED')) && (
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Closed - Field Clearance
                            </span>
                        )}
                    </span>
                    {ticketStatus === 'closed' && displayMilestones.some(m => (m.stage === 'REQUEST_CLEARED_AT_FIELD' || m.stage === 'FIELD_CLEARANCE_APPROVED')) && (
                        <p className="text-xs text-green-600 mt-1">
                            ✓ Issue resolved at field level - Service center processing bypassed
                        </p>
                    )}
                </div>
            </div>

            {/* Timeline */}
            <div className="relative">
                {displayMilestones.map((milestone) => {
                    const isActive = activeMilestone?.id === milestone.id;

                    return (
                        <MilestoneCard
                            key={milestone.id}
                            milestone={milestone}
                            isActive={isActive}
                            onTransition={handleTransition}
                            onUpdateNotes={handleUpdateNotes}
                            onBlock={handleBlock}
                            onUnblock={handleUnblock}
                            currentMilestone={currentMilestone}
                            handleMilestoneAction={handleMilestoneAction}
                            token={token}
                            addToast={addToast}
                            user={user}
                            allMilestones={milestones}
                        />
                    );
                })}
            </div>

            {/* Transition Modal */}
            <AnimatePresence>
                {showTransitionModal && selectedTargetStage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowTransitionModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {selectedTargetStage && MILESTONE_CONFIG[selectedTargetStage]?.label || 'Advance Milestone'}
                                </h3>
                                <button
                                    onClick={() => setShowTransitionModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {selectedTargetStage && MILESTONE_CONFIG[selectedTargetStage] && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm text-blue-700">
                                            <strong>Action:</strong> {MILESTONE_CONFIG[selectedTargetStage].description}
                                        </p>
                                        {MILESTONE_CONFIG[selectedTargetStage].photoRequired && (
                                            <p className="text-xs text-blue-600 mt-1">
                                                📷 This milestone will require photo documentation
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Photo Upload Section */}
                                {selectedTargetStage && MILESTONE_CONFIG[selectedTargetStage]?.photoRequired && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Photos Required (Min: {MILESTONE_CONFIG[selectedTargetStage]?.minPhotos || 1})
                                        </label>

                                        {/* Photo Requirements Info */}
                                        {(selectedTargetStage === 'RECEIVED_AT_SERVICE_CENTER' || selectedTargetStage === 'SUBMITTED_TO_SERVICE_CENTER') && MILESTONE_CONFIG[selectedTargetStage]?.requiredPhotos && (
                                            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border mb-3">
                                                <strong>4 specific photos required:</strong>
                                                <div className="mt-1 grid grid-cols-2 gap-1 text-xs">
                                                    {MILESTONE_CONFIG[selectedTargetStage].requiredPhotos.map((photoType, index) => (
                                                        <div key={index} className="flex items-center gap-1">
                                                            <span className={`w-4 h-4 rounded text-white text-xs flex items-center justify-center ${transitionPhotos.length > index ? 'bg-green-500' : 'bg-gray-400'
                                                                }`}>
                                                                {index + 1}
                                                            </span>
                                                            <span className={transitionPhotos.length > index ? 'text-green-600 font-medium' : 'text-gray-600'}>
                                                                {photoType}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Upload Button */}
                                        <button
                                            onClick={() => setShowPhotoModal(true)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                                        >
                                            <Camera className="w-5 h-5" />
                                            <span className="font-medium">
                                                {transitionPhotos.length > 0 
                                                    ? `${transitionPhotos.length} photo(s) selected - Click to change`
                                                    : 'Upload Photos'
                                                }
                                            </span>
                                        </button>

                                        {/* Photo Count Status */}
                                        {transitionPhotos.length > 0 && (
                                            <div className="mt-2 text-xs text-center">
                                                {(selectedTargetStage === 'RECEIVED_AT_SERVICE_CENTER' || selectedTargetStage === 'SUBMITTED_TO_SERVICE_CENTER') && MILESTONE_CONFIG[selectedTargetStage]?.minPhotos === 4 ? (
                                                    <span className={`font-medium ${transitionPhotos.length >= 4 ? 'text-green-600' : 'text-orange-600'}`}>
                                                        {transitionPhotos.length >= 4 
                                                            ? '✓ All required photos uploaded!' 
                                                            : `${transitionPhotos.length} of 4 photos - ${4 - transitionPhotos.length} more needed`
                                                        }
                                                    </span>
                                                ) : (
                                                    <span className="text-green-600 font-medium">
                                                        ✓ {transitionPhotos.length} photo(s) ready to upload
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Required Photos Info for other stages */}
                                        {selectedTargetStage !== 'RECEIVED_AT_SERVICE_CENTER' && MILESTONE_CONFIG[selectedTargetStage]?.requiredPhotos && (
                                            <div className="mt-2 text-xs text-gray-600">
                                                <span className="font-medium">Required Photos: </span>
                                                {MILESTONE_CONFIG[selectedTargetStage].requiredPhotos.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => setShowTransitionModal(false)}
                                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleTransition}
                                        disabled={
                                            (selectedTargetStage === 'RECEIVED_AT_SERVICE_CENTER' || selectedTargetStage === 'SUBMITTED_TO_SERVICE_CENTER') &&
                                            MILESTONE_CONFIG[selectedTargetStage]?.photoRequired &&
                                            transitionPhotos.length < (MILESTONE_CONFIG[selectedTargetStage]?.minPhotos || 1)
                                        }
                                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${(selectedTargetStage === 'RECEIVED_AT_SERVICE_CENTER' || selectedTargetStage === 'SUBMITTED_TO_SERVICE_CENTER') &&
                                            MILESTONE_CONFIG[selectedTargetStage]?.photoRequired &&
                                            transitionPhotos.length < (MILESTONE_CONFIG[selectedTargetStage]?.minPhotos || 1)
                                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                        Advance
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Spare Request Modal */}
            <AnimatePresence>
                {showSpareRequestModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-2 sm:p-4"
                        onClick={() => setShowSpareRequestModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
                        >
                            <SpareRequestForm
                                onSubmit={handleSpareRequestSubmit}
                                onCancel={() => {
                                    setShowSpareRequestModal(false);
                                    setPendingSpareTransition(null);
                                }}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirmation Dialog */}
            <AnimatePresence>
                {showConfirmDialog && confirmDialogData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/25 select-none z-50 flex items-center justify-center p-4"
                        onClick={() => setShowConfirmDialog(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {confirmDialogData.title}
                                </h3>
                                <button
                                    onClick={() => setShowConfirmDialog(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <p className="text-gray-600">
                                    {confirmDialogData.message}
                                </p>
                                {(confirmDialogData.targetStage === 'REQUEST_CLEARED_AT_FIELD' || confirmDialogData.targetStage === 'FIELD_CLEARANCE_APPROVED') && (
                                    <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-start space-x-3">
                                            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold text-red-800 mb-1">
                                                    Ticket will be CLOSED immediately
                                                </p>
                                                <p className="text-sm text-red-700">
                                                    • All remaining service center processes will be bypassed<br />
                                                    • This action cannot be undone<br />
                                                    • The ticket status will change to CLOSED
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {confirmDialogData.isTicketClosure && (
                                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="text-sm text-green-700">
                                            <CheckCircle className="w-4 h-4 inline mr-1" />
                                            Issue has been resolved at the field level
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setShowConfirmDialog(false)}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmedAction}
                                    className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 font-medium ${(confirmDialogData.targetStage === 'REQUEST_CLEARED_AT_FIELD' || confirmDialogData.targetStage === 'FIELD_CLEARANCE_APPROVED')
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : confirmDialogData.isPhotoUpload
                                            ? 'bg-orange-600 hover:bg-orange-700'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {confirmDialogData.isPhotoUpload && <Camera className="w-4 h-4" />}
                                    {(confirmDialogData.targetStage === 'REQUEST_CLEARED_AT_FIELD' || confirmDialogData.targetStage === 'FIELD_CLEARANCE_APPROVED') && <X className="w-4 h-4" />}
                                    {!confirmDialogData.isPhotoUpload && (confirmDialogData.targetStage !== 'REQUEST_CLEARED_AT_FIELD' && confirmDialogData.targetStage !== 'FIELD_CLEARANCE_APPROVED') && <ArrowRight className="w-4 h-4" />}
                                    {confirmDialogData.confirmText}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Photo Upload Modal */}
            <PhotoUploadModal
                isOpen={showPhotoModal}
                onClose={() => setShowPhotoModal(false)}
                onUpload={(filesOrLabeled) => {
                    // Handle labeled photos for RECEIVED_AT_SERVICE_CENTER or regular files for other stages
                    if ((selectedTargetStage === 'RECEIVED_AT_SERVICE_CENTER' || selectedTargetStage === 'SUBMITTED_TO_SERVICE_CENTER') && Array.isArray(filesOrLabeled) && filesOrLabeled[0]?.file) {
                        // Extract files from labeled objects and store labels separately if needed
                        const files = filesOrLabeled.map(item => item.file);
                        const labels = filesOrLabeled.map(item => item.label);
                        setTransitionPhotos(files);
                        // You could store labels in a separate state if needed for validation
                    } else {
                        setTransitionPhotos(filesOrLabeled);
                    }
                    setShowPhotoModal(false);
                }}
                title={selectedTargetStage && MILESTONE_CONFIG[selectedTargetStage] 
                    ? `Upload Photos - ${MILESTONE_CONFIG[selectedTargetStage].label}`
                    : 'Upload Photos'
                }
                description={(selectedTargetStage === 'RECEIVED_AT_SERVICE_CENTER' || selectedTargetStage === 'SUBMITTED_TO_SERVICE_CENTER') && MILESTONE_CONFIG[selectedTargetStage]?.requiredPhotos
                    ? `Please upload 4 specific photos: ${MILESTONE_CONFIG[selectedTargetStage].requiredPhotos.join(', ')}`
                    : selectedTargetStage && MILESTONE_CONFIG[selectedTargetStage]?.requiredPhotos
                        ? `Required photos: ${MILESTONE_CONFIG[selectedTargetStage].requiredPhotos.join(', ')}`
                        : 'Select photos to upload for this milestone'
                }
                minPhotos={selectedTargetStage && MILESTONE_CONFIG[selectedTargetStage]?.minPhotos || 1}
                uploading={uploadingPhotos}
                requireLabels={selectedTargetStage === 'RECEIVED_AT_SERVICE_CENTER' || selectedTargetStage === 'SUBMITTED_TO_SERVICE_CENTER'}
                requiredLabels={(selectedTargetStage === 'RECEIVED_AT_SERVICE_CENTER' || selectedTargetStage === 'SUBMITTED_TO_SERVICE_CENTER') ? MILESTONE_CONFIG[selectedTargetStage]?.requiredPhotos : undefined}
            />
        </div>
    );
};

export default MilestoneTimeline;
