import { redirect } from "next/navigation";

/**
 * Redirección server-side a la consola canónica de Studio.
 *
 * La gestión de actividades vive en el tab "Actividades" de
 * /studio/[slug]/program/[programId] — esta ruta legacy solo reenvía ahí.
 */
export default async function ProgramActivitiesRedirect({ params }: { params: { id: string } }) {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
  let slug = "";
  try {
    const res = await fetch(`${API}/api/programs/${params.id}/company-slug`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      slug = data?.slug || "";
    }
  } catch {
    // ignorar: si falla, caemos al listado
  }

  if (slug) {
    redirect(`/studio/${slug}/program/${params.id}?tab=actividades`);
  }
  redirect("/dashboard/programs/assignments");
}
