import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Camera, Image as ImageIcon, Trash2 } from 'lucide-react';

/**
 * Photo Upload Modal for Milestone Photos
 * Shows a popup to select and preview photos before uploading
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
  requiredLabels = []
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [photoLabels, setPhotoLabels] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Create preview URLs for selected images
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    
    setSelectedFiles(prev => [...prev, ...files]);
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    
    // Initialize labels for new files
    if (requireLabels) {
      setPhotoLabels(prev => [...prev, ...files.map(() => '')]);
    }
  };

  const handleRemovePhoto = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    
    // Revoke the object URL to free memory
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    
    // Remove corresponding label
    if (requireLabels) {
      setPhotoLabels(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleUpload = async () => {
    setErrorMsg('');
    if (selectedFiles.length < minPhotos) {
      setErrorMsg(`Please select at least ${minPhotos} photo(s)`);
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

    // Create files with labels if required
    const filesWithLabels = requireLabels 
      ? selectedFiles.map((file, index) => ({
          file,
          label: photoLabels[index] || ''
        }))
      : selectedFiles;

    if (!filesWithLabels.length) {
      setErrorMsg('No photos provided. Please select photos to upload.');
      return;
    }

    await onUpload(filesWithLabels);
    handleClose();
  };

  const handleClose = () => {
    // Clean up preview URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setPhotoLabels([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <div>
              <h3 className="text-lg uppercase tracking-Hey, Cortana. wide sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">{description}</p>
            </div>
            <button
              onClick={handleClose}
              disabled={uploading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {errorMsg && (
              <div className="mb-3 text-center text-sm text-red-600 font-medium">{errorMsg}</div>
            )}
            {/* File Input Options */}
            <div className="mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      disabled={uploading}
                      className="hidden"
                    />
                    <Upload className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-gray-400 mb-2" />
                    <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Choose from Gallery
                    </p>
                    <p className="text-xs text-gray-500">
                      Select existing photos
                    </p>
                  </div>
                </label>
                
                <label className="block">
                  <div className="border-2 border-dashed border-orange-300 rounded-lg p-4 sm:p-6 text-center hover:border-orange-500 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      capture="environment"
                      onChange={handleFileSelect}
                      disabled={uploading}
                      className="hidden"
                    />
                    <Camera className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-orange-500 mb-2" />
                    <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1">
                      Take Photo
                    </p>
                    <p className="text-xs text-orange-600">
                      Use camera
                    </p>
                  </div>
                </label>
              </div>
              
              <p className="text-xs text-center text-gray-500">
                Minimum {minPhotos} photo{minPhotos > 1 ? 's' : ''} required
                {requireLabels && requiredLabels.length > 0 && (
                  <span className="block mt-1 text-blue-600 font-medium">
                    Each photo must be labeled with its specific type
                  </span>
                )}
              </p>
            </div>

            {/* Preview Grid */}
            {selectedFiles.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Selected Photos ({selectedFiles.length})
                  </h4>
                  {selectedFiles.length < minPhotos && (
                    <span className="text-xs text-amber-600">
                      Need {minPhotos - selectedFiles.length} more
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {previewUrls.map((url, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative group"
                    >
                      <div className="flex gap-3 p-3 border border-gray-200 rounded-lg">
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover rounded border"
                          />
                          <button
                            onClick={() => handleRemovePhoto(index)}
                            disabled={uploading}
                            className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-600 mb-2">
                            {selectedFiles[index].name.length > 25
                              ? selectedFiles[index].name.substring(0, 22) + '...'
                              : selectedFiles[index].name}
                          </div>
                          {requireLabels && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Photo Type:
                              </label>
                              {requiredLabels.length > 0 ? (
                                <select
                                  value={photoLabels[index] || ''}
                                  onChange={(e) => {
                                    const newLabels = [...photoLabels];
                                    newLabels[index] = e.target.value;
                                    setPhotoLabels(newLabels);
                                  }}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                  disabled={uploading}
                                >
                                  <option value="">Select type...</option>
                                  {requiredLabels.map((label) => (
                                    <option 
                                      key={label} 
                                      value={label}
                                      disabled={photoLabels.includes(label) && photoLabels[index] !== label}
                                    >
                                      {label}
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
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
            {selectedFiles.length === 0 && (
              <div className="text-center py-8 sm:py-12">
                <ImageIcon className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-gray-300 mb-3" />
                <p className="text-sm sm:text-base text-gray-500">No photos selected yet</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-xs sm:text-sm text-gray-600">
              {selectedFiles.length > 0 && (
                <div className="space-y-1">
                  <span>
                    {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''} selected
                  </span>
                  {requireLabels && requiredLabels.length > 0 && (
                    <div>
                      <span className={`text-xs ${
                        photoLabels.filter(label => label).length === selectedFiles.length 
                          ? 'text-green-600' 
                          : 'text-amber-600'
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
                onClick={handleClose}
                disabled={uploading}
                className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={
                  uploading || 
                  selectedFiles.length < minPhotos ||
                  (requireLabels && photoLabels.some((label, index) => !label && index < selectedFiles.length)) ||
                  (requireLabels && requiredLabels.length > 0 && selectedFiles.length !== requiredLabels.length)
                }
                className="px-3 sm:px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Photos
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
