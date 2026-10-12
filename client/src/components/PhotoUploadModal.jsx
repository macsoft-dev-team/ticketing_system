import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Camera, Image as ImageIcon, Trash2, RefreshCw, AlertTriangle, CheckCircle, Video } from 'lucide-react';
import { compressImage } from '../lib/utils/imageCompressor';

/**
 * Photo Upload Modal for Milestone Photos
 * Shows a popup to select and preview photos before uploading.
 * Strictly enforces device camera capture for Field Engineers and Service Center Technicians on SUBMITTED_TO_SERVICE_CENTER.
 */
const PhotoUploadModal = ({ 
  isOpen, 
  onClose, 
  onUpload, 
  title = 'Upload Photos',
  description = 'Select photos to upload for this milestone',
  minPhotos = 1,
  uploading = false,
  requireLabels = false,
  requiredLabels = [],
  userRole = null,
  stage = null,
  allowGallery = true
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [photoLabels, setPhotoLabels] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Live Camera states
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState('environment');
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const videoRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Role and Milestone camera restriction
  const isRestrictedRole = ['CUSTOMER_FIELD_ENGINEER', 'SERVICE_CENTER_TECHNICIAN'].includes(userRole);
  const isSubmittedToServiceCenter = stage === 'SUBMITTED_TO_SERVICE_CENTER';
  const isCameraOnly = (isSubmittedToServiceCenter && isRestrictedRole) || allowGallery === false;

  // Cleanup camera stream on close / unmount
  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsLiveCameraOpen(false);
    setCameraLoading(false);
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Connect stream to video element when available
  useEffect(() => {
    if (isLiveCameraOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(err => {
        console.error('Error playing camera stream:', err);
      });
    }
  }, [isLiveCameraOpen, cameraStream]);

  // Start live device camera stream
  const startLiveCamera = async (facing = cameraFacingMode) => {
    setErrorMsg('');
    setCameraLoading(true);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser or requires HTTPS.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setCameraStream(stream);
      setIsLiveCameraOpen(true);
      setCameraFacingMode(facing);
    } catch (err) {
      console.error('Camera access error:', err);
      setErrorMsg(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in browser settings, or use the Device Camera App button below.'
          : err.message || 'Could not access device camera. Please use the Device Camera App button below.'
      );
    } finally {
      setCameraLoading(false);
    }
  };

  // Flip between environment (back) and user (front) cameras
  const toggleCameraFacing = async () => {
    const nextMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
    await startLiveCamera(nextMode);
  };

  // Add a new captured file to selection list
  const addPhotoFile = (file) => {
    const newPreviewUrl = URL.createObjectURL(file);
    setSelectedFiles(prev => [...prev, file]);
    setPreviewUrls(prev => [...prev, newPreviewUrl]);

    if (requireLabels) {
      // Automatically assign the next unused required label if available
      setPhotoLabels(prev => {
        const unusedLabel = requiredLabels.find(label => !prev.includes(label)) || '';
        return [...prev, unusedLabel];
      });
    }
  };

  // Capture frame from live video feed
  const capturePhotoFromLiveStream = () => {
    if (!videoRef.current || !cameraStream) return;
    const video = videoRef.current;

    let width = video.videoWidth || 1280;
    let height = video.videoHeight || 720;
    const maxWidth = 1920;
    const maxHeight = 1920;

    if (width > height) {
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
    } else {
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob((blob) => {
      if (!blob) {
        setErrorMsg('Failed to capture photo frame.');
        return;
      }
      const nextIndex = selectedFiles.length + 1;
      const fileName = `Device_Photo_${nextIndex}_${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      addPhotoFile(file);
      setErrorMsg('');
    }, 'image/jpeg', 0.85);
  };

  // Handle files selected via file input (gallery or native camera app)
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Create preview URLs for selected images
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    
    setSelectedFiles(prev => [...prev, ...files]);
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    
    // Initialize labels for new files
    if (requireLabels) {
      setPhotoLabels(prev => {
        let currentLabels = [...prev];
        files.forEach(() => {
          const unusedLabel = requiredLabels.find(label => !currentLabels.includes(label)) || '';
          currentLabels.push(unusedLabel);
        });
        return currentLabels;
      });
    }

    // Reset input value so same file/shutter can be triggered repeatedly
    e.target.value = '';
  };

  const handleRemovePhoto = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    
    // Revoke the object URL to free memory
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    
    // Remove corresponding label
    if (requireLabels) {
      setPhotoLabels(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleUpload = async () => {
    setErrorMsg('');
    if (selectedFiles.length < minPhotos) {
      setErrorMsg(`Please select or take at least ${minPhotos} photo(s)`);
      return;
    }

    // Validate labels if required
    if (requireLabels) {
      const missingLabels = photoLabels.some((label, index) => !label && index < selectedFiles.length);
      if (missingLabels) {
        setErrorMsg('Please assign labels to all photos');
        return;
      }

      // Check for duplicate labels if specific labels are required
      if (requiredLabels.length > 0) {
        const usedLabels = photoLabels.filter(label => label);
        const duplicates = usedLabels.filter((label, index) => usedLabels.indexOf(label) !== index);
        if (duplicates.length > 0) {
          setErrorMsg('Each photo must have a unique label');
          return;
        }
      }
    }

    // Compress all files before upload
    let compressedFiles = [];
    try {
      compressedFiles = await Promise.all(
        selectedFiles.map(file => compressImage(file, { quality: 0.7, maxWidth: 1200, maxHeight: 1200 }))
      );
    } catch (e) {
      console.error("Image compression failed, using original files", e);
      compressedFiles = selectedFiles;
    }

    // Create files with labels if required
    const filesWithLabels = requireLabels 
      ? compressedFiles.map((file, index) => ({
          file,
          label: photoLabels[index] || ''
        }))
      : compressedFiles;

    if (!filesWithLabels.length) {
      setErrorMsg('No photos provided. Please take or select photos to upload.');
      return;
    }

    await onUpload(filesWithLabels);
    handleClose();
  };

  const handleClose = () => {
    stopLiveCamera();
    // Clean up preview URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setPhotoLabels([]);
    setErrorMsg('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 bg-gray-50/70">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                {isCameraOnly ? 'Take Photos with Device Camera' : title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">{description}</p>
            </div>
            <button
              onClick={handleClose}
              disabled={uploading}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center text-xs sm:text-sm text-red-700 font-medium">
                {errorMsg}
              </div>
            )}

            {/* Device Camera Only Alert Banner for Restricted Roles */}
            {isCameraOnly && (
              <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <div className="p-1.5 bg-amber-100 text-amber-700 rounded-md flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="text-xs text-amber-800">
                  <span className="font-semibold block text-amber-900 text-xs sm:text-sm mb-0.5">
                    Live Device Camera Photo Required
                  </span>
                  For <strong>Submitted to Service Center</strong>, photos must be captured directly using your device camera. Uploading existing photos from gallery or local storage is disabled for Field Engineers and Technicians.
                </div>
              </div>
            )}

            {/* Live Camera Viewfinder (if open) */}
            {isLiveCameraOpen && (
              <div className="mb-5 border-2 border-gray-800 rounded-xl overflow-hidden bg-black relative shadow-inner">
                <video
                  ref={videoRef}
                  className="w-full aspect-video object-cover bg-black"
                  playsInline
                  muted
                  autoPlay
                />
                
                {/* Guide overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-4/5 h-3/4 border-2 border-dashed border-white/60 rounded-xl flex items-center justify-center">
                    <span className="text-white/70 text-xs px-2 py-1 bg-black/40 rounded">
                      Align subject inside frame
                    </span>
                  </div>
                </div>

                {/* Top action controls */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                    title="Flip Camera (Front/Back)"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={stopLiveCamera}
                    className="p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                    title="Close Camera Viewfinder"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Next required label banner inside camera */}
                {requireLabels && requiredLabels.length > 0 && (
                  <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-blue-400" />
                    <span>
                      Target: {requiredLabels.find(l => !photoLabels.includes(l)) || 'Additional Photo'}
                    </span>
                  </div>
                )}

                {/* Capture shutter button */}
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={capturePhotoFromLiveStream}
                    className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-medium rounded-full shadow-lg transition-all"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Capture Photo {selectedFiles.length + 1}{minPhotos ? `/${minPhotos}` : ''}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Photo Capture / Input Controls */}
            <div className="mb-5 space-y-3">
              {isCameraOnly ? (
                /* CAMERA ONLY: For Field Engineers & Technicians on Submitted to Service Center */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: Live In-Browser Camera */}
                  <button
                    type="button"
                    onClick={() => (isLiveCameraOpen ? stopLiveCamera() : startLiveCamera('environment'))}
                    disabled={uploading || cameraLoading}
                    className="border-2 border-dashed border-blue-400 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-600 rounded-xl p-4 sm:p-5 text-center transition-all flex flex-col items-center justify-center group"
                  >
                    <div className="w-11 h-11 rounded-full bg-blue-100 group-hover:bg-blue-200 text-blue-600 flex items-center justify-center mb-2 transition-colors">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-blue-900 mb-0.5">
                      {isLiveCameraOpen ? 'Close Live Camera' : 'Open Live Camera'}
                    </p>
                    <p className="text-xs text-blue-700">
                      Snap photo directly in browser
                    </p>
                  </button>

                  {/* Option 2: Native Device Camera App */}
                  <label className="border-2 border-dashed border-orange-400 bg-orange-50/50 hover:bg-orange-50 hover:border-orange-600 rounded-xl p-4 sm:p-5 text-center transition-all flex flex-col items-center justify-center cursor-pointer group">
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      capture="environment"
                      onChange={handleFileSelect}
                      disabled={uploading}
                      className="hidden"
                    />
                    <div className="w-11 h-11 rounded-full bg-orange-100 group-hover:bg-orange-200 text-orange-600 flex items-center justify-center mb-2 transition-colors">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-orange-900 mb-0.5">
                      Use Device Camera App
                    </p>
                    <p className="text-xs text-orange-700">
                      Open mobile / tablet camera
                    </p>
                  </label>
                </div>
              ) : (
                /* ALLOW BOTH GALLERY & CAMERA: For Admin and Macsoft roles */
                <div className="grid grid-cols-2 gap-3">
                  {/* Choose from Gallery */}
                  <label className="block">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-5 text-center hover:border-blue-500 hover:bg-blue-50/30 transition-colors cursor-pointer flex flex-col items-center justify-center h-full">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        disabled={uploading}
                        className="hidden"
                      />
                      <Upload className="w-8 h-8 sm:w-9 sm:h-9 text-gray-400 mb-2" />
                      <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-0.5">
                        Choose from Gallery
                      </p>
                      <p className="text-xs text-gray-500">
                        Select existing files
                      </p>
                    </div>
                  </label>
                  
                  {/* Take Photo */}
                  <label className="block">
                    <div className="border-2 border-dashed border-orange-300 bg-orange-50/30 rounded-xl p-4 sm:p-5 text-center hover:border-orange-500 hover:bg-orange-50 transition-colors cursor-pointer flex flex-col items-center justify-center h-full">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        capture="environment"
                        onChange={handleFileSelect}
                        disabled={uploading}
                        className="hidden"
                      />
                      <Camera className="w-8 h-8 sm:w-9 sm:h-9 text-orange-500 mb-2" />
                      <p className="text-xs sm:text-sm font-semibold text-orange-700 mb-0.5">
                        Take Photo
                      </p>
                      <p className="text-xs text-orange-600">
                        Use device camera
                      </p>
                    </div>
                  </label>
                </div>
              )}
              
              <div className="text-xs text-center text-gray-500">
                <span>Minimum {minPhotos} photo{minPhotos > 1 ? 's' : ''} required</span>
                {requireLabels && requiredLabels.length > 0 && (
                  <span className="block mt-1 text-blue-600 font-medium">
                    Required specific photos: {requiredLabels.join(', ')}
                  </span>
                )}
              </div>
            </div>

            {/* Preview Grid */}
            {selectedFiles.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Captured Photos ({selectedFiles.length})
                  </h4>
                  {selectedFiles.length < minPhotos ? (
                    <span className="text-xs text-amber-600 font-medium">
                      Need {minPhotos - selectedFiles.length} more photo{minPhotos - selectedFiles.length > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-xs text-green-600 font-medium">
                      ✓ Minimum requirement met
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {previewUrls.map((url, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative group border border-gray-200 rounded-lg p-3 bg-gray-50/60"
                    >
                      <div className="flex gap-3">
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover rounded-md border border-gray-300"
                          />
                          <button
                            onClick={() => handleRemovePhoto(index)}
                            disabled={uploading}
                            className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:opacity-50"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-700 truncate mb-1.5" title={selectedFiles[index]?.name}>
                            Photo {index + 1}: {selectedFiles[index]?.name}
                          </div>
                          {requireLabels && (
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                Photo Label:
                              </label>
                              {requiredLabels.length > 0 ? (
                                <select
                                  value={photoLabels[index] || ''}
                                  onChange={(e) => {
                                    const newLabels = [...photoLabels];
                                    newLabels[index] = e.target.value;
                                    setPhotoLabels(newLabels);
                                  }}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                  disabled={uploading}
                                >
                                  <option value="">Select photo type...</option>
                                  {requiredLabels.map((label) => (
                                    <option 
                                      key={label} 
                                      value={label}
                                      disabled={photoLabels.includes(label) && photoLabels[index] !== label}
                                    >
                                      {label} {photoLabels.includes(label) && photoLabels[index] !== label ? '(assigned)' : ''}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={photoLabels[index] || ''}
                                  onChange={(e) => {
                                    const newLabels = [...photoLabels];
                                    newLabels[index] = e.target.value;
                                    setPhotoLabels(newLabels);
                                  }}
                                  placeholder="Enter photo description"
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                  disabled={uploading}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {selectedFiles.length === 0 && !isLiveCameraOpen && (
              <div className="text-center py-8 sm:py-10 border-2 border-dashed border-gray-200 rounded-xl mt-2">
                <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-600">No photos captured yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  {isCameraOnly ? 'Use the camera controls above to take device photos' : 'Choose gallery photos or take photos with camera'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-t border-gray-200 bg-gray-50">
            <div className="text-xs sm:text-sm text-gray-600">
              {selectedFiles.length > 0 && (
                <div className="space-y-0.5">
                  <span className="font-medium text-gray-800">
                    {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''} ready
                  </span>
                  {requireLabels && requiredLabels.length > 0 && (
                    <div>
                      <span className={`text-xs ${
                        photoLabels.filter(label => label).length === selectedFiles.length 
                          ? 'text-green-600 font-medium' 
                          : 'text-amber-600 font-medium'
                      }`}>
                        {photoLabels.filter(label => label).length} of {selectedFiles.length} labeled
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={uploading}
                className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={
                  uploading || 
                  selectedFiles.length < minPhotos ||
                  (requireLabels && photoLabels.some((label, index) => !label && index < selectedFiles.length)) ||
                  (requireLabels && requiredLabels.length > 0 && selectedFiles.length !== requiredLabels.length)
                }
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
              >
                {uploading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    {isCameraOnly ? <Camera className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                    <span>{isCameraOnly ? 'Submit Photos' : 'Upload Photos'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PhotoUploadModal;
