import { NextResponse } from "next/server";

import {
  buildPartnerClientPhotos,
  formatPhotoNumber,
  type PartnerClientPhotosRawData,
} from "@/lib/partners/client-photos-metrics";
import { createClient } from "@/lib/supabase/server";

type PhotoExportRouteProps = {
  params: Promise<{ id: string }>;
};

type PhotosRpcClient = {
  rpc(name: "partner_client_photos", params: { p_patient_id: string }): PromiseLike<{
    data: unknown;
    error: { message: string } | null;
  }>;
};

function escapePdfText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()\\]/g, "\\$&");
}

function buildSimplePdf(lines: string[]) {
  const text = [
    "BT",
    "/F1 16 Tf",
    "56 790 Td",
    `(${escapePdfText(lines[0] ?? "Relatorio")}) Tj`,
    "/F1 10 Tf",
    ...lines.slice(1, 38).flatMap((line) => ["0 -18 Td", `(${escapePdfText(line)}) Tj`]),
    "ET",
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(text, "utf8")} >>\nstream\n${text}\nendstream`,
  ];
  let body = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(body, "utf8"));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(body, "utf8");
  body += `xref\n0 ${objects.length + 1}\n`;
  body += "0000000000 65535 f \n";
  body += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(body, "utf8");
}

export async function GET(_request: Request, { params }: PhotoExportRouteProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await (supabase as unknown as PhotosRpcClient).rpc("partner_client_photos", {
    p_patient_id: id,
  });

  if (error) return new NextResponse("Não foi possível gerar o PDF.", { status: 500 });
  if (!data) return new NextResponse("Cliente não encontrado.", { status: 404 });

  const photos = buildPartnerClientPhotos(data as PartnerClientPhotosRawData);
  const comparison = photos.comparison;
  const lines = [
    "Comparacao de Fotos",
    `Sessao A: ${comparison.before?.capturedDateLabel ?? "Nao selecionada"}`,
    `Sessao B: ${comparison.after?.capturedDateLabel ?? "Nao selecionada"}`,
    `Intervalo: ${comparison.intervalDays === null ? "sem dados" : `${comparison.intervalDays} dias`}`,
    "",
    "Resumo comparativo",
    ...comparison.deltas.map((delta) => {
      const before = formatPhotoNumber(delta.beforeValue, delta.unit);
      const after = formatPhotoNumber(delta.afterValue, delta.unit);
      const diff = delta.delta === null ? "sem delta" : `${delta.delta > 0 ? "+" : ""}${delta.delta.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${delta.unit}`;
      return `${delta.label}: ${before} -> ${after} (${diff})`;
    }),
    "",
    "Observacoes do profissional",
    comparison.note?.notes ?? "Sem observacoes registradas.",
    "",
    "Disponibilidade de angulos",
    ...comparison.angleAvailability.map((angle) => `${angle.label}: Sessao A ${angle.before ? "ok" : "-"} | Sessao B ${angle.after ? "ok" : "-"}`),
  ];

  return new NextResponse(buildSimplePdf(lines), {
    headers: {
      "Content-Disposition": "attachment; filename=\"comparacao-fotos.pdf\"",
      "Content-Type": "application/pdf",
    },
  });
}
