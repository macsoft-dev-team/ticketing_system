import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    X,
    Loader2
} from 'lucide-react';
import { Button } from '../ui/button';

const ScannerComponent = ({
    isScanning,
    scannerStream,
    videoDevices,
    selectedDeviceId,
    scannerVideoRef,
    stopBarcodeScanning,
    handleDeviceChange
}) => {
    return (
        <AnimatePresence>
            {isScanning && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative max-w-2xl max-h-[90vh] bg-white rounded-lg overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                            <div>
                                <h3 className="font-semibold">Scan Controller Barcode</h3>
                                <p className="text-sm text-gray-600">
                                    Position the barcode within the camera view
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedDeviceId || ''}
                                    onChange={handleDeviceChange}
                                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                                >
                                    <option value="">Select Camera</option>
                                    {videoDevices.map(device => (
                                        <option key={device.deviceId} value={device.deviceId}>
                                            {device.label || `Camera ${device.deviceId}`}
                                        </option>
                                    ))}
                                </select>
                                <Button
                                    onClick={stopBarcodeScanning}
                                    variant="ghost"
                                    size="small"
                                    className="p-2"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        <div className="relative">
                            <video
                                ref={scannerVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full max-h-96 object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-64 h-32 border-2 border-white border-dashed rounded-lg"></div>
                            </div>
                            
                            {!scannerStream && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                    <div className="text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-500" />
                                        <p className="text-sm text-gray-600">Initializing camera...</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-gray-50 border-t">
                            <p className="text-xs text-gray-600 text-center">
                                The scanner will automatically detect and search for the barcode when it's in view
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ScannerComponent;