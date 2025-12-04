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
  EyeOff
} from 'lucide-react';

const MediaCapture = ({ 
  onCapture, 
  onClose, 
  disabled = false,
  maxVideoDuration = 120, // 2 minutes in seconds
  maxAudioDuration = 300, // 5 minutes in seconds
  supportedFormats = {
    image: ['image/jpeg', 'image/png'],
    video: ['video/mp4', 'video/webm'],
    audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm']
  }
}) => {
  const [currentMode, setCurrentMode] = useState('photo'); // 'photo', 'video', 'audio'
  const [mediaState, setMediaState] = useState('idle'); // 'idle', 'recording', 'recorded', 'playing'
  const [stream, setStream] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
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

  // Check permissions
  const checkPermissions = useCallback(async () => {
    try {
      const cameraResult = await navigator.permissions.query({ name: 'camera' });
      const microphoneResult = await navigator.permissions.query({ name: 'microphone' });
      
      setCameraPermission(cameraResult.state);
      setMicrophonePermission(microphoneResult.state);

      // Listen for permission changes
      cameraResult.onchange = () => setCameraPermission(cameraResult.state);
      microphoneResult.onchange = () => setMicrophonePermission(microphoneResult.state);
    } catch (error) {
      console.warn('Permission API not supported:', error);
    }
  }, []);

  // Initialize media stream
  const initializeStream = useCallback(async () => {
    try {
      setError(null);
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: currentMode === 'audio' ? false : {
          facingMode: facingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        },
        audio: currentMode !== 'photo'
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current && newStream.getVideoTracks().length > 0) {
        videoRef.current.srcObject = newStream;
      }

      // Set up audio level monitoring for audio/video modes
      if (currentMode !== 'photo' && newStream.getAudioTracks().length > 0) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(newStream);
        
        analyser.fftSize = 256;
        microphone.connect(analyser);
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        
        // Monitor audio levels
        const monitorAudio = () => {
          if (analyserRef.current && mediaState === 'recording') {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioLevel(average / 255);
            requestAnimationFrame(monitorAudio);
          }
        };
        
        if (mediaState === 'recording') {
          monitorAudio();
        }
      }
      
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setError(getErrorMessage(error));
    }
  }, [currentMode, facingMode, stream, mediaState]);

  // Get user-friendly error message
  const getErrorMessage = (error) => {
    if (error.name === 'NotAllowedError') {
      return 'Camera/microphone access denied. Please enable permissions and try again.';
    } else if (error.name === 'NotFoundError') {
      return 'Camera or microphone not found.';
    } else if (error.name === 'NotReadableError') {
      return 'Camera or microphone is being used by another application.';
    } else if (error.name === 'OverconstrainedError') {
      return 'Camera configuration not supported.';
    }
    return `Media error: ${error.message}`;
  };

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      setRecordedBlob(blob);
      setMediaState('recorded');
      setIsPreviewMode(true);
    }, 'image/jpeg', 0.9);
  }, []);

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
  const handleCapture = useCallback(() => {
    if (!recordedBlob) return;

    const file = new File(
      [recordedBlob], 
      `${currentMode}-${Date.now()}.${currentMode === 'photo' ? 'jpg' : currentMode === 'video' ? 'mp4' : 'webm'}`,
      { 
        type: recordedBlob.type,
        lastModified: Date.now()
      }
    );

    onCapture(file, currentMode);
    onClose();
  }, [recordedBlob, currentMode, onCapture, onClose]);

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
      if (recordedBlob) {
        URL.revokeObjectURL(recordedBlob);
      }
    };
  }, [stream, recordedBlob]);

  // Initialize when component mounts or mode changes
  useEffect(() => {
    checkPermissions();
    initializeStream();
  }, [currentMode, facingMode, checkPermissions, initializeStream]);

  // Check if we're on a small screen
  const isSmallScreen = window.innerWidth < 768;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
        <div className="flex items-center justify-between text-white">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium capitalize">{currentMode} Mode</span>
            {recordingDuration > 0 && (
              <span className="text-red-400 font-mono text-sm">
                {formatDuration(recordingDuration)}
              </span>
            )}
          </div>

          {currentMode !== 'audio' && (
            <button
              onClick={flipCamera}
              className="p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col h-full">
        {/* Media Display Area */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          {error ? (
            <div className="text-center p-4">
              <div className="text-red-400 text-lg mb-2">⚠️</div>
              <p className="text-white text-sm max-w-xs">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  initializeStream();
                }}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
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
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={mediaState !== 'playing'}
                className="w-full h-full object-cover"
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              />
              
              {/* Recording indicator */}
              {mediaState === 'recording' && (
                <div className="absolute top-4 right-4 bg-red-500 rounded-full p-2 animate-pulse">
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>
              )}
              
              {/* Preview overlay for photos */}
              {currentMode === 'photo' && isPreviewMode && recordedBlob && (
                <div className="absolute inset-0 bg-black flex items-center justify-center">
                  <img
                    src={URL.createObjectURL(recordedBlob)}
                    alt="Captured"
                    className="max-w-full max-h-full object-contain"
                    style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="bg-black/90 backdrop-blur-sm p-4 space-y-4">
          {/* Mode Selection */}
          <div className="flex justify-center gap-2 mb-4">
            {['photo', 'video', 'audio'].map((mode) => (
              <button
                key={mode}
                onClick={() => changeMode(mode)}
                disabled={mediaState === 'recording'}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  currentMode === mode
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                } disabled:opacity-50`}
              >
                {mode === 'photo' && <Camera className="w-4 h-4 mr-2 inline" />}
                {mode === 'video' && <Video className="w-4 h-4 mr-2 inline" />}
                {mode === 'audio' && <Mic className="w-4 h-4 mr-2 inline" />}
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-6">
            {mediaState === 'idle' ? (
              <button
                onClick={currentMode === 'photo' ? capturePhoto : startRecording}
                disabled={disabled || !!error}
                className="w-20 h-20 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentMode === 'photo' ? (
                  <Camera className="w-8 h-8 text-gray-800" />
                ) : currentMode === 'video' ? (
                  <Video className="w-8 h-8 text-red-500" />
                ) : (
                  <Mic className="w-8 h-8 text-blue-500" />
                )}
              </button>
            ) : mediaState === 'recording' ? (
              <button
                onClick={stopRecording}
                className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <Square className="w-8 h-8 text-white fill-current" />
              </button>
            ) : mediaState === 'recorded' ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={resetCapture}
                  className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  <Trash2 className="w-6 h-6 text-white" />
                </button>
                
                {currentMode !== 'photo' && (
                  <button
                    onClick={playRecording}
                    className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-colors"
                  >
                    <Play className="w-8 h-8 text-white fill-current" />
                  </button>
                )}
                
                <button
                  onClick={handleCapture}
                  className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 transition-colors"
                >
                  <Check className="w-6 h-6 text-white" />
                </button>
              </div>
            ) : mediaState === 'playing' ? (
              <button
                onClick={pausePlayback}
                className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-colors"
              >
                <Pause className="w-8 h-8 text-white fill-current" />
              </button>
            ) : null}
          </div>

          {/* Additional Info */}
          {mediaState === 'idle' && (
            <div className="text-center">
              <p className="text-white/70 text-sm">
                {currentMode === 'photo' 
                  ? 'Tap to capture photo'
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