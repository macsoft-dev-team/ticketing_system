import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Video, 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  X, 
  Volume2,
  Download,
  Trash2,
  Upload,
  Eye,
  EyeOff,
  Send
} from 'lucide-react';
import { compressImage } from '../../lib/utils/imageCompressor';

const MediaCapture = ({ 
  onCapture, 
  onClose, 
  disabled = false,
  allowedModes = ['photo', 'video', 'audio'],
  initialMode = 'photo',
  maxVideoDuration = 120, // 2 minutes in seconds
  maxAudioDuration = 300, // 5 minutes in seconds
  supportedFormats = {
    image: ['image/jpeg', 'image/png'],
    video: ['video/mp4', 'video/webm'],
    audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm']
  }
}) => {
  const [currentMode, setCurrentMode] = useState(
    allowedModes.includes(initialMode) ? initialMode : (allowedModes[0] || 'photo')
  );
  const [mediaState, setMediaState] = useState('idle'); // 'idle', 'recording', 'recorded', 'playing'
  const [stream, setStream] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'
  const [error, setError] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [cameraPermission, setCameraPermission] = useState('prompt');
  const [microphonePermission, setMicrophonePermission] = useState('prompt');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const audioPreviewRef = useRef(null);
  const streamRef = useRef(null);
  const deviceCameraInputRef = useRef(null);

  // Manage object URL for preview cleanly
  useEffect(() => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [recordedBlob]);

  // Keep streamRef updated
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  // Get supported media types based on current browser
  const getSupportedMimeType = useCallback((mediaType) => {
    const types = supportedFormats[mediaType] || [];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    // Fallback types
    if (mediaType === 'video') {
      return 'video/webm;codecs=vp8';
    } else if (mediaType === 'audio') {
      return 'audio/webm;codecs=opus';
    }
    return types[0];
  }, [supportedFormats]);

  // Check permissions (only request microphone if in video or audio mode)
  const checkPermissions = useCallback(async () => {
    try {
      if (navigator.permissions?.query) {
        const cameraResult = await navigator.permissions.query({ name: 'camera' });
        setCameraPermission(cameraResult.state);
        cameraResult.onchange = () => setCameraPermission(cameraResult.state);

        if (currentMode !== 'photo') {
          const microphoneResult = await navigator.permissions.query({ name: 'microphone' });
          setMicrophonePermission(microphoneResult.state);
          microphoneResult.onchange = () => setMicrophonePermission(microphoneResult.state);
        }
      }
    } catch (error) {
      console.warn('Permission API not supported:', error);
    }
  }, [currentMode]);

  // Initialize media stream with mobile-safe constraints
  const initializeStream = useCallback(async () => {
    try {
      setError(null);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera is not supported on this device or requires a secure connection (HTTPS).');
      }

      // Safe constraints for both mobile and desktop (avoids restrictive max width/height that fails on mobile portrait)
      const constraints = {
        video: currentMode === 'audio' ? false : {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: currentMode !== 'photo'
      };

      let newStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (constraintErr) {
        console.warn('Initial camera constraints failed, attempting fallback:', constraintErr);
        // Fallback for devices without back camera or strict constraint support
        if (currentMode !== 'audio') {
          try {
            newStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: facingMode },
              audio: currentMode !== 'photo'
            });
          } catch (err2) {
            newStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: currentMode !== 'photo'
            });
          }
        } else {
          throw constraintErr;
        }
      }

      streamRef.current = newStream;
      setStream(newStream);

      // Set up audio level monitoring for audio/video modes
      if (currentMode !== 'photo' && newStream.getAudioTracks().length > 0) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(newStream);
        
        analyser.fftSize = 256;
        microphone.connect(analyser);
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
      }
      
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setError(getErrorMessage(error));
    }
  }, [currentMode, facingMode]);

  // Connect stream to video element and ensure autoplay on mobile
  useEffect(() => {
    if (videoRef.current && stream && currentMode !== 'audio' && !isPreviewMode) {
      const video = videoRef.current;
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Video auto-play prevented or stream ended:', err);
        });
      }
    }
  }, [stream, currentMode, isPreviewMode]);

  // Get user-friendly error message
  const getErrorMessage = (error) => {
    if (error.name === 'NotAllowedError') {
      return 'Camera access was denied. Please enable camera permission in your browser settings, or tap below to open the device camera app.';
    } else if (error.name === 'NotFoundError') {
      return 'No camera or microphone found on this device.';
    } else if (error.name === 'NotReadableError') {
      return 'Camera is being used by another application or blocked by system.';
    } else if (error.name === 'OverconstrainedError') {
      return 'Camera configuration not supported by this device.';
    }
    return `Camera error: ${error.message || 'Unable to open camera.'}`;
  };

  // Fallback to native device camera app (works on all mobile devices even if WebRTC fails)
  const handleDeviceCameraCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    try {
      // Compress the native device photo to prevent huge files (e.g. 5-10MB) from mobile cameras
      const compressed = await compressImage(file, { quality: 0.7, maxWidth: 1280, maxHeight: 1280 });
      onCapture(compressed, 'photo', true);
    } catch (err) {
      console.warn('Compression error on device capture:', err);
      onCapture(file, 'photo', true);
    }
    onClose();
  };

  // Capture photo frame from stream
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    let width = video.videoWidth || 1280;
    let height = video.videoHeight || 720;

    // Scale to standard mobile size (max 1280) to ensure lightweight transfer and low memory use
    const maxWidth = 1280;
    const maxHeight = 1280;
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

    canvas.width = width;
    canvas.height = height;
    
    // When front camera (user facing) is active, flip horizontally to match video viewfinder
    if (facingMode === 'user') {
      context.translate(width, 0);
      context.scale(-1, 1);
    }

    context.drawImage(video, 0, 0, width, height);
    
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Failed to capture photo frame. Please try again or use the device camera.');
        return;
      }
      setRecordedBlob(blob);
      setMediaState('recorded');
      setIsPreviewMode(true);
    }, 'image/jpeg', 0.72);
  }, [facingMode]);

  // Start recording (video or audio)
  const startRecording = useCallback(async () => {
    if (!stream) return;

    try {
      const mimeType = getSupportedMimeType(currentMode);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality
        audioBitsPerSecond: 128000   // 128 kbps for good audio quality
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        setRecordedBlob(blob);
        setMediaState('recorded');
        setIsPreviewMode(true);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setMediaState('recording');
      setRecordingDuration(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          const maxDuration = currentMode === 'video' ? maxVideoDuration : maxAudioDuration;
          
          if (newDuration >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newDuration;
        });
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording: ' + error.message);
    }
  }, [stream, currentMode, getSupportedMimeType, maxVideoDuration, maxAudioDuration]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaState === 'recording') {
      mediaRecorderRef.current.stop();
      setMediaState('recorded');
    }
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    
    setAudioLevel(0);
  }, [mediaState]);

  // Play recorded media
  const playRecording = useCallback(() => {
    if (!recordedBlob) return;

    if (currentMode === 'audio' && audioPreviewRef.current) {
      const audioUrl = URL.createObjectURL(recordedBlob);
      audioPreviewRef.current.src = audioUrl;
      audioPreviewRef.current.play();
      setMediaState('playing');
      
      audioPreviewRef.current.onended = () => {
        setMediaState('recorded');
        URL.revokeObjectURL(audioUrl);
      };
    } else if (currentMode === 'video' && videoRef.current) {
      const videoUrl = URL.createObjectURL(recordedBlob);
      videoRef.current.srcObject = null;
      videoRef.current.src = videoUrl;
      videoRef.current.play();
      setMediaState('playing');
      
      videoRef.current.onended = () => {
        setMediaState('recorded');
        URL.revokeObjectURL(videoUrl);
        // Restore live stream
        if (stream) {
          videoRef.current.src = null;
          videoRef.current.srcObject = stream;
        }
      };
    }
  }, [recordedBlob, currentMode, stream]);

  // Pause playback
  const pausePlayback = useCallback(() => {
    if (currentMode === 'audio' && audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    } else if (currentMode === 'video' && videoRef.current) {
      videoRef.current.pause();
    }
    setMediaState('recorded');
  }, [currentMode]);

  // Reset capture
  const resetCapture = useCallback(() => {
    if (recordedBlob) {
      URL.revokeObjectURL(recordedBlob);
    }
    
    setRecordedBlob(null);
    setMediaState('idle');
    setRecordingDuration(0);
    setIsPreviewMode(false);
    setError(null);
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }

    // Restore live stream for video modes
    if (stream && videoRef.current && currentMode !== 'audio') {
      videoRef.current.src = null;
      videoRef.current.srcObject = stream;
    }
  }, [recordedBlob, stream, currentMode]);

  // Flip camera (front/back)
  const flipCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // Format duration for display
  const formatDuration = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle mode change
  const changeMode = useCallback((newMode) => {
    if (newMode === currentMode) return;
    
    resetCapture();
    setCurrentMode(newMode);
  }, [currentMode, resetCapture]);

  // Handle capture submission
  const handleCapture = useCallback((sendDirectly = true) => {
    if (!recordedBlob) return;

    const file = new File(
      [recordedBlob], 
      `Live_Photo_${Date.now()}.${currentMode === 'photo' ? 'jpg' : currentMode === 'video' ? 'mp4' : 'webm'}`,
      { 
        type: recordedBlob.type || 'image/jpeg',
        lastModified: Date.now()
      }
    );

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    onCapture(file, currentMode, sendDirectly);
    onClose();
  }, [recordedBlob, currentMode, onCapture, onClose, stream]);

  const handleClose = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onClose();
  }, [stream, onClose]);

  // Cleanup on unmount or mode change
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [stream]);

  // Initialize when component mounts or mode changes
  useEffect(() => {
    checkPermissions();
    initializeStream();
  }, [currentMode, facingMode, checkPermissions, initializeStream]);

  // Check if we're on a small screen
  const isSmallScreen = window.innerWidth < 768;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-3 sm:p-4">
        <div className="flex items-center justify-between text-white max-w-4xl mx-auto">
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors cursor-pointer"
            title="Close camera"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-semibold tracking-wide">
              {allowedModes.length === 1 && allowedModes[0] === 'photo'
                ? 'Live Camera'
                : `${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)} Mode`}
            </span>
            <span className="px-2 py-0.5 text-[10px] sm:text-xs bg-emerald-500 text-white rounded-full font-medium flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Live
            </span>
            {recordingDuration > 0 && (
              <span className="text-red-400 font-mono text-sm">
                {formatDuration(recordingDuration)}
              </span>
            )}
          </div>

          {currentMode !== 'audio' ? (
            <button
              type="button"
              onClick={flipCamera}
              className="p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors cursor-pointer"
              title="Flip camera (front / back)"
            >
              <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col h-full">
        {/* Media Display Area */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="text-center p-6 z-10 max-w-sm">
              <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center text-2xl mb-3">
                ⚠️
              </div>
              <h4 className="text-white font-semibold mb-1">Camera Access Issue</h4>
              <p className="text-gray-300 text-xs sm:text-sm mb-5 leading-relaxed">{error}</p>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    initializeStream();
                  }}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors shadow-md cursor-pointer"
                >
                  Try Live Camera Again
                </button>
                <button
                  type="button"
                  onClick={() => deviceCameraInputRef.current?.click()}
                  className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium border border-gray-600 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4 text-blue-400" />
                  <span>Open Device Camera App</span>
                </button>
              </div>
            </div>
          ) : currentMode === 'audio' ? (
            <div className="text-center p-8">
              <div className="relative mb-6">
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Mic className={`w-16 h-16 text-white transition-transform ${mediaState === 'recording' ? 'scale-110' : ''}`} />
                </div>
                
                {/* Audio level indicator */}
                {mediaState === 'recording' && (
                  <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-pulse">
                    <div 
                      className="absolute inset-0 rounded-full border-4 border-red-400 transition-opacity"
                      style={{ opacity: audioLevel }}
                    />
                  </div>
                )}
              </div>
              
              <p className="text-white text-lg mb-2">
                {mediaState === 'recording' ? 'Recording Audio...' : 'Audio Recording'}
              </p>
              
              {mediaState === 'recorded' && (
                <p className="text-gray-300 text-sm">
                  Recording ready - {formatDuration(recordingDuration)}
                </p>
              )}
              
              {/* Audio playback element */}
              <audio ref={audioPreviewRef} className="hidden" controls={false} />
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = true;
                    videoRef.current.play().catch(() => {});
                  }
                }}
                className="w-full h-full object-cover"
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              />
              
              {/* Viewfinder framing guide for photo mode */}
              {currentMode === 'photo' && !isPreviewMode && !error && (
                <div className="absolute inset-8 sm:inset-16 pointer-events-none rounded-2xl border border-white/20">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-white rounded-br" />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white/90 text-[11px] font-medium flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-blue-400" />
                    <span>Point device at subject and tap shutter</span>
                  </div>
                </div>
              )}

              {/* Recording indicator */}
              {mediaState === 'recording' && (
                <div className="absolute top-16 right-4 bg-red-500 rounded-full p-2 animate-pulse">
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>
              )}
              
              {/* Preview overlay for captured photos */}
              {currentMode === 'photo' && isPreviewMode && previewUrl && (
                <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
                  <img
                    src={previewUrl}
                    alt="Captured Live Photo"
                    className="max-w-full max-h-full object-contain"
                  />
                  <div className="absolute top-16 left-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-medium flex items-center gap-1.5 border border-white/20 shadow-md">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Photo captured live - Review & confirm</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Hidden native device camera input for fallback */}
          <input
            ref={deviceCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleDeviceCameraCapture}
          />
        </div>

        {/* Bottom Controls */}
        <div className="bg-black/95 backdrop-blur-md p-4 sm:p-5 space-y-3 z-20">
          {/* Mode Selection - only shown when more than 1 mode is permitted */}
          {allowedModes.length > 1 && (
            <div className="flex justify-center gap-2 mb-2">
              {allowedModes.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => changeMode(mode)}
                  disabled={mediaState === 'recording'}
                  className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                    currentMode === mode
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white/15 text-white/80 hover:bg-white/25'
                  } disabled:opacity-50`}
                >
                  {mode === 'photo' && <Camera className="w-3.5 h-3.5 mr-1.5 inline" />}
                  {mode === 'video' && <Video className="w-3.5 h-3.5 mr-1.5 inline" />}
                  {mode === 'audio' && <Mic className="w-3.5 h-3.5 mr-1.5 inline" />}
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-6">
            {mediaState === 'idle' ? (
              <button
                type="button"
                onClick={currentMode === 'photo' ? capturePhoto : startRecording}
                disabled={disabled || !!error}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ring-4 ring-white/30"
                title="Capture live photo"
              >
                {currentMode === 'photo' ? (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-gray-900 flex items-center justify-center">
                    <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-gray-900" />
                  </div>
                ) : currentMode === 'video' ? (
                  <Video className="w-8 h-8 text-red-500" />
                ) : (
                  <Mic className="w-8 h-8 text-blue-500" />
                )}
              </button>
            ) : mediaState === 'recording' ? (
              <button
                type="button"
                onClick={stopRecording}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors shadow-xl ring-4 ring-red-400/30 cursor-pointer"
              >
                <Square className="w-8 h-8 text-white fill-current" />
              </button>
            ) : mediaState === 'recorded' ? (
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={resetCapture}
                  className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-gray-800 hover:bg-gray-700 text-white text-xs sm:text-sm font-medium transition-colors shadow-lg border border-gray-700 cursor-pointer"
                  title="Retake photo"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>Retake</span>
                </button>
                
                {currentMode !== 'photo' && (
                  <button
                    type="button"
                    onClick={playRecording}
                    className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg cursor-pointer"
                  >
                    <Play className="w-5 h-5 text-white fill-current" />
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => handleCapture(true)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg cursor-pointer"
                  title="Send photo directly to chat"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Photo</span>
                </button>
              </div>
            ) : mediaState === 'playing' ? (
              <button
                type="button"
                onClick={pausePlayback}
                className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-colors shadow-xl cursor-pointer"
              >
                <Pause className="w-7 h-7 text-white fill-current" />
              </button>
            ) : null}
          </div>

          {/* Additional Info */}
          {mediaState === 'idle' && (
            <div className="text-center">
              <p className="text-white/70 text-xs sm:text-sm">
                {currentMode === 'photo' 
                  ? 'Tap button to capture live photo'
                  : currentMode === 'video'
                  ? `Tap to start recording (max ${Math.floor(maxVideoDuration / 60)}min)`
                  : `Tap to start recording (max ${Math.floor(maxAudioDuration / 60)}min)`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaCapture;