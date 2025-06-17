import { useRef } from "react";

export const useNotificationSound = () => {
  const audioRef = useRef(new Audio("/sounds/livechat-129007.mp3"));

  const playSound = () => {
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch((e) => {
      console.warn("Audio play failed:", e);
    });
  };

  return playSound;
};
