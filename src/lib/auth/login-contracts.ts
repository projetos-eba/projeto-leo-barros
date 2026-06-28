export type NormalizedLoginCredentials =
  | {
      ok: true;
      email: string;
      password: string;
    }
  | {
      ok: false;
      message: string;
    };

export function normalizeEmailPasswordLogin(credentials: {
  loginId: string;
  password: string;
}): NormalizedLoginCredentials {
  const email = credentials.loginId.trim().toLowerCase();
  const password = credentials.password;

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

  return {
    ok: true,
    email,
    password,
  };
}

