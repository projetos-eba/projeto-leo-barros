import { ForgotPasswordView } from "@/components/auth/forgot-password-view";

export default function ClientForgotPasswordPage() {
  return (
    <ForgotPasswordView
      backHref="/login"
      expectedRole="cliente"
      roleLabel="Cliente"
    />
  );
}
