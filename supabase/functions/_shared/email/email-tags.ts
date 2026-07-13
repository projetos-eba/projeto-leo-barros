import type { AuthRole } from "../env.ts";

export type AuthEmailType =
  | "email_confirmation"
  | "admin_account_approval"
  | "admin_invite"
  | "password_reset";

export function buildResendTags({
  environment,
  flow,
  requestId,
  role,
}: {
  environment: string;
  flow: AuthEmailType;
  requestId: string;
  role: AuthRole;
}) {
  return [
    { name: "flow", value: flow },
    { name: "role", value: role },
    { name: "environment", value: environment.replace(/[^a-zA-Z0-9_-]/g, "_") },
    { name: "request_id", value: requestId.replace(/[^a-zA-Z0-9_-]/g, "_") },
  ];
}
