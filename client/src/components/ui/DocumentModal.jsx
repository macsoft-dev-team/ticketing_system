import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Eye, FileText, Image, File as FileIcon } from 'lucide-react';

const DocumentModal = ({ isOpen, onClose, document: fileDocument }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !fileDocument) return null;

  const isImage = fileDocument.mimetype?.startsWith('image/');
  const isPdf = fileDocument.mimetype === 'application/pdf';
  const isText = fileDocument.mimetype === 'text/plain' || fileDocument.name?.endsWith('.txt');
  
  const baseApiUrl = import.meta.env.VITE_API_URL;
  const baseUrl = baseApiUrl?.replace('/api', '') || 'http://localhost:3057'; // Remove /api for file URLs
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  // Construct the proper file URL
  const getFileUrl = () => {
    if (!fileDocument.url) {
      console.error('No file URL provided:', fileDocument);
      return '';
    }

    let fileUrl;
     
    if (fileDocument.url.startsWith('/uploads/')) {
      // URL already has /uploads prefix, just prepend base URL
      fileUrl = `${baseUrl}${fileDocument.url}`;
    } else if (fileDocument.url.startsWith('http')) {
      // Full URL already provided
      fileUrl = fileDocument.url;
    } else {
      // Add /uploads prefix if missing
      fileUrl = `${baseUrl}/uploads/${fileDocument.url}`;
    }
        return fileUrl;
  };

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let downloadUrl;
            
      // Try multiple download strategies
      const downloadStrategies = [];
      
      // Strategy 1: Use API endpoint if we have an ID and token
      if (fileDocument.id && token && baseApiUrl) {
        downloadStrategies.push({
          url: `${baseApiUrl}/attachments/download/${fileDocument.id}`,
          headers: { 'Authorization': `Bearer ${token}` },
          name: 'API with auth'
        });
      }
      
      // Strategy 2: Direct file access
      downloadStrategies.push({
        url: getFileUrl(),
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        name: 'Direct file'
      });
      
      // Strategy 3: Try with /api/uploads prefix
      if (fileDocument.url && baseApiUrl) {
        const fileUrl = fileDocument.url.startsWith('/uploads/') ? fileDocument.url : `/uploads/${fileDocument.url}`;
        downloadStrategies.push({
          url: `${baseApiUrl}${fileUrl}`,
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          name: 'API uploads'
        });
      }
            
      // Try each strategy until one works
      let testResponse;
      let lastError;
      
      for (const strategy of downloadStrategies) {
        try {
           testResponse = await fetch(strategy.url, {
            method: 'GET',
            headers: strategy.headers,
          });
          
          if (testResponse.ok) {
             downloadUrl = strategy.url;
            break;
          } else {
             lastError = new Error(`${strategy.name}: ${testResponse.status} ${testResponse.statusText}`);
          }
        } catch (error) {
           lastError = error;
        }
      }
      
      if (!testResponse || !testResponse.ok) {
        throw lastError || new Error('All download strategies failed');
      }
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
      });
            
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Download failed response:', errorText);
        throw new Error(`Failed to download file: ${response.status} - ${response.statusText}\n${errorText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = fileDocument.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      console.error('Document data:', fileDocument);
      console.error('Download URL attempted:', downloadUrl);
      setError(`Failed to download file: ${error.message}`)
    } finally {
      setLoading(false);
    }
  };

  const renderDocumentContent = () => {
    const fileUrl = getFileUrl();
    
    if (isImage) {
      return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <img 
            src={fileUrl}
            alt={fileDocument.name}
            className="max-w-full max-h-full object-contain"
            onLoad={() => console.log('Image loaded successfully:', fileUrl)}
            onError={(e) => {
              console.error('Image failed to load:', fileUrl, e);
              setError(`Failed to load image: ${fileUrl}`);
            }}
          />
        </div>
      );
    }
    
    if (isPdf) {
      return (
        <div className="h-full min-h-screen">
          <iframe
            src={fileUrl}
            title={fileDocument.name}
                  className="w-full h-full min-h-screen border-0"
            onError={() => setError('Failed to load PDF')}
          />
        </div>
      );
    }
    
    if (isText) {
      return (
        <div className="h-full min-h-[400px]">
          <iframe
            src={fileUrl}
            title={fileDocument.name}
            className="w-full h-full border-0 bg-white"
            onError={() => setError('Failed to load text file')}
          />
        </div>
      );
    }
    
      // For other file types, show file info and download option
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-4">
        <FileIcon className="w-16 h-16 text-gray-400" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{fileDocument.name}</h3>
          <p className="text-sm text-gray-600 mb-4">
            File type: {fileDocument.mimetype || 'Unknown'} • Size: {fileDocument.size}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            This file type cannot be previewed. Click download to view it.
          </p>
          <button
            onClick={handleDownload}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {loading ? 'Downloading...' : 'Download File'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b">
            <div className="flex items-center gap-3">
              {isImage ? (
                <Image className="w-5 h-5 text-blue-500" />
              ) : isPdf ? (
                <FileText className="w-5 h-5 text-red-500" />
              ) : (
                <FileIcon className="w-5 h-5 text-gray-500" />
              )}
              <div>
                <h2 className="text-sm font-semibold text-gray-900 truncate">
                  {fileDocument.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {fileDocument.size} • {fileDocument.mimetype}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-blue-500 transition-colors disabled:opacity-50"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {error ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                  <FileIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading File</h3>
                  <p className="text-sm text-red-600 mb-4">{error}</p>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Try Download
                  </button>
                </div>
              </div>
            ) : (
              renderDocumentContent()
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DocumentModal;