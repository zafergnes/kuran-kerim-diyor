"use client";

import { useState } from "react";
import { Check, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

type DeleteWarningDialogProps = {
  onCancel: () => void;
  onConfirm: (dontAskAgain: boolean) => void;
};

export function DeleteWarningDialog({ onCancel, onConfirm }: DeleteWarningDialogProps) {
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-xl">
        <TriangleAlert className="mx-auto text-primary" size={40} />
        <h2 className="mt-3 text-center text-lg font-bold text-text">{t("delete_warning.title", "Favorilerden Çıkar")}</h2>
        <p className="mt-2 text-center text-sm leading-6 text-secondary">
          {t("delete_warning.message", "Bu ayeti favorilerden çıkardığında eklendiği tüm koleksiyonlardan da silinir.")}
        </p>
        <button
          onClick={() => setDontAskAgain((value) => !value)}
          className="mx-auto mt-5 flex items-center gap-2 text-sm font-semibold text-secondary"
        >
          <span className={`grid h-5 w-5 place-items-center rounded border ${dontAskAgain ? "border-primary bg-primary" : "border-border"}`}>
            {dontAskAgain && <Check size={14} className="text-white" />}
          </span>
          {t("delete_warning.dont_ask", "Bir daha sorma")}
        </button>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={onCancel} className="h-11 rounded-md border border-border text-sm font-bold text-text hover:bg-background">
            {t("common.cancel", "İptal")}
          </button>
          <button onClick={() => onConfirm(dontAskAgain)} className="h-11 rounded-md bg-primary text-sm font-bold text-white">
            {t("common.delete", "Sil")}
          </button>
        </div>
      </div>
    </div>
  );
}
