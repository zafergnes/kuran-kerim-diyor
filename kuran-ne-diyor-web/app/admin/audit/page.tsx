"use client";

import { useEffect, useState } from "react";
import apiClient from "@/services/apiClient";

type Audit = { id: number; action: string; targetType: string; targetId: string; createdAt: string; details?: Record<string, unknown> | null; admin: { email: string; name?: string | null } };

export default function AuditPage() {
  const [items, setItems] = useState<Audit[] | null>(null);
  useEffect(() => {
    let active = true;
    apiClient.get<Audit[]>("/admin/audit").then((response) => { if (active) setItems(response.data); });
    return () => { active = false; };
  }, []);
  if (!items) return <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />;
  return <div><h2 className="text-xl font-bold text-text">Admin İşlem Geçmişi</h2><p className="mt-1 text-sm text-secondary">Moderasyon işlemlerinin değiştirilemez zaman sıralı görünümü.</p><div className="mt-6 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border text-muted"><tr><th className="p-3">Zaman</th><th className="p-3">Admin</th><th className="p-3">İşlem</th><th className="p-3">Hedef</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-border"><td className="p-3">{new Date(item.createdAt).toLocaleString("tr-TR")}</td><td className="p-3">{item.admin.email}</td><td className="p-3 font-semibold">{item.action}</td><td className="p-3">{item.targetType} #{item.targetId}</td></tr>)}</tbody></table></div></div>;
}
