type EdgeTable<
  Row extends Record<string, unknown>,
  Insert extends Record<string, unknown> = Record<string, unknown>,
  Update extends Record<string, unknown> = Partial<Insert>,
> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type ProfileRow = {
  display_name: string | null;
  email_confirmed_at: string | null;
  id: string;
  role: string;
  status: string;
  user_id: string;
};

type ProfileInsert = {
  display_name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  user_id: string;
};

type ProfileUpdate = {
  email_confirmed_at?: string | null;
  first_access_completed_at?: string;
  last_auth_flow_at?: string;
};

type PartnerInsert = {
  professional_name: string;
  professional_registry_number: string | null;
  professional_registry_type: string | null;
  professional_type: string;
  profile_id: string;
};

type PartnerRow = {
  id: string;
  profile_id: string;
};

type EmailVerificationTokenInsert = {
  auth_user_id: string;
  expires_at: string;
  profile_id: string;
  purpose: string;
  token_hash: string;
};

type EmailVerificationTokenUpdate = {
  consumed_at: string;
};

type PlatformActivityEventInsert = {
  detail: string;
  event_type: string;
  metadata: Record<string, unknown>;
  partner_id: string;
  title: string;
};

export type EdgeDatabase = {
  public: {
    Tables: {
      auth_email_deliveries: EdgeTable<{ id: string }>;
      email_verification_tokens: EdgeTable<
        { id: string },
        EmailVerificationTokenInsert,
        EmailVerificationTokenUpdate
      >;
      partner_clients: EdgeTable<{ id: string }>;
      partner_subscriptions: EdgeTable<{
        current_period_end: string;
        current_period_start: string;
        id: string;
        partner_id: string;
        status: string;
      }>;
      partners: EdgeTable<PartnerRow, PartnerInsert>;
      patients: EdgeTable<{ id: string }>;
      platform_activity_events: EdgeTable<
        { id: string },
        PlatformActivityEventInsert
      >;
      profiles: EdgeTable<ProfileRow, ProfileInsert, ProfileUpdate>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
