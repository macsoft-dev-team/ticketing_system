import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    X,
    Download
} from 'lucide-react';
import { Button } from '../ui/button';

const ImageViewerComponent = ({
    viewingImages,
    currentBatchImages,
    currentImageIndex,
    closeImageViewer,
    nextImage,
    prevImage
}) => {
    return (
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
    );
};

export default ImageViewerComponent;