import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";

import {
  buildPartnerAgendaData,
  type PartnerAgendaAppointmentRecord,
  type PartnerAgendaBlockRecord,
  type PartnerAgendaClientRow,
  type PartnerAgendaData,
  type PartnerAgendaRawData,
} from "./agenda-metrics";

type QueryResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

type SupabaseReadQuery = PromiseLike<QueryResult<unknown>> & {
  eq(column: string, value: string): SupabaseReadQuery;
  in(column: string, values: string[]): SupabaseReadQuery;
  order(column: string, options?: { ascending?: boolean }): SupabaseReadQuery;
};

type SupabaseReadClient = {
  from(table: string): {
    select(columns: string): SupabaseReadQuery;
  };
  rpc(functionName: "partner_clients_list"): PromiseLike<QueryResult<unknown>>;
};

type PartnerRecord = {
  id: string;
  professional_name: string;
  professional_type: string;
  profile_id: string;
};

type AppointmentRow = {
  appointment_type: string;
  ends_at: string;
  id: string;
  location_text: string | null;
  modality: string;
  notes: string | null;
  patient_id: string;
  reminder_minutes: number;
  starts_at: string;
  status: string;
  title: string;
};

type PatientRow = {
  avatar_url: string | null;
  birth_date: string | null;
  gender: string | null;
  id: string;
  objective: string | null;
  phone: string | null;
  profile_id: string;
};

function asQuery<T>(query: SupabaseReadQuery | PromiseLike<QueryResult<unknown>>) {
  return query as PromiseLike<QueryResult<T>>;
}

async function expectData<T>(result: PromiseLike<QueryResult<T>>, label: string) {
  const { data, error } = await result;

  if (error) {
    throw new Error(`Falha ao carregar ${label}: ${error.message}`);
  }

  return data ?? [];
}

export async function fetchPartnerAgendaData(): Promise<PartnerAgendaData> {
  const supabase = (await createClient()) as unknown as SupabaseReadClient;
  const { profile } = await getCurrentProfile();

  if (!profile) {
    throw new Error("Falha ao carregar agenda: sessão do parceiro indisponível.");
  }

  const partnerRows = await expectData(
    asQuery<PartnerRecord>(
      supabase
        .from("partners")
        .select("id, profile_id, professional_name, professional_type")
        .eq("profile_id", profile.id),
    ),
    "cadastro do parceiro",
  );
  const partner = partnerRows[0] ?? null;

  if (!partner) {
    return buildPartnerAgendaData({
      appointments: [],
      blocks: [],
      clients: [],
      partner: null,
    });
  }

  const [clients, appointments, blocks] = await Promise.all([
    expectData(
      asQuery<PartnerAgendaClientRow>(supabase.rpc("partner_clients_list")),
      "clientes da agenda",
    ),
    expectData(
      asQuery<AppointmentRow>(
        supabase
          .from("partner_client_appointments")
          .select("id, patient_id, title, starts_at, ends_at, status, notes, appointment_type, modality, location_text, reminder_minutes")
          .eq("partner_id", partner.id)
          .order("starts_at", { ascending: true }),
      ),
      "compromissos da agenda",
    ),
    expectData(
      asQuery<PartnerAgendaBlockRecord>(
        supabase
          .from("partner_calendar_blocks")
          .select("id, title, starts_at, ends_at, reason, status")
          .eq("partner_id", partner.id)
          .order("starts_at", { ascending: true }),
      ),
      "bloqueios da agenda",
    ),
  ]);

  const patientIds = Array.from(new Set(appointments.map((appointment) => appointment.patient_id)));
  const patients = patientIds.length
    ? await expectData(
        asQuery<PatientRow>(
          supabase
            .from("patients")
            .select("id, profile_id, phone, birth_date, objective, gender, avatar_url")
            .in("id", patientIds),
        ),
        "clientes dos compromissos",
      )
    : [];
  const patientsById = new Map(patients.map((patient) => [patient.id, patient]));
  const clientsByPatientId = new Map(clients.map((client) => [client.patient_id, client]));

  const agendaAppointments: PartnerAgendaAppointmentRecord[] = appointments.flatMap((appointment) => {
    const patient = patientsById.get(appointment.patient_id);
    const client = clientsByPatientId.get(appointment.patient_id);
    if (!patient) return [];

    return {
      ...appointment,
      avatar_url: patient.avatar_url,
      birth_date: patient.birth_date,
      display_name: client?.display_name ?? "Cliente",
      email: client?.email ?? "sem-email@example.invalid",
      gender: patient.gender,
      objective: patient.objective,
      phone: patient.phone ?? client?.phone ?? null,
    };
  });

  const raw: PartnerAgendaRawData = {
    appointments: agendaAppointments,
    blocks,
    clients,
    partner: {
      id: partner.id,
      professionalName: partner.professional_name,
      professionalType: partner.professional_type,
    },
  };

  return buildPartnerAgendaData(raw);
}
