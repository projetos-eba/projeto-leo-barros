import "server-only";

import { getSupabasePublicEnv } from "./env";

type InvokeResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      message: string;
    };

export async function invokeSupabaseFunction<T>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<InvokeResult<T>> {
  const { publishableKey, url } = getSupabasePublicEnv();
  const response = await fetch(`${url}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as
    | { error?: { message?: string }; success?: boolean }
    | null;

  if (!response.ok || payload?.success === false) {
    return {
      ok: false,
      message: payload?.error?.message ?? "Nao foi possivel concluir a operacao.",
    };
  }

  return {
    ok: true,
    data: payload as T,
  };
}
