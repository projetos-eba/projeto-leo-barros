import { notFound } from "next/navigation";

import { fetchPartnerMaterialsData } from "@/lib/partners/materials-data";

import { PartnerMaterialDetailView } from "./partner-material-detail-view";

export const dynamic = "force-dynamic";

type PartnerMaterialDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PartnerMaterialDetailPage({ params }: PartnerMaterialDetailPageProps) {
  const { id } = await params;
  const data = await fetchPartnerMaterialsData();
  const material = data.materials.find((item) => item.id === id);

  if (!material) notFound();

  return (
    <PartnerMaterialDetailView
      clients={data.clients}
      events={data.events.filter((event) => event.materialId === material.id)}
      material={material}
    />
  );
}
