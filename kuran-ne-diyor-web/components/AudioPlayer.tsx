"use client";

import { useRef, useState, useEffect } from "react";
import { Loader2, Pause, Play } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { GlobalAudioController } from "@/services/globalAudioController";

const reciterNames: Record<string, string> = {
  "ar.alafasy": "Mishary Rashid",
  "ar.abdurrahmaansudais": "Al-Sudais",
  "ar.mahermuaiqly": "Maher Al-Muaiqly",
  "ar.abdulbasitmurattal": "Abdulbasit Abdussamed",
};

export function AudioPlayer({ globalAyahNumber }: { globalAyahNumber: number }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const selectedReciter = useUserStore((state) => state.selectedReciter);

  const expectedUrl = `https://cdn.islamic.network/quran/audio/64/${selectedReciter}/${globalAyahNumber}.mp3`;
  const ownerId = `ayah_${globalAyahNumber}`;

  // Reset audio element if reciter or URL changes
  useEffect(() => {
    if (audioRef.current) {
      GlobalAudioController.stop(ownerId);
      audioRef.current = null;
      setIsPlaying(false);
      setPlayProgress(0);
    }
  }, [expectedUrl]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      GlobalAudioController.stop(ownerId);
    };
  }, []);

  const toggle = async () => {
    if (isLoading) return;

    if (audioRef.current && audioRef.current.src !== expectedUrl) {
      GlobalAudioController.stop(ownerId);
      audioRef.current = null;
      setPlayProgress(0);
    }

    if (!audioRef.current) {
      const audio = new Audio(expectedUrl);
      audioRef.current = audio;

      audio.addEventListener("timeupdate", () => {
        if (audio.duration) {
          setPlayProgress(audio.currentTime / audio.duration);
        }
      });

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setPlayProgress(0);
        audio.currentTime = 0;
        GlobalAudioController.stop(ownerId);
      });
    }

    if (isPlaying) {
      GlobalAudioController.stop(ownerId);
      return;
    }

    setIsLoading(true);
    try {
      if (audioRef.current.duration && audioRef.current.currentTime >= audioRef.current.duration - 0.1) {
        audioRef.current.currentTime = 0;
        setPlayProgress(0);
      }

      GlobalAudioController.play(audioRef.current, ownerId, () => {
        setIsPlaying(false);
        setPlayProgress(0);
      });

      await audioRef.current.play();
      setIsPlaying(true);
    } catch (e) {
      console.error("Web audio playback error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.min(1, Math.max(0, clickX / width));

    if (audioRef.current.duration) {
      const targetTime = percentage * audioRef.current.duration;
      audioRef.current.currentTime = targetTime;
      setPlayProgress(percentage);
    }
  };

  const showProgress = isPlaying || (playProgress > 0 && audioRef.current);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => void toggle()}
        className="grid h-10 w-10 place-items-center rounded-md border border-border text-primary transition hover:bg-background"
        title={isPlaying ? "Duraklat" : "Dinle"}
      >
        {isLoading ? <Loader2 size={18} className="animate-spin" /> : isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </button>
      {showProgress && (
        <div className="flex flex-col justify-center w-[120px]">
          <div
            onClick={handleProgressClick}
            className="w-full h-6 flex items-center cursor-pointer mb-1 relative group"
          >
            <div className="w-full h-1.5 rounded-full bg-primary/20 relative">
              <div
                className="h-full bg-primary rounded-full transition-all duration-75"
                style={{ width: `${playProgress * 100}%` }}
              />
              <div 
                className="absolute w-3 h-3 rounded-full bg-primary -top-[3px] -ml-[6px] transition-all duration-75"
                style={{ left: `${playProgress * 100}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium truncate w-full">
            🎙️ {reciterNames[selectedReciter] || selectedReciter.split(".").pop()}
          </span>
        </div>
      )}
    </div>
  );
}
