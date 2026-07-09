import {
  type OfficialRole,
  isKnownRole,
} from "./identity-contracts";

export type NormalizedLoginCredentials =
  | {
      ok: true;
      email: string;
      expectedRole: OfficialRole;
      password: string;
    }
  | {
      ok: false;
      message: string;
    };

export function normalizeEmailPasswordLogin(credentials: {
  expectedRole?: OfficialRole;
  loginId: string;
  password: string;
}): NormalizedLoginCredentials {
  const email = credentials.loginId.trim().toLowerCase();
  const password = credentials.password;
  const expectedRole = credentials.expectedRole ?? "cliente";

  if (!email || !password) {
    return {
      ok: false,
      message: "Informe e-mail e senha para continuar.",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      ok: false,
      message: "Use o e-mail cadastrado para acessar.",
    };
  }

  if (!isKnownRole(expectedRole)) {
    return {
      ok: false,
      message: "Area de acesso invalida.",
    };
  }

  return {
    ok: true,
    email,
    expectedRole,
    password,
  };
}

