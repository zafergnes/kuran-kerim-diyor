"use client";

import { FormEvent, useState } from "react";
import { Plus, X } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { useTranslation } from "react-i18next";

type CollectionMenuProps = {
  ayahId: string;
  surahNumber: number;
  ayahNumber: number;
  onClose: () => void;
};

export function CollectionMenu({ ayahId, surahNumber, ayahNumber, onClose }: CollectionMenuProps) {
  const collections = useUserStore((state) => state.collections);
  const createCollection = useUserStore((state) => state.createCollection);
  const addAyahToCollection = useUserStore((state) => state.addAyahToCollection);
  const removeAyahFromCollection = useUserStore((state) => state.removeAyahFromCollection);
  const { t } = useTranslation();
  const [name, setName] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    await createCollection(name.trim(), { ayahId, surahNumber, ayahNumber });
    setName("");
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold text-text">{t("favorites.add_to_collections", "Koleksiyona ekle")}</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-md border border-border text-primary">
            <X size={17} />
          </button>
        </div>
        <div className="grid gap-3 p-5">
          {Object.values(collections).length === 0 ? (
            <p className="rounded-md bg-background p-4 text-sm font-semibold text-muted">{t("collections.empty_items", "Henüz koleksiyon yok.")}</p>
          ) : (
            Object.values(collections).map((collection) => {
              const hasAyah = Boolean(collection.ayahs[ayahId]);
              return (
                <button
                  key={collection.id}
                  onClick={() =>
                    hasAyah
                      ? void removeAyahFromCollection(collection.id, ayahId)
                      : void addAyahToCollection(collection.id, ayahId, surahNumber, ayahNumber)
                  }
                  className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-3 text-left text-sm font-bold text-text"
                >
                  <span>{collection.name}</span>
                  <span className="text-xs text-primary">{hasAyah ? t("common.cancel", "Çıkar") : t("favorites.add", "Ekle")}</span>
                </button>
              );
            })
          )}
        </div>
        <form onSubmit={submit} className="flex gap-2 border-t border-border p-5">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-11 flex-1 rounded-md border border-border bg-background px-3 text-sm font-semibold text-text placeholder:text-muted"
            placeholder={t("favorites.create_new_collection", "Yeni koleksiyon")}
            maxLength={50}
          />
          <button className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white">
            <Plus size={17} />
            {t("favorites.create", "Oluştur")}
          </button>
        </form>
      </div>
    </div>
  );
}
