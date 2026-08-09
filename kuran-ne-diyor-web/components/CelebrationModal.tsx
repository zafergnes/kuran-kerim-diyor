"use client";

import React, { useEffect, useState } from "react";
import { useUserStore } from "@/store/userStore";
import { useTranslation } from "react-i18next";
import { Award, Star, X } from "lucide-react";

export function CelebrationModal() {
  const { t } = useTranslation();
  const activeCelebration = useUserStore((state) => state.activeCelebration);
  const setActiveCelebration = useUserStore((state) => state.setActiveCelebration);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (activeCelebration) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [activeCelebration]);

  if (!activeCelebration || !isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setActiveCelebration(null);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/60 backdrop-blur-md transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl border border-border bg-card p-8 text-center shadow-2xl transition-all duration-300 scale-100 animate-in fade-in zoom-in-95">
        
        {/* Confetti Micro-animations (CSS) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-1/4 h-2 w-2 animate-ping rounded-full bg-primary" />
          <div className="absolute top-24 right-1/4 h-3 w-3 animate-ping rounded-full bg-accent" />
          <div className="absolute bottom-12 left-1/3 h-2 w-2 animate-bounce rounded-full bg-yellow-500" />
          <div className="absolute top-1/2 right-12 h-2.5 w-2.5 animate-bounce rounded-full bg-emerald-500" />
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 rounded-full p-1 text-muted hover:bg-background hover:text-text transition-colors"
        >
          <X size={20} />
        </button>

        {/* Icon Container with glowing gradient */}
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-accent shadow-lg shadow-primary/20">
          <Award className="h-10 w-10 text-white animate-bounce" />
          <Star className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400 fill-yellow-400 animate-pulse" />
        </div>

        {/* Title */}
        <h2 className="mt-6 text-2xl font-bold text-text">
          {t("achievements.modal_title", "Tebrikler!")}
        </h2>
        
        <p className="mt-1 text-sm font-semibold text-primary">
          {t("achievements.modal_subtitle", "Yeni bir başarı kilidi açıldı!")}
        </p>

        {/* Badge Card */}
        <div className="mt-6 rounded-xl border border-border bg-background/50 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-text">
            {t(`achievements.badge_${activeCelebration}_title`)}
          </h3>
          <p className="mt-2 text-sm font-semibold text-muted">
            {t(`achievements.badge_${activeCelebration}_desc`)}
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleClose}
          className="mt-8 w-full rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
        >
          {t("achievements.modal_close", "Harika")}
        </button>
      </div>
    </div>
  );
}
