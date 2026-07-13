import { ForgotPasswordView } from "@/components/auth/forgot-password-view";

export default function PartnerForgotPasswordPage() {
  return (
    <ForgotPasswordView
      backHref="/login/parceiros"
      expectedRole="parceiro"
      roleLabel="Parceiro"
    />
  );
}
