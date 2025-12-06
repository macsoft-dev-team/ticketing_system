// src/lib/sound/SoundManager.jsx
import React, { createContext, useContext, useRef, useCallback, useEffect, useState } from "react";

/**
 * SoundManager
 * - Preloads configured sounds
 * - Exposes play(key), mute/unmute, setVolume, getLabel
 *
 * Place sound files in /public/sounds/<filename>
 */

const SOUND_URL = import.meta.env.SOUND_URL || import.meta.env.VITE_SOUND_URL || 'http://localhost:3057/api/uploads/sounds'

const SOUND_MAP = {
    notify_critical: { label: "System Alert", file: `${SOUND_URL}/system-alert.wav` },
    inbound_notification: { label: "Incoming Notification", file: `${SOUND_URL}/incoming-ping.mp3` },
    case_initiated: { label: "Case Initiated", file: `${SOUND_URL}/case-initiated.mp3` },
    case_modified: { label: "Case Modified", file: `${SOUND_URL}/case-updated.mp3` },
    outbound_chime: { label: "Outbound Chime", file: `${SOUND_URL}/message-sent-chime.mp3` },
    inbound_chime: { label: "Inbound Chime", file: `${SOUND_URL}/message-received-chime.mp3` },
    file_attach: { label: "Attachment Clip", file: `${SOUND_URL}/attachment-clip.mp3` },
    message_tone: { label: "Message Tone", file: `${SOUND_URL}/message-tone.mp3` }
};

// LocalStorage cache utilities
const CACHE_PREFIX = 'soundcache_';
const CACHE_VERSION = '1.0';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

