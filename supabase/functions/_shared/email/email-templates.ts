import type { AuthRole } from "../env.ts";

export function emailConfirmationTemplate({
  displayName,
  verificationUrl,
}: {
  displayName: string | null;
  verificationUrl: string;
}) {
  const greeting = displayName ? `Ola, ${displayName}.` : "Ola.";

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Confirme seu e-mail</h2>
      <p>${greeting} Confirme seu e-mail para acessar o Projeto Leo Barros.</p>
      <p><a href="${verificationUrl}">Confirmar e-mail</a></p>
      <p>Este link expira em 24 horas. Se voce nao solicitou, ignore este e-mail.</p>
    </div>
  `;
}

export function adminApprovalTemplate({
  accountEmail,
  role,
  verificationUrl,
}: {
  accountEmail: string;
  role: AuthRole;
  verificationUrl: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Conta aguardando confirmacao</h2>
      <p>A conta ${accountEmail} (${role}) aguarda confirmacao.</p>
      <p>Ao clicar, a conta solicitante sera confirmada.</p>
      <p><a href="${verificationUrl}">Confirmar conta</a></p>
      <p>Este link expira em 24 horas.</p>
    </div>
  `;
}

export function passwordResetTemplate({ resetUrl }: { resetUrl: string }) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Redefinir senha</h2>
      <p>Recebemos uma solicitacao para redefinir sua senha.</p>
      <p><a href="${resetUrl}">Criar nova senha</a></p>
      <p>Este link expira em 1 hora. Se voce nao solicitou, ignore este e-mail.</p>
    </div>
  `;
}
