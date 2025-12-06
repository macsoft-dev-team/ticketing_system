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
    case_initiated: { label: "Case Initiated", file: `${SOUND_URL}/case-initiated.mp3`},
    case_modified: { label: "Case Modified", file: `${SOUND_URL}/case-updated.mp3`},
    outbound_chime: { label: "Outbound Chime", file: `${SOUND_URL}/message-sent-chime.mp3`},
    inbound_chime: { label: "Inbound Chime", file: `${SOUND_URL}/message-received-chime.mp3`},
    file_attach: { label: "Attachment Clip", file: `${SOUND_URL}/attachment-clip.mp3`},
    message_tone: { label: "Message Tone", file: `${SOUND_URL}/message-tone.mp3` }
};

const SoundContext = createContext(null);

export function SoundProvider({ children, defaultVolume = 0.5, preload = true }) {
    const audiosRef = useRef({});
    const [muted, setMuted] = useState(false);
    const volumeRef = useRef(defaultVolume);
    const recentSoundsRef = useRef(new Map()); // Track recent sounds to prevent duplicates

    // Preload audio objects
    useEffect(() => {
        if (!preload) return;
        Object.entries(SOUND_MAP).forEach(([key, { file }]) => {
            try {
                const a = new Audio(file);
                a.preload = "auto";
                a.volume = volumeRef.current;
                audiosRef.current[key] = a;
            } catch (e) {
                // ignore preload errors (browser restrictions)
            }
        });
        // cleanup not strictly necessary for Audio objects but clear ref if unmounting
        return () => {
            audiosRef.current = {};
        };
    }, [preload]);

    const play = useCallback((key) => {
        // Get call stack to identify caller
        const stack = new Error().stack;
        const caller = stack.split('\n')[2]?.trim() || 'unknown caller';
        
        console.log(`🎵 [SOUNDMANAGER] PLAY REQUESTED: "${key}" by ${caller}`);
        
        if (muted) {
            console.log(`🔇 [SOUNDMANAGER] MUTED - not playing "${key}"`);
            return;
        }

        // Prevent duplicate sounds within 500ms window
        const now = Date.now();
        const lastPlayTime = recentSoundsRef.current.get(key);
        if (lastPlayTime && (now - lastPlayTime) < 500) {
            console.log(`🚫 [SOUNDMANAGER] DUPLICATE BLOCKED: "${key}" (played ${now - lastPlayTime}ms ago)`);
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
        
        console.log(`🔊 [SOUNDMANAGER] PLAYING SOUND: "${key}" (${entry.label})`);

        // Try to reuse preloaded Audio object, otherwise create one.
        let audio = audiosRef.current[key];
        if (!audio) {
            audio = new Audio(entry.file);
            audio.volume = volumeRef.current;
        } else {
            // clone to allow overlapping plays (optional)
            // Some apps prefer to reuse. We'll try .currentTime reset approach; if it's playing, clone.
            try {
                if (!audio.paused) {
                    // overlapping: create a temporary instance
                    const tmp = new Audio(entry.file);
                    tmp.volume = volumeRef.current;
                    tmp.play().catch(() => { });
                    return;
                }
                audio.currentTime = 0;
            } catch (e) {
                // fallback to creating a new instance
                audio = new Audio(entry.file);
                audio.volume = volumeRef.current;
            }
        }

        audio.volume = volumeRef.current;
        audio.play().then(() => {
            console.log(`✅ [SOUNDMANAGER] Successfully played: "${key}"`);
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
        preloadAll: () => {
            // create/rescue any missing audio objects
            Object.entries(SOUND_MAP).forEach(([key, { file }]) => {
                if (!audiosRef.current[key]) {
                    const a = new Audio(file);
                    a.preload = "auto";
                    a.volume = volumeRef.current;
                    audiosRef.current[key] = a;
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
