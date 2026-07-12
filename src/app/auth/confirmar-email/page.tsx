import { EmailConfirmationStatusView } from "@/components/auth/email-confirmation-status-view";

import { verifyEmailToken } from "@/app/login/account-actions";

type ConfirmEmailPageProps = {
  searchParams?: Promise<{
    token?: string;
  }>;
};

export default async function ConfirmEmailPage({
  searchParams,
}: ConfirmEmailPageProps) {
  const params = await searchParams;
  const result = await verifyEmailToken(params?.token ?? "");

  return (
    <EmailConfirmationStatusView
      loginHref={result.loginHref}
      message={result.message}
      ok={result.ok}
    />
  );
}
