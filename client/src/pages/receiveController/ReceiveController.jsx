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
    ScanLine
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import Input from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../components/ui/toast';
import { useAuth } from '../../lib/hooks/useAuth';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const ReceiveController = () => {
    const { token } = useAuth();
    const toastContext = useToast();

    // Safe toast function with fallback
    const addToast = toastContext?.addToast || ((toast) => {
        console.warn('Toast not available:', toast);
    });

    const [controllerNo, setControllerNo] = useState('');
    const [searchedTicket, setSearchedTicket] = useState(null);
    const [searching, setSearching] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [photos, setPhotos] = useState([]);
    const [videos, setVideos] = useState([]);
    const [audioRecording, setAudioRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scannerStream, setScannerStream] = useState(null);

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

    // Search ticket by controller number
    const handleSearch = useCallback(async () => {
        if (!controllerNo.trim()) {
            addToast({
                title: 'Input Required',
                description: 'Please enter a controller number',
                variant: 'warning'
            });
            return;
        }

        setSearching(true);
        try {
            const response = await axios.get(
                `${API_URL}/tickets/search/controller/${encodeURIComponent(controllerNo.trim())}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true
                }
            );

            setSearchedTicket(response.data);
            addToast({
                title: 'Ticket Found',
                description: `Ticket ${response.data.ticketCode} found`,
                variant: 'success'
            });
        } catch (error) {
            console.error('Search error:', error);
            setSearchedTicket(null);
            addToast({
                title: 'Not Found',
                description: error.response?.data?.message || 'No ticket found with this controller number',
                variant: 'error'
            });
        } finally {
            setSearching(false);
        }
    }, [controllerNo, token, addToast]);

    // Handle photo upload
    const handlePhotoSelect = (e) => {
        const files = Array.from(e.target.files || []);
        const newPhotos = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            label: '',
            id: Math.random().toString(36)
        }));
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
        if (!cameraVideoRef.current || !cameraStream) return;

        const video = cameraVideoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            const file = new File([blob], `${requiredPhotos[currentPhotoIndex]}-${Date.now()}.jpg`, { type: 'image/jpeg' });
            const newPhoto = {
                file,
                preview: URL.createObjectURL(blob),
                label: requiredPhotos[currentPhotoIndex],
                id: Math.random().toString(36)
            };

            setPhotos(prev => [...prev, newPhoto]);

            addToast({
                title: 'Photo Captured',
                description: `${requiredPhotos[currentPhotoIndex]} captured`,
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

    // Update photo label
    const updatePhotoLabel = (photoId, label) => {
        setPhotos(prev => prev.map(p =>
            p.id === photoId ? { ...p, label } : p
        ));
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
                    setControllerNo(upperValue);
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

    // Handle scanner fallback - just show error and close scanner
    const handleScannerFallback = (errorMessage) => {
        addToast({
            title: 'Scanner Not Available',
            description: errorMessage,
            variant: 'error'
        });
        setIsScanning(false);
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
            formData.append('controllerNo', controllerNo.trim());

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
                description: `Controller ${controllerNo} received successfully at service center`,
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
        setControllerNo('');
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

            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                >
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Package className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                        <h1 className="text-xl sm:text-2xl tracking-widest font-bold text-gray-900 uppercase">Receive Controller</h1>
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 px-5">
                        Scan or enter controller serial number to receive at service center
                    </p>
                </motion.div>

                {/* Search Section */}
                <Card className="p-4 sm:p-6">
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex gap-2 flex-1">
                                <div className="flex-1 relative">
                                    <Input
                                        type="text"
                                        placeholder="Enter or scan controller serial number..."
                                        value={controllerNo}
                                        onChange={(e) => setControllerNo(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        autoFocus
                                        className="pr-12"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    onClick={(e) => {
                                         e.preventDefault();

                                        if (isScanning) {
                                            stopBarcodeScanning();
                                            setIsScanning(false);
                                        } else {
                                            // Ensure devices are listed and start scanning
                                            listVideoInputDevices().then(() => {
                                                setIsScanning(true);
                                                // Auto-start barcode scanner
                                                setTimeout(() => startBarcodeScanning(), 300);
                                            });
                                        }
                                    }}
                                    variant={isScanning ? "destructive" : "outline"}
                                    size="medium"
                                    className="gap-1 px-3"
                                    title={isScanning ? "Stop Barcode Scanner" : "Start Barcode Scanner"}
                                >
                                    <ScanLine className="w-4 h-4" />
                                    {isScanning ? 'Stop' : 'Scan'}
                                </Button>
                            </div>
                            <Button
                                onClick={handleSearch}
                                disabled={searching || !controllerNo.trim()}
                                className="gap-2 w-full sm:w-auto"
                                size="medium"
                            >
                                {searching ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Search className="w-4 h-4" />
                                )}
                                Search
                            </Button>
                        </div>

                        {/* Ticket Info */}
                        <AnimatePresence>
                            {searchedTicket && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-blue-900">
                                                Ticket Found: {searchedTicket.ticketCode}
                                            </h3>
                                            <div className="mt-2 text-sm text-blue-800 space-y-1">
                                                <p><strong>Customer:</strong> {searchedTicket.customerName}</p>
                                                <p><strong>Controller No:</strong> {searchedTicket.controllerNo}</p>
                                                <p><strong>Description:</strong> {searchedTicket.description}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <strong>Status:</strong>
                                                    <Badge variant="info">{searchedTicket.status}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </Card>

                {/* Barcode Scanner Modal */}
                <AnimatePresence>
                    {isScanning && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white rounded-lg p-4 max-w-md w-full mx-4"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Barcode Scanner</h3>
                                    <button
                                        onClick={() => { stopBarcodeScanning(); setIsScanning(false); }}
                                        className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="relative">
                                    <video
                                        ref={scannerVideoRef}
                                        className="w-full aspect-video bg-black rounded-lg"
                                        playsInline
                                        muted
                                        autoPlay
                                    />

                                    {/* Scanning overlay with target area */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                            <div className="w-64 h-40 sm:w-80 sm:h-48 border-4 border-green-500 border-dashed rounded-lg animate-pulse bg-green-500/10">
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-white text-sm font-bold whitespace-nowrap bg-green-600 px-4 py-2 rounded-lg shadow-lg">
                                                    📷 Hold barcode here (6-12 inches away)
                                                </div>
                                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-white text-xs whitespace-nowrap bg-black/70 px-3 py-1 rounded">
                                                    Ensure good lighting
                                                </div>
                                            </div>
                                        </div>

                                        {/* Corner guides */}
                                        <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-green-400"></div>
                                        <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-green-400"></div>
                                        <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-green-400"></div>
                                        <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-green-400"></div>
                                    </div>

                                    {/* Loading indicator */}
                                    {!scannerStream && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
                                            <div className="text-white text-center">
                                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                                <p className="text-sm">Loading camera...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 space-y-3">
                                    {/* NEW: Camera selection dropdown */}
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-gray-700">Camera:</label>
                                        <select
                                            value={selectedDeviceId || ''}
                                            onChange={handleDeviceChange}
                                            className="ml-2 text-sm border rounded px-2 py-1"
                                        >
                                            {/* If no devices yet, show placeholder */}
                                            {videoDevices.length === 0 && <option value="">Default Camera</option>}
                                            {videoDevices.map(dev => (
                                                <option key={dev.deviceId} value={dev.deviceId}>
                                                    {dev.label || `Camera ${dev.deviceId}`}
                                                </option>
                                            ))}
                                        </select>

                                        {/* Manual refresh devices */}
                                        <button
                                            onClick={() => listVideoInputDevices()}
                                            className="ml-auto text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                                            type="button"
                                        >
                                            Refresh
                                        </button>
                                    </div>

                                    <div className="text-center">
                                        <div className="inline-flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-full">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            Scanning for barcodes...
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            onClick={() => {
                                                const manualValue = prompt('Please enter controller number manually:');
                                                if (manualValue && manualValue.trim()) {
                                                    setControllerNo(manualValue.trim().toUpperCase());
                                                    stopBarcodeScanning();
                                                    setIsScanning(false);
                                                    addToast({
                                                        title: 'Manual Entry',
                                                        description: 'Controller number entered manually',
                                                        variant: 'success'
                                                    });
                                                }
                                            }}
                                            variant="outline"
                                            className="gap-1"
                                            size="medium"
                                        >
                                            <ScanLine className="w-4 h-4" />
                                            Manual
                                        </Button>

                                        <Button
                                            onClick={() => { stopBarcodeScanning(); setIsScanning(false); }}
                                            variant="outline"
                                            size="medium"
                                        >
                                            Cancel
                                        </Button>
                                    </div>

                                    <p className="text-xs text-gray-600 text-center">
                                        Position the barcode within the red frame for automatic detection,
                                        <br />
                                        or use "Manual" to enter the number directly.
                                    </p>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Photo Upload Section */}
                {searchedTicket && (
                    <>
                        <Card className="p-4 sm:p-6">
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                                        <Camera className="w-5 h-5 text-blue-600" />
                                        Upload Photos (Mandatory)
                                    </h2>
                                    <Badge variant={photos.length >= 4 ? 'success' : 'warning'} size="small">
                                        {photos.length}/4 Required
                                    </Badge>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <p className="text-sm text-yellow-800 font-medium mb-2">
                                        Required Photos:
                                    </p>
                                    <ul className="text-sm text-yellow-700 space-y-1">
                                        {requiredPhotos.map((label, idx) => (
                                            <li key={idx} className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full" />
                                                {label}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <input
                                    ref={photoInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handlePhotoSelect}
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
                                        Upload Files
                                    </Button>
                                </div>

                                {/* Photo Grid */}
                                {photos.length > 0 && (
                                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                        {photos.map((photo) => (
                                            <div key={photo.id} className="relative group">
                                                <img
                                                    src={photo.preview}
                                                    alt="Controller"
                                                    className="w-full h-24 sm:h-32 object-cover rounded-lg border-2 border-gray-200"
                                                />
                                                <button
                                                    onClick={() => removePhoto(photo.id)}
                                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <select
                                                    value={photo.label}
                                                    onChange={(e) => updatePhotoLabel(photo.id, e.target.value)}
                                                    className="mt-2 w-full text-xs border rounded px-2 py-1"
                                                >
                                                    <option value="">Select label...</option>
                                                    {requiredPhotos.map(label => (
                                                        <option key={label} value={label}>{label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Video Upload Section (Optional) */}
                        <Card className="p-4 sm:p-6">
                            <div className="space-y-4">
                                <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                                    <Video className="w-5 h-5 text-blue-600" />
                                    Upload Videos (Optional)
                                </h2>

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
                                        onClick={startVideoRecording}
                                        variant="default"
                                        className="w-full gap-2"
                                    >
                                        <Video className="w-4 h-4" />
                                        Record Video
                                    </Button>

                                    <Button
                                        onClick={() => videoInputRef.current?.click()}
                                        variant="outline"
                                        className="w-full gap-2"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Upload Files
                                    </Button>
                                </div>

                                {videos.length > 0 && (
                                    <div className="space-y-2">
                                        {videos.map((video) => (
                                            <div key={video.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                <Video className="w-8 h-8 text-gray-400" />
                                                <span className="flex-1 text-sm truncate">{video.file.name}</span>
                                                <button
                                                    onClick={() => removeVideo(video.id)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Audio Recording Section (Optional) */}
                        <Card className="p-4 sm:p-6">
                            <div className="space-y-4">
                                <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                                    <Mic className="w-5 h-5 text-blue-600" />
                                    Voice Note (Optional)
                                </h2>

                                {!audioRecording ? (
                                    <Button
                                        onClick={isRecording ? stopRecording : startRecording}
                                        variant={isRecording ? 'danger' : 'outline'}
                                        className="w-full gap-2"
                                    >
                                        <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
                                        {isRecording ? 'Stop Recording' : 'Start Recording'}
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <Mic className="w-8 h-8 text-gray-400" />
                                        <audio controls src={audioRecording.preview} className="flex-1" />
                                        <button
                                            onClick={removeAudio}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Submit Button */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={resetForm}
                                variant="outline"
                                className="flex-1 w-full"
                                disabled={submitting}
                                size="medium"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                className="flex-1 w-full gap-2"
                                disabled={submitting || photos.length < 4}
                                size="medium"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Receive Controller
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                )}
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
        </div>
    );
};

export default ReceiveController;
