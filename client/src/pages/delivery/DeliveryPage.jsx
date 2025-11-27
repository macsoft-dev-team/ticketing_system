import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import {
    Package,
     CheckCircle,
     Search,
    X,
    Loader2,
    ScanLine,
    List
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import Input from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../components/ui/toast';
import { useAuth } from '../../lib/hooks/useAuth';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

 

const DeliveryPage = () => {
    const { token } = useAuth();
    const toastContext = useToast();
    const addToast = toastContext?.addToast || ((toast) => console.warn('Toast not available:', toast));

    // Form/search states
    const [filter, setFilter] = useState('ticket'); // 'ticket' or 'controller'
    const [ticketCode, setTicketCode] = useState('');
    const [controllerNo, setControllerNo] = useState('');
    const [searchedTicket, setSearchedTicket] = useState(null);
    const [searching, setSearching] = useState(false);

    // Media states
    const [photos, setPhotos] = useState([]);
    const [videos, setVideos] = useState([]);
    const [audioRecording, setAudioRecording] = useState(null);
 
    // Batch state - list of items added to batch
    const [batchItems, setBatchItems] = useState([]);

    // Camera / scanner / recording shared refs and states
    const [isScanning, setIsScanning] = useState(false);
    const [scannerStream, setScannerStream] = useState(null);
    const codeReaderRef = useRef(null);
    const scannerVideoRef = useRef(null);

    // Camera capture
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const cameraVideoRef = useRef(null);
 

    // Video recording
    const [isVideoRecording, setIsVideoRecording] = useState(false);
    const [videoRecordingStream, setVideoRecordingStream] = useState(null);
    const videoRecordingVideoRef = useRef(null);
  

    // Device list for scanner
    const [videoDevices, setVideoDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState(null);



    const requiredPhotos = [
        'Controller Front',
        'Controller Bottom',
        'Full View Open',
        'MCB Close Up'
    ];

    // --- device enumeration on mount ---
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

    const pickVideoDeviceId = (devices) => {
        if (!devices || devices.length === 0) return null;
        const back = devices.find(d => /back|rear|environment|camera 0/i.test(d.label));
        if (back) return back.deviceId;
        return devices[devices.length - 1].deviceId;
    };

    const listVideoInputDevices = async () => {
        try {
            if (!codeReaderRef.current) codeReaderRef.current = new BrowserMultiFormatReader();
            const devices = await codeReaderRef.current.listVideoInputDevices();
            setVideoDevices(devices || []);
            if (!selectedDeviceId) {
                const defaultId = pickVideoDeviceId(devices);
                setSelectedDeviceId(defaultId);
            }
        } catch (err) {
            console.warn('Could not list video devices:', err);
            setVideoDevices([]);
        }
    };

    // --- Search by ticket or controller ---
    const handleSearch = useCallback(async () => {
        // Decide search key
        const key = filter === 'ticket' ? ticketCode.trim() : controllerNo.trim();
        if (!key) {
            addToast({
                title: 'Input Required',
                description: `Please enter a ${filter === 'ticket' ? 'ticket code' : 'controller number'}`,
                variant: 'warning'
            });
            return;
        }

        setSearching(true);
        try {
            // Adjust endpoint according to filter - keep existing /tickets/search/controller/ for controller
            const endpoint =
                filter === 'ticket'
                    ? `${API_URL}/tickets/search/code/${encodeURIComponent(key)}`
                    : `${API_URL}/tickets/search/controller/${encodeURIComponent(key)}`;

            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            });

            setSearchedTicket(response.data);
            // If ticket search returned controller number, fill it
            if (response.data?.controllerNo) setControllerNo(response.data.controllerNo);
            if (response.data?.ticketCode) setTicketCode(response.data.ticketCode);

            addToast({
                title: 'Ticket Found',
                description: `Ticket ${response.data.ticketCode || ''} found`,
                variant: 'success'
            });
        } catch (error) {
            console.error('Search error:', error);
            setSearchedTicket(null);
            addToast({
                title: 'Not Found',
                description: error.response?.data?.message || 'No ticket found',
                variant: 'error'
            });
        } finally {
            setSearching(false);
        }
    }, [filter, ticketCode, controllerNo, token, addToast]);
 

 
    // --- Barcode scanning (now sets either ticketCode or controllerNo depending on filter) ---
    const startBarcodeScanning = async (deviceId = null) => {
        const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
        if (!isSecureContext) {
            addToast({ title: 'HTTPS Required', description: 'Camera access requires HTTPS.', variant: 'error' });
            setIsScanning(false);
            return;
        }

        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            addToast({ title: 'Not Supported', description: 'Camera API not supported on this device/browser.', variant: 'error' });
            setIsScanning(false);
            return;
        }

        try {
            if (!codeReaderRef.current) {
                codeReaderRef.current = new BrowserMultiFormatReader();
                const hints = new Map();
                hints.set(2, true);
                codeReaderRef.current.hints = hints;
            }

            if (videoDevices.length === 0) await listVideoInputDevices();
            const chosenId = deviceId || selectedDeviceId || pickVideoDeviceId(videoDevices);

            const videoEl = scannerVideoRef.current;
            if (!videoEl) throw new Error('Scanner video element not mounted');

            videoEl.muted = true;
            videoEl.playsInline = true;
            videoEl.setAttribute('playsinline', 'true');
            videoEl.setAttribute('webkit-playsinline', 'true');

            let stream;
            if (chosenId) {
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
                }
            } else {
                const constraints = isMobile ? { audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } } } : { video: true, audio: false };
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            }

            videoEl.srcObject = stream;
            try { await videoEl.play(); } catch (e) { /* may require user interaction */ }
            setScannerStream(stream);
            try { codeReaderRef.current.reset(); } catch (e) { /* ignore */ }

            const onDecodeResult = (result, error) => {
                if (result) {
                    const detectedValue = result.getText();
                    const upperValue = detectedValue.trim().toUpperCase();
                    if (filter === 'ticket') {
                        setTicketCode(upperValue);
                    } else {
                        setControllerNo(upperValue);
                    }
                    stopBarcodeScanning();
                    addToast({ title: '✅ Barcode Detected', description: `${filter === 'ticket' ? 'Ticket' : 'Controller'}: ${upperValue}`, variant: 'success' });
                } else if (error && !(error instanceof NotFoundException)) {
                    console.warn('Decode error:', error);
                }
            };

            if (chosenId) {
                await codeReaderRef.current.decodeFromVideoDevice(chosenId, videoEl, onDecodeResult);
            } else {
                await codeReaderRef.current.decodeFromVideoElement(videoEl, onDecodeResult);
            }
        } catch (error) {
            console.error('Barcode scanning error:', error);
            let errorMessage = 'Could not start barcode scanner.';
            if (error.name === 'NotAllowedError') errorMessage = 'Camera permission denied. Please allow camera access.';
            else if (error.name === 'NotFoundError') errorMessage = 'No camera found on this device.';
            else if (error.name === 'NotReadableError') errorMessage = 'Camera is already in use.';
            else if (error.name === 'OverconstrainedError') errorMessage = 'Camera constraints not supported.';
            else if (error.message) errorMessage = `${error.message}`;

            addToast({ title: 'Scanner Error', description: errorMessage, variant: 'error' });
            setIsScanning(false);
        }
    };

    const stopBarcodeScanning = () => {
        try {
            if (codeReaderRef.current) {
                try { codeReaderRef.current.reset(); } catch (e) { /* noop */ }
                codeReaderRef.current = null;
            }
            if (scannerStream) {
                scannerStream.getTracks().forEach(track => {
                    try { track.stop(); } catch (e) { /* noop */ }
                });
                setScannerStream(null);
            }
            if (scannerVideoRef.current) {
                scannerVideoRef.current.srcObject = null;
                try { scannerVideoRef.current.pause(); } catch (e) { /* noop */ }
            }
        } catch (error) {
            console.error('Error stopping scanner:', error);
        } finally {
            setIsScanning(false);
        }
    };

    const handleDeviceChange = async (e) => {
        const newDeviceId = e.target.value || null;
        if (codeReaderRef.current) {
            try { codeReaderRef.current.reset(); } catch (err) { console.warn('Error resetting reader:', err); }
        }
        if (scannerStream) {
            scannerStream.getTracks().forEach(track => track.stop());
            setScannerStream(null);
        }
        if (scannerVideoRef.current) scannerVideoRef.current.srcObject = null;
        setSelectedDeviceId(newDeviceId);
        await new Promise(resolve => setTimeout(resolve, 400));
        await startBarcodeScanning(newDeviceId);
    };

    useEffect(() => {
        if (isScanning) {
            listVideoInputDevices().then(() => {
                startBarcodeScanning(selectedDeviceId);
            });
        } else {
            stopBarcodeScanning();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isScanning]);

    useEffect(() => {
        if (cameraStream && cameraVideoRef.current && isCameraOpen) {
            cameraVideoRef.current.srcObject = cameraStream;
            cameraVideoRef.current.play().catch(() => { });
        }
    }, [cameraStream, isCameraOpen]);

    useEffect(() => {
        if (videoRecordingStream && videoRecordingVideoRef.current && isVideoRecording) {
            videoRecordingVideoRef.current.srcObject = videoRecordingStream;
            videoRecordingVideoRef.current.play().catch(err => console.error('Video play error:', err));
        }
    }, [videoRecordingStream, isVideoRecording]);

 

    const addToBatch = () => {
        const item = {
            id: Math.random().toString(36),
            ticketCode: searchedTicket?.ticketCode || ticketCode || '',
            controllerNo: controllerNo || searchedTicket?.controllerNo || '',
            isMarkedForDelivery: true
        };

        setBatchItems(prev => [item, ...prev]);
        addToast({ title: 'Added to Batch', description: `Controller ${item.controllerNo || '-'} added to batch`, variant: 'success' });
    };

    const removeBatchItem = (id) => {
        setBatchItems(prev => prev.filter(it => it.id !== id));
    };

    const clearBatch = () => {
        setBatchItems([]);
    };

    // --- Batch submission: Mark all as received ---
    const markAllAsReceived = async () => {
        if (batchItems.length === 0) {
            addToast({ title: 'Batch Empty', description: 'No items in the batch to submit.', variant: 'warning' });
            return;
        }

        // Build multipart form with files grouped per item
        const formData = new FormData();
        formData.append('batchCount', String(batchItems.length));

        batchItems.forEach((item, idx) => {
            formData.append(`items[${idx}][ticketCode]`, item.ticketCode || '');
            formData.append(`items[${idx}][controllerNo]`, item.controllerNo || '');

            // photos
            item.photos.forEach((photo, pidx) => {
                formData.append(`items[${idx}][photos]`, photo.file, photo.file.name);
                // send label metadata for that photo
                formData.append(`items[${idx}][photoLabels][${pidx}]`, photo.label || '');
            });

            // videos
            item.videos.forEach((v, vidx) => {
                formData.append(`items[${idx}][videos]`, v.file, v.file.name);
            });

            // audio
            if (item.audio && item.audio.file) {
                formData.append(`items[${idx}][audio]`, item.audio.file, item.audio.file.name);
            }
        });

        try {
            addToast({ title: 'Submitting Batch', description: `Sending ${batchItems.length} item(s)`, variant: 'info' });
            const response = await axios.post(
                `${API_URL}/milestones/receive-batch`,
                formData,
                {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
                    withCredentials: true
                }
            );

            addToast({ title: 'Success', description: `Batch processed: ${response.data?.message || 'All items received'}`, variant: 'success' });
            // Cleanup
            clearBatch();
            setSearchedTicket(null);
            setTicketCode('');
            setControllerNo('');
        } catch (error) {
            console.error('Batch submission error:', error);
            addToast({ title: 'Submission Failed', description: error.response?.data?.message || 'Failed to process batch', variant: 'error' });
        }
    };

    // --- reset a little (not batch) ---
    const resetForm = () => {
        setTicketCode('');
        setControllerNo('');
        setSearchedTicket(null);
        photos.forEach(p => p.preview && URL.revokeObjectURL(p.preview));
        videos.forEach(v => v.preview && URL.revokeObjectURL(v.preview));
        if (audioRecording?.preview) URL.revokeObjectURL(audioRecording.preview);
        setPhotos([]);
        setVideos([]);
        setAudioRecording(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left: Batch list */}
                <div className="col-span-1">
                    <Card className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <List className="w-5 h-5 text-blue-600" />
                                Batch ({batchItems.length})
                            </h3>
                            <div className="flex items-center gap-2">
                                <Button onClick={clearBatch} variant="outline" size="small" disabled={batchItems.length === 0}>Clear</Button>
                                <Button onClick={markAllAsReceived} variant={batchItems.length ? 'default' : 'ghost'} size="small" disabled={batchItems.length === 0}>
                                    <CheckCircle className="w-4 h-4" />
                                    Mark All as Delivered
                                </Button>
                            </div>
                        </div>

                        {batchItems.length === 0 ? (
                            <div className="text-sm text-gray-500">No items in batch yet. Add captured items from the right panel.</div>
                        ) : (
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                                {batchItems.map(item => (
                                    <div key={item.id} className="flex items-center gap-3 p-2 bg-white rounded shadow-sm">
                                        <img src={item.photos[0]?.preview} alt="thumb" className="w-14 h-14 object-cover rounded" />
                                        <div className="flex-1 text-sm">
                                            <div className="font-medium truncate">{item.ticketCode || item.controllerNo || '—'}</div>
                                            <div className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                {item.photos.length} photos • {item.videos.length} videos • {item.audio ? '1 audio' : '0 audio'}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <Button size="small" variant="outline" onClick={() => removeBatchItem(item.id)}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                <div className="col-span-2">
                    <Card className='px-4 py-5  space-y-4'>{/* Right: Main form / uploader */}
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Package className="w-8 h-8 text-blue-600" />
                                <h1 className="text-xl sm:text-2xl font-medium tracking-wide uppercase">Delivery — Add to Batch</h1>
                            </div>
                            <p className="text-sm text-gray-600">Scan ticket or controller, upload required photos, then add to batch. Submit batch when ready.</p>
                        </motion.div>

                        <div className="space-y-3">
                            <div className="flex gap-2 items-center">
                                <div className="flex-1">
                                    <Input
                                        placeholder={'Controller serial number or ticket code...'}
                                        value={filter === 'ticket' ? ticketCode : controllerNo}
                                        onChange={(e) => filter === 'ticket' ? setTicketCode(e.target.value) : setControllerNo(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>

                                <Button
                                    onClick={() => {
                                        if (isScanning) { stopBarcodeScanning(); setIsScanning(false); }
                                        else {
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

                                <Button onClick={handleSearch} disabled={searching || (!(ticketCode.trim()) && !(controllerNo.trim()))} className="gap-2">
                                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                    Search
                                </Button>
                            </div>

                            <AnimatePresence>
                                {isScanning && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3">
                                        <div className="bg-white p-3 rounded shadow">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium">Barcode Scanner</h4>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs">Camera:</label>
                                                    <select value={selectedDeviceId || ''} onChange={handleDeviceChange} className="text-sm border rounded px-2 py-1">
                                                        {videoDevices.length === 0 && <option value="">Default Camera</option>}
                                                        {videoDevices.map(dev => <option key={dev.deviceId} value={dev.deviceId}>{dev.label || `Camera ${dev.deviceId}`}</option>)}
                                                    </select>
                                                    <button onClick={() => { stopBarcodeScanning(); setIsScanning(false); }} className="ml-2 text-gray-500"><X className="w-5 h-5" /></button>
                                                </div>
                                            </div>

                                            <div className="relative">
                                                <video ref={scannerVideoRef} className="w-full aspect-video bg-black rounded" playsInline muted autoPlay />
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

                            {/* If ticket found show details */}
                            <AnimatePresence>
                                {searchedTicket && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                            <div>
                                                <div className="font-semibold">Ticket Found: {searchedTicket.ticketCode}</div>
                                                <div className="text-sm text-blue-800 mt-1">
                                                    <div><strong>Customer:</strong> {searchedTicket.customerName}</div>
                                                    <div><strong>Controller:</strong> {searchedTicket.controllerNo}</div>
                                                    <div className="mt-1"><Badge variant="info">{searchedTicket.status}</Badge></div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Photo / Video / Audio Uploader */}
                        <div className="space-y-3">
 
                            <div className="pt-3 flex gap-3">
                                <Button onClick={resetForm} variant="outline" className="flex-1">Reset</Button>

                                <Button onClick={addToBatch} className="flex-1" disabled={photos.length < requiredPhotos.length}>
                                    <Package className="w-4 h-4" /> Add to Batch
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

        </div>
    );
};

export default DeliveryPage;
