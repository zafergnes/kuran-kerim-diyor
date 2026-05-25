"use client";

import { useRef, useState, useEffect } from "react";
import { Loader2, Pause, Play } from "lucide-react";
import { useUserStore } from "@/store/userStore";

export function AudioPlayer({ globalAyahNumber }: { globalAyahNumber: number }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { selectedReciter } = useUserStore();

  // Reset audio element if reciter changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, [selectedReciter]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const toggle = async () => {
    if (isLoading) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(`https://cdn.islamic.network/quran/audio/64/${selectedReciter}/${globalAyahNumber}.mp3`);
      audioRef.current.addEventListener("ended", () => setIsPlaying(false));
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (e) {
      console.error("Web audio playback error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={() => void toggle()}
      className="grid h-10 w-10 place-items-center rounded-md border border-border text-primary transition hover:bg-background"
      title={isPlaying ? "Duraklat" : "Dinle"}
    >
      {isLoading ? <Loader2 size={18} className="animate-spin" /> : isPlaying ? <Pause size={18} /> : <Play size={18} />}
    </button>
  );
}
