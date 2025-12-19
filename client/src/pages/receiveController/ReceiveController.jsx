import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import {
    Package,
    Camera,
    CheckCircle,
    AlertCircle,
    Search,
    X,
    Upload,
    Mic,
    Video,
    Image as ImageIcon,
    Loader2,
    ScanLine,
    List,
    Eye,
    Download,
    RefreshCw
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import Input from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../components/ui/toast';
import { useAuth } from '../../lib/hooks/useAuth';
import useTickets from '../../lib/hooks/useTickets';
import useBatch from '../../lib/hooks/useBatch';
import { useDebounce } from '../../lib/hooks/ticketHooks';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const ReceiveController = () => {
    const { token } = useAuth();
    const { fetchTickets, tickets, searching, searchResults, updateMilestone } = useTickets();
    const { 
        currentBatch, 
        getOrCreateActiveBatch, 
        addTicketToBatch, 
        removeTicketFromBatch, 
        isTicketInBatch,
        fetchCompletedBatches,
        loading: loadingBatch 
    } = useBatch();
    const toastContext = useToast();

    // Safe toast function with fallback
    const addToast = toastContext?.addToast || ((toast) => {
        console.warn('Toast not available:', toast);
    });

    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchedTicket, setSearchedTicket] = useState(null);
    const [ticketsList, setTicketsList] = useState([]);
    const [showTicketsList, setShowTicketsList] = useState(false);
    
    // Debounce the search keyword with 500ms delay (longer for API calls)
    const debouncedSearchKeyword = useDebounce(searchKeyword, 500);
    const [submitting, setSubmitting] = useState(false);
    const [photos, setPhotos] = useState([]);
    const [videos, setVideos] = useState([]);
    const [audioRecording, setAudioRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scannerStream, setScannerStream] = useState(null);
    
    // Batch item photos - stores photos for each ticket in the batch
    const [batchItemPhotos, setBatchItemPhotos] = useState({}); // { ticketId: [photo1, photo2, ...] }
    const [selectedTicketForUpload, setSelectedTicketForUpload] = useState(null);
    
    // Completed batches state
    const [completedBatches, setCompletedBatches] = useState([]);
    const [showCompletedBatches, setShowCompletedBatches] = useState(false);
    const [loadingCompletedBatches, setLoadingCompletedBatches] = useState(false);
    
    // Batch state comes from useBatch hook

    // NEW: Camera capture state
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [cameraStream, setCameraStream] = useState(null);

    // NEW: Video recording state
    const [isVideoRecording, setIsVideoRecording] = useState(false);
    const [videoRecordingStream, setVideoRecordingStream] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const videoRecorderRef = useRef(null);
    const videoChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);

    // NEW: video devices and selected device
    const [videoDevices, setVideoDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState(null);

    // Image viewing state
    const [viewingImages, setViewingImages] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [currentBatchImages, setCurrentBatchImages] = useState([]);
    const [selectedTicketForImages, setSelectedTicketForImages] = useState(null);
    const [ticketImages, setTicketImages] = useState({});

    // Batch state comes from useBatch hook

    const photoInputRef = useRef(null);
    const videoInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const scannerVideoRef = useRef(null);
    const codeReaderRef = useRef(null);
    const cameraVideoRef = useRef(null); // NEW: For camera capture
    const videoRecordingVideoRef = useRef(null); // NEW: For video recording

    // Required photo labels for RECEIVED_AT_SERVICE_CENTER
    const requiredPhotos = [
        'Controller Front',
        'Controller Bottom',
        'Full View Open',
        'MCB Close Up'
    ];

    // Enumerate video devices on mount
    useEffect(() => {
        const initDevices = async () => {
            try {
                if (!codeReaderRef.current) {
                    codeReaderRef.current = new BrowserMultiFormatReader();
                }
                const devices = await codeReaderRef.current.listVideoInputDevices();
                setVideoDevices(devices || []);
                if (devices && devices.length > 0 && !selectedDeviceId) {
                    const defaultId = pickVideoDeviceId(devices);
                    setSelectedDeviceId(defaultId);
                }
            } catch (err) {
                console.warn('Could not enumerate devices on mount:', err);
            }
        };
        initDevices();
    }, []);

    // Helper: pick a default camera if none selected (prefer back)
    const pickVideoDeviceId = (devices) => {
        if (!devices || devices.length === 0) return null;
        const back = devices.find(d => /back|rear|environment|camera 0/i.test(d.label));
        if (back) return back.deviceId;
        return devices[devices.length - 1].deviceId;
    };

    // List video input devices and set state
    const listVideoInputDevices = async () => {
        try {
            if (!codeReaderRef.current) codeReaderRef.current = new BrowserMultiFormatReader();
            const devices = await codeReaderRef.current.listVideoInputDevices();
            setVideoDevices(devices || []);
            // If nothing selected yet, set a sensible default
            if (!selectedDeviceId) {
                const defaultId = pickVideoDeviceId(devices);
                setSelectedDeviceId(defaultId);
            }
        } catch (err) {
            console.warn('Could not list video devices:', err);
            setVideoDevices([]);
        }
    };

    // Search tickets by keyword (controller number, ticket code, or IMEI)
    const handleSearch = useCallback(async () => {
        const keyword = debouncedSearchKeyword.trim();
        if (!keyword) {
            addToast({
                title: 'Input Required',
                description: 'Please enter a search keyword (Controller No, Ticket Code, or IMEI)',
                variant: 'warning'
            });
            return;
        }

        // Use fetchTickets with search filter for tickets ready to receive
        fetchTickets({
            skip: 0,
            take: 50,
            filter: {
                search: keyword,
                milestoneStage: 'SUBMITTED_TO_SERVICE_CENTER' // Filter by milestone stage
            }
        });
        setShowTicketsList(true);
    }, [debouncedSearchKeyword]); // Remove unstable function dependencies

    // Update ticket list when tickets from hook change
    React.useEffect(() => {
        if (tickets && showTicketsList) {
            setTicketsList(tickets);
            // Only show toast notifications when there are actual results to show
            // Remove addToast from dependencies to prevent infinite loops
            if (tickets.length > 0) {
                addToast({
                    title: 'Tickets Found',
                    description: `Found ${tickets.length} tickets`,
                    variant: 'success'
                });
            }
        }
    }, [tickets, showTicketsList]); // Remove addToast and searchKeyword

    // Select a ticket from the search results
    const handleSelectTicket = useCallback((ticket) => {
        setSearchedTicket(ticket);
        setShowTicketsList(false);
        // Clear photos when selecting a new ticket
        setPhotos([]);
        setVideos([]);
        setAudioRecording(null);
 
    }, [addToast]);

    // Add selected ticket to batch after photos are taken
    const addTicketToBatchHandler = useCallback(async () => {
        if (!searchedTicket || !currentBatch) {
            addToast({
                title: 'Error',
                description: 'No ticket selected or batch not available',
                variant: 'error'
            });
            return;
        }

        // Check if ticket is already in batch
        if (isTicketInBatch(searchedTicket.id)) {
            addToast({
                title: 'Already Added',
                description: `Ticket ${searchedTicket.ticketCode} is already in the batch`,
                variant: 'warning'
            });
            return;
        }

        // Check if photos are available
        if (photos.length === 0) {
            addToast({
                title: 'Photos Required',
                description: 'Please capture or upload photos before adding ticket to batch',
                variant: 'error'
            });
            return;
        }

        try {
            // First, create the milestone with attachments
            const milestoneResult = await updateMilestone({
                ticketId: searchedTicket.id,
                milestoneData: {
                    targetStage: 'RECEIVED_AT_SERVICE_CENTER',
                    action: 'transition',
                    attachments: photos.map(photo => photo.file) // Extract File objects
                }
            });

            // Check if milestone creation was successful
            if (milestoneResult.meta.requestStatus === 'fulfilled') {
                // Now add ticket to batch
                await addTicketToBatch(currentBatch.id, searchedTicket.id);                
             
                // Reset form after adding to batch
                setSearchedTicket(null);
                setPhotos([]);
                setVideos([]);
                setAudioRecording(null);
                setSearchKeyword('');
            } else {
                throw new Error(milestoneResult.payload || 'Failed to create milestone');
            }
        } catch (error) {
            console.error('Error adding ticket to batch:', error);
            addToast({
                title: 'Error',
                description: error.message || 'Failed to process ticket',
                variant: 'error'
            });
        }
    }, [searchedTicket, currentBatch, isTicketInBatch, addTicketToBatch, addToast, photos, updateMilestone]);

    // Remove ticket from batch
    const removeTicketFromBatchHandler = useCallback(async (ticketId) => {
        if (!currentBatch) {
            addToast({
                title: 'Error',
                description: 'No active batch found',
                variant: 'error'
            });
            return;
        }

        try {
            await removeTicketFromBatch(currentBatch.id, ticketId);
        } catch (error) {
            console.error('Error removing ticket from batch:', error);
        }
    }, [currentBatch, removeTicketFromBatch, addToast]);

    // Function to load completed batches
    const loadCompletedBatches = useCallback(async () => {
        setLoadingCompletedBatches(true);
        try {
            const batches = await fetchCompletedBatches();
            setCompletedBatches(batches);
        } catch (error) {
            console.error('Error loading completed batches:', error);
            addToast({
                title: 'Error',
                description: 'Failed to load completed batches',
                variant: 'error'
            });
        } finally {
            setLoadingCompletedBatches(false);
        }
    }, [fetchCompletedBatches, addToast]);

    // Initialize batch on component mount
    React.useEffect(() => {
        const init = async () => {
            try {
                await getOrCreateActiveBatch('RECEIVE_CONTROLLER');
                // Load completed batches
                await loadCompletedBatches();
            } catch (error) {
                console.error('Error initializing batch:', error);
            }
        };
        init();
    }, [getOrCreateActiveBatch, loadCompletedBatches]); // Updated dependencies

    // Auto-search when debounced keyword changes (if it has value)
    React.useEffect(() => {
        if (debouncedSearchKeyword && debouncedSearchKeyword.trim().length >= 2) {
            const keyword = debouncedSearchKeyword.trim();
            // Call fetchTickets without .then() since it doesn't return a Promise
            fetchTickets({
                skip: 0,
                take: 50,
                filter: {
                    search: keyword,
                    milestoneStage: 'SUBMITTED_TO_SERVICE_CENTER' // Filter by milestone stage
                }
            });
            setShowTicketsList(true);
        } else if (debouncedSearchKeyword.trim().length === 0) {
            // Clear results when search is empty
            setShowTicketsList(false);
            setTicketsList([]);
        }
    }, [debouncedSearchKeyword]); // Remove fetchTickets from dependencies

    // Functions exist later in the component

    // Handle photo upload
    const handlePhotoSelect = (e) => {
        const files = Array.from(e.target.files || []);
        const newPhotos = files.map((file, index) => {
            const photoId = Date.now() + Math.random() + index;
            const originalName = file.name;
            let fileName = originalName;
            
            // If ticket is selected, use proper naming format
            if (searchedTicket && originalName.includes('.')) {
                const extension = originalName.split('.').pop();
                fileName = `photo_${searchedTicket.ticketCode}_${photoId}.${extension}`;
            }
            
            const renamedFile = new File([file], fileName, { type: file.type });
            
            return {
                id: photoId,
                file: renamedFile,
                label: '',
                preview: URL.createObjectURL(file)
            };
        });
        setPhotos(prev => [...prev, ...newPhotos]);
    };

    // NEW: Open camera to capture photos one by one
    const openCameraForCapture = async () => {
        setIsCameraOpen(true);
        setCurrentPhotoIndex(0);

        // Wait a bit for modal to render
        setTimeout(async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    }
                });

                setCameraStream(stream);

                // Attach stream to video element
                if (cameraVideoRef.current) {
                    cameraVideoRef.current.srcObject = stream;
                    await cameraVideoRef.current.play();
                }
            } catch (error) {
                console.error('❌ Camera access error:', error);
                addToast({
                    title: 'Camera Error',
                    description: 'Could not access camera. Please allow camera permissions.',
                    variant: 'error'
                });
                setIsCameraOpen(false);
            }
        }, 300);
    };

    // NEW: Capture current photo from camera
    const capturePhoto = () => {
        if (!cameraVideoRef.current || !cameraStream || !searchedTicket) return;

        const video = cameraVideoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            const label = requiredPhotos[currentPhotoIndex];
            const fileName = `${label.replace(/\s+/g, '_')}_${searchedTicket.ticketCode}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            const newPhoto = {
                file,
                preview: URL.createObjectURL(blob),
                label: label,
                id: Math.random().toString(36)
            };

            setPhotos(prev => {
                const filtered = prev.filter(p => p.label !== label);
                return [...filtered, newPhoto];
            });

            addToast({
                title: 'Photo Captured',
                description: `${label} captured`,
                variant: 'success'
            });

            // Move to next photo or close camera
            if (currentPhotoIndex < requiredPhotos.length - 1) {
                setCurrentPhotoIndex(prev => prev + 1);
            } else {
                closeCameraCapture();
                addToast({
                    title: 'All Photos Captured',
                    description: 'All required photos have been taken',
                    variant: 'success'
                });
            }
        }, 'image/jpeg', 0.95);
    };

    // NEW: Close camera capture
    const closeCameraCapture = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        if (cameraVideoRef.current) {
            cameraVideoRef.current.srcObject = null;
        }
        setIsCameraOpen(false);
        setCurrentPhotoIndex(0);
    };

    // Handle video upload
    const handleVideoSelect = (e) => {
        const files = Array.from(e.target.files || []);
        const newVideos = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            id: Math.random().toString(36)
        }));
        setVideos(prev => [...prev, ...newVideos]);
    };

    // NEW: Start video recording with camera
    const startVideoRecording = async () => {
        setIsVideoRecording(true);
        setRecordingTime(0);

        setTimeout(async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    },
                    audio: true
                });

                setVideoRecordingStream(stream);

                // Attach stream to video element
                if (videoRecordingVideoRef.current) {
                    videoRecordingVideoRef.current.srcObject = stream;
                    await videoRecordingVideoRef.current.play();
                }

                // Start MediaRecorder
                videoRecorderRef.current = new MediaRecorder(stream, {
                    mimeType: 'video/webm;codecs=vp8,opus'
                });
                videoChunksRef.current = [];

                videoRecorderRef.current.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        videoChunksRef.current.push(event.data);
                    }
                };

                videoRecorderRef.current.onstop = () => {
                    const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
                    const videoFile = new File([videoBlob], `video-${Date.now()}.webm`, { type: 'video/webm' });
                    const newVideo = {
                        file: videoFile,
                        preview: URL.createObjectURL(videoBlob),
                        id: Math.random().toString(36)
                    };

                    setVideos(prev => [...prev, newVideo]);

                    addToast({
                        title: 'Video Saved',
                        description: `Video recorded (${recordingTime}s)`,
                        variant: 'success'
                    });

                    // Cleanup
                    stopVideoRecording();
                };

                videoRecorderRef.current.start();

                // Start timer
                recordingTimerRef.current = setInterval(() => {
                    setRecordingTime(prev => prev + 1);
                }, 1000);

                addToast({
                    title: 'Recording Started',
                    description: 'Video recording in progress',
                    variant: 'info'
                });

            } catch (error) {
                console.error('❌ Video recording error:', error);
                addToast({
                    title: 'Recording Error',
                    description: 'Could not access camera/microphone. Please allow permissions.',
                    variant: 'error'
                });
                setIsVideoRecording(false);
            }
        }, 300);
    };

    // NEW: Stop video recording
    const stopVideoRecording = () => {
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }

        if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
            videoRecorderRef.current.stop();
        }

        if (videoRecordingStream) {
            videoRecordingStream.getTracks().forEach(track => track.stop());
            setVideoRecordingStream(null);
        }

        if (videoRecordingVideoRef.current) {
            videoRecordingVideoRef.current.srcObject = null;
        }

        setIsVideoRecording(false);
        setRecordingTime(0);
    };

    // NEW: Cancel video recording without saving
    const cancelVideoRecording = () => {
        if (videoRecorderRef.current) {
            videoRecorderRef.current.ondataavailable = null;
            videoRecorderRef.current.onstop = null;
        }
        videoChunksRef.current = [];
        stopVideoRecording();
        addToast({
            title: 'Recording Cancelled',
            description: 'Video recording was cancelled',
            variant: 'info'
        });
    };

    // Remove photo
    const removePhoto = (photoId) => {
        setPhotos(prev => {
            const photo = prev.find(p => p.id === photoId);
            if (photo?.preview) {
                URL.revokeObjectURL(photo.preview);
            }
            return prev.filter(p => p.id !== photoId);
        });
    };

    // Remove video
    const removeVideo = (videoId) => {
        setVideos(prev => {
            const video = prev.find(v => v.id === videoId);
            if (video?.preview) {
                URL.revokeObjectURL(video.preview);
            }
            return prev.filter(v => v.id !== videoId);
        });
    };

    // Update photo label and rename file
    const updatePhotoLabel = (photoId, label) => {
        setPhotos(prev => prev.map(photo => {
            if (photo.id === photoId) {
                let fileName = photo.file.name;
                
                // Rename file if ticket is available and label is set
                if (searchedTicket && label) {
                    const extension = photo.file.name.split('.').pop();
                    fileName = `${label.replace(/\s+/g, '_')}_${searchedTicket.ticketCode}.${extension}`;
                    const renamedFile = new File([photo.file], fileName, { type: photo.file.type });
                    return { ...photo, label, file: renamedFile };
                }
                
                return { ...photo, label };
            }
            return photo;
        }));
    };

    // Start audio recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
                setAudioRecording({
                    file: audioFile,
                    preview: URL.createObjectURL(audioBlob),
                    id: Math.random().toString(36)
                });
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            addToast({
                title: 'Recording Started',
                description: 'Voice recording is in progress',
                variant: 'info'
            });
        } catch (error) {
            console.error('Recording error:', error);
            addToast({
                title: 'Recording Failed',
                description: 'Could not access microphone',
                variant: 'error'
            });
        }
    };

    // Stop audio recording
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            addToast({
                title: 'Recording Stopped',
                description: 'Voice recording saved',
                variant: 'success'
            });
        }
    };

    // Remove audio recording
    const removeAudio = () => {
        if (audioRecording?.preview) {
            URL.revokeObjectURL(audioRecording.preview);
        }
        setAudioRecording(null);
    };

    // Batch management functions
    const addToBatch = async () => {
        if (!searchedTicket) {
            addToast({
                title: 'No Ticket Selected',
                description: 'Please search and select a ticket first',
                variant: 'error'
            });
            return;
        }

        if (!searchedTicket.controllerNo) {
            addToast({
                title: 'Controller Number Missing',
                description: 'This ticket does not have a controller number',
                variant: 'error'
            });
            return;
        }

        if (photos.length === 0) {
            addToast({
                title: 'Photos Required',
                description: 'At least one photo must be captured or attached before adding to batch',
                variant: 'error'
            });
            return;
        }

        // Check if all photos have labels selected
        const photosWithoutLabels = photos.filter(photo => !photo.label || photo.label.trim() === '');
        if (photosWithoutLabels.length > 0) {
            addToast({
                title: 'Labels Required',
                description: `Please select labels for all photos. ${photosWithoutLabels.length} photo(s) missing labels.`,
                variant: 'error'
            });
            return;
        }

        // Check if required photos are present
        const presentLabels = photos.map(photo => photo.label);
        const missingRequired = requiredPhotos.filter(required => !presentLabels.includes(required));
        if (missingRequired.length > 0) {
            addToast({
                title: 'Missing Required Photos',
                description: `Missing required photos: ${missingRequired.join(', ')}`,
                variant: 'error'
            });
            return;
        }

        // Check if already in batch using the hook
        if (isTicketInBatch(searchedTicket.id)) {
            addToast({
                title: 'Already in Batch',
                description: 'This ticket is already in the batch',
                variant: 'warning'
            });
            return;
        }

        // photo labels must be unique
        const labelSet = new Set();
        for (const photo of photos) {
            if (labelSet.has(photo.label)) {
                addToast({
                    title: 'Duplicate Labels',
                    description: `Duplicate photo label found: ${photo.label}. Please ensure all photo labels are unique.`,
                    variant: 'error'
                });
                return;
            }
            labelSet.add(photo.label);
        }

        // Use the batch hook to add the ticket
        try {
            await addTicketToBatchHandler();
            // Reset form after successful addition
            resetForm();
        } catch (error) {
            console.error('Error adding ticket to batch:', error);
        }
    };

    const removeBatchItem = (ticketId) => {
        if (currentBatch) {
            removeTicketFromBatchHandler(ticketId);
        }
    };

    const clearBatch = () => {
        // This would require a separate endpoint to close/complete batch
        addToast({
            title: 'Clear Batch',
            description: 'Clear batch functionality needs to be implemented',
            variant: 'warning'
        });
    };

    // View ticket images (milestone attachments) - use data already available in batch
    const viewTicketImages = useCallback(async (ticketId) => {
        if (!ticketId) return;
        
        try {
            let images = [];
            
            // Find the ticket in the current batch
            const batchItem = currentBatch?.batchItems?.find(item => item.ticket?.id === ticketId);
            
            if (batchItem?.ticket) {
                // First, try to find RECEIVED_AT_SERVICE_CENTER milestone attachments
                const receivedMilestone = batchItem.ticket.ticketMilestones?.find(m => m.stage === 'RECEIVED_AT_SERVICE_CENTER');
                if (receivedMilestone?.attachments?.length > 0) {
                    images = receivedMilestone.attachments.filter(att => 
                        att.fileType?.startsWith('image/') || 
                        att.fileName?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
                    );
                 }
                
                // If no images in RECEIVED_AT_SERVICE_CENTER, check other milestone attachments
                if (images.length === 0) {
                    const milestonesWithAttachments = batchItem.ticket.ticketMilestones?.filter(m => 
                        m.attachments && m.attachments.length > 0
                    );
                    
                    if (milestonesWithAttachments?.length > 0) {
                        // Get all images from all milestones
                        images = milestonesWithAttachments.flatMap(m => 
                            m.attachments.filter(att => 
                                att.fileType?.startsWith('image/') || 
                                att.fileName?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
                            )
                        );
                     }
                }
                
                // If still no images, check general ticket attachments
                if (images.length === 0 && batchItem.ticket.attachments) {
                    images = batchItem.ticket.attachments.filter(att => 
                        att.fileType?.startsWith('image/') || 
                        att.fileName?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
                    );
                 }
            }
            
            // If still no images, check if there are locally uploaded photos for this ticket
            if (images.length === 0 && batchItemPhotos[ticketId]) {
                images = batchItemPhotos[ticketId].map(photo => ({
                    id: photo.id,
                    fileName: photo.file.name,
                    fileType: photo.file.type,
                    fileUrl: photo.preview,
                    label: photo.label,
                    isLocal: true // Flag to indicate this is a local preview
                }));
             }
            
            if (images && images.length > 0) {
                setCurrentBatchImages(images);
                setCurrentImageIndex(0);
                setSelectedTicketForImages(ticketId);
                setViewingImages(true);
                
            } else {
                 addToast({
                    title: 'No Images',
                    description: 'No images found for this ticket. Upload photos during receiving process.',
                    variant: 'info'
                });
            }
        } catch (error) {
            console.error('Error viewing ticket images:', error);
            addToast({
                title: 'Error',
                description: 'Failed to display ticket images',
                variant: 'error'
            });
        }
    }, [currentBatch, batchItemPhotos, addToast]);

    // Close image viewer
    const closeImageViewer = () => {
        setViewingImages(false);
        setCurrentBatchImages([]);
        setCurrentImageIndex(0);
        setSelectedTicketForImages(null);
    };

    // Navigate images
    const nextImage = () => {
        setCurrentImageIndex((prev) => 
            prev < currentBatchImages.length - 1 ? prev + 1 : 0
        );
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => 
            prev > 0 ? prev - 1 : currentBatchImages.length - 1
        );
    };

    // Batch submission: Mark all as received
    const markAllAsReceived = async () => {
        const batchItems = currentBatch?.batchItems || [];
        if (batchItems.length === 0) {
            addToast({
                title: 'Batch Empty',
                description: 'No items in the batch to submit.',
                variant: 'warning'
            });
            return;
        }

        // Validate all items have controllerNo
        const itemsWithoutControllerNo = batchItems.filter(item => !item.ticket.controllerNo);
        if (itemsWithoutControllerNo.length > 0) {
            addToast({
                title: 'Invalid Items',
                description: `${itemsWithoutControllerNo.length} item(s) missing controller number`,
                variant: 'error'
            });
            return;
        }

        // Since milestones are now created when tickets are added to batch,
        // we skip detailed photo validation here as photos are already attached to milestones
        // The batch processing endpoint will handle any remaining validation

        // Build form data with batch information
        // Photos are already attached to milestones when tickets were added to batch
        const formData = new FormData();
        formData.append('batchCount', String(batchItems.length));
        formData.append('batchId', String(currentBatch.id));

       
        batchItems.forEach((item, idx) => {
            // Append item metadata with correct FormData key format
            formData.append(`items[${idx}][ticketCode]`, item.ticket.ticketCode || '');
            formData.append(`items[${idx}][controllerNo]`, item.ticket.controllerNo);

            

            // If there are additional photos in batchItemPhotos (uploaded later), include them
            const additionalPhotos = batchItemPhotos[item.ticket.id] || [];
            additionalPhotos.forEach((photo, pidx) => {
                formData.append(`items[${idx}][additionalPhotos]`, photo.file, photo.file.name);
                formData.append(`items[${idx}][additionalPhotoLabels][${pidx}]`, photo.label || '');
             });
        });

        try {
            addToast({
                title: 'Submitting Batch',
                description: `Processing ${batchItems.length} item(s)`,
                variant: 'info'
            });
            
             
            const response = await axios.post(
                `${API_URL}/milestones/receive-batch`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    },
                    withCredentials: true
                }
            );

 
            addToast({
                title: 'Success',
                description: `Batch processed: ${response.data?.message || 'All items received at service center'}`,
                variant: 'success'
            });
            
            // Cleanup
            clearBatch();
            setBatchItemPhotos({}); // Clear any additional photos
            setSearchedTicket(null);
            setSearchKeyword('');
        } catch (error) {
            console.error('❌ Batch submission error:', error);
            console.error('Error response:', error.response?.data);
            
            // Show detailed error information
            let errorMessage = 'Failed to process batch';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.errors) {
                // If there are specific item errors, show them
                const errorCount = error.response.data.errors.length;
                errorMessage = `${errorCount} item(s) failed. Check console for details.`;
             }
            
            addToast({
                title: 'Submission Failed',
                description: errorMessage,
                variant: 'error'
            });
        }
    };

    // Single unified barcode scanning function
    const startBarcodeScanning = async (deviceId = null) => {

        // Check secure context - but don't close scanner yet
        const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
        if (!isSecureContext) {
            addToast({
                title: 'HTTPS Required',
                description: 'Camera access requires HTTPS. Please use a secure connection.',
                variant: 'error'
            });
            setIsScanning(false);
            return;
        }

        // Detect mobile device
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Check API support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('❌ Camera API not supported');
            addToast({
                title: 'Not Supported',
                description: 'Camera API not supported on this device/browser.',
                variant: 'error'
            });
            setIsScanning(false);
            return;
        }

        try {
            // Note: isScanning is already true from the button click

            // Ensure code reader exists
            if (!codeReaderRef.current) {
                codeReaderRef.current = new BrowserMultiFormatReader();

                // Configure hints for better detection
                const hints = new Map();
                hints.set(2, true); // TRY_HARDER
                hints.set(3, [128, 39, 93, 25, 6]); // POSSIBLE_FORMATS: Code128, Code39, Code93, ITF, EAN-13
                codeReaderRef.current.hints = hints;
            }

            // Re-enumerate devices if needed
            if (videoDevices.length === 0) {
                await listVideoInputDevices();
            }

            // Determine which device to use
            const chosenId = deviceId || selectedDeviceId || pickVideoDeviceId(videoDevices);

            // Get the video element
            const videoEl = scannerVideoRef.current;
            if (!videoEl) {
                throw new Error('Scanner video element not mounted');
            }

            // Prepare video element for mobile
            videoEl.muted = true;
            videoEl.playsInline = true;
            videoEl.setAttribute('playsinline', 'true');
            videoEl.setAttribute('webkit-playsinline', 'true');

            let stream;

            // Try to get camera stream with progressive fallback
            if (chosenId) {
                // Attempt 1: Use specific device with mobile-optimized constraints
                try {
                    const constraints = {
                        audio: false,
                        video: {
                            deviceId: { exact: chosenId },
                            width: { min: 320, ideal: isMobile ? 640 : 1280, max: 1920 },
                            height: { min: 240, ideal: isMobile ? 480 : 720, max: 1080 },
                            frameRate: { min: 10, ideal: 15, max: 30 }
                        }
                    };
                    stream = await navigator.mediaDevices.getUserMedia(constraints);
                } catch (err1) {
                    // Attempt 2: Try with ideal instead of exact
                    try {
                        const constraints = {
                            audio: false,
                            video: {
                                deviceId: { ideal: chosenId },
                                facingMode: isMobile ? { ideal: 'environment' } : undefined,
                                width: { ideal: isMobile ? 640 : 1280 },
                                height: { ideal: isMobile ? 480 : 720 }
                            }
                        };
                        stream = await navigator.mediaDevices.getUserMedia(constraints);
                    } catch (err2) {
                        console.warn('⚠️ Ideal constraints failed:', err2.message);
                        throw err2;
                    }
                }
            } else {
                // No specific device - try environment facing on mobile
                try {
                    const constraints = isMobile
                        ? {
                            audio: false,
                            video: {
                                facingMode: { ideal: 'environment' },
                                width: { ideal: 640 },
                                height: { ideal: 480 }
                            }
                        }
                        : { video: true, audio: false };
                    stream = await navigator.mediaDevices.getUserMedia(constraints);
                } catch (err) {
                    throw err;
                }
            }

            // Attach stream to video element

            videoEl.srcObject = stream;

            // Wait for video to be ready
            try {
                await videoEl.play();
            } catch (playErr) {
                // Sometimes mobile needs user interaction, but we'll try anyway
            }

            // Store stream for cleanup
            setScannerStream(stream);

            // Reset previous reader state
            try {
                codeReaderRef.current.reset();
            } catch (e) {
            }

            // Single decode callback for consistency
            let frameCount = 0;
            const onDecodeResult = (result, error) => {
                frameCount++;
                if (frameCount % 30 === 0) { // Log every 30 frames to reduce noise
                }

                if (result) {
                    const detectedValue = result.getText();
                    const barcodeFormat = result.getBarcodeFormat();
                    const upperValue = detectedValue.toUpperCase();
                    setSearchKeyword(upperValue);
                    stopBarcodeScanning();

                    addToast({
                        title: '✅ Barcode Detected!',
                        description: `Controller: ${upperValue}`,
                        variant: 'success'
                    });

                    // Vibrate on mobile if supported
                    if (navigator.vibrate) {
                        navigator.vibrate([200, 100, 200]);
                    }
                } else if (frameCount % 30 === 0) {
                }

                if (error) {
                    if (error instanceof NotFoundException) {
                        // Normal - no barcode in this frame
                    } else if (frameCount % 30 === 0) {
                        console.warn('⚠️ Decode error:', error.name, error.message);
                    }
                }
            };
            try {
                if (chosenId) {
                    await codeReaderRef.current.decodeFromVideoDevice(chosenId, videoEl, onDecodeResult);
                } else {
                    await codeReaderRef.current.decodeFromVideoElement(videoEl, onDecodeResult);
                }
            } catch (decodeErr) {
                console.error('❌ Failed to start decoder:', decodeErr);
                throw decodeErr;
            }

        } catch (error) {
            console.error('❌ Barcode scanning error:', error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);

            let errorMessage = 'Could not start barcode scanner.';
            const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            if (error.name === 'NotAllowedError') {
                errorMessage = isMobile
                    ? 'Camera permission denied. Please allow camera access and try again.'
                    : 'Camera permission denied. Please allow camera access in your browser settings.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No camera found on this device.';
            } else if (error.name === 'NotReadableError') {
                errorMessage = 'Camera is already in use by another application.';
            } else if (error.name === 'OverconstrainedError') {
                errorMessage = 'Camera constraints not supported on this device.';
            } else if (error.name === 'NotSupportedError') {
                errorMessage = isMobile
                    ? 'Camera not supported. Please try Chrome or Safari mobile browser.'
                    : 'Camera not supported by this browser.';
            } else if (error.message) {
                errorMessage = `${error.message}`;
            }

            addToast({
                title: 'Scanner Error',
                description: errorMessage,
                variant: 'error'
            });
            setIsScanning(false);
        }
    };

    // Stop barcode scanning
    const stopBarcodeScanning = () => {

        try {
            if (codeReaderRef.current) {
                try { codeReaderRef.current.reset(); } catch (e) { console.warn('codeReader reset failed', e); }
                // Do not null here in case we want to re-use instance quickly; but you can set to null safely
                codeReaderRef.current = null;
            }

            if (scannerStream) {
                scannerStream.getTracks().forEach(track => {
                    try {
                        track.stop();
                    } catch (e) { console.warn('Error stopping track', e); }
                });
                setScannerStream(null);
            }

            if (scannerVideoRef.current) {
                scannerVideoRef.current.srcObject = null;
                try { scannerVideoRef.current.pause(); } catch (e) { }
            }
        } catch (error) {
            console.error('Error stopping scanner:', error);
        } finally {
            setIsScanning(false);
        }
    };

 


    // Handle user selects a different camera from dropdown
    const handleDeviceChange = async (e) => {
        const newDeviceId = e.target.value || null;
        if (codeReaderRef.current) {
            try {
                codeReaderRef.current.reset();
            } catch (err) {
                console.warn('Error resetting reader:', err);
            }
        }

        if (scannerStream) {
            scannerStream.getTracks().forEach(track => {
                track.stop();
            });
            setScannerStream(null);
        }

        if (scannerVideoRef.current) {
            scannerVideoRef.current.srcObject = null;
        }

        // Update selected device
        setSelectedDeviceId(newDeviceId);

        // Wait a bit for resources to be fully released, then start new camera
        await new Promise(resolve => setTimeout(resolve, 500));
        await startBarcodeScanning(newDeviceId);
    };

    // When scanning modal opens, list devices and start scanning with selected device
    useEffect(() => {
        if (isScanning) {
            // Populate device list (will set selectedDeviceId if empty)
            listVideoInputDevices().then(() => {
                // start scanner with the selected device (if any)
                startBarcodeScanning(selectedDeviceId);
            });
        } else {
            // When scanner is closed, cleanup
            stopBarcodeScanning();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isScanning]);

    // NEW: Ensure camera stream is attached to video element when it's available
    useEffect(() => {
        if (cameraStream && cameraVideoRef.current && isCameraOpen) {
             cameraVideoRef.current.srcObject = cameraStream;
            cameraVideoRef.current.play().then(() => {
             }).catch(err => {
             });
        }
    }, [cameraStream, isCameraOpen]);

    // NEW: Ensure video recording stream is attached
    useEffect(() => {
        if (videoRecordingStream && videoRecordingVideoRef.current && isVideoRecording) {
             videoRecordingVideoRef.current.srcObject = videoRecordingStream;
            videoRecordingVideoRef.current.play().then(() => {
             }).catch(err => {
                console.error('❌ Error playing video:', err);
            });
        }
    }, [videoRecordingStream, isVideoRecording]);

    // Handle form submission
    const handleSubmit = async () => {
        // Validate photos
        if (photos.length < requiredPhotos.length) {
            addToast({
                title: 'Photos Required',
                description: `Please upload all required photos (${requiredPhotos.join(', ')})`,
                variant: 'warning'
            });
            return;
        }

        // Check that all photos have a label
        const labels = photos.map(p => p.label && p.label.trim());
        if (labels.some(l => !l)) {
            addToast({
                title: 'Label Required',
                description: 'Please select a label for each photo before submitting.',
                variant: 'warning'
            });
            return;
        }
        // Check for duplicate labels
        const labelSet = new Set(labels);
        if (labelSet.size !== requiredPhotos.length) {
            addToast({
                title: 'Unique Labels Required',
                description: 'Each required photo must have a unique label.',
                variant: 'warning'
            });
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('controllerNo', searchedTicket?.controllerNo || '');

            // Add photos
            photos.forEach((photo, index) => {
                formData.append('photos', photo.file);
                // Store label in a separate field or filename
                if (photo.label) {
                    formData.append(`photoLabels[${index}]`, photo.label);
                }
            });

            // Add videos if any
            videos.forEach(video => {
                formData.append('videos', video.file);
            });

            // Add audio if any
            if (audioRecording) {
                formData.append('audio', audioRecording.file);
            }

            const response = await axios.post(
                `${API_URL}/milestones/receive-controller`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    },
                    withCredentials: true
                }
            );

            addToast({
                title: 'Success!',
                description: `Controller ${searchedTicket?.controllerNo || searchedTicket?.ticketCode} received successfully at service center`,
                variant: 'success'
            });

            // Reset form
            resetForm();
        } catch (error) {
            console.error('Submission error:', error);
            addToast({
                title: 'Submission Failed',
                description: error.response?.data?.message || 'Failed to receive controller',
                variant: 'error'
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setSearchKeyword('');
        setSearchedTicket(null);

        // Clean up object URLs
        photos.forEach(photo => {
            if (photo.preview) URL.revokeObjectURL(photo.preview);
        });
        videos.forEach(video => {
            if (video.preview) URL.revokeObjectURL(video.preview);
        });
        if (audioRecording?.preview) {
            URL.revokeObjectURL(audioRecording.preview);
        }

        setPhotos([]);
        setVideos([]);
        setAudioRecording(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Main content - spans 2 columns */}
                <div className="lg:col-span-2">
                    <Card className="px-4 py-5 space-y-4">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2"
                        >
                            <div className="flex items-center gap-2">
                                <Package className="w-8 h-8 text-blue-600" />
                                <h1 className="font-medium tracking-wide uppercase">
                                    Receive Controller
                                </h1>
                            </div>
                            <p className="text-sm text-gray-600">
                                Scan controller, upload required photos, then add to batch.
                            </p>
                        </motion.div>

                        {/* Search Section */}
                        <div className="space-y-3">
                            <div className="flex gap-2 items-center">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Type 2+ characters to search (Controller No, Ticket Code, IMEI...)"
                                        value={searchKeyword}
                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>

                                <Button
                                    onClick={() => {
                                        if (isScanning) {
                                            stopBarcodeScanning();
                                            setIsScanning(false);
                                        } else {
                                            listVideoInputDevices().then(() => {
                                                setIsScanning(true);
                                                setTimeout(() => startBarcodeScanning(), 300);
                                            });
                                        }
                                    }}
                                    variant={isScanning ? "destructive" : "outline"}
                                    className="gap-1 px-3"
                                    size="medium"
                                >
                                    <ScanLine className="w-4 h-4" />
                                    {isScanning ? 'Stop' : 'Scan'}
                                </Button>

                                <Button
                                    onClick={handleSearch}
                                    disabled={searching || !searchKeyword.trim()}
                                    className="gap-2"
                                >
                                    {searching ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Search className="w-4 h-4" />
                                    )}
                                    {searching ? 'Searching...' : 'Search'}
                                </Button>
                            </div>

                            {/* Ticket Search Results List */}
                            <AnimatePresence>
                                {showTicketsList && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-white border border-gray-200 rounded-lg shadow-sm max-h-64 overflow-y-auto"
                                    >
                                        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <List className="w-4 h-4 text-gray-600" />
                                                <span className="font-medium text-sm">
                                                    Search Results ({ticketsList.length})
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setShowTicketsList(false)}
                                                className="p-1 h-6 w-6"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        
                                        {searching ? (
                                            <div className="p-4 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Searching tickets...
                                            </div>
                                        ) : ticketsList.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500 text-sm">
                                                No tickets found matching your search
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-100">
                                                {ticketsList.map((ticket) => (
                                                    <div
                                                        key={ticket.id}
                                                        className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                                        onClick={() => handleSelectTicket(ticket)}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-sm truncate">
                                                                    {ticket.ticketCode}
                                                                </div>
                                                                <div className="text-xs text-gray-600 mt-1">
                                                                    <div><strong>Customer:</strong> {ticket.customerName}</div>
                                                                    <div><strong>Controller:</strong> {ticket.controllerNo}</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1 ml-3">
                                                                <Badge variant="outline" className="text-xs">
                                                                    {ticket.status}
                                                                </Badge>
                                                                {isTicketInBatch(ticket.id) && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        In Batch
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* If ticket found show details */}
                            <AnimatePresence>
                                {searchedTicket && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                                    >
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                            <div>
                                                <div className="font-semibold">
                                                    Ticket Found: {searchedTicket.ticketCode}
                                                </div>
                                                <div className="text-sm text-blue-800 mt-1">
                                                    <div><strong>Customer:</strong> {searchedTicket.customerName}</div>
                                                    <div><strong>Controller:</strong> {searchedTicket.controllerNo}</div>
                                                    <div className="mt-1">
                                                        <Badge variant="info">{searchedTicket.status}</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <AnimatePresence>
                            {isScanning && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="mt-3"
                                >
                                    <div className="bg-white p-3 rounded shadow">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium">Barcode Scanner</h4>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs">Camera:</label>
                                                <select
                                                    value={selectedDeviceId || ''}
                                                    onChange={handleDeviceChange}
                                                    className="text-sm border rounded px-2 py-1"
                                                >
                                                    {videoDevices.length === 0 && <option value="">Default Camera</option>}
                                                    {videoDevices.map(dev => (
                                                        <option key={dev.deviceId} value={dev.deviceId}>
                                                            {dev.label || `Camera ${dev.deviceId}`}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => { stopBarcodeScanning(); setIsScanning(false); }}
                                                    className="ml-2 text-gray-500"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <video
                                                ref={scannerVideoRef}
                                                className="w-full aspect-video bg-black rounded"
                                                playsInline
                                                muted
                                                autoPlay
                                            />
                                            {!scannerStream && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="text-white text-center">
                                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                                        Loading camera...
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Mobile-Friendly Searched Ticket Info */}
                        {searchedTicket && (
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4 shadow-sm mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold text-green-800 flex items-center">
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Ticket Found
                                    </h3>
                                    <Badge variant={
                                        searchedTicket.status === 'OPEN' ? 'warning' :
                                        searchedTicket.status === 'IN_PROGRESS' ? 'info' :
                                        searchedTicket.status === 'RESOLVED' ? 'success' :
                                        'secondary'
                                    }>
                                        {searchedTicket.status}
                                    </Badge>
                                </div>
                                
                                {/* Mobile optimized info cards */}
                                <div className="space-y-3">
                                    <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <div className="text-xs text-gray-500 mb-1">TICKET CODE</div>
                                        <div className="font-semibold text-gray-900 text-lg">{searchedTicket.ticketCode}</div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <div className="text-xs text-gray-500 mb-1">CONTROLLER NO</div>
                                            <div className="font-medium text-gray-900">{searchedTicket.controllerNo || 'N/A'}</div>
                                        </div>
                                        
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <div className="text-xs text-gray-500 mb-1">IMEI</div>
                                            <div className="font-medium text-gray-900">{searchedTicket.imei || 'N/A'}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <div className="text-xs text-gray-500 mb-1">CLIENT</div>
                                        <div className="font-medium text-gray-900">{searchedTicket.clientName || searchedTicket.customerName}</div>
                                    </div>
                                    
                                    {searchedTicket.description && (
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <div className="text-xs text-gray-500 mb-1">DESCRIPTION</div>
                                            <div className="text-sm text-gray-700 leading-relaxed">{searchedTicket.description}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Photo / Video / Audio Uploader - only show when ticket found */}
                        {searchedTicket && (
                            <div className="space-y-3">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <p className="text-sm text-yellow-800 font-medium mb-2">Required Photos:</p>
                                    <div className="grid grid-cols-2 gap-1 text-xs text-yellow-700">
                                        {requiredPhotos.map((label, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full" />
                                                {label}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <input
                                    ref={photoInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handlePhotoSelect}
                                    className="hidden"
                                />
                                <input
                                    ref={videoInputRef}
                                    type="file"
                                    accept="video/*"
                                    multiple
                                    onChange={handleVideoSelect}
                                    className="hidden"
                                />

                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        onClick={openCameraForCapture}
                                        variant="default"
                                        className="w-full gap-2"
                                    >
                                        <Camera className="w-4 h-4" />
                                        Capture Photos
                                    </Button>
                                    <Button
                                        onClick={() => photoInputRef.current?.click()}
                                        variant="outline"
                                        className="w-full gap-2"
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                        Upload Photos
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        onClick={startVideoRecording}
                                        variant="outline"
                                        className="w-full gap-2"
                                    >
                                        <Video className="w-4 h-4" />
                                        Record Video
                                    </Button>
                                    <Button
                                        onClick={isRecording ? stopRecording : startRecording}
                                        variant={isRecording ? 'destructive' : 'outline'}
                                        className="w-full gap-2"
                                    >
                                        <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
                                        {isRecording ? 'Stop Recording' : 'Record Audio'}
                                    </Button>
                                </div>

                                {/* Validation Summary */}
                                {searchedTicket && (
                                    <div className="bg-gray-50 p-3 rounded-lg border">
                                        <h4 className="text-sm font-medium mb-2 text-gray-700">Validation Status</h4>
                                        <div className="space-y-1 text-sm">
                                            <div className={`flex items-center gap-2 ${
                                                photos.length >= 4 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                <span className="text-xs">{photos.length >= 4 ? '✓' : '✗'}</span>
                                                Photos: {photos.length}/4 minimum required
                                            </div>
                                            <div className={`flex items-center gap-2 ${
                                                photos.every(photo => photo.label) ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                <span className="text-xs">{photos.every(photo => photo.label) ? '✓' : '✗'}</span>
                                                All photos labeled: {photos.filter(photo => photo.label).length}/{photos.length}
                                            </div>
                                            <div className="ml-4 space-y-1">
                                                {requiredPhotos.map(required => {
                                                    const hasPhoto = photos.some(photo => photo.label === required);
                                                    return (
                                                        <div key={required} className={`flex items-center gap-2 text-xs ${
                                                            hasPhoto ? 'text-green-600' : 'text-gray-500'
                                                        }`}>
                                                            <span>{hasPhoto ? '✓' : '○'}</span>
                                                            {required}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Media Preview Grid */}
                                {(photos.length > 0 || videos.length > 0 || audioRecording) && (
                                    <div className="space-y-3">
                                        {photos.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Photos ({photos.length}/4)</h4>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {photos.map((photo) => (
                                                        <div key={photo.id} className="relative group">
                                                            <img
                                                                src={photo.preview}
                                                                alt="Controller"
                                                                className="w-full h-20 object-cover rounded border-2 border-gray-200"
                                                            />
                                                            <button
                                                                onClick={() => removePhoto(photo.id)}
                                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                            <select
                                                                value={photo.label}
                                                                onChange={(e) => updatePhotoLabel(photo.id, e.target.value)}
                                                                className={`mt-1 w-full text-xs border rounded px-1 py-0.5 ${
                                                                    !photo.label ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                                }`}
                                                                required
                                                            >
                                                                <option value="">Select label...</option>
                                                                {requiredPhotos.map(label => (
                                                                    <option key={label} value={label}>{label}</option>
                                                                ))}
                                                            </select>
                                                            {!photo.label && (
                                                                <p className="text-xs text-red-500 mt-1">Label required</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {videos.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Videos ({videos.length})</h4>
                                                <div className="space-y-1">
                                                    {videos.map((video) => (
                                                        <div key={video.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                                                            <Video className="w-4 h-4 text-gray-400" />
                                                            <span className="flex-1 truncate">{video.file.name}</span>
                                                            <button
                                                                onClick={() => removeVideo(video.id)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {audioRecording && (
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Audio Recording</h4>
                                                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                                    <Mic className="w-4 h-4 text-gray-400" />
                                                    <audio controls src={audioRecording.preview} className="flex-1" />
                                                    <button
                                                        onClick={removeAudio}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}


                                <div className="pt-3 flex gap-3">
                                    <Button onClick={resetForm} variant="outline" className="flex-1">
                                        Reset
                                    </Button>
                                    <Button
                                        onClick={addToBatch}
                                        className="flex-1"
                                        disabled={!searchedTicket || photos.length === 0 || photos.some(photo => !photo.label)}
                                    >
                                        <Package className="w-4 h-4" />
                                        {!searchedTicket 
                                            ? 'Search Ticket First'
                                            : photos.length === 0 
                                            ? 'Capture Photos First'
                                            : photos.some(photo => !photo.label)
                                            ? 'Select All Labels'
                                            : 'Add to Batch'
                                        }
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right side: Batch Card */}
                <div className="lg:col-span-1">
                    <Card className="p-4 space-y-4 h-fit sticky top-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <List className="w-5 h-5 text-blue-600" />
                                    Current Batch
                                </h3>
                                {currentBatch && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        {currentBatch.batchCode}
                                    </p>
                                )}
                            </div>
                            {loadingBatch && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                        </div>

                        {currentBatch ? (
                            <div className="space-y-3">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="text-sm text-blue-800 font-medium">
                                        {currentBatch.batchItems?.length || 0} tickets in batch
                                    </div>
                                </div>


                                {/* Batch Items List */}
                                {currentBatch.batchItems?.length > 0 ? (
                                    <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                                        <div className="text-sm font-medium text-gray-700">
                                            Tickets:
                                        </div>
                                        {currentBatch.batchItems.map(item => (
                                            <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm truncate">
                                                        {item.ticket?.ticketCode}
                                                    </div>
                                                    <div className="text-xs text-gray-600 truncate">
                                                        Controller: {item.ticket?.controllerNo}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate">
                                                        Customer: {item.ticket?.customerName}
                                                    </div>
                                                </div>
                                                                                        <div className="flex items-center gap-1">                                                  
                                                    {batchItemPhotos[item.ticket?.id]?.length > 0 && (
                                                        <div className="text-xs bg-green-100 text-green-700 px-1 rounded">
                                                            {batchItemPhotos[item.ticket?.id].length}
                                                        </div>
                                                    )}
                                                    <Button
                                                        variant="default"
                                                        size="xs"
                                                        onClick={() => viewTicketImages(item.ticket?.id)}
                                                        className="p-1 h-6 w-6 text-white"
                                                        title="View Images"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="xs"
                                                        onClick={() => removeTicketFromBatchHandler(item.ticket?.id)}
                                                         title="Remove from batch"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 text-sm py-4">
                                        No tickets in batch yet
                                    </div>
                                )}
                                
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                       {/*  <Button 
                                            onClick={clearBatch} 
                                            variant="outline" 
                                            size="small" 
                                            disabled={!currentBatch?.batchItems?.length}
                                            className="flex-1"
                                        >
                                            Clear
                                        </Button> */}
                                        {currentBatch?.batchItems?.length > 0 && (
                                        <Button 
                                            onClick={markAllAsReceived} 
                                            variant={currentBatch?.batchItems?.length ? 'default' : 'ghost'} 
                                            size="small" 
                                            disabled={!currentBatch?.batchItems?.length}
                                            className="flex-1"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Mark as Completed
                                        </Button>
                                        )}
                                    </div>
 
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-4">
                                <div className="text-sm">Loading batch...</div>
                            </div>
                        )}
                    </Card>

                    {/* Completed Batches Section */}
                    <Card className="bg-white border-l-4 border-l-green-500 my-4">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-sm flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        Completed Batches
                                    </h3>
                                    <p className="text-xs text-gray-600 mt-1">
                                        View previously completed batches
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => setShowCompletedBatches(!showCompletedBatches)}
                                        variant="outline"
                                        size="xs"
                                    >
                                        {showCompletedBatches ? 'Hide' : 'Show'}
                                    </Button>
                                    <Button
                                        onClick={loadCompletedBatches}
                                        variant="outline"
                                        size="xs"
                                        disabled={loadingCompletedBatches}
                                    >
                                        {loadingCompletedBatches ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <RefreshCw className="w-3 h-3" />
                                        )}
                                        Refresh
                                    </Button>
                                </div>
                            </div>

                            {showCompletedBatches && (
                                <div className="space-y-3">
                                    {completedBatches.length > 0 ? (
                                        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                                            {completedBatches.map(batch => (
                                                <div key={batch.id} className="border border-gray-200 rounded-lg p-3">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div>
                                                            <div className="font-medium text-sm text-gray-900">
                                                                {batch.batchCode}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                Completed: {new Date(batch.updatedAt).toLocaleDateString()} {new Date(batch.updatedAt).toLocaleTimeString()}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm font-medium text-green-600">
                                                                COMPLETED
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {batch.batchItems?.length || 0} tickets
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {batch.batchItems && batch.batchItems.length > 0 && (
                                                        <div className="mt-2 pt-2 border-t border-gray-100">
                                                            <div className="text-xs text-gray-600 mb-1">Tickets:</div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {batch.batchItems.slice(0, 3).map(item => (
                                                                    <span key={item.id} className="inline-block px-2 py-1 bg-gray-100 text-xs rounded">
                                                                        {item.ticket.ticketCode}
                                                                    </span>
                                                                ))}
                                                                {batch.batchItems.length > 3 && (
                                                                    <span className="inline-block px-2 py-1 bg-gray-100 text-xs rounded">
                                                                        +{batch.batchItems.length - 3} more
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-500 py-4">
                                            <div className="text-sm">No completed batches found</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Camera Capture Modal */}
            <AnimatePresence>
                {isCameraOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Camera className="w-5 h-5 text-blue-600" />
                                    Capture Photo {currentPhotoIndex + 1}/4
                                </h2>
                                <button
                                    onClick={closeCameraCapture}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-4 space-y-4">
                                {/* Current photo label */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-sm font-medium text-blue-900">
                                        Currently capturing: <span className="font-bold">{requiredPhotos[currentPhotoIndex]}</span>
                                    </p>
                                </div>

                                {/* Video preview */}
                                <div className="relative">
                                    <video
                                        ref={cameraVideoRef}
                                        className="w-full aspect-video bg-black rounded-lg"
                                        playsInline
                                        muted
                                        autoPlay
                                    />

                                    {/* Capture guide overlay */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-dashed border-white rounded-lg w-4/5 h-3/4 opacity-50"></div>
                                    </div>

                                    {!cameraStream && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
                                            <div className="text-white text-center">
                                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                                <p className="text-sm">Loading camera...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Instructions */}
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-sm text-gray-700">
                                        📸 Position the <strong>{requiredPhotos[currentPhotoIndex]}</strong> within the frame and tap capture
                                    </p>
                                </div>

                                {/* Capture button */}
                                <Button
                                    onClick={capturePhoto}
                                    disabled={!cameraStream}
                                    className="w-full gap-2 py-6 text-lg"
                                    size="large"
                                >
                                    <Camera className="w-6 h-6" />
                                    Capture Photo {currentPhotoIndex + 1}/4
                                </Button>

                                {/* Progress indicator */}
                                <div className="flex justify-center gap-2">
                                    {requiredPhotos.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`w-3 h-3 rounded-full transition-colors ${idx < currentPhotoIndex
                                                    ? 'bg-green-500'
                                                    : idx === currentPhotoIndex
                                                        ? 'bg-blue-500 animate-pulse'
                                                        : 'bg-gray-300'
                                                }`}
                                        />
                                    ))}
                                </div>

                                {/* Remaining photos list */}
                                <div className="border-t pt-3">
                                    <p className="text-xs font-medium text-gray-600 mb-2">Photos to capture:</p>
                                    <div className="space-y-1">
                                        {requiredPhotos.map((label, idx) => (
                                            <div
                                                key={idx}
                                                className={`text-sm flex items-center gap-2 ${idx < currentPhotoIndex
                                                        ? 'text-green-600 line-through'
                                                        : idx === currentPhotoIndex
                                                            ? 'text-blue-600 font-medium'
                                                            : 'text-gray-500'
                                                    }`}
                                            >
                                                {idx < currentPhotoIndex ? (
                                                    <CheckCircle className="w-4 h-4" />
                                                ) : idx === currentPhotoIndex ? (
                                                    <Camera className="w-4 h-4" />
                                                ) : (
                                                    <div className="w-4 h-4 border-2 border-gray-400 rounded-full" />
                                                )}
                                                {label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Video Recording Modal */}
            <AnimatePresence>
                {isVideoRecording && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Video className="w-5 h-5 text-red-600 animate-pulse" />
                                    Recording Video
                                </h2>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-full">
                                        <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                                        <span className="text-sm font-mono font-medium text-red-600">
                                            {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                                        </span>
                                    </div>
                                    <button
                                        onClick={cancelVideoRecording}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 space-y-4">
                                {/* Video preview */}
                                <div className="relative">
                                    <video
                                        ref={videoRecordingVideoRef}
                                        className="w-full aspect-video bg-black rounded-lg"
                                        playsInline
                                        muted
                                        autoPlay
                                    />

                                    {/* Recording indicator overlay */}
                                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-full shadow-lg">
                                        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                                        <span className="text-sm font-medium">REC</span>
                                    </div>

                                    {!videoRecordingStream && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
                                            <div className="text-white text-center">
                                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                                <p className="text-sm">Starting camera...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Instructions */}
                                <div className="bg-blue-50 rounded-lg p-3">
                                    <p className="text-sm text-blue-900">
                                        🎥 Recording in progress. Tap "Stop Recording" when done.
                                    </p>
                                </div>

                                {/* Control buttons */}
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        onClick={cancelVideoRecording}
                                        variant="outline"
                                        className="w-full gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancel
                                    </Button>

                                    <Button
                                        onClick={() => {
                                            if (videoRecorderRef.current && videoRecorderRef.current.state === 'recording') {
                                                videoRecorderRef.current.stop();
                                            }
                                        }}
                                        disabled={!videoRecordingStream}
                                        variant="danger"
                                        className="w-full gap-2 py-6 text-lg bg-red-600 hover:bg-red-700"
                                    >
                                        <div className="w-6 h-6 bg-white rounded"></div>
                                        Stop Recording
                                    </Button>
                                </div>

                                {/* Recording time indicator */}
                                <div className="text-center">
                                    <p className="text-xs text-gray-500">
                                        Recording time: {Math.floor(recordingTime / 60)}m {recordingTime % 60}s
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Image Viewer Modal */}
            <AnimatePresence>
                {viewingImages && currentBatchImages.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/25"
                        onClick={closeImageViewer}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-4xl max-h-[calc(100vh-4rem)] bg-white rounded-lg overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                                <div>
                                    <h3 className="font-semibold text-lg">
                                        Ticket Images
                                        {currentBatchImages[currentImageIndex]?.isLocal 
                                            ? ' - Local Photos' 
                                            : ' - Milestone Attachments'
                                        }
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {currentImageIndex + 1} of {currentBatchImages.length}
                                    </p>
                                </div>
                                <Button
                                    onClick={closeImageViewer}
                                    variant="ghost"
                                    size="small"
                                    className="p-2"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Image Display */}
                            <div className="relative min-h-40">
                                <img
                                    src={currentBatchImages[currentImageIndex]?.isLocal 
                                        ? currentBatchImages[currentImageIndex]?.fileUrl 
                                        : `${import.meta.env.VITE_API_URL}${currentBatchImages[currentImageIndex]?.fileUrl}`
                                    }
                                    alt={currentBatchImages[currentImageIndex]?.fileName || 'Ticket image'}
                                    className="max-w-full max-h-[70vh] object-contain mx-auto"
                                />
                                
                                {/* Navigation Buttons */}
                                {currentBatchImages.length > 1 && (
                                    <>
                                        <Button
                                            onClick={prevImage}
                                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/25 hover:bg-opacity-70 text-white"
                                            size="small"
                                        >
                                            ‹
                                        </Button>
                                        <Button
                                            onClick={nextImage}
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/25 hover:bg-opacity-70 text-white"
                                            size="small"
                                        >
                                            ›
                                        </Button>
                                    </>
                                )}
                            </div>

                            {/* Image Info */}
                            <div className="p-4 bg-gray-50 border-t">
                                <div className="flex justify-between items-start">
                                    <div className="text-sm flex gap-2 px-2">
                                        <p><strong>Filename:</strong> {currentBatchImages[currentImageIndex]?.fileName}</p>
                                        <p><strong>Type:</strong> {currentBatchImages[currentImageIndex]?.fileType}</p>
                                        <p><strong>Size:</strong> {currentBatchImages[currentImageIndex]?.fileSize ? 
                                            `${Math.round(currentBatchImages[currentImageIndex].fileSize / 1024)} KB` : 'Unknown'}</p>
                                        {currentBatchImages[currentImageIndex]?.createdAt && (
                                            <p><strong>Uploaded:</strong> {new Date(currentBatchImages[currentImageIndex].createdAt).toLocaleDateString()}</p>
                                        )}
                                    </div>
                                    <Button
                                        onClick={() => {
                                            const attachment = currentBatchImages[currentImageIndex];
                                            const link = document.createElement('a');
                                            link.href = attachment.isLocal 
                                                ? attachment.fileUrl 
                                                : `${import.meta.env.VITE_API_URL}${attachment.fileUrl}`;
                                            link.download = attachment.fileName;
                                            link.target = '_blank';
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }}
                                        variant="outline"
                                        size="small"
                                        className="flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReceiveController;
