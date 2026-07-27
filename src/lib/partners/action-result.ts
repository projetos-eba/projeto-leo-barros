export type PartnerActionCode =
  | "success"
  | "validation_error"
  | "not_found"
  | "forbidden"
  | "conflict"
  | "unavailable"
  | "unexpected_error";

export type PartnerActionResult = {
  code: PartnerActionCode;
  error?: string;
  message?: string;
  ok: boolean;
};

export function partnerActionSuccess(message: string): PartnerActionResult {
  return { code: "success", message, ok: true };
}

export function partnerActionFailure(
  code: Exclude<PartnerActionCode, "success">,
  error: string,
): PartnerActionResult {
  return { code, error, ok: false };
}
