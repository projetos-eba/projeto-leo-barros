export type PhotoAngle = "back" | "front" | "left" | "right";
export type PhotoSessionStatus = "archived" | "complete" | "draft";

export type PartnerClientPhotosRawData = {
  comparisonNotes: Array<{
    afterSessionId: string;
    beforeSessionId: string;
    id: string;
    notes: string;
    updatedAt: string;
  }>;
  events: Array<{
    actorName: string | null;
    createdAt: string;
    detail: string;
    details: Record<string, unknown>;
    eventType: string;
    id: string;
    sessionId: string | null;
  }>;
  generatedAt: string;
  partnerId: string;
  patientId: string;
  sessions: PartnerClientPhotoRawSession[];
};

export type PartnerClientPhotoRawSession = {
  capturedAt: string;
  createdAt: string;
  id: string;
  measurements: {
    armCm: number | null;
    calfCm: number | null;
    hipCm: number | null;
    thighCm: number | null;
    waistCm: number | null;
    weightKg: number | null;
  };
  notes: string | null;
  photos: Array<{
    angle: string;
    createdAt: string;
    cropData: Record<string, unknown>;
    heightPx: number | null;
    id: string;
    mimeType: string;
    originalFilename: string;
    sizeBytes: number;
    storagePath: string;
    widthPx: number | null;
  }>;
  status: string;
  title: string;
  updatedAt: string;
};

export type PartnerClientPhotoItem = {
  angle: PhotoAngle;
  angleLabel: string;
  cropData: Record<string, unknown>;
  heightPx: number | null;
  id: string;
  imageUrl: string;
  mimeType: string;
  originalFilename: string;
  sizeBytes: number;
  storagePath: string;
  widthPx: number | null;
};

export type PartnerClientPhotoMeasurements = {
  armCm: number | null;
  calfCm: number | null;
  hipCm: number | null;
  thighCm: number | null;
  waistCm: number | null;
  weightKg: number | null;
};

export type PartnerClientPhotoSession = {
  capturedAt: string;
  capturedDateLabel: string;
  capturedTimeLabel: string;
  completed: boolean;
  id: string;
  measurements: PartnerClientPhotoMeasurements;
  notes: string | null;
  photos: PartnerClientPhotoItem[];
  photosByAngle: Record<PhotoAngle, PartnerClientPhotoItem | null>;
  photoCount: number;
  status: PhotoSessionStatus;
  title: string;
};

export type PartnerClientPhotoDelta = {
  afterValue: number | null;
  beforeValue: number | null;
  delta: number | null;
  improved: boolean | null;
  key: keyof PartnerClientPhotoMeasurements;
  label: string;
  unit: "cm" | "kg";
};

export type PartnerClientPhotoComparison = {
  after: PartnerClientPhotoSession | null;
  angleAvailability: Array<{
    after: boolean;
    before: boolean;
    label: string;
    value: PhotoAngle;
  }>;
  before: PartnerClientPhotoSession | null;
  deltas: PartnerClientPhotoDelta[];
  intervalDays: number | null;
  note: {
    id: string;
    notes: string;
  } | null;
};

export type PartnerClientPhotosData = {
  comparison: PartnerClientPhotoComparison;
  comparisonNotes: PartnerClientPhotosRawData["comparisonNotes"];
  events: Array<{
    actorName: string | null;
    dateLabel: string;
    detail: string;
    eventType: string;
    id: string;
  }>;
  generatedAt: string;
  partnerId: string;
  patientId: string;
  sessions: PartnerClientPhotoSession[];
  summary: {
    completeSessions: number;
    latestDateLabel: string;
    sessionCount: number;
  };
};

export const photoAngles: Array<{ label: string; value: PhotoAngle }> = [
  { label: "Frente", value: "front" },
  { label: "Costas", value: "back" },
  { label: "Lado esquerdo", value: "left" },
  { label: "Lado direito", value: "right" },
];

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const measurementMeta: Array<{
  key: keyof PartnerClientPhotoMeasurements;
  label: string;
  unit: "cm" | "kg";
  lowerIsBetter: boolean;
}> = [
  { key: "weightKg", label: "Peso", lowerIsBetter: false, unit: "kg" },
  { key: "waistCm", label: "Cintura", lowerIsBetter: true, unit: "cm" },
  { key: "hipCm", label: "Quadril", lowerIsBetter: true, unit: "cm" },
  { key: "armCm", label: "Braço", lowerIsBetter: true, unit: "cm" },
  { key: "thighCm", label: "Coxa", lowerIsBetter: true, unit: "cm" },
  { key: "calfCm", label: "Panturrilha", lowerIsBetter: true, unit: "cm" },
];

function asAngle(value: string): PhotoAngle | null {
  if (value === "front" || value === "back" || value === "left" || value === "right") return value;
  return null;
}

function asStatus(value: string): PhotoSessionStatus {
  if (value === "draft" || value === "archived") return value;
  return "complete";
}

