import { redirect } from "next/navigation";

/**
 * Redirección server-side a la consola canónica de Studio.
 *
 * Esta ruta NO renderiza UI: resuelve la empresa del programa en el servidor y
 * emite un redirect antes de pintar nada, de modo que el antiguo layout de
 * pestañas (/dashboard/programs/[id]) nunca aparece. La consola única vive en
 * /studio/[slug]/program/[programId].
 */
export default async function ManageProgramRedirect({ params }: { params: { id: string } }) {
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
    redirect(`/studio/${slug}/program/${params.id}`);
  }
  redirect("/dashboard/programs?tab=programs");
}
