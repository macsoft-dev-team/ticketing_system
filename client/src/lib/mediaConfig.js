// Configuration service to fetch server-side settings
let configCache = null;

export const getMediaUploadConfig = async () => {
  if (configCache) {
    return configCache;
  }

  try {
    const baseApiUrl = import.meta.env.VITE_API_URL;
    const response = await fetch(`${baseApiUrl}/conversations/config/media-upload`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch media upload configuration');
    }
    
    const config = await response.json();
    configCache = config;
    
    // Cache for 5 minutes
    setTimeout(() => {
      configCache = null;
    }, 5 * 60 * 1000);
    
    return config;
  } catch (error) {
    console.warn('Failed to fetch media upload config, falling back to environment variables:', error);
    
    // Fallback to client-side environment variables
    return {
      enabled: import.meta.env.VITE_ENABLE_MEDIA_UPLOAD === 'true',
      maxFileSize: 50,
      maxVideoDuration: 300,
      maxAudioDuration: 600
    };
  }
};

export const isMediaUploadEnabled = async () => {
  const config = await getMediaUploadConfig();
  return config.enabled;
};

export const getMaxFileSizeMB = async () => {
  const config = await getMediaUploadConfig();
  return config.maxFileSize;
};

export const getMaxVideoDuration = async () => {
  const config = await getMediaUploadConfig();
  return config.maxVideoDuration;
};

export const getMaxAudioDuration = async () => {
  const config = await getMediaUploadConfig();
  return config.maxAudioDuration;
};