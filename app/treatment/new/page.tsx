import { redirect } from "next/navigation";

// Legacy route — all new-treatment creation now lives at /treatments/new.
export default function LegacyNewTreatmentPage() {
  redirect("/treatments/new");
}