const getSoundFromCache = (key) => {
    try {
        const cacheKey = `${CACHE_PREFIX}${key}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const data = JSON.parse(cached);
            if (data.version === CACHE_VERSION && Date.now() < data.expiry) {
                return data.blob;
            } else {
                localStorage.removeItem(cacheKey);
            }
        }
    } catch (e) {
        console.warn(`❌ [SOUNDMANAGER] Failed to read cache for "${key}":`, e);
    }
    return null;
};

const saveSoundToCache = (key, blob) => {
    try {
        const cacheKey = `${CACHE_PREFIX}${key}`;
        const data = {
            version: CACHE_VERSION,
            blob: blob,
            expiry: Date.now() + CACHE_EXPIRY
        };
        localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (e) {
        console.warn(`❌ [SOUNDMANAGER] Failed to cache sound "${key}":`, e);
        // If localStorage is full, try to clear old sound caches
        if (e.name === 'QuotaExceededError') {
            clearOldSoundCache();
        }
    }
};

const clearOldSoundCache = () => {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (Date.now() >= data.expiry) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    localStorage.removeItem(key);
                }
            }
        });
    } catch (e) {
        console.warn(`❌ [SOUNDMANAGER] Failed to clean cache:`, e);
    }
};

const fetchAndCacheSoundBlob = async (key, url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        saveSoundToCache(key, base64);
        return arrayBuffer;
    } catch (e) {
        console.warn(`❌ [SOUNDMANAGER] Failed to fetch sound "${key}":`, e);
        throw e;
    }
};

const createAudioFromBlob = (key, data) => {
    try {
        let arrayBuffer;
        if (typeof data === 'string') {
            // Base64 from cache
            const binaryString = atob(data);
            arrayBuffer = new ArrayBuffer(binaryString.length);
            const uint8Array = new Uint8Array(arrayBuffer);
            for (let i = 0; i < binaryString.length; i++) {
                uint8Array[i] = binaryString.charCodeAt(i);
            }
        } else {
            // ArrayBuffer from fetch
            arrayBuffer = data;
        }

        const blob = new Blob([arrayBuffer]);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        // Clean up blob URL when audio is no longer needed
        const cleanup = () => {
            URL.revokeObjectURL(url);
        };
        audio.addEventListener('ended', cleanup);
        audio.addEventListener('error', cleanup);

        return audio;
    } catch (e) {
        console.warn(`❌ [SOUNDMANAGER] Failed to create audio for "${key}":`, e);
        return null;
    }
};

const SoundContext = createContext(null);

export function SoundProvider({ children, defaultVolume = 0.5, preload = true }) {
    const audiosRef = useRef({});
    const [muted, setMuted] = useState(false);
    const volumeRef = useRef(defaultVolume);
    const recentSoundsRef = useRef(new Map()); // Track recent sounds to prevent duplicates

    // Preload audio objects with caching
    useEffect(() => {
        if (!preload) return;

        const loadSound = async (key, { file }) => {
            try {
                // Try to get from cache first
                const cachedBlob = getSoundFromCache(key);
                let audio;

                if (cachedBlob) {
                    // Use cached data
                    audio = createAudioFromBlob(key, cachedBlob);
                } else {
                    // Fetch and cache
                    const arrayBuffer = await fetchAndCacheSoundBlob(key, file);
                    audio = createAudioFromBlob(key, arrayBuffer);
                }

                if (audio) {
                    audio.preload = "auto";
                    audio.volume = volumeRef.current;
                    audiosRef.current[key] = audio;
                } else {
                    // Fallback to regular Audio object
                    const fallbackAudio = new Audio(file);
                    fallbackAudio.preload = "auto";
                    fallbackAudio.volume = volumeRef.current;
                    audiosRef.current[key] = fallbackAudio;
                }
            } catch (e) {
                console.warn(`❌ [SOUNDMANAGER] Failed to preload "${key}", using fallback:`, e);
                // Fallback to regular Audio object
                try {
                    const fallbackAudio = new Audio(file);
                    fallbackAudio.preload = "auto";
                    fallbackAudio.volume = volumeRef.current;
                    audiosRef.current[key] = fallbackAudio;
                } catch (fallbackError) {
                    console.warn(`❌ [SOUNDMANAGER] Fallback also failed for "${key}":`, fallbackError);
                }
            }
        };

        // Clean old cache entries on startup
        clearOldSoundCache();

        // Load all sounds
        Object.entries(SOUND_MAP).forEach(([key, config]) => {
            loadSound(key, config);
        });

        // cleanup not strictly necessary for Audio objects but clear ref if unmounting
        return () => {
            Object.values(audiosRef.current).forEach(audio => {
                if (audio && audio.src && audio.src.startsWith('blob:')) {
                    URL.revokeObjectURL(audio.src);
                }
            });
            audiosRef.current = {};
        };
    }, [preload]);

    const play = useCallback((key) => {
        // Get call stack to identify caller
        const stack = new Error().stack;
        const caller = stack.split('\n')[2]?.trim() || 'unknown caller';

        if (muted) {
            return;
        }

        // Prevent duplicate sounds within 500ms window
        const now = Date.now();
        const lastPlayTime = recentSoundsRef.current.get(key);
        if (lastPlayTime && (now - lastPlayTime) < 500) {
            return;
        }

        // Update the last play time and clean up old entries
        recentSoundsRef.current.set(key, now);

        // Clean up entries older than 5 seconds to prevent memory leaks
        for (const [soundKey, timestamp] of recentSoundsRef.current.entries()) {
            if (now - timestamp > 5000) {
                recentSoundsRef.current.delete(soundKey);
            }
        }

        const entry = SOUND_MAP[key];
        if (!entry) {
            console.warn(`[SoundManager] No sound configured for key: "${key}"`);
            return;
        }


        // Try to reuse preloaded Audio object, otherwise create one.
        let audio = audiosRef.current[key];
        if (!audio) {
            // Try to create from cache first
            const cachedBlob = getSoundFromCache(key);
            if (cachedBlob) {
                audio = createAudioFromBlob(key, cachedBlob);
                if (audio) {
                    audio.volume = volumeRef.current;
                    audiosRef.current[key] = audio;
                }
            }

            // Fallback to regular Audio object
            if (!audio) {
                audio = new Audio(entry.file);
                audio.volume = volumeRef.current;
            }
        } else {
            // clone to allow overlapping plays (optional)
            // Some apps prefer to reuse. We'll try .currentTime reset approach; if it's playing, clone.
            try {
                if (!audio.paused) {
                    // overlapping: create a temporary instance
                    const cachedBlob = getSoundFromCache(key);
                    let tmp;
                    if (cachedBlob) {
                        tmp = createAudioFromBlob(key, cachedBlob);
                    }
                    if (!tmp) {
                        tmp = new Audio(entry.file);
                    }
                    tmp.volume = volumeRef.current;
                    tmp.play().catch(() => { });
                    return;
                }
                audio.currentTime = 0;
            } catch (e) {
                // fallback to creating a new instance
                const cachedBlob = getSoundFromCache(key);
                if (cachedBlob) {
                    audio = createAudioFromBlob(key, cachedBlob);
                    if (audio) {
                        audio.volume = volumeRef.current;
                    }
                }
                if (!audio) {
                    audio = new Audio(entry.file);
                    audio.volume = volumeRef.current;
                }
            }
        }

        audio.volume = volumeRef.current;
        audio.play().then(() => {
        }).catch((err) => {
            console.warn(`❌ [SOUNDMANAGER] Failed to play "${key}":`, err);
            // Common reason: autoplay restrictions. Do nothing.
            // You can optionally store a flag to attempt later after user interaction.
        });
    }, [muted]);

    const setVolume = useCallback((v) => {
        const vol = Math.max(0, Math.min(1, Number(v) || 0));
        volumeRef.current = vol;
        Object.values(audiosRef.current).forEach((a) => {
            try { a.volume = vol; } catch (e) { }
        });
    }, []);

    const mute = useCallback(() => setMuted(true), []);
    const unmute = useCallback(() => setMuted(false), []);
    const getLabel = useCallback((key) => (SOUND_MAP[key] ? SOUND_MAP[key].label : key), []);

    const getVolume = useCallback(() => volumeRef.current, []);

    const value = {
        play,
        mute,
        unmute,
        muted,
        setVolume,
        getVolume,
        getLabel,
        soundKeys: Object.keys(SOUND_MAP),
        soundMap: SOUND_MAP,
        preloadAll: async () => {
            // create/rescue any missing audio objects with caching
            const loadPromises = Object.entries(SOUND_MAP).map(async ([key, { file }]) => {
                if (!audiosRef.current[key]) {
                    try {
                        const cachedBlob = getSoundFromCache(key);
                        let audio;

                        if (cachedBlob) {
                            audio = createAudioFromBlob(key, cachedBlob);
                        } else {
                            const arrayBuffer = await fetchAndCacheSoundBlob(key, file);
                            audio = createAudioFromBlob(key, arrayBuffer);
                        }

                        if (audio) {
                            audio.preload = "auto";
                            audio.volume = volumeRef.current;
                            audiosRef.current[key] = audio;
                        } else {
                            // Fallback
                            const fallbackAudio = new Audio(file);
                            fallbackAudio.preload = "auto";
                            fallbackAudio.volume = volumeRef.current;
                            audiosRef.current[key] = fallbackAudio;
                        }
                    } catch (e) {
                        console.warn(`❌ [SOUNDMANAGER] Failed to preload "${key}":`, e);
                        // Fallback
                        const fallbackAudio = new Audio(file);
                        fallbackAudio.preload = "auto";
                        fallbackAudio.volume = volumeRef.current;
                        audiosRef.current[key] = fallbackAudio;
                    }
                }
            });

            await Promise.allSettled(loadPromises);
        },
        clearCache: () => {
            // Clear all cached sounds
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(CACHE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
        },
    };

    return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSoundManager() {
    const ctx = useContext(SoundContext);
    if (!ctx) throw new Error("useSoundManager must be used inside a SoundProvider");
    return ctx;
}
