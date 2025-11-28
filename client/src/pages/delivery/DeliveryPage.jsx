import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import {
    Package,
    CheckCircle,
    AlertCircle,
    Search,
    X,
    ScanLine,
    Loader2,
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

const DeliveryPage = () => {
    const { token } = useAuth();
    const { fetchTickets, tickets, searching, updateMilestone } = useTickets();
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
    const [isScanning, setIsScanning] = useState(false);
    const [scannerStream, setScannerStream] = useState(null);

    // Completed batches state
    const [completedBatches, setCompletedBatches] = useState([]);
    const [showCompletedBatches, setShowCompletedBatches] = useState(false);
    const [loadingCompletedBatches, setLoadingCompletedBatches] = useState(false);

     // Refs for barcode scanning
    const scannerVideoRef = useRef(null);
    const codeReaderRef = useRef(null);

    // Initialize barcode reader
    useEffect(() => {
        if (!codeReaderRef.current) {
            codeReaderRef.current = new BrowserMultiFormatReader();
        }
    }, []);

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

        // Use fetchTickets with search filter for tickets ready for delivery
        fetchTickets({
            skip: 0,
            take: 50,
            filter: {
                search: keyword,
                milestoneStage: 'READY_FOR_DISPATCH' // Filter by milestone stage
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
        addToast({
            title: 'Ticket Selected',
            description: `Selected ticket ${ticket.ticketCode}`,
            variant: 'success'
        });
    }, [addToast]);

    // Add selected ticket to batch for delivery
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

        try {
            // First, create the milestone for delivery
            const milestoneResult = await updateMilestone({
                ticketId: searchedTicket.id,
                milestoneData: {
                    targetStage: 'DELIVERED_TO_FIELD',
                    action: 'transition'
                }
            });

            // Check if milestone creation was successful
            if (milestoneResult.meta.requestStatus === 'fulfilled') {
                // Now add ticket to batch
                await addTicketToBatch(currentBatch.id, searchedTicket.id);
                
                addToast({
                    title: 'Success',
                    description: `Ticket ${searchedTicket.ticketCode} marked for delivery and added to batch`,
                    variant: 'success'
                });
                
                // Reset form after adding to batch
                setSearchedTicket(null);
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
    }, [searchedTicket, currentBatch, isTicketInBatch, addTicketToBatch, addToast, updateMilestone]);    // Remove ticket from batch
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
            const batches = await fetchCompletedBatches('DELIVERY_CONTROLLER');
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
                await getOrCreateActiveBatch('DELIVERY_CONTROLLER');
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
                    milestoneStage: 'READY_FOR_DISPATCH' // Filter by milestone stage
                }
            });
            setShowTicketsList(true);
        } else if (debouncedSearchKeyword.trim().length === 0) {
            // Clear results when search is empty
            setShowTicketsList(false);
            setTicketsList([]);
        }
    }, [debouncedSearchKeyword]); // Remove fetchTickets from dependencies

    // No media functions needed for delivery - tickets are just marked as delivered

    // Batch management functions - simplified for delivery
    const addToBatch = async () => {
        await addTicketToBatchHandler();
    };
 
    const clearBatch = () => {
        // This would require a separate endpoint to close/complete batch
        addToast({
            title: 'Clear Batch',
            description: 'Clear batch functionality needs to be implemented',
            variant: 'warning'
        });
    };

  
    // Batch submission: Mark all as delivered
    const markAllAsDelivered = async () => {
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

        // Build form data with batch information for delivery
        const formData = new FormData();
        formData.append('batchCount', String(batchItems.length));
        formData.append('batchId', String(currentBatch.id));

        console.log('🚀 Building delivery batch FormData:', {
            itemCount: batchItems.length,
            items: batchItems.map((item, idx) => ({
                index: idx,
                controllerNo: item.ticket.controllerNo,
                ticketCode: item.ticket.ticketCode,
                note: 'Delivery milestone already created'
            }))
        });

        batchItems.forEach((item, idx) => {
            // Append item metadata with correct FormData key format
            formData.append(`items[${idx}][ticketCode]`, item.ticket.ticketCode || '');
            formData.append(`items[${idx}][controllerNo]`, item.ticket.controllerNo);

            console.log(`📦 Item ${idx}:`, {
                ticketCode: item.ticket.ticketCode,
                controllerNo: item.ticket.controllerNo,
                note: 'Delivery milestone already created'
            });
        });

        try {
            addToast({
                title: 'Submitting Batch',
                description: `Processing ${batchItems.length} item(s) for delivery`,
                variant: 'info'
            });

            console.log('📤 Sending delivery batch request to:', `${API_URL}/milestones/delivery-batch`);

            const response = await axios.post(
                `${API_URL}/milestones/delivery-batch`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    },
                    withCredentials: true
                }
            );

            console.log('✅ Delivery batch submission successful:', response.data);

            addToast({
                title: 'Success',
                description: `Batch processed: ${response.data?.message || 'All items delivered to field'}`,
                variant: 'success'
            });

            // Cleanup
            clearBatch();
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
                console.log('Item errors:', error.response.data.errors);
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

 
    // Reset form
    const resetForm = () => {
        setSearchKeyword('');
        setSearchedTicket(null);
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
                                    Deliver
                                </h1>
                            </div>
                            <p className="text-sm text-gray-600">
                                Scan or search for controllers ready for field delivery.
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

                        {/* Delivery Action - only show when ticket found */}
                        {searchedTicket && (
                            <div className="space-y-3">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-sm text-blue-800 font-medium mb-2">Ready for Delivery</p>
                                    <p className="text-xs text-blue-700">
                                        This controller has been completed at the service center and is ready to be delivered to the field.
                                    </p>
                                </div>





                                <div className="pt-3 flex gap-3">
                                    <Button onClick={resetForm} variant="outline" className="flex-1">
                                        Reset
                                    </Button>
                                    <Button
                                        onClick={addToBatch}
                                        className="flex-1"
                                        disabled={!searchedTicket}
                                    >
                                        <Package className="w-4 h-4" />
                                        {!searchedTicket ? 'Search Ticket First' : 'Add to Delivery Batch'}
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
                                    Delivery Batch
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
                                             {/*    <div className="flex items-center gap-1">
                                                
                                                    <Button
                                                        variant="danger"
                                                        size="xs"
                                                        onClick={() => removeTicketFromBatchHandler(item.ticket?.id)}
                                                        title="Remove from batch"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </Button>
                                                </div> */}
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
                                                onClick={markAllAsDelivered}
                                                variant={currentBatch?.batchItems?.length ? 'default' : 'ghost'}
                                                size="small"
                                                disabled={!currentBatch?.batchItems?.length}
                                                className="flex-1"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Mark as Delivered
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
        </div>
    );
};

export default DeliveryPage;
