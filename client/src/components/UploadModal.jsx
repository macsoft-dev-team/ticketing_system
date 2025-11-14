import { useState } from 'react';
import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Upload, FileText, X, CheckCircle, AlertCircle, FileSpreadsheet, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { readExcelAsJSON } from '../utils/excelUtils';
import { hashDevicePasswords } from '../utils/passwordHasher';
import { useToast } from '../lib/hooks/use-toast';

const UploadModal = ({ open, onOpenChange, uploadDevice, requiredColumns, title, description }) => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState(null);  
    const [uploadMessage, setUploadMessage] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [hashingProgress, setHashingProgress] = useState(null);
    const [passwordsHashed, setPasswordsHashed] = useState(false);
    const [processedDevices, setProcessedDevices] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [recordCount, setRecordCount] = useState(0);
    const [showLargeFileWarning, setShowLargeFileWarning] = useState(false);
    const fileInputRef = useRef(null);
    const cancelRef = useRef(false);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            validateAndSetFile(file);
        }
    };

    const validateAndSetFile = (file) => {
         if (!file.name.match(/\.(xlsx|xls)$/i)) {
            setUploadStatus('error');
            setUploadMessage('Please select a valid Excel file (.xlsx or .xls)');
            toast({
                title: "Invalid File Type",
                description: "Please select a valid Excel file (.xlsx or .xls)",
                variant: "destructive"
            });
            return;
        }

         const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            setUploadStatus('error');
            setUploadMessage('File size must be less than 10MB');
            toast({
                title: "File Too Large",
                description: "File size must be less than 10MB",
                variant: "destructive"
            });
            return;
        }

        setSelectedFile(file);
        setUploadStatus(null);
        setUploadMessage('');
        setUploadProgress(0);
        setPasswordsHashed(false);
        setProcessedDevices(null);
        setRecordCount(0);
        setShowLargeFileWarning(false);
        cancelRef.current = false;
    };

    const processFileAndHashPasswords = async () => {
        if (!selectedFile || passwordsHashed) return;

        // Show processing time warning for large files before starting
        if (recordCount > 1000) {
            const timeEstimate = calculateProcessingTime(recordCount);
            
            toast({
                title: "Large File Processing Warning",
                description: `Processing ${recordCount} records may take approximately ${timeEstimate}. Please be patient and do not close this window.`,
                variant: "default"
            });
        }

        setIsSubmitting(true);
        setIsProcessing(true);
        cancelRef.current = false;
        setUploadStatus(null);
        setUploadProgress(0);
        setHashingProgress(null);

        try {
            // Step 1: Read Excel file (5% of total progress)
            if (cancelRef.current) throw new Error('Process cancelled by user');
            setUploadMessage('Reading Excel file...');
            setUploadProgress(5);
            
            const json = await readExcelAsJSON(selectedFile);
            if (!json || json.length === 0) {
                throw new Error('No valid data found in the Excel file');
            }

            // Set record count and check for large files
            setRecordCount(json.length);
            if (json.length > 1000) {
                setShowLargeFileWarning(true);
                const timeEstimate = calculateProcessingTime(json.length);
                
                toast({
                    title: "Large File Detected",
                    description: `File contains ${json.length} records. Processing may take approximately ${timeEstimate}. Consider uploading 1,000 records or less in batches for faster processing.`,
                    variant: "default"
                });
            } else {
                setShowLargeFileWarning(false);
            }

            // Check for cancellation
            if (cancelRef.current) throw new Error('Process cancelled by user');

            // Step 2: Format the data (10% of total progress)
            setUploadMessage('Formatting device data...');
            setUploadProgress(10);
            
         
            // Check for cancellation before hashing
            if (cancelRef.current) throw new Error('Process cancelled by user');

            // Step 3: Hash passwords with progress tracking (15% to 95% of total progress)
            setUploadMessage('Hashing device passwords...');
            setUploadProgress(15);
            
            const hashedDevices = await hashDevicePasswords(
                json,
                (progress) => {
                    setHashingProgress(progress);
                    setUploadMessage(`Hashing passwords... ${progress.current}/${progress.total} devices`);
                    
                    // Map hashing progress (0-100%) to overall progress (15-95%)
                    // This gives 80% of the total progress bar to hashing
                    const hashProgressPercent = (progress.percentage / 100) * 80;
                    const totalProgress = 15 + hashProgressPercent;
                    setUploadProgress(Math.round(totalProgress));
                },
                10, // saltRounds
                () => cancelRef.current // shouldCancel function
            );

            // Final check for cancellation
            if (cancelRef.current) throw new Error('Process cancelled by user');

            // Step 4: Finalize (100%)
            setUploadMessage('Finalizing...');
            setUploadProgress(98);
            
            // Small delay to show finalization
            await new Promise(resolve => setTimeout(resolve, 200));

            setProcessedDevices(hashedDevices);
            setPasswordsHashed(true);
            setUploadProgress(100);
            setUploadStatus('ready');
            setUploadMessage(`${hashedDevices.length} devices processed and ready to upload!`);
            setHashingProgress(null);
            
        } catch (error) {
            if (error.message === 'Process cancelled by user') {
                setUploadStatus(null);
                setUploadMessage('');
                setUploadProgress(0);
                setHashingProgress(null);
            } else {
                setUploadStatus('error');
                
                // Check if it's a scientific notation validation error
                if (error.message.includes('Scientific notation detected')) {
                    toast({
                        title: "Upload Validation Failed",
                        description: "Excel file contains scientific notation (E notation) values. Please format these cells as text or numbers without scientific notation.",
                        variant: "destructive"
                    });
                    setUploadMessage('Scientific notation detected in Excel file. Please check and fix the data format.');
                } else {
                    // Format error message for better display
                    const errorMessage = error.message || 'Failed to process file. Please try again.';
                    setUploadMessage(errorMessage);
                    
                    // Show toast for other errors too
                    toast({
                        title: "Processing Failed",
                        description: errorMessage.split('\n')[0], // First line for toast
                        variant: "destructive"
                    });
                }
                
                setUploadProgress(0);
                setHashingProgress(null);
            }
            setPasswordsHashed(false);
            setProcessedDevices(null);
        } finally {
            setIsSubmitting(false);
            setIsProcessing(false);
            cancelRef.current = false;
        }
    };

    const handleCancelProcessing = () => {
        cancelRef.current = true;
        setUploadMessage('Cancelling process...');
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            validateAndSetFile(files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!processedDevices || !passwordsHashed) {
            setUploadStatus('error');
            setUploadMessage('Please process the file first');
            return;
        }

        setIsSubmitting(true);
        setUploadStatus(null);
        setUploadProgress(0);

        try {
            setUploadMessage('Preparing upload...');
            setUploadProgress(10);
            
            // Small delay to show preparation
            await new Promise(resolve => setTimeout(resolve, 200));
            
            setUploadMessage('Uploading to server...');
            setUploadProgress(30);
            
            await uploadDevice(processedDevices);
            
            setUploadMessage('Upload successful!');
            setUploadProgress(100);
            setUploadStatus('success');
            setUploadMessage(`Successfully uploaded ${processedDevices.length} devices with hashed passwords!`);
            
            // Show success toast
            toast({
                title: "Upload Successful",
                description: `Successfully uploaded ${processedDevices.length} devices with hashed passwords!`,
                variant: "default"
            });
            
            setTimeout(() => {
                setSelectedFile(null);
                setUploadStatus(null);
                setUploadMessage('');
                setUploadProgress(0);
                setHashingProgress(null);
                setPasswordsHashed(false);
                setProcessedDevices(null);
                setRecordCount(0);
                setShowLargeFileWarning(false);
                onOpenChange(false);
            }, 3000);
            
        } catch (error) {
            setUploadStatus('error');
            setUploadMessage(error.message || 'Upload failed. Please try again.');
            setUploadProgress(0);
            
            // Show error toast
            toast({
                title: "Upload Failed",
                description: error.message || 'Upload failed. Please try again.',
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (isProcessing) {
            handleCancelProcessing();
            return;
        }
        
        if (!isSubmitting) {
            setSelectedFile(null);
            setUploadStatus(null);
            setUploadMessage('');
            setUploadProgress(0);
            setHashingProgress(null);
            setPasswordsHashed(false);
            setProcessedDevices(null);
            setIsProcessing(false);
            setRecordCount(0);
            setShowLargeFileWarning(false);
            cancelRef.current = false;
            setIsDragOver(false);
            onOpenChange(false);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setUploadStatus(null);
        setUploadMessage('');
        setUploadProgress(0);
        setHashingProgress(null);
        setPasswordsHashed(false);
        setProcessedDevices(null);
        setIsProcessing(false);
        setRecordCount(0);
        setShowLargeFileWarning(false);
        cancelRef.current = false;
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatLastModified = (timestamp) => {
        return new Date(timestamp).toLocaleDateString();
    };

    const calculateProcessingTime = (recordCount) => {
        const estimatedMinutes = Math.ceil(recordCount / 500);  
        if (estimatedMinutes < 1) return 'less than 1 minute';
        if (estimatedMinutes < 60) {
            return `${estimatedMinutes} minute${estimatedMinutes > 1 ? 's' : ''}`;
        }
        const hours = Math.ceil(estimatedMinutes / 60);
        return `${hours} hour${hours > 1 ? 's' : ''}`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2 uppercase">
                        <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                        <span>{title}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                     <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Upload Requirements:</p>
                            <ul className="text-xs space-y-1">
                                <li>• Excel files only (.xlsx)</li>
                                <li>• Maximum file size: 10MB</li>
                                <li>• Required columns: {requiredColumns && requiredColumns.join(", ")}</li>
                                <li>• No scientific notation (E notation) allowed</li>
                                <li>• <span className="font-medium text-orange-700">Recommended: Upload 1,000 records or less for faster processing</span></li>
                            </ul>
                        </div>
                    </div>

                    {/* Large File Warning */}
                    <AnimatePresence>
                        {showLargeFileWarning && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200"
                            >
                                <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-orange-800">
                                    <p className="font-medium mb-1">Large File Notice:</p>
                                    <p className="text-xs">
                                        Your file contains {recordCount} records. Processing may take approximately{' '}
                                        <span className="font-medium">
                                            {calculateProcessingTime(recordCount)}
                                        </span>. 
                                        For optimal performance, consider uploading in smaller batches of 1,000 records or less.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                     <div
                        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                            isDragOver
                                ? 'border-blue-400 bg-blue-50'
                                : selectedFile 
                                    ? 'border-blue-300 bg-blue-50' 
                                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={isSubmitting}
                        />

                        <AnimatePresence mode="wait">
                            {selectedFile ? (
                                <motion.div
                                    key="file-selected"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="space-y-3"
                                >
                                    <div className="flex items-center justify-center w-14 h-14 mx-auto bg-green-100 rounded-full">
                                        <FileText className="w-7 h-7 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                                        <div className="flex items-center justify-center space-x-4 mt-2 text-xs text-gray-500">
                                            <span>{formatFileSize(selectedFile.size)}</span>
                                            <span>•</span>
                                            <span>{formatLastModified(selectedFile.lastModified)}</span>
                                            {recordCount > 0 && (
                                                <>
                                                    <span>•</span>
                                                    <span className={recordCount > 1000 ? 'text-orange-600 font-medium' : ''}>
                                                        {recordCount} records
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {!isSubmitting && (
                                        <button
                                            onClick={handleRemoveFile}
                                            className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-red-100 transition-colors group"
                                            title="Remove file"
                                        >
                                            <X className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                                        </button>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="file-upload"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center justify-center w-14 h-14 mx-auto bg-gray-100 rounded-full">
                                        <Upload className={`w-7 h-7 transition-colors ${
                                            isDragOver 
                                                ? 'text-blue-600' 
                                                : 'text-gray-400'
                                        }`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {isDragOver ? 'Drop your file here' : 'Drop your Excel file here'}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            or{' '}
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-blue-600 hover:text-blue-500 underline font-medium"
                                                disabled={isSubmitting}
                                            >
                                                browse files
                                            </button>
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        Maximum file size: 10MB
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                     <AnimatePresence>
                        {isSubmitting && uploadProgress > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-2"
                            >
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700">
                                        {hashingProgress ? 
                                            `Processing ${hashingProgress.currentDevice}...` : 
                                            'Processing...'
                                        }
                                    </span>
                                    <span className="text-blue-600 font-medium">
                                        {Math.round(uploadProgress)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-blue-600 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${uploadProgress}%` }}
                                        transition={{ duration: 0.3, ease: 'easeOut' }}
                                    />
                                </div>
                                {hashingProgress && (
                                    <div className="text-xs text-gray-500 text-center">
                                        {hashingProgress.current} of {hashingProgress.total} devices processed
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                     <AnimatePresence>
                        {(uploadStatus || uploadMessage) && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`flex items-start space-x-3 p-4 rounded-lg ${
                                    uploadStatus === 'success'
                                        ? 'bg-green-50 border border-green-200'
                                        : uploadStatus === 'ready'
                                        ? 'bg-blue-50 border border-blue-200'
                                        : uploadStatus === 'error'
                                        ? 'bg-red-50 border border-red-200'
                                        : 'bg-blue-50 border border-blue-200'
                                }`}
                            >
                                <div className="flex-shrink-0 mt-0.5">
                                    {uploadStatus === 'success' && (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    )}
                                    {uploadStatus === 'ready' && (
                                        <CheckCircle className="w-5 h-5 text-blue-600" />
                                    )}
                                    {uploadStatus === 'error' && (
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm font-medium ${
                                        uploadStatus === 'success'
                                            ? 'text-green-800'
                                            : uploadStatus === 'ready'
                                            ? 'text-blue-800'
                                            : uploadStatus === 'error'
                                            ? 'text-red-800'
                                            : 'text-blue-800'
                                    }`}>
                                        {uploadStatus === 'error' ? (
                                            <div className="whitespace-pre-line">
                                                {uploadMessage}
                                            </div>
                                        ) : (
                                            uploadMessage
                                        )}
                                    </p>
                                    {uploadStatus === 'success' && (
                                        <p className="text-xs text-green-600 mt-1">
                                            You can close this dialog or it will close automatically.
                                        </p>
                                    )}
                                    {uploadStatus === 'ready' && (
                                        <p className="text-xs text-blue-600 mt-1">
                                            Click "Upload Devices" to upload to the server.
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                     <AnimatePresence>
                        {isSubmitting && !uploadMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center justify-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200"
                            >
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                <span className="text-sm font-medium text-blue-800">
                                    Processing your file...
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                 <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSubmitting && !isProcessing}
                    >
                        {isProcessing ? 'Cancel Processing' : 'Cancel'}
                    </Button>
                    
                    {selectedFile && !passwordsHashed && !isProcessing && (
                        <Button
                            onClick={processFileAndHashPasswords}
                            disabled={isSubmitting || passwordsHashed}
                            className="min-w-[120px] bg-orange-600 hover:bg-orange-700"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Process File
                        </Button>
                    )}
                    
                    {isProcessing && (
                        <Button
                            disabled
                            className="min-w-[120px] bg-orange-600"
                        >
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                        </Button>
                    )}
                    
                    {passwordsHashed && !isProcessing && (
                        <Button
                            onClick={handleSubmit}
                            disabled={!passwordsHashed || isSubmitting || uploadStatus === 'success'}
                            className={`min-w-[120px] ${
                                uploadStatus === 'success' 
                                    ? 'bg-green-600 hover:bg-green-700' 
                                    : ''
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Uploading...
                                </>
                            ) : uploadStatus === 'success' ? (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Uploaded
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Devices
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UploadModal;
