import { ResetPasswordView } from "@/components/auth/reset-password-view";

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    token?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;

  return <ResetPasswordView token={params?.token ?? null} />;
}