function toNumber(value: unknown) {
  if (value === null || typeof value === "undefined") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatPhotoNumber(value: number | null, unit: string) {
  if (value === null) return "Sem dado";
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${unit}`;
}

export function intervalDays(before: string, after: string) {
  const start = new Date(before).getTime();
  const end = new Date(after).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

export function buildPhotoDeltas(
  before: PartnerClientPhotoMeasurements | null,
  after: PartnerClientPhotoMeasurements | null,
): PartnerClientPhotoDelta[] {
  return measurementMeta.map((meta) => {
    const beforeValue = before ? toNumber(before[meta.key]) : null;
    const afterValue = after ? toNumber(after[meta.key]) : null;
    const delta = beforeValue === null || afterValue === null ? null : Number((afterValue - beforeValue).toFixed(1));
    return {
      afterValue,
      beforeValue,
      delta,
      improved: delta === null ? null : meta.lowerIsBetter ? delta <= 0 : delta >= 0,
      key: meta.key,
      label: meta.label,
      unit: meta.unit,
    };
  });
}

export function buildAngleAvailability(
  before: PartnerClientPhotoSession | null,
  after: PartnerClientPhotoSession | null,
) {
  return photoAngles.map((angle) => ({
    after: Boolean(after?.photosByAngle[angle.value]),
    before: Boolean(before?.photosByAngle[angle.value]),
    label: angle.label,
    value: angle.value,
  }));
}

function photoUrl(photoId: string) {
  return `/parceiros/clientes/fotos/${photoId}/arquivo`;
}

function buildSession(session: PartnerClientPhotoRawSession): PartnerClientPhotoSession {
  const photosByAngle = Object.fromEntries(photoAngles.map((angle) => [angle.value, null])) as Record<PhotoAngle, PartnerClientPhotoItem | null>;
  const photos = session.photos.flatMap((photo) => {
    const angle = asAngle(photo.angle);
    if (!angle) return [];
    const item: PartnerClientPhotoItem = {
      angle,
      angleLabel: photoAngles.find((candidate) => candidate.value === angle)?.label ?? angle,
      cropData: photo.cropData ?? {},
      heightPx: photo.heightPx === null ? null : Number(photo.heightPx),
      id: photo.id,
      imageUrl: photoUrl(photo.id),
      mimeType: photo.mimeType,
      originalFilename: photo.originalFilename,
      sizeBytes: Number(photo.sizeBytes),
      storagePath: photo.storagePath,
      widthPx: photo.widthPx === null ? null : Number(photo.widthPx),
    };
    photosByAngle[angle] = item;
    return [item];
  });

  return {
    capturedAt: session.capturedAt,
    capturedDateLabel: dateFormatter.format(new Date(session.capturedAt)),
    capturedTimeLabel: timeFormatter.format(new Date(session.capturedAt)),
    completed: photoAngles.every((angle) => photosByAngle[angle.value]),
    id: session.id,
    measurements: {
      armCm: toNumber(session.measurements?.armCm),
      calfCm: toNumber(session.measurements?.calfCm),
      hipCm: toNumber(session.measurements?.hipCm),
      thighCm: toNumber(session.measurements?.thighCm),
      waistCm: toNumber(session.measurements?.waistCm),
      weightKg: toNumber(session.measurements?.weightKg),
    },
    notes: session.notes,
    photoCount: photos.length,
    photos,
    photosByAngle,
    status: asStatus(session.status),
    title: session.title,
  };
}

export function buildPartnerClientPhotos(raw: PartnerClientPhotosRawData): PartnerClientPhotosData {
  const sessions = raw.sessions
    .map(buildSession)
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
  const completeSessions = sessions.filter((session) => session.completed);
  const after = completeSessions[0] ?? sessions[0] ?? null;
  const before = completeSessions.find((session) => session.id !== after?.id)
    ?? sessions.find((session) => session.id !== after?.id)
    ?? null;
  const note = before && after
    ? raw.comparisonNotes.find((candidate) => candidate.beforeSessionId === before.id && candidate.afterSessionId === after.id) ?? null
    : null;

  return {
    comparison: {
      after,
      angleAvailability: buildAngleAvailability(before, after),
      before,
      deltas: buildPhotoDeltas(before?.measurements ?? null, after?.measurements ?? null),
      intervalDays: before && after ? intervalDays(before.capturedAt, after.capturedAt) : null,
      note: note ? { id: note.id, notes: note.notes } : null,
    },
    comparisonNotes: raw.comparisonNotes,
    events: raw.events.map((event) => ({
      actorName: event.actorName,
      dateLabel: dateTimeFormatter.format(new Date(event.createdAt)),
      detail: event.detail,
      eventType: event.eventType,
      id: event.id,
    })),
    generatedAt: raw.generatedAt,
    partnerId: raw.partnerId,
    patientId: raw.patientId,
    sessions,
    summary: {
      completeSessions: completeSessions.length,
      latestDateLabel: after?.capturedDateLabel ?? "Sem sessões",
      sessionCount: sessions.length,
    },
  };
}
