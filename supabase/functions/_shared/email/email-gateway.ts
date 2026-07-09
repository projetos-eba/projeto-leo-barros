import type { SupabaseClient } from "npm:@supabase/supabase-js@2.98.0";

import {
  type AuthRole,
  getEnvironmentName,
  getRequiredEnv,
  getResendFrom,
} from "../env.ts";
import { type AuthEmailType, buildResendTags } from "./email-tags.ts";

type SendAuthEmailInput = {
  authUserId: string | null;
  flow: AuthEmailType;
  html: string;
  profileId: string | null;
  requestId: string;
  role: AuthRole;
  subject: string;
  supabase: SupabaseClient;
  to: string;
};

async function recordDelivery(
  supabase: SupabaseClient,
  payload: Record<string, unknown>,
) {
  const { error } = await supabase.from("auth_email_deliveries").insert(
    payload,
  );

  if (error) {
    console.error(JSON.stringify({
      code: "AUTH_EMAIL_LEDGER_INSERT_FAILED",
      databaseCode: error.code,
    }));
  }
}

export async function sendAuthEmail({
  authUserId,
  flow,
  html,
  profileId,
  requestId,
  role,
  subject,
  supabase,
  to,
}: SendAuthEmailInput): Promise<{ resendEmailId: string | null }> {
  const apiKey = getRequiredEnv("RESEND_API_KEY");
  const from = getResendFrom();
  const environment = getEnvironmentName();

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      html,
      subject,
      tags: buildResendTags({ environment, flow, requestId, role }),
      to: [to],
    }),
  });

  const payload = (await resendResponse.json().catch(() => null)) as
    | { id?: string }
    | null;
  const resendEmailId = typeof payload?.id === "string" ? payload.id : null;

  await recordDelivery(supabase, {
    auth_user_id: authUserId,
    environment,
    flow,
    profile_id: profileId,
    request_id: requestId,
    resend_email_id: resendEmailId,
    result_status: resendResponse.ok ? "accepted" : "failed",
    role,
    to_email: to,
  });

  if (!resendResponse.ok) {
    console.error(JSON.stringify({
      code: "RESEND_SEND_FAILED",
      requestId,
      status: resendResponse.status,
    }));
    throw new Error("RESEND_SEND_FAILED");
  }

  return { resendEmailId };
}
