import { describe, expect, it } from "vitest";

import {
  buildAngleAvailability,
  buildPartnerClientPhotos,
  buildPhotoDeltas,
  intervalDays,
  type PartnerClientPhotosRawData,
} from "./client-photos-metrics";

const raw: PartnerClientPhotosRawData = {
  comparisonNotes: [{
    afterSessionId: "session-2",
    beforeSessionId: "session-1",
    id: "note-1",
    notes: "Boa evolução.",
    updatedAt: "2026-07-01T12:00:00.000Z",
  }],
  events: [],
  generatedAt: "2026-07-02T12:00:00.000Z",
  partnerId: "partner-1",
  patientId: "client-1",
  sessions: [
    {
      capturedAt: "2026-05-01T10:00:00.000Z",
      createdAt: "2026-05-01T10:00:00.000Z",
      id: "session-1",
      measurements: { armCm: 28, calfCm: 34, hipCm: 96, thighCm: 54, waistCm: 74, weightKg: 65 },
      notes: null,
      photos: [
        { angle: "front", createdAt: "2026-05-01T10:00:00.000Z", cropData: {}, heightPx: 1448, id: "photo-1", mimeType: "image/png", originalFilename: "front.png", sizeBytes: 1000, storagePath: "partner/client/session/front.png", widthPx: 1086 },
        { angle: "back", createdAt: "2026-05-01T10:00:00.000Z", cropData: {}, heightPx: 1448, id: "photo-2", mimeType: "image/png", originalFilename: "back.png", sizeBytes: 1000, storagePath: "partner/client/session/back.png", widthPx: 1086 },
      ],
      status: "complete",
      title: "Sessão A",
      updatedAt: "2026-05-01T10:00:00.000Z",
    },
    {
      capturedAt: "2026-06-01T10:00:00.000Z",
      createdAt: "2026-06-01T10:00:00.000Z",
      id: "session-2",
      measurements: { armCm: 27, calfCm: 33.5, hipCm: 93, thighCm: 52, waistCm: 71, weightKg: 63.4 },
      notes: "Depois",
      photos: [
        { angle: "front", createdAt: "2026-06-01T10:00:00.000Z", cropData: {}, heightPx: 1448, id: "photo-3", mimeType: "image/png", originalFilename: "front.png", sizeBytes: 1000, storagePath: "partner/client/session2/front.png", widthPx: 1086 },
        { angle: "back", createdAt: "2026-06-01T10:00:00.000Z", cropData: {}, heightPx: 1448, id: "photo-4", mimeType: "image/png", originalFilename: "back.png", sizeBytes: 1000, storagePath: "partner/client/session2/back.png", widthPx: 1086 },
        { angle: "left", createdAt: "2026-06-01T10:00:00.000Z", cropData: {}, heightPx: 1448, id: "photo-5", mimeType: "image/png", originalFilename: "left.png", sizeBytes: 1000, storagePath: "partner/client/session2/left.png", widthPx: 1086 },
        { angle: "right", createdAt: "2026-06-01T10:00:00.000Z", cropData: {}, heightPx: 1448, id: "photo-6", mimeType: "image/png", originalFilename: "right.png", sizeBytes: 1000, storagePath: "partner/client/session2/right.png", widthPx: 1086 },
      ],
      status: "complete",
      title: "Sessão B",
      updatedAt: "2026-06-01T10:00:00.000Z",
    },
  ],
};

describe("client photos metrics", () => {
  it("ordena sessões e monta comparação padrão", () => {
    const data = buildPartnerClientPhotos(raw);

    expect(data.sessions[0].id).toBe("session-2");
    expect(data.comparison.before?.id).toBe("session-1");
    expect(data.comparison.after?.id).toBe("session-2");
    expect(data.comparison.note?.notes).toBe("Boa evolução.");
  });

  it("calcula disponibilidade de ângulos e sessões completas", () => {
    const data = buildPartnerClientPhotos(raw);

    expect(data.sessions[0].completed).toBe(true);
    expect(data.sessions[1].completed).toBe(false);
    expect(buildAngleAvailability(data.sessions[1], data.sessions[0]).find((angle) => angle.value === "left")).toMatchObject({
      after: true,
      before: false,
    });
  });

  it("calcula deltas e intervalo", () => {
    const deltas = buildPhotoDeltas(raw.sessions[0].measurements, raw.sessions[1].measurements);

    expect(deltas.find((delta) => delta.key === "waistCm")?.delta).toBe(-3);
    expect(deltas.find((delta) => delta.key === "weightKg")?.delta).toBe(-1.6);
    expect(intervalDays(raw.sessions[0].capturedAt, raw.sessions[1].capturedAt)).toBe(31);
  });
});
