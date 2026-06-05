"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { useAppInit } from "@/hooks/useAppInit";
import { useUserStore } from "@/store/userStore";
import { useTranslation } from "react-i18next";

export function CollectionsClient() {
  useAppInit();
  const collections = useUserStore((state) => state.collections);
  const createCollection = useUserStore((state) => state.createCollection);
  const deleteCollection = useUserStore((state) => state.deleteCollection);
  const { t } = useTranslation();
  const [name, setName] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    await createCollection(name.trim());
    setName("");
  };

  return (
    <div className="grid gap-5">
      <form onSubmit={submit} className="flex gap-2 rounded-lg border border-border bg-card p-4 shadow-sm">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-11 flex-1 rounded-md border border-border bg-background px-3 text-sm font-semibold text-text placeholder:text-muted"
          placeholder={t("favorites.create_new_collection", "Yeni koleksiyon adı")}
          maxLength={50}
        />
        <button className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white">
          <Plus size={17} />
          {t("favorites.create", "Oluştur")}
        </button>
      </form>

      {Object.values(collections).length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
          <BookOpen className="mx-auto text-primary" size={30} />
          <h2 className="mt-3 text-2xl font-bold text-text">{t("collections.empty_title", "Koleksiyon yok")}</h2>
          <p className="mt-2 text-sm font-semibold text-muted">{t("collections.empty_desc", "Ayet kartından veya buradan koleksiyon oluşturabilirsin.")}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {Object.values(collections).map((collection) => (
            <div key={collection.id} className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/collections/${collection.id}`} className="min-w-0">
                  <h2 className="truncate text-xl font-bold text-text">{collection.name}</h2>
                  <p className="mt-1 text-sm font-semibold text-muted">{Object.keys(collection.ayahs).length} {t("common.ayah", "ayet")}</p>
                </Link>
                <button onClick={() => void deleteCollection(collection.id)} className="text-muted hover:text-primary" title={t("common.delete", "Sil")}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
