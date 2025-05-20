import { useRef } from "react";

export const useNotificationSound = () => {
  const audioRef = useRef(new Audio("/sounds/level-up-191997.mp3"));

  const playSound = () => {
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch((e) => {
      console.warn("Audio play failed:", e);
    });
  };

  return playSound;
};
