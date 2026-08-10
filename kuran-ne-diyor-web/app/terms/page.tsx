import { Suspense } from "react";
import { LegalDocument } from "@/components/LegalDocument";
export default function Page() { return <Suspense><LegalDocument kind="terms" /></Suspense>; }
