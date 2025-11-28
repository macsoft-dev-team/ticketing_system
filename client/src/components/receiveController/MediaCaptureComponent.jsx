import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Camera,
    Upload,
    Mic,
    Video,
    X,
    Loader2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

const MediaCaptureComponent = ({
    photos,
    videos,
    audioRecording,
    isRecording,
    isCameraOpen,
    isVideoRecording,
    recordingTime,
    videoDevices,
    selectedDeviceId,
    requiredPhotos,
    currentPhotoIndex,
    photoInputRef,
    videoInputRef,
    cameraVideoRef,
    videoRecordingVideoRef,
    cameraStream,
    videoRecordingStream,
    handlePhotoSelect,
    openCameraForCapture,
    capturePhoto,
    closeCameraCapture,
    handleVideoSelect,
    startVideoRecording,
    stopVideoRecording,
    cancelVideoRecording,
    removePhoto,
    removeVideo,
    updatePhotoLabel,
    startRecording,
    stopRecording,
    removeAudio,
    handleDeviceChange
}) => {
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-4">
            {/* Photo Upload Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Required Photos ({photos.length}/4)</h3>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => photoInputRef.current?.click()}
                            variant="outline"
                            size="small"
                            className="gap-2"
                        >
                            <Upload className="w-4 h-4" />
                            Upload
                        </Button>
                        <Button
                            onClick={openCameraForCapture}
                            variant="outline"
                            size="small"
                            className="gap-2"
                        >
                            <Camera className="w-4 h-4" />
                            Camera
                        </Button>
                    </div>
                </div>

                <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoSelect}
                />

                {/* Photo Grid */}
                {photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                        {photos.map((photo) => (
                            <div key={photo.id} className="relative group">
                                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                    <img
                                        src={photo.url}
                                        alt={photo.label}
                                        className="w-full h-full object-cover"
                                    />
                                    <Button
                                        onClick={() => removePhoto(photo.id)}
                                        size="small"
                                        variant="destructive"
                                        className="absolute top-2 right-2 p-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="mt-2">
                                    <select
                                        value={photo.label}
                                        onChange={(e) => updatePhotoLabel(photo.id, e.target.value)}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white"
                                    >
                                        <option value="">Select label...</option>
                                        {requiredPhotos.map(label => (
                                            <option key={label} value={label}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Video Upload Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Videos ({videos.length})</h3>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => videoInputRef.current?.click()}
                            variant="outline"
                            size="small"
                            className="gap-2"
                        >
                            <Upload className="w-4 h-4" />
                            Upload
                        </Button>
                        <Button
                            onClick={isVideoRecording ? stopVideoRecording : startVideoRecording}
                            variant={isVideoRecording ? "destructive" : "outline"}
                            size="small"
                            className="gap-2"
                        >
                            <Video className="w-4 h-4" />
                            {isVideoRecording ? `Stop (${formatTime(recordingTime)})` : 'Record'}
                        </Button>
                    </div>
                </div>

                <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoSelect}
                />

                {/* Video Grid */}
                {videos.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                        {videos.map((video) => (
                            <div key={video.id} className="relative group">
                                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                    <video
                                        src={video.url}
                                        className="w-full h-full object-cover"
                                        controls
                                    />
                                    <Button
                                        onClick={() => removeVideo(video.id)}
                                        size="small"
                                        variant="destructive"
                                        className="absolute top-2 right-2 p-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="mt-1 text-sm text-gray-600 truncate">
                                    {video.name}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Audio Recording Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Audio Recording</h3>
                    <Button
                        onClick={isRecording ? stopRecording : startRecording}
                        variant={isRecording ? "destructive" : "outline"}
                        size="small"
                        className="gap-2"
                    >
                        <Mic className="w-4 h-4" />
                        {isRecording ? 'Stop' : 'Record'}
                    </Button>
                </div>

                {audioRecording && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <audio src={audioRecording.url} controls className="flex-1" />
                        <Button
                            onClick={removeAudio}
                            size="small"
                            variant="outline"
                            className="p-2"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Camera Capture Modal */}
            <AnimatePresence>
                {isCameraOpen && (
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
                                    <h3 className="font-semibold">Capture Required Photos</h3>
                                    <p className="text-sm text-gray-600">
                                        Photo {currentPhotoIndex + 1} of {requiredPhotos.length}: {requiredPhotos[currentPhotoIndex]}
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
                                        onClick={closeCameraCapture}
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
                                    ref={cameraVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full max-h-96 object-cover"
                                />
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                    <Button
                                        onClick={capturePhoto}
                                        size="large"
                                        className="rounded-full w-16 h-16 p-0"
                                    >
                                        <Camera className="w-6 h-6" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
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
                                    <h3 className="font-semibold">Recording Video</h3>
                                    <p className="text-sm text-gray-600">
                                        Recording time: {formatTime(recordingTime)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={cancelVideoRecording}
                                        variant="ghost"
                                        size="small"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={stopVideoRecording}
                                        variant="primary"
                                        size="small"
                                    >
                                        Stop & Save
                                    </Button>
                                </div>
                            </div>

                            <div className="relative">
                                <video
                                    ref={videoRecordingVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full max-h-96 object-cover"
                                />
                                <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 rounded-full text-sm font-medium">
                                    ● REC
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MediaCaptureComponent;