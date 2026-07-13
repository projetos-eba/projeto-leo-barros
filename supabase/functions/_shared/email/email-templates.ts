import type { AuthRole } from "../env.ts";

type EmailLayoutInput = {
  content: string;
  platformName: string;
  preheader: string;
  title: string;
};

type EmailActionButtonInput = {
  href: string;
  label: string;
};

type EmailFallbackLinkInput = {
  url: string;
};

function subjectText(value: string) {
  return value.replaceAll(/[\r\n]+/g, " ").trim();
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function emailConfirmationSubject(platformName: string) {
  return `Confirme seu e-mail - ${subjectText(platformName)}`;
}

export function adminApprovalSubject({
  accountEmail,
  platformName,
}: {
  accountEmail: string;
  platformName: string;
}) {
  return `[${subjectText(platformName)}] Confirmacao pendente: ${
    subjectText(accountEmail)
  }`;
}

export function passwordResetSubject(platformName: string) {
  return `Redefinicao de senha - ${subjectText(platformName)}`;
}

export function adminInviteSubject(platformName: string) {
  return `Convite administrativo - ${subjectText(platformName)}`;
}

export function renderEmailLayout({
  content,
  platformName,
  preheader,
  title,
}: EmailLayoutInput) {
  const safePlatformName = escapeHtml(platformName);
  const safePreheader = escapeHtml(preheader);
  const safeTitle = escapeHtml(title);

  return `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safePreheader}</div>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;margin:0;padding:0;background:#f3f7fb;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;max-width:560px;border:1px solid #d8e4ee;border-radius:10px;background:#ffffff;">
            <tr>
              <td style="padding:24px 24px 12px 24px;font-family:Arial,sans-serif;">
                <p style="margin:0 0 8px 0;color:#2563eb;font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;">${safePlatformName}</p>
                <h1 style="margin:0;color:#102331;font-size:22px;line-height:30px;font-weight:700;">${safeTitle}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 24px 24px 24px;font-family:Arial,sans-serif;color:#314656;font-size:15px;line-height:24px;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #e1ebf2;padding:16px 24px;font-family:Arial,sans-serif;color:#6c7d8a;font-size:12px;line-height:18px;">
                ${safePlatformName}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

export function renderEmailActionButton(
  { href, label }: EmailActionButtonInput,
) {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td align="center" bgcolor="#2563eb" style="border-radius:6px;">
          <a href="${safeHref}" style="display:inline-block;padding:14px 24px;border-radius:6px;background:#2563eb;color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:700;line-height:20px;text-decoration:none;">
            ${safeLabel}
          </a>
        </td>
      </tr>
    </table>
  `;
}

export function renderEmailFallbackLink({ url }: EmailFallbackLinkInput) {
  const safeUrl = escapeHtml(url);

  return `
    <p style="margin:18px 0 6px 0;color:#526879;font-size:13px;line-height:20px;">Se o botao nao funcionar, copie e cole o endereco abaixo no navegador:</p>
    <p style="margin:0;word-break:break-all;overflow-wrap:anywhere;font-size:12px;line-height:18px;">
      <a href="${safeUrl}" style="color:#2563eb;text-decoration:underline;word-break:break-all;overflow-wrap:anywhere;">${safeUrl}</a>
    </p>
  `;
}

export function emailConfirmationTemplate({
  displayName,
  platformName,
  verificationUrl,
}: {
  displayName: string | null;
  platformName: string;
  verificationUrl: string;
}) {
  const greeting = displayName ? `Ola, ${escapeHtml(displayName)}.` : "Ola.";
  const safePlatformName = escapeHtml(platformName);

  return renderEmailLayout({
    content: `
      <p style="margin:0 0 16px 0;">${greeting} Confirme seu e-mail para acessar a plataforma ${safePlatformName}.</p>
      ${
      renderEmailActionButton({
        href: verificationUrl,
        label: "Confirmar e-mail",
      })
    }
      ${renderEmailFallbackLink({ url: verificationUrl })}
      <p style="margin:18px 0 0 0;color:#526879;font-size:13px;line-height:20px;">Este link expira em 24 horas. Se voce nao solicitou, ignore este e-mail.</p>
    `,
    platformName,
    preheader: `Confirme seu e-mail para acessar ${platformName}.`,
    title: "Confirme seu e-mail",
  });
}

export function adminApprovalTemplate({
  accountEmail,
  platformName,
  role,
  verificationUrl,
}: {
  accountEmail: string;
  platformName: string;
  role: AuthRole;
  verificationUrl: string;
}) {
  return renderEmailLayout({
    content: `
      <p style="margin:0 0 16px 0;">A conta ${escapeHtml(accountEmail)} (${
      escapeHtml(role)
    }) aguarda confirmacao.</p>
      <p style="margin:0 0 16px 0;">Ao clicar, a conta solicitante sera confirmada.</p>
      ${
      renderEmailActionButton({
        href: verificationUrl,
        label: "Confirmar conta",
      })
    }
      ${renderEmailFallbackLink({ url: verificationUrl })}
      <p style="margin:18px 0 0 0;color:#526879;font-size:13px;line-height:20px;">Este link expira em 24 horas.</p>
    `,
    platformName,
    preheader: "Conta aguardando confirmacao.",
    title: "Conta aguardando confirmacao",
  });
}

export function passwordResetTemplate({
  platformName,
  resetUrl,
}: {
  platformName: string;
  resetUrl: string;
}) {
  return renderEmailLayout({
    content: `
      <p style="margin:0 0 16px 0;">Recebemos uma solicitacao para redefinir sua senha.</p>
      ${renderEmailActionButton({ href: resetUrl, label: "Criar nova senha" })}
      ${renderEmailFallbackLink({ url: resetUrl })}
      <p style="margin:18px 0 0 0;color:#526879;font-size:13px;line-height:20px;">Este link expira em 1 hora. Se voce nao solicitou, ignore este e-mail.</p>
    `,
    platformName,
    preheader: `Crie uma nova senha para acessar ${platformName}.`,
    title: "Redefinir senha",
  });
}

export function adminInviteTemplate({
  displayName,
  inviteUrl,
  platformName,
}: {
  displayName: string;
  inviteUrl: string;
  platformName: string;
}) {
  return renderEmailLayout({
    content: `
      <p style="margin:0 0 16px 0;">Ola, ${
      escapeHtml(displayName)
    }. Voce recebeu acesso administrativo para ${escapeHtml(platformName)}.</p>
      <p style="margin:0 0 16px 0;">Use o botao abaixo para aceitar o convite e concluir o acesso com seguranca.</p>
      ${renderEmailActionButton({ href: inviteUrl, label: "Aceitar convite" })}
      ${renderEmailFallbackLink({ url: inviteUrl })}
      <p style="margin:18px 0 0 0;color:#526879;font-size:13px;line-height:20px;">Se voce nao esperava este convite, ignore este e-mail.</p>
    `,
    platformName,
    preheader: `Convite administrativo para acessar ${platformName}.`,
    title: "Convite administrativo",
  });
}
