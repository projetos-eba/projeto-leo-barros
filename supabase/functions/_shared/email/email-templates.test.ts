import {
  adminApprovalSubject,
  adminApprovalTemplate,
  adminInviteSubject,
  adminInviteTemplate,
  emailConfirmationSubject,
  emailConfirmationTemplate,
  escapeHtml,
  passwordResetSubject,
  passwordResetTemplate,
} from "./email-templates.ts";

const actionUrl =
  "https://app.example.test/auth/confirmar-email?token=abc123&next=<x>";

Deno.test("escapeHtml escapa caracteres perigosos", () => {
  const escaped = escapeHtml('"Minha" <Plataforma> & Empresa');

  if (escaped !== "&quot;Minha&quot; &lt;Plataforma&gt; &amp; Empresa") {
    throw new Error(`escapeHtml inesperado: ${escaped}`);
  }
});

Deno.test("emailConfirmationTemplate usa branding dinamico, CTA e link alternativo", () => {
  const html = emailConfirmationTemplate({
    displayName: 'Minha Plataforma <script>alert("xss")</script>',
    platformName: "Empresa & Saude",
    verificationUrl: actionUrl,
  });

  if (html.includes("<script>")) {
    throw new Error("HTML nao pode conter tag script executavel");
  }

  if (!html.includes("Empresa &amp; Saude")) {
    throw new Error("platformName deve ser escapado no HTML");
  }

  if (
    !html.includes(
      "Minha Plataforma &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
    )
  ) {
    throw new Error("displayName deve ser escapado no HTML");
  }

  if (!html.includes('role="presentation"')) {
    throw new Error("CTA deve usar tabela presentation");
  }

  if (!html.includes("Confirmar e-mail")) {
    throw new Error("label do CTA de confirmacao ausente");
  }

  if (!html.includes("Se o botao nao funcionar")) {
    throw new Error("link alternativo ausente");
  }

  if (!html.includes("token=abc123&amp;next=&lt;x&gt;")) {
    throw new Error("URL alternativa deve preservar e escapar o link");
  }

  if (html.includes("Projeto Leo Barros") || html.includes("Leo Barros")) {
    throw new Error("template nao deve conter branding antigo hardcoded");
  }
});

Deno.test("adminApprovalTemplate escapa conta, papel e renderiza confirmar conta", () => {
  const html = adminApprovalTemplate({
    accountEmail: 'conta"><script>@example.test',
    platformName: "Marca Operacional",
    role: "parceiro",
    verificationUrl: actionUrl,
  });

  if (html.includes("<script>")) {
    throw new Error("accountEmail deve ser escapado");
  }

  if (!html.includes("Confirmar conta")) {
    throw new Error("CTA de aprovacao ausente");
  }

  if (!html.includes("conta&quot;&gt;&lt;script&gt;@example.test")) {
    throw new Error("accountEmail escapado nao encontrado");
  }
});

Deno.test("adminInviteTemplate escapa nome e renderiza aceitar convite", () => {
  const html = adminInviteTemplate({
    displayName: 'Admin <script>alert("xss")</script>',
    inviteUrl:
      "https://app.example.test/auth/v1/verify?token=invite&type=invite",
    platformName: "Marca Operacional",
  });

  if (html.includes("<script>")) {
    throw new Error("displayName deve ser escapado");
  }

  if (!html.includes("Aceitar convite")) {
    throw new Error("CTA de convite ausente");
  }

  if (
    !html.includes("Admin &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;")
  ) {
    throw new Error("displayName escapado nao encontrado");
  }
});

Deno.test("passwordResetTemplate renderiza criar nova senha e validade de 1 hora", () => {
  const html = passwordResetTemplate({
    platformName: "Marca Operacional",
    resetUrl: "https://app.example.test/auth/redefinir-senha?token=reset",
  });

  if (!html.includes("Criar nova senha")) {
    throw new Error("CTA de reset ausente");
  }

  if (!html.includes("Este link expira em 1 hora")) {
    throw new Error("validade de reset deve ser preservada");
  }

  if (!html.includes("Se o botao nao funcionar")) {
    throw new Error("link alternativo de reset ausente");
  }
});

Deno.test("assuntos usam nome dinamico e removem quebras de linha", () => {
  const platformName = "Minha\nPlataforma";

  if (
    emailConfirmationSubject(platformName) !==
      "Confirme seu e-mail - Minha Plataforma"
  ) {
    throw new Error("assunto de confirmacao inesperado");
  }

  if (
    adminApprovalSubject({
      accountEmail: "conta@example.test\r\nbcc:other@example.test",
      platformName,
    }) !==
      "[Minha Plataforma] Confirmacao pendente: conta@example.test bcc:other@example.test"
  ) {
    throw new Error("assunto de aprovacao inesperado");
  }

  if (
    adminInviteSubject(platformName) !==
      "Convite administrativo - Minha Plataforma"
  ) {
    throw new Error("assunto de convite admin inesperado");
  }

  if (
    passwordResetSubject(platformName) !==
      "Redefinicao de senha - Minha Plataforma"
  ) {
    throw new Error("assunto de reset inesperado");
  }
});
