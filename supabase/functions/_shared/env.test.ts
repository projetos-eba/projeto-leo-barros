import {
  buildAppUrl,
  getAppUrl,
  getAuthEmailFlags,
  getResendFrom,
  parseBooleanEnv,
} from "./env.ts";

Deno.test("parseBooleanEnv trata strings booleanas sem Boolean('false')", () => {
  if (parseBooleanEnv("true") !== true) throw new Error("true esperado");
  if (parseBooleanEnv(" TRUE ") !== true) throw new Error("TRUE esperado");
  if (parseBooleanEnv("false") !== false) throw new Error("false esperado");
  if (parseBooleanEnv(" FALSE ") !== false) throw new Error("FALSE esperado");
  if (parseBooleanEnv(undefined, true) !== true) {
    throw new Error("default true esperado");
  }
  if (parseBooleanEnv("", true) !== true) {
    throw new Error("string vazia deve usar default");
  }
});

Deno.test("parseBooleanEnv rejeita valores ambiguos", () => {
  try {
    parseBooleanEnv("1");
  } catch (error) {
    if ((error as Error).message === "INVALID_BOOLEAN_ENV") return;
  }

  throw new Error("INVALID_BOOLEAN_ENV esperado");
});

Deno.test("APP_URL valida protocolo e monta links no mesmo origin", () => {
  const previous = Deno.env.get("APP_URL");
  try {
    Deno.env.set("APP_URL", "http://localhost:3000/");

    const appUrl = getAppUrl();
    if (appUrl.toString() !== "http://localhost:3000/") {
      throw new Error(`APP_URL normalizado inesperado: ${appUrl.toString()}`);
    }

    const url = buildAppUrl("/auth/redefinir-senha", { token: "abc123" });
    if (url !== "http://localhost:3000/auth/redefinir-senha?token=abc123") {
      throw new Error(`URL inesperada: ${url}`);
    }
  } finally {
    if (previous === undefined) Deno.env.delete("APP_URL");
    else Deno.env.set("APP_URL", previous);
  }
});

Deno.test("APP_URL rejeita protocolos nao HTTP", () => {
  const previous = Deno.env.get("APP_URL");
  try {
    Deno.env.set("APP_URL", "javascript:alert(1)");
    getAppUrl();
  } catch (error) {
    if ((error as Error).message === "APP_URL_INVALID_PROTOCOL") return;
  } finally {
    if (previous === undefined) Deno.env.delete("APP_URL");
    else Deno.env.set("APP_URL", previous);
  }

  throw new Error("APP_URL_INVALID_PROTOCOL esperado");
});

Deno.test("RESEND_FROM exige formato com dominio verificado", () => {
  const previous = Deno.env.get("RESEND_FROM");
  try {
    Deno.env.set("RESEND_FROM", "DeLoad Fit <noreply@deloadfit.app>");
    if (getResendFrom() !== "DeLoad Fit <noreply@deloadfit.app>") {
      throw new Error("RESEND_FROM valido rejeitado");
    }

    Deno.env.set("RESEND_FROM", "DeLoad Fit <noreply@example.com>");
    try {
      getResendFrom();
    } catch (error) {
      if ((error as Error).message === "RESEND_FROM_DOMAIN_NOT_ALLOWED") return;
    }
  } finally {
    if (previous === undefined) Deno.env.delete("RESEND_FROM");
    else Deno.env.set("RESEND_FROM", previous);
  }

  throw new Error("RESEND_FROM_DOMAIN_NOT_ALLOWED esperado");
});

Deno.test("confirmacao automatica prevalece sobre aprovacao administrativa", () => {
  const previousApproval = Deno.env.get("ALL_ACCOUNT_CREATE_APPROVAL_ADM");
  const previousAutomatic = Deno.env.get("CONFIRMED_AUTOMATICALLY_EMAIL");

  try {
    Deno.env.set("ALL_ACCOUNT_CREATE_APPROVAL_ADM", "true");
    Deno.env.set("CONFIRMED_AUTOMATICALLY_EMAIL", "true");

    const flags = getAuthEmailFlags();
    if (!flags.adminApprovalEnabled || !flags.automaticallyConfirmed) {
      throw new Error("flags esperadas nao foram lidas");
    }
  } finally {
    if (previousApproval === undefined) {
      Deno.env.delete("ALL_ACCOUNT_CREATE_APPROVAL_ADM");
    } else {
      Deno.env.set("ALL_ACCOUNT_CREATE_APPROVAL_ADM", previousApproval);
    }

    if (previousAutomatic === undefined) {
      Deno.env.delete("CONFIRMED_AUTOMATICALLY_EMAIL");
    } else {
      Deno.env.set("CONFIRMED_AUTOMATICALLY_EMAIL", previousAutomatic);
    }
  }
});

Deno.test("reset de senha nao depende das flags de confirmacao", async () => {
  const source = await Deno.readTextFile(
    new URL("../send-password-reset-email/index.ts", import.meta.url),
  );

  if (source.includes("getAuthEmailFlags")) {
    throw new Error("reset nao deve ler flags de confirmacao");
  }

  if (
    source.includes("ALL_ACCOUNT_CREATE_APPROVAL_ADM") ||
    source.includes("CONFIRMED_AUTOMATICALLY_EMAIL")
  ) {
    throw new Error("reset nao deve consultar flags diretamente");
  }
});
