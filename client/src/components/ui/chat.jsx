import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Paperclip, X, File, RefreshCw, Eye, CheckCircle, MessageCircle, Download, Camera, Video, Mic } from 'lucide-react';
import DocumentModal from './DocumentModal';
import MediaCapture from './MediaCapture';
import { isMediaUploadEnabled, getMaxVideoDuration, getMaxAudioDuration } from '../../lib/mediaConfig';
import { useToast } from '../../lib/hooks/use-toast';
import { useSoundManager } from '../../lib/hooks/SoundManager';
import moment from 'moment';

const TicketClosedView = ({ onViewChat }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative">
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>

        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Ticket Closed</h3>
          <p className="text-gray-600 mb-6">This ticket has been successfully resolved and closed.</p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onViewChat}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            View Chat History
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

const MessageAttachment = ({ attachment, isOwnMessage, onPreview }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const getIcon = (attachment) => {
    const mimeType = attachment.fileType || attachment.type || '';
    const fileName = attachment.fileName || attachment.name || '';

    if (mimeType.startsWith('image/') || attachment.type === 'image') {
      return '🖼️';
    } else if (mimeType.startsWith('video/') || attachment.type === 'video' || /\.(mp4|mov|avi|webm)$/i.test(fileName)) {
      return '🎥';
    } else if (mimeType.startsWith('audio/') || attachment.type === 'audio' || /\.(mp3|wav|ogg|m4a)$/i.test(fileName)) {
      return '🎵';
    } else if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) {
      return '📄';
    } else if (mimeType.includes('document') || mimeType.includes('word') || /\.(doc|docx)$/i.test(fileName)) {
      return '📝';
    } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || /\.(xls|xlsx)$/i.test(fileName)) {
      return '📊';
    }
    return '📁';
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    setIsDownloading(true);

    try {
      const baseApiUrl = import.meta.env.VITE_API_URL;
      const baseUrl = baseApiUrl.replace('/api', ''); // Remove /api for file URLs
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      let downloadUrl;

      // Use dedicated download endpoint if attachment has an ID
      if (attachment.id) {
        downloadUrl = `${baseApiUrl}/attachments/download/${attachment.id}`;
      } else {
        // Fallback to direct file URL - handle both /uploads and /api/uploads
        const fileUrl = attachment.url.startsWith('/uploads/') ? attachment.url : `/uploads/${attachment.url}`;
        downloadUrl = `${baseUrl}${fileUrl}`;
      }

      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
      });

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = (e) => {
    e.stopPropagation();
    if (onPreview) {
      onPreview(attachment);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`flex items-center gap-2 p-2 rounded-lg transition-colors mb-1 ${isOwnMessage
        ? 'bg-blue-400'
        : 'bg-gray-200'
        }`}
    >
      <span className="text-sm">{getIcon(attachment)}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate max-w-40 ${isOwnMessage ? 'text-white' : 'text-gray-900'}`}>
          {attachment.name}
        </p>
        <p className={`text-[10px] ${isOwnMessage ? 'text-blue-100' : 'text-gray-600'}`}>
          {attachment.size}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={handlePreview}
          className={`p-1 rounded transition-colors ${isOwnMessage
            ? 'text-white hover:text-blue-100'
            : 'text-gray-600 hover:text-gray-800 cursor-pointer '
            }`}
          title="Preview"
        >
          <Eye className="w-3 h-3" />
        </button>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className={`p-1 rounded transition-colors ${isDownloading
            ? 'opacity-50 cursor-not-allowed'
            : isOwnMessage
              ? 'text-white hover:text-blue-100'
              : 'text-gray-600 hover:text-gray-800 cursor-pointer '
            }`}
          title={isDownloading ? 'Downloading...' : 'Download'}
        >
          {isDownloading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-3 h-3 border border-current border-t-transparent rounded-full"
            />
          ) : (
            <Download className="w-3 h-3" />
          )}
        </button>
      </div>
    </motion.div>
  );
};

export const ChatMessage = ({ message, isOwnMessage = false, timestamp, avatar, name, attachments = [], onPreviewAttachment, date }) => {
  const formatDateTime = (timestamp, date) => {
    if (!timestamp) return '';
    
    // If date is provided, use it
    if (date) {
      return `${moment(date).format('LLL')}`;
    }
    
    // Otherwise try to format the timestamp
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // If timestamp contains date info, parse it
    const dateMatch = timestamp.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (dateMatch) {
      return timestamp;
    }
    
    // If timestamp is just time, add today's date
    const msgDate = today.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${msgDate} ${timestamp}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-2 sm:gap-3 mb-3 sm:mb-4 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
    >
      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs sm:text-sm font-medium flex-shrink-0">
        {avatar || name?.charAt(0) || 'A'}
      </div>
      <div className={`flex flex-col max-w-[75%] sm:max-w-[70%] ${isOwnMessage ? 'items-end' : ''}`}>
        <div className={`px-3 sm:px-4 py-2 rounded-2xl ${isOwnMessage
          ? 'bg-blue-500 text-white rounded-br-md'
          : 'bg-gray-100 text-gray-900 rounded-bl-md'
          }`}>
          {message && <p className="text-xs sm:text-sm">{message}</p>}
          {attachments && attachments.length > 0 && (
            <div className={`${message ? 'mt-2' : ''} space-y-1`}>
              {attachments.map((attachment, index) => (
                <MessageAttachment
                  key={attachment.id || index}
                  attachment={attachment}
                  isOwnMessage={isOwnMessage}
                  onPreview={onPreviewAttachment}
                />
              ))}
            </div>
          )}
        </div>
        <span className="text-[10px] sm:text-xs text-gray-500 mt-1 px-2">
          {formatDateTime(timestamp, date)} {name ? `• ${name}` : ''}
        </span>
      </div>
    </motion.div>
  );
};

export const ChatInput = ({ onSendMessage, onFileUpload, disabled = false, ticketStatus = null }) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showMediaCapture, setShowMediaCapture] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [mediaUploadEnabled, setMediaUploadEnabled] = useState(false);
  const [maxVideoDuration, setMaxVideoDuration] = useState(120);
  const [maxAudioDuration, setMaxAudioDuration] = useState(300);
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  const { play, muted } = useSoundManager();

  // Load media upload configuration on component mount
  /*   useEffect(() => {
      const loadMediaConfig = async () => {
        try {
          const enabled = await isMediaUploadEnabled();
          const videoDuration = await getMaxVideoDuration();
          const audioDuration = await getMaxAudioDuration();
          
          setMediaUploadEnabled(enabled);
          setMaxVideoDuration(videoDuration);
          setMaxAudioDuration(audioDuration);
        } catch (error) {
          console.warn('Failed to load media config:', error);
          // Fallback to environment variables
          setMediaUploadEnabled(import.meta.env.VITE_ENABLE_MEDIA_UPLOAD === 'true');
        }
      };
      
      loadMediaConfig();
    }, []); */

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      if (!muted) {
        play('outbound_chime');
      }
      onSendMessage(message.trim(), attachments);
      setMessage('');
      setAttachments([]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    // Check if any files are media files when media upload is disabled
    if (!mediaUploadEnabled) {
      const mediaFiles = files.filter(file => {
        const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|avi|webm)$/i.test(file.name);
        const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(file.name);
        return isVideo || isAudio;
      });

      if (mediaFiles.length > 0) {
        toast({
          title: "Video/Voice Upload Not Enabled",
          description: `${mediaFiles.length === 1 ? 'This file type is' : 'These file types are'} not supported. Video and audio upload features are disabled. Please contact your administrator.`,
          variant: "destructive"
        });

        // Filter out media files
        const allowedFiles = files.filter(file => {
          const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|avi|webm)$/i.test(file.name);
          const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(file.name);
          return !isVideo && !isAudio;
        });

        setAttachments(prev => [...prev, ...allowedFiles]);
        return;
      }
    }

    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleMediaCapture = (file, mediaType) => {
    // Add the captured media file to attachments
    setAttachments(prev => [...prev, file]);
    setShowMediaCapture(false);
  };

  const handleMediaCaptureClose = () => {
    setShowMediaCapture(false);
  };

  const handleMediaCaptureAttempt = () => {
    if (!mediaUploadEnabled) {
      toast({
        title: "Video/Voice Upload Not Enabled",
        description: "Video and audio upload features are currently disabled. Please contact your administrator to enable this feature.",
        variant: "destructive"
      });
      return;
    }
    setShowMediaCapture(true);
  };

  // Update mobile view on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`border-t py-5 pb-0 border-gray-200 p-2 sm:p-4  ${disabled ? 'bg-gray-200' : 'bg-white '}`}>
      {/* Attachments Preview */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 sm:mb-3"
          >
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 bg-gray-100 cursor-pointer rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm"
                >
                  <File className="w-[14px] h-[14px] sm:w-4 sm:h-4 text-gray-500" />
                  <span className="truncate max-w-24 sm:max-w-32">{file.name}</span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X className="w-3 h-3 sm:w-[14px] sm:h-[14px]" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            disabled={disabled}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base"
            rows={2}
            style={{ maxHeight: '120px' }}
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            className="hidden"
            accept={mediaUploadEnabled
              ? "image/*,.pdf,.doc,.docx,.txt,.mp4,.mov,.avi,.webm,.mp3,.wav,.ogg,.m4a"
              : "image/*,.pdf,.doc,.docx,.txt"
            }
          />

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="p-2 sm:p-3 text-gray-500 hover:text-blue-500 transition-colors disabled:text-gray-300 disabled:cursor-not-allowed"
            title={mediaUploadEnabled ? "Attach files" : "Attach files (media upload disabled)"}
          >
            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>

          {/* Media Capture Button - Show on mobile or small screens
          {isMobileView && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleMediaCaptureAttempt}
              disabled={disabled}
              className={`p-2 sm:p-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
                mediaUploadEnabled
                  ? 'text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                  : 'text-gray-400 bg-gray-200 hover:bg-gray-300 cursor-pointer'
              }`}
              title={mediaUploadEnabled ? "Capture photo/video/audio" : "Media upload disabled - Contact admin"}
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          )}
 */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={disabled || (!message.trim() && attachments.length === 0)}
            className="p-2 sm:p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>
        </div>
      </div>

      {/* Media Capture Modal */}
      <AnimatePresence>
        {showMediaCapture && mediaUploadEnabled && (
          <MediaCapture
            onCapture={handleMediaCapture}
            onClose={handleMediaCaptureClose}
            disabled={disabled}
            maxVideoDuration={maxVideoDuration}
            maxAudioDuration={maxAudioDuration}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export const ChatWindow = ({
  messages = [],
  onSendMessage,
  isTyping = false,
  autoCloseTimer = null,
  disabled = false,
  loading = false,
  error = null,
  isConnected = true,
  onRefresh = null,
  ticketStatus = null,
  onMarkMessagesAsSeen = null, // New prop for marking messages as seen
  currentUserId = null // New prop for current user ID
}) => {
  const messagesEndRef = useRef(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePreviewAttachment = (attachment) => {
    setSelectedDocument(attachment);
    setIsDocumentModalOpen(true);
  };

  const closeDocumentModal = () => {
    setIsDocumentModalOpen(false);
    setSelectedDocument(null);
  };

  const handleViewChat = () => {
    setShowChatHistory(true);
  };

  const handleBackToClosedView = () => {
    setShowChatHistory(false);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-mark messages as seen when they become visible
  useEffect(() => {
    if (!onMarkMessagesAsSeen || !currentUserId || !messages.length) return;

    const unreadMessages = messages.filter(message =>
      message.senderId !== currentUserId && // Don't mark own messages
      !message.seenBy?.some(seen => seen.userId === currentUserId) // Not already seen
    );

    if (unreadMessages.length > 0) {
      // Mark all unread messages as seen after a short delay to ensure they're visible
      const timeoutId = setTimeout(() => {
        const messageIds = unreadMessages.map(msg => msg.id);
        onMarkMessagesAsSeen(messageIds).catch(console.error);
      }, 1000); // 1 second delay

      return () => clearTimeout(timeoutId);
    }
  }, [messages, onMarkMessagesAsSeen, currentUserId]);

  // Show closed ticket view if ticket is closed and user hasn't requested to view chat
  if (ticketStatus === 'closed' && !showChatHistory) {
    return (
      <div className="flex flex-col h-full bg-white">
        <TicketClosedView onViewChat={handleViewChat} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="border-b border-gray-200 p-3 sm:p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">
              {ticketStatus === 'closed' && showChatHistory ? 'Chat History' : <div>
                Conversation
              </div>}
            </h3>
            {ticketStatus === 'closed' && showChatHistory && (
              <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-full">
                Ticket Closed
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {ticketStatus === 'closed' && showChatHistory && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBackToClosedView}
                className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
              >
                Back
              </motion.button>
            )}
            {/* Connection Status */}
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              title={isConnected ? 'Connected' : 'Disconnected'} />
            <span className="text-xs text-gray-600">
              {isConnected ? 'Live' : 'Offline'}
            </span>
            {onRefresh && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onRefresh}
                className="p-1 text-gray-500 cursor-pointer hover:text-blue-500 transition-colors"
                title="Refresh messages"
              >
                <RefreshCw className="w-3 h-3" />
              </motion.button>
            )}
          </div>
        </div>

        {/*  {autoCloseTimer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs sm:text-sm text-amber-600 mt-1"
          >
            Auto-close in {Math.ceil(autoCloseTimer / 60)} minutes if no response
          </motion.div>
        )} */}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs sm:text-sm text-red-600 mt-1 bg-red-50 px-2 py-1 rounded"
          >
            {error}
          </motion.div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto sm:max-h-full max-h-4/5 p-3 sm:p-4 space-y-3 sm:space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
              />
              <p className="text-sm text-gray-500">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p className="text-sm sm:text-base">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <ChatMessage
              key={msg.id || index}
              message={msg.message}
              isOwnMessage={msg.isOwnMessage}
              timestamp={msg.createdAt}
              date={msg.createdAt}
              avatar={msg.avatar}
              name={msg.senderName}
              attachments={msg.attachments}
              onPreviewAttachment={handlePreviewAttachment}
            />
          ))
        )}

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex gap-3 mb-4"
            >
              {/*   <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm">
                 T
              </div> */}
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      {ticketStatus === 'closed' && showChatHistory ? (
        <div className="border-t border-b border-gray-200 p-4 bg-gray-50">
          <div className="text-center text-sm text-gray-600">
            This ticket is closed. No new messages can be sent.
          </div>
        </div>
      ) : (
        <ChatInput
          ticketStatus={ticketStatus}
          onSendMessage={onSendMessage}
          disabled={disabled || !isConnected || ticketStatus === 'closed'}
        />
      )}

      {/* Document Modal */}
      <DocumentModal
        isOpen={isDocumentModalOpen}
        onClose={closeDocumentModal}
        document={selectedDocument}
      />
    </div>
  );
};